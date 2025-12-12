const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    reportType: {
      type: String,
      enum: ["Individual", "Class"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    format: {
      type: String,
      enum: ["PDF", "JSON"],
      default: "JSON",
    },
    filePath: {
      type: String,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    shareVia: {
      type: String,
      enum: ["Email", "WhatsApp", "SMS"],
    },
    sharedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
