const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['course_enrolled', 'chapter_completed', 'module_completed', 'quiz_taken', 'article_read', 'video_watched'],
    required: true 
  },
  description: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  moduleIndex: Number,
  chapterIndex: Number,
  score: Number, // for quiz
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);
