const Teacher = require("../models/Teacher");
const { sendTokenResponse } = require("../utils/jwt");

// Register Teacher
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phoneNumber, department, qualifications } =
      req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    // Check if teacher exists
    let teacher = await Teacher.findOne({ email });
    if (teacher) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    teacher = await Teacher.create({
      name,
      email,
      password,
      phoneNumber,
      department,
      qualifications,
    });

    sendTokenResponse(teacher, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Login Teacher
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const teacher = await Teacher.findOne({ email }).select("+password");

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await teacher.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    sendTokenResponse(teacher, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Current Teacher Profile
exports.getMe = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.user.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Teacher Profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phoneNumber, department, qualifications } = req.body;

    const teacher = await Teacher.findByIdAndUpdate(
      req.user.id,
      { name, phoneNumber, department, qualifications },
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
