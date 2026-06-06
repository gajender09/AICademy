const mongoose = require("mongoose");

const quizQuestionSchema = new mongoose.Schema(
  {
    question: String,
    options: [String],
    answer: String,
  },
  { _id: false }
);

const chapterSchema = new mongoose.Schema({
  title: String,
  content: { type: String, default: "" },
  isCompleted: { type: Boolean, default: false },
  quiz: { type: [quizQuestionSchema], default: [] },
  quizPassed: { type: Boolean, default: false },
  bestQuizScore: { type: Number, default: 0 },
  lastQuizScore: { type: Number, default: 0 },
  quizAttempts: { type: Number, default: 0 },
  quizLastAttemptAt: { type: Date, default: null },
});

const moduleSchema = new mongoose.Schema({
  title: String,
  chapters: [chapterSchema],
  quiz: { type: [quizQuestionSchema], default: [] },
  quizPassed: { type: Boolean, default: false },
  bestQuizScore: { type: Number, default: 0 },
  lastQuizScore: { type: Number, default: 0 },
  quizAttempts: { type: Number, default: 0 },
  quizLastAttemptAt: { type: Date, default: null },
  isCompleted: { type: Boolean, default: false },
  videoResources: { type: [mongoose.Schema.Types.Mixed], default: [] },
  articleResources: { type: [mongoose.Schema.Types.Mixed], default: [] },
});

const courseSchema = new mongoose.Schema({
  title: String,
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  modules: [moduleSchema],
  progress: {
    type: Number,
    default: 0,
  },
  imageUrl: { type: String, default: "" },
  imageSource: { type: String, default: "" },
  imageFetchedAt: { type: Date, default: null },
  finalQuiz: { type: [quizQuestionSchema], default: [] },
  finalQuizPassed: { type: Boolean, default: false },
  finalQuizUnlocked: { type: Boolean, default: false },
  finalQuizBestScore: { type: Number, default: 0 },
  finalQuizLastScore: { type: Number, default: 0 },
  finalQuizAttempts: { type: Number, default: 0 },
  finalQuizLastAttemptAt: { type: Date, default: null },
  enrolled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Course", courseSchema);
