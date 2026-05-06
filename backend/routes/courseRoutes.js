const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  generateCourse,
  getSubtopicContent,
  getQuiz,
} = require("../controllers/courseController");

/* MAIN */
router.post("/generate", protect, generateCourse);

/* LAZY */
router.post("/subtopic", protect, getSubtopicContent);

/* QUIZ */
router.post("/quiz", protect, getQuiz);

module.exports = router;