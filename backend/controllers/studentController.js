const Student = require("../models/Student");
const Class = require("../models/Class");
const fs = require("fs");
const csv = require("csv-parser");
const { validateCSV } = require("../utils/csvValidator");

// Get Students by Class
exports.getStudents = async (req, res, next) => {
  try {
    const students = await Student.find({ class: req.params.classId }).populate(
      "class",
      "className"
    );

    if (!students) {
      return res.status(404).json({
        success: false,
        message: "No students found",
      });
    }

    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add Student
exports.addStudent = async (req, res, next) => {
  try {
    const { rollNumber, name, email, phoneNumber, parentPhoneNumber } =
      req.body;

    if (!rollNumber || !name) {
      return res.status(400).json({
        success: false,
        message: "Please provide rollNumber and name",
      });
    }

    const student = await Student.create({
      rollNumber,
      name,
      email,
      phoneNumber,
      parentPhoneNumber,
      class: req.params.classId,
    });

    // Update class total students
    await Class.findByIdAndUpdate(
      req.params.classId,
      { $inc: { totalStudents: 1 } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Roll number already exists for this class",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Import Students from CSV
exports.importStudentsCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV file",
      });
    }

    const results = [];

    // Read CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", async () => {
        try {
          // Validate CSV data
          const errors = validateCSV(results);
          if (errors.length > 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
              success: false,
              message: "CSV validation failed",
              errors: errors.slice(0, 10), // Return first 10 errors
            });
          }

          // Insert students
          const studentsToInsert = results.map((student) => ({
            rollNumber: student.rollNumber.trim(),
            name: student.name.trim(),
            email: student.email ? student.email.trim() : "",
            phoneNumber: student.phoneNumber ? student.phoneNumber.trim() : "",
            parentPhoneNumber: student.parentPhoneNumber
              ? student.parentPhoneNumber.trim()
              : "",
            class: req.params.classId,
          }));

          const insertedStudents = await Student.insertMany(studentsToInsert, {
            ordered: false,
          });

          // Update class total students
          await Class.findByIdAndUpdate(
            req.params.classId,
            { $inc: { totalStudents: insertedStudents.length } },
            { new: true }
          );

          // Delete uploaded file
          fs.unlinkSync(req.file.path);

          res.status(201).json({
            success: true,
            message: `${insertedStudents.length} students imported successfully`,
            data: insertedStudents,
          });
        } catch (error) {
          fs.unlinkSync(req.file.path);
          if (error.code === 11000) {
            return res.status(400).json({
              success: false,
              message: "Duplicate roll numbers detected",
            });
          }
          res.status(500).json({
            success: false,
            message: error.message,
          });
        }
      })
      .on("error", (error) => {
        fs.unlinkSync(req.file.path);
        res.status(500).json({
          success: false,
          message: "Error reading CSV file",
        });
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Import Students from Existing Class
exports.importStudentsFromExisting = async (req, res, next) => {
  try {
    const { sourceClassId } = req.body;

    if (!sourceClassId) {
      return res.status(400).json({
        success: false,
        message: "Please provide sourceClassId",
      });
    }

    // Get students from source class
    const students = await Student.find({ class: sourceClassId });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found in source class",
      });
    }

    // Create new students with updated class reference
    const newStudents = students.map((student) => ({
      rollNumber: student.rollNumber,
      name: student.name,
      email: student.email,
      phoneNumber: student.phoneNumber,
      parentPhoneNumber: student.parentPhoneNumber,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      address: student.address,
      class: req.params.classId,
    }));

    const insertedStudents = await Student.insertMany(newStudents);

    // Update class total students
    await Class.findByIdAndUpdate(
      req.params.classId,
      { $inc: { totalStudents: insertedStudents.length } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: `${insertedStudents.length} students imported successfully`,
      data: insertedStudents,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate roll numbers detected",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Student
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.studentId,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Student
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Update class total students
    await Class.findByIdAndUpdate(
      student.class,
      { $inc: { totalStudents: -1 } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
