const Class = require("../models/Class");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Report = require("../models/Report");

// Create Class
exports.createClass = async (req, res, next) => {
  try {
    const {
      className,
      classCode,
      section,
      academicYear,
      semester,
      room,
      schedule,
    } = req.body;

    if (!className || !classCode || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "Please provide className, classCode and academicYear",
      });
    }

    const newClass = await Class.create({
      className,
      classCode,
      section,
      academicYear,
      semester,
      room,
      schedule,
      teacher: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: newClass,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Class code already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Classes for Teacher
exports.getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find({ teacher: req.user.id }).populate(
      "teacher",
      "name email"
    );

    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Class by ID
exports.getClass = async (req, res, next) => {
  try {
    const classId = req.params.id;
    console.log("Getting class with ID:", classId);

    const classData = await Class.findById(classId).populate(
      "teacher",
      "name email"
    );

    console.log("Class data found:", classData);

    if (!classData) {
      console.log("Class not found for ID:", classId);
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Check if user is the teacher of this class
    if (classData.teacher._id.toString() !== req.user.id) {
      console.log(
        "Authorization failed. Class teacher:",
        classData.teacher._id,
        "User:",
        req.user.id
      );
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this class",
      });
    }

    const students = await Student.find({ class: classId });
    console.log("Found students:", students.length);

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    console.error("Error in getClass:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Class
exports.updateClass = async (req, res, next) => {
  try {
    let classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (classData.teacher.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this class",
      });
    }

    classData = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Class (cascade delete)
exports.deleteClass = async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (classData.teacher.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this class",
      });
    }

    // Delete all students
    await Student.deleteMany({ class: req.params.id });

    // Delete all attendance records
    await Attendance.deleteMany({ class: req.params.id });

    // Delete all reports
    await Report.deleteMany({ class: req.params.id });

    // Delete class
    await Class.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Class and all related data deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
