const express = require("express");
const {
  getLowAttendanceStudents,
  sendLowAttendanceSMS,
  sendLowAttendanceWhatsApp,
  sendLowAttendanceEmail,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // All routes require authentication

// Get students with low attendance
router.get("/:classId/low-attendance", getLowAttendanceStudents);

// Send SMS alerts to students with low attendance
router.post("/:classId/send-sms", sendLowAttendanceSMS);

// Send WhatsApp alerts to students with low attendance
router.post("/:classId/send-whatsapp", sendLowAttendanceWhatsApp);

// Send Email alerts to students with low attendance
router.post("/:classId/send-email", sendLowAttendanceEmail);

module.exports = router;
