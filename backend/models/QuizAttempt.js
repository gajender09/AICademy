const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  scope: { type: String, enum: ['chapter', 'module', 'final'], default: 'chapter' },
  moduleIndex: Number,
  chapterIndex: Number,
  chapterTitle: String,
  moduleTitle: String,
  score: { type: Number, required: true }, // percentage
  correctAnswers: { type: Number, default: 0 },
  totalQuestions: Number,
  passed: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
