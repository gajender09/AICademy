const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: String,
  description: String,
  videos: [{ title: String, url: String, completed: { type: Boolean, default: false } }],
});

module.exports = mongoose.model("Course", CourseSchema);
