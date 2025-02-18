const express = require("express");
const Course = require("../models/Course");

const router = express.Router();

// Fetch all courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Enroll in a course
router.post("/enroll", async (req, res) => {
  const { userId, courseId } = req.body;
  // You can store enrollment info in the user schema
  res.json({ message: "Enrolled successfully" });
});

module.exports = router;
