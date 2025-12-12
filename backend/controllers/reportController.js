// controllers/reportController.js
const Report = require("../models/Report");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Class = require("../models/Class");
const {
  generateAttendanceReport,
  generatePDFReport,
  generateHTMLReport,
} = require("../utils/reportGenerator");

// Generate Report
exports.generateReport = async (req, res, next) => {
  try {
    const { startDate, endDate, reportType, studentId } = req.body;

    if (!startDate || !endDate || !reportType) {
      return res.status(400).json({
        success: false,
        message: "Please provide startDate, endDate and reportType",
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const classId = req.params.classId;

    // Fetch class meta (className, classCode, etc.)
    const classData = await Class.findById(classId);

    let query = {
      class: classId,
      date: { $gte: start, $lte: end },
    };

    // Populate student reference inside each record if stored as ObjectId
    const attendances = await Attendance.find(query).populate(
      "records.student",
      "name rollNumber email"
    );

    if (!attendances || attendances.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for the given date range",
      });
    }

    let reportData = {};

    // Teacher name from req.user.name (Option A)
    const teacherName = req.user?.name || "";

    if (reportType === "Individual" && studentId) {
      // Individual student report
      const studentData = await Student.findById(studentId);

      if (!studentData) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      // Build list of per-day record objects (may be undefined if absent in that day's records)
      const studentAttendances = attendances.map((attendance) => {
        // find the record for the student in this attendance doc
        const record = (attendance.records || []).find((r) => {
          if (!r) return false;
          // r.student might be populated doc or ObjectId
          const sid = r.student && r.student._id ? r.student._id.toString() : (r.student || "").toString();
          return sid === studentId.toString();
        });
        // we may want to attach date info for individual display (optional)
        return record || null;
      });

      const singleReport = generateAttendanceReport(studentAttendances);

      reportData = {
        ...singleReport,
        studentDetails: {
          name: studentData.name,
          rollNumber: studentData.rollNumber,
          email: studentData.email,
        },
        // include class info for header
        classInfo: {
          className: classData?.className || "Class",
          classCode: classData?.classCode || (classData?._id || "").toString(),
          teacherName,
        },
      };
    } else {
      // Class-wide report
      const allStudents = await Student.find({ class: classId }).lean();

      // sort students by numeric rollNumber if possible then by name
      allStudents.sort((a, b) => {
        const ra = a.rollNumber ? String(a.rollNumber).trim() : "";
        const rb = b.rollNumber ? String(b.rollNumber).trim() : "";

        const na = Number(ra);
        const nb = Number(rb);

        if (!isNaN(na) && !isNaN(nb)) {
          if (na !== nb) return na - nb; // numeric compare
        } else {
          const cmp = ra.localeCompare(rb);
          if (cmp !== 0) return cmp;
        }

        // fallback to name
        return (a.name || "").localeCompare(b.name || "");
      });

      const studentReports = {};

      allStudents.forEach((student) => {
        const studentAttendances = attendances.map((attendance) => {
          const record = (attendance.records || []).find((r) => {
            if (!r) return false;
            const sid = r.student && r.student._id ? r.student._id.toString() : (r.student || "").toString();
            return sid === (student._id || "").toString();
          });
          return record || null;
        });

        const studentReport = generateAttendanceReport(studentAttendances);

        studentReports[student._id] = {
          ...studentReport,
          name: student.name,
          rollNumber: student.rollNumber,
        };
      });

      // compute class average attendance percentage
      const percentages = Object.values(studentReports).map(
        (s) => Number(s.attendancePercentage || 0)
      );
      const classAverage =
        percentages.length > 0
          ? Math.round(
              (percentages.reduce((a, b) => a + b, 0) / percentages.length) * 100
            ) / 100
          : 0;

      reportData = {
        totalStudents: allStudents.length,
        studentReports,
        classAverage,
        classInfo: {
          className: classData?.className || "Class",
          classCode: classData?.classCode || (classData?._id || "").toString(),
          teacherName,
        },
      };
    }

    const report = await Report.create({
      title: `${reportType} Attendance Report`,
      class: classId,
      student: reportType === "Individual" ? studentId : null,
      reportType,
      startDate: start,
      endDate: end,
      data: reportData,
      generatedBy: req.user.id,
      format: "JSON",
    });

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("[Report.generateReport] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Student Reports
exports.getStudentReports = async (req, res, next) => {
  try {
    const reports = await Report.find({
      student: req.params.studentId,
    })
      .populate("class", "className classCode")
      .populate("student", "name rollNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("[Report.getStudentReports] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Class Reports
exports.getClassReports = async (req, res, next) => {
  try {
    const reports = await Report.find({
      class: req.params.classId,
      reportType: "Class",
    })
      .populate("class", "className classCode")
      .populate("generatedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("[Report.getClassReports] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Share Report (placeholder for email/WhatsApp integration)
exports.shareReport = async (req, res, next) => {
  try {
    const { shareVia } = req.body;

    if (!shareVia || !["Email", "WhatsApp", "SMS"].includes(shareVia)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid shareVia method (Email, WhatsApp, SMS)",
      });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      {
        isShared: true,
        shareVia,
        sharedAt: new Date(),
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Placeholder for actual email/WhatsApp/SMS sending logic
    console.log(`Report shared via ${shareVia}`);

    res.status(200).json({
      success: true,
      message: `Report shared via ${shareVia}`,
      data: report,
    });
  } catch (error) {
    console.error("[Report.shareReport] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Report
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("[Report.deleteReport] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Export Report as PDF/HTML
exports.exportReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { format } = req.query; // 'pdf' or 'html'

    const report = await Report.findById(reportId)
      .populate("class")
      .populate("student");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // prefer class object from DB; otherwise fallback to embedded classInfo in report.data
    const classInfo = report.class || report.data.classInfo;

    const html = generateHTMLReport(
      report.data,
      report.reportType,
      report.startDate,
      report.endDate,
      classInfo
    );

    if (format === "pdf") {
      // Return HTML; client or a headless browser can convert to PDF
      const pdfResult = generatePDFReport({ html, reportId: report._id });
      res.status(200).json({
        success: true,
        format: "pdf",
        html: html,
        filename: `attendance-report-${report._id}.pdf`,
        pdfResult,
      });
    } else {
      // Send HTML directly
      res.status(200).json({
        success: true,
        format: "html",
        html: html,
        filename: `attendance-report-${report._id}.html`,
      });
    }
  } catch (error) {
    console.error("[Report.exportReport] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
