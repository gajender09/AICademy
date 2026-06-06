import axios from "axios";

const apiHost =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001";

const baseURL = `${apiHost}/api/courses`;

const API = axios.create({
  baseURL,
});

/* =========================
   REQUEST INTERCEPTOR
========================= */
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token && token !== "undefined") {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

/* =========================
   RESPONSE INTERCEPTOR
========================= */
API.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error(
      "API Error:",
      err.response?.data || err.message
    );

    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

/* =========================
   HELPER
========================= */
const handleRes = (res) => res.data;

/* =========================
   APIs
========================= */

export const generateCourseStructure = (title) =>
  API.post("/generate-structure", { title }).then(handleRes);

export const enrollCourse = (data) =>
  API.post("/enroll", data).then(handleRes);

export const getCourse = (id) =>
  API.get(`/${id}`).then(handleRes);

export const generateChapterContent = (data) =>
  API.post("/generate-content", data).then(handleRes);

export const markComplete = (data) =>
  API.post("/complete", data).then(handleRes);

export const getGlossary = (data) =>
  API.post("/glossary", data).then(handleRes);

export const getRoadmap = (data) =>
  API.post("/roadmap", data).then(handleRes);

export const generateQuiz = (data) =>
  API.post("/generate-quiz", data).then(handleRes);

export const submitQuiz = (data) =>
  API.post("/submit-quiz", data).then(handleRes);

export const explainQuizAnswer = (data) =>
  API.post("/explain-quiz-answer", data).then(handleRes);

export const getMyCourses = () =>
  API.get("/dashboard").then(handleRes);

export const getModuleVideos = (data) =>
  API.post("/module-videos", data).then(handleRes);

export const getModuleArticles = (data) =>
  API.post("/module-articles", data).then(handleRes);
