const express = require("express");
const {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
} = require("../controllers/classController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect); // All routes require authentication

router.post("/", createClass);
router.get("/", getClasses);
router.get("/:id", getClass);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);

module.exports = router;
