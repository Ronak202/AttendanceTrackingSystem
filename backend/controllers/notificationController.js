const Report = require("../models/Report");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Class = require("../models/Class");
const {
  sendSMS,
  sendWhatsApp,
  sendEmail,
  generateSMSMessage,
  generateWhatsAppMessage,
  generateEmailHTML,
  calculateAttendancePercentage,
} = require("../services/notificationService");

// Get students with low attendance
exports.getLowAttendanceStudents = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { threshold = 75 } = req.query; // Default threshold is 75%

    console.log(`[Low Attendance] Fetching students below ${threshold}% for class ${classId}`);

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const students = await Student.find({ class: classId });

    // Get all attendance records for the class
    const attendances = await Attendance.find({ class: classId }).populate(
      "records.student"
    );

    // Calculate attendance for each student
    const lowAttendanceStudents = [];

    students.forEach((student) => {
      const studentAttendances = attendances.map((attendance) => {
        const record = attendance.records.find(
          (r) => r.student._id.toString() === student._id.toString()
        );
        return record;
      });

      // Filter out null/undefined records
      const validRecords = studentAttendances.filter(
        (record) => record !== null && record !== undefined
      );

      // Calculate attendance stats
      let presentDays = 0;
      validRecords.forEach((record) => {
        if (record.status === "Present" || record.status === "Late") {
          presentDays++;
        }
      });

      const totalDays = validRecords.length;
      const percentage = calculateAttendancePercentage(presentDays, totalDays);

      console.log(
        `[Low Attendance] ${student.name}: ${percentage}% (${presentDays}/${totalDays} days)`
      );

      // Add to list if below threshold
      if (percentage < threshold && totalDays > 0) {
        lowAttendanceStudents.push({
          studentId: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          email: student.email,
          phoneNumber: student.phoneNumber,
          parentPhone: student.parentPhone || student.phoneNumber,
          parentEmail: student.parentEmail || student.email,
          attendance: {
            presentDays,
            totalDays,
            percentage,
          },
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        classInfo: {
          id: classData._id,
          name: classData.className,
          code: classData.classCode,
        },
        threshold,
        lowAttendanceStudents,
        count: lowAttendanceStudents.length,
      },
    });
  } catch (error) {
    console.error("[Low Attendance Error]", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Send low attendance alerts via SMS
exports.sendLowAttendanceSMS = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { threshold = 75, studentIds } = req.body;

    console.log(
      `[SMS Alert] Sending SMS alerts for class ${classId} with threshold ${threshold}%`
    );

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Get low attendance students
    let query = { class: classId };
    if (studentIds && studentIds.length > 0) {
      query._id = { $in: studentIds };
    }

    const students = await Student.find(query);
    const attendances = await Attendance.find({ class: classId }).populate(
      "records.student"
    );

    const results = [];

    for (const student of students) {
      const studentAttendances = attendances.map((attendance) => {
        const record = attendance.records.find(
          (r) => r.student._id.toString() === student._id.toString()
        );
        return record;
      });

      const validRecords = studentAttendances.filter(
        (record) => record !== null && record !== undefined
      );

      let presentDays = 0;
      validRecords.forEach((record) => {
        if (record.status === "Present" || record.status === "Late") {
          presentDays++;
        }
      });

      const totalDays = validRecords.length;
      const percentage = calculateAttendancePercentage(presentDays, totalDays);

      if (percentage < threshold && totalDays > 0) {
        const phoneNumber = student.parentPhone || student.phoneNumber;
        if (!phoneNumber) {
          results.push({
            studentName: student.name,
            status: "failed",
            error: "No phone number available",
          });
          continue;
        }

        const message = generateSMSMessage(student.name, percentage, threshold);
        const result = await sendSMS(phoneNumber, message);

        results.push({
          studentName: student.name,
          phoneNumber,
          percentage,
          status: result.success ? "sent" : "failed",
          messageId: result.messageId,
          error: result.error,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `SMS alerts sent`,
      data: results,
    });
  } catch (error) {
    console.error("[SMS Alert Error]", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Send low attendance alerts via WhatsApp
exports.sendLowAttendanceWhatsApp = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { threshold = 75, studentIds } = req.body;

    console.log(
      `[WhatsApp Alert] Sending WhatsApp alerts for class ${classId} with threshold ${threshold}%`
    );

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    let query = { class: classId };
    if (studentIds && studentIds.length > 0) {
      query._id = { $in: studentIds };
    }

    const students = await Student.find(query);
    const attendances = await Attendance.find({ class: classId }).populate(
      "records.student"
    );

    const results = [];

    for (const student of students) {
      const studentAttendances = attendances.map((attendance) => {
        const record = attendance.records.find(
          (r) => r.student._id.toString() === student._id.toString()
        );
        return record;
      });

      const validRecords = studentAttendances.filter(
        (record) => record !== null && record !== undefined
      );

      let presentDays = 0;
      validRecords.forEach((record) => {
        if (record.status === "Present" || record.status === "Late") {
          presentDays++;
        }
      });

      const totalDays = validRecords.length;
      const percentage = calculateAttendancePercentage(presentDays, totalDays);

      if (percentage < threshold && totalDays > 0) {
        const phoneNumber = student.parentPhone || student.phoneNumber;
        if (!phoneNumber) {
          results.push({
            studentName: student.name,
            status: "failed",
            error: "No phone number available",
          });
          continue;
        }

        const message = generateWhatsAppMessage(
      student.name,
      student.rollNumber,
      percentage,
      threshold,
      classData.classCode,
      classData.className,
      totalDays,
      presentDays
      );

        const result = await sendWhatsApp(phoneNumber, message);

        results.push({
          studentName: student.name,
          phoneNumber,
          percentage,
          status: result.success ? "sent" : "failed",
          messageId: result.messageId,
          error: result.error,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `WhatsApp alerts sent`,
      data: results,
    });
  } catch (error) {
    console.error("[WhatsApp Alert Error]", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Send low attendance alerts via Email
exports.sendLowAttendanceEmail = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { threshold = 75, studentIds } = req.body;

    console.log(
      `[Email Alert] Sending email alerts for class ${classId} with threshold ${threshold}%`
    );

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    let query = { class: classId };
    if (studentIds && studentIds.length > 0) {
      query._id = { $in: studentIds };
    }

    const students = await Student.find(query);
    const attendances = await Attendance.find({ class: classId }).populate(
      "records.student"
    );

    const results = [];

    for (const student of students) {
      const studentAttendances = attendances.map((attendance) => {
        const record = attendance.records.find(
          (r) => r.student._id.toString() === student._id.toString()
        );
        return record;
      });

      const validRecords = studentAttendances.filter(
        (record) => record !== null && record !== undefined
      );

      let presentDays = 0;
      validRecords.forEach((record) => {
        if (record.status === "Present" || record.status === "Late") {
          presentDays++;
        }
      });

      const totalDays = validRecords.length;
      const percentage = calculateAttendancePercentage(presentDays, totalDays);

      if (percentage < threshold && totalDays > 0) {
        const recipientEmail = student.parentEmail || student.email;
        if (!recipientEmail) {
          results.push({
            studentName: student.name,
            status: "failed",
            error: "No email available",
          });
          continue;
        }

        const htmlContent = generateEmailHTML(
          student.name,
          student.rollNumber,
          percentage,
          threshold,
          classData.classCode,
          totalDays,
          presentDays
        );

        const result = await sendEmail(
          recipientEmail,
          `Low Attendance Alert - ${student.name}`,
          htmlContent
        );

        results.push({
          studentName: student.name,
          email: recipientEmail,
          percentage,
          status: result.success ? "sent" : "failed",
          messageId: result.messageId,
          error: result.error,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Email alerts sent`,
      data: results,
    });
  } catch (error) {
    console.error("[Email Alert Error]", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
