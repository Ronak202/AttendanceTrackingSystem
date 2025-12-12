const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

// =========================
// GET ATTENDANCE FOR A DATE
// =========================
exports.getAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const classId = req.params.classId;

    if (!date)
      return res.status(400).json({ success: false, message: "Date required" });

    // Normalize date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Fetch all students in class
    const students = await Student.find({ class: classId });

    let attendance = await Attendance.findOne({
      class: classId,
      date: { $gte: startDate, $lte: endDate },
    }).populate("records.student");

    // ----------------------------
    // CASE 1: No attendance → create
    // ----------------------------
    if (!attendance) {
      const records = students.map((s) => ({
        student: s._id,
        status: "Present",
        remarks: "",
      }));

      attendance = await Attendance.create({
        class: classId,
        date: startDate,
        records,
        teacher: req.user.id,
      });
    } else {
      // ----------------------------
      // CASE 2: Attendance exists → sync missing students
      // ----------------------------
      const existingStudentIds = attendance.records.map(
        (r) => r.student?._id?.toString()
      );

      const missingStudents = students.filter(
        (s) => !existingStudentIds.includes(s._id.toString())
      );

      if (missingStudents.length > 0) {
        const newRecords = missingStudents.map((s) => ({
          student: s._id,
          status: "Present",
          remarks: "",
        }));
        attendance.records.push(...newRecords);
      }

      // 🔥 Clean deleted students (student == null)
      attendance.records = attendance.records.filter((r) => r.student != null);

      await attendance.save();
    }

    // Final populate
    attendance = await Attendance.findById(attendance._id).populate(
      "records.student"
    );

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// SAVE / UPDATE ATTENDANCE
// =========================
exports.saveAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;
    const classId = req.params.classId;

    if (!date || !records)
      return res.status(400).json({
        success: false,
        message: "Please provide date and records",
      });

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let attendance = await Attendance.findOne({
      class: classId,
      date: { $gte: startDate, $lte: endDate },
    });

    if (attendance && attendance.isLocked)
      return res.status(400).json({
        success: false,
        message: "Attendance is locked and cannot be modified",
      });

    if (attendance) {
      attendance.records = records;
      attendance.records = attendance.records.filter((r) => r.student != null); // 🔥 Clean deleted
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        class: classId,
        date: startDate,
        records,
        teacher: req.user.id,
      });
    }

    attendance = await Attendance.findById(attendance._id).populate(
      "records.student"
    );

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// GET RANGE HISTORY
// =========================
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate)
      return res.status(400).json({
        success: false,
        message: "Please provide startDate and endDate",
      });

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const attendances = await Attendance.find({
      class: req.params.classId,
      date: { $gte: start, $lte: end },
    })
      .populate("records.student")
      .sort({ date: 1 });

    res.status(200).json({ success: true, data: attendances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// LOCK ATTENDANCE
// =========================
exports.lockAttendance = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date)
      return res.status(400).json({
        success: false,
        message: "Please provide a date",
      });

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOneAndUpdate(
      {
        class: req.params.classId,
        date: { $gte: startDate, $lte: endDate },
      },
      { isLocked: true },
      { new: true }
    ).populate("records.student");

    if (!attendance)
      return res.status(404).json({
        success: false,
        message: "Attendance not found",
      });

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
