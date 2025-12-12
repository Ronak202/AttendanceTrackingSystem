const express = require("express");
const {
  getAttendance,
  saveAttendance,
  getAttendanceHistory,
  lockAttendance,
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // All routes require authentication

router.get("/:classId/attendance", getAttendance);
router.post("/:classId/attendance", saveAttendance);
router.get("/:classId/attendance-history", getAttendanceHistory);
router.post("/:classId/attendance/lock", lockAttendance);

module.exports = router;
