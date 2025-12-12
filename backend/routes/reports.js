const express = require("express");
const {
  generateReport,
  getStudentReports,
  getClassReports,
  shareReport,
  deleteReport,
  exportReport,
} = require("../controllers/reportController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // All routes require authentication

router.post("/:classId/reports/generate", generateReport);
router.get("/student/:studentId/reports", getStudentReports);
router.get("/:classId/reports", getClassReports);
router.post("/:reportId/share", shareReport);
router.delete("/:reportId", deleteReport);
router.get("/:reportId/export", exportReport);

module.exports = router;
