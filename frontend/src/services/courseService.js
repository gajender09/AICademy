import API from "./api";

// 🎯 Generate course
export const generateCourse = (courseId) =>
  API.post("/api/courses/generate", { courseId });

// ⚡ Lazy load subtopic
export const getSubtopicContent = (data) =>
  API.post("/api/courses/subtopic", data);

// 🧠 Quiz
export const getQuiz = (courseId) =>
  API.post("/api/courses/quiz", { courseId });