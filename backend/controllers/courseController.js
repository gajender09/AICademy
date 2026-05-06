const axios = require("axios");
const Course = require("../models/Course");

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`;

/* ================= PARSE MODULES ================= */
const parseModules = (text) => {
  const lines = text.split("\n").filter((l) => l.trim());

  const chapters = [];
  let current = null;

  lines.forEach((line) => {
    if (line.startsWith("Chapter")) {
      current = { title: line, subtopics: [] };
      chapters.push(current);
    } else if (line.startsWith("-") && current) {
      current.subtopics.push({
        title: line.replace("-", "").trim(),
        content: "",
      });
    }
  });

  return chapters;
};

/* ================= PARSE QUIZ ================= */
const parseQuiz = (text) => {
  const blocks = text.split("\n\n");

  return blocks.map((b) => {
    const lines = b.split("\n");

    return {
      question: lines[0]?.replace("Q:", "").trim(),
      options: [
        lines[1]?.replace("A:", "").trim(),
        lines[2]?.replace("B:", "").trim(),
        lines[3]?.replace("C:", "").trim(),
        lines[4]?.replace("D:", "").trim(),
      ],
      correct: lines[5]?.replace("Correct:", "").trim(),
    };
  });
};

/* ================= GENERATE COURSE ================= */
exports.generateCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // ✅ CACHE
    let existing = await Course.findOne({ userId, courseId });
    if (existing) return res.json(existing);

    const prompt = `
Generate structured course for "${courseId}"

Format:
Chapter 1: Title
- 1.1 Subtopic
- 1.2 Subtopic
(10 chapters, 4-5 subtopics each)
`;

    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }],
    });

    const raw =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const modules = parseModules(raw);

    const course = await Course.create({
      userId,
      courseId,
      modules,
    });

    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= SUBTOPIC CONTENT ================= */
exports.getSubtopicContent = async (req, res) => {
  try {
    const { courseId, chapterIndex, subtopicIndex } = req.body;

    const course = await Course.findOne({
      userId: req.user.id,
      courseId,
    });

    const subtopic =
      course.modules[chapterIndex].subtopics[subtopicIndex];

    // ✅ CACHE
    if (subtopic.content) {
      return res.json({ content: subtopic.content });
    }

    const prompt = `Explain "${subtopic.title}" with examples`;

    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }],
    });

    const content =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No content";

    subtopic.content = content;
    await course.save();

    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= QUIZ ================= */
exports.getQuiz = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findOne({
      userId: req.user.id,
      courseId,
    });

    if (course.quiz.length > 0) {
      return res.json(course.quiz);
    }

    const prompt = `Generate 10 MCQ quiz for ${courseId}`;

    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }],
    });

    const quizText =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    const quiz = parseQuiz(quizText);

    course.quiz = quiz;
    await course.save();

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};