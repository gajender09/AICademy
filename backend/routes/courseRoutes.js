const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  generateCourseStructure,
  enrollCourse,
  getCourse,
  generateChapterContent,
  markChapterComplete,
  getGlossary,
  getRoadmap,
  generateQuiz,
  explainQuizAnswer,
  getMyCourses,
  getModuleVideos,
  getModuleArticles,
  getRecentActivity,
  getLastQuiz,
  getRecommendations,
  getDashboardActivitySummary,
  submitQuizAttempt,
  getCourseUsage,
} = require("../controllers/courseController");

router.post("/generate-structure", protect, generateCourseStructure);
router.post("/enroll", protect, enrollCourse);

router.get("/usage", protect, getCourseUsage);
router.get("/dashboard", protect, getMyCourses);
router.get('/activity/recent', protect, getRecentActivity);
router.get('/activity/summary', protect, getDashboardActivitySummary);
router.get('/quiz/last', protect, getLastQuiz);
router.get('/recommendations', protect, getRecommendations);
router.get("/:id", protect, getCourse);


router.post("/generate-content", protect, generateChapterContent);
router.post("/generate-quiz", protect, generateQuiz);
router.post("/submit-quiz", protect, submitQuizAttempt);
router.post("/explain-quiz-answer", protect, explainQuizAnswer);
router.post("/complete", protect, markChapterComplete);

router.post("/glossary", protect, getGlossary);
router.post("/roadmap", protect, getRoadmap);

router.post("/module-videos", protect, getModuleVideos);
router.post("/module-articles", protect, getModuleArticles);

module.exports = router;
