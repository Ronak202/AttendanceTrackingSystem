const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  getStudents,
  addStudent,
  importStudentsCSV,
  importStudentsFromExisting,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Setup multer for CSV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== ".csv") {
      return cb(new Error("Only CSV files are allowed"), false);
    }
    cb(null, true);
  },
});

router.use(protect); // All routes require authentication

router.get("/:classId/students", getStudents);
router.post("/:classId/students", addStudent);
router.post("/:classId/import/csv", upload.single("file"), importStudentsCSV);
router.post("/:classId/import/existing", importStudentsFromExisting);
router.put("/:classId/students/:studentId", updateStudent);
router.delete("/:classId/students/:studentId", deleteStudent);

module.exports = router;
