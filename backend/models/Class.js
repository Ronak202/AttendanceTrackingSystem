const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, "Please provide a class name"],
      trim: true,
    },
    classCode: {
      type: String,
      required: [true, "Please provide a class code"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    section: {
      type: String,
      default: "A",
    },
    academicYear: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      default: 1,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    schedule: {
      monday: String,
      tuesday: String,
      wednesday: String,
      thursday: String,
      friday: String,
      saturday: String,
      sunday: String,
    },
    room: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);
