const mongoose = require("mongoose");

const SubtopicSchema = new mongoose.Schema({
  title: String,
  content: String, // lazy loaded
});

const ChapterSchema = new mongoose.Schema({
  title: String,
  subtopics: [SubtopicSchema],
});

const CourseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  courseId: String,

  modules: [ChapterSchema],

  glossary: { type: Array, default: [] },
  roadmap: { type: Array, default: [] },
  quiz: { type: Array, default: [] },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Course", CourseSchema);