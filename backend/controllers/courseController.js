const User = require("../models/User");
const { FREE_ACTIVE_COURSE_LIMIT } =
  require("../config/limits");

const Course = require("../models/Course");
const mongoose = require("mongoose");
const axios = require("axios");
const slugify = require("slugify");
const Activity = require('../models/Activity');
const QuizAttempt = require('../models/QuizAttempt');

const PASS_SCORE = 60;

const normalizeQuizForStorage = (quiz = []) =>
  (Array.isArray(quiz) ? quiz : []).map((item) => ({
    question: item.question,
    options: item.options,
    answer: item.answer,
  }));

const getQuizTarget = (course, scope, moduleIndex, chapterIndex) => {
  const module = course.modules[moduleIndex];
  if (!module) {
    return { error: "Invalid module index" };
  }

  if (scope === "module") {
    return {
      module,
      target: module,
      title: `${module.title} Module Quiz`,
      quiz: module.quiz || [],
    };
  }

  const chapter = module.chapters[chapterIndex];
  if (!chapter) {
    return { error: "Invalid chapter index" };
  }

  return {
    module,
    chapter,
    target: chapter,
    title: chapter.title,
    quiz: chapter.quiz || [],
  };
};

const recalculateCourseProgress = (course) => {
  let total = 0;
  let completed = 0;

  course.modules.forEach((module) => {
    const chapters = module.chapters || [];
    chapters.forEach((chapter) => {
      total += 1;
      if (chapter.quizPassed || chapter.isCompleted) completed += 1;
    });

    if (chapters.length) {
      total += 1;
      if (module.quizPassed || module.isCompleted) completed += 1;
    }

    module.isCompleted =
      chapters.length > 0 &&
      chapters.every((chapter) => chapter.quizPassed || chapter.isCompleted) &&
      Boolean(module.quizPassed);
  });

  course.progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  return course.progress;
};

const recordActivity = (data) =>
  Activity.create(data).catch((err) => {
    console.error("Activity write failed:", err.message);
  });

const toDateKey = (date) => new Date(date).toISOString().slice(0, 10);

const buildHeatmap = (activities, year) => {
  const counts = new Map();
  activities.forEach((activity) => {
    const key = toDateKey(activity.timestamp);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const heatmap = [];
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  let cursor = new Date(start);

  while (cursor <= end) {
    const dateKey = toDateKey(cursor);
    const count = counts.get(dateKey) || 0;
    heatmap.push({
      date: dateKey,
      count,
      level: count === 0 ? 0 : Math.min(4, Math.ceil(count / 2)),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const activeDays = new Set([...counts.keys()]);

  let currentStreak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const streakCursor = year === today.getUTCFullYear() ? new Date(today) : new Date(end);
  while (activeDays.has(toDateKey(streakCursor))) {
    currentStreak += 1;
    streakCursor.setUTCDate(streakCursor.getUTCDate() - 1);
  }

  const sortedDays = [...activeDays].sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let previous = null;

  sortedDays.forEach((dateKey) => {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    if (!previous) {
      runningStreak = 1;
    } else {
      const diffDays = Math.round((date - previous) / (24 * 60 * 60 * 1000));
      runningStreak = diffDays === 1 ? runningStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, runningStreak);
    previous = date;
  });

  return {
    heatmap,
    currentStreak,
    longestStreak,
    activeDays: activeDays.size,
    totalActivities: activities.length,
    year
  };
};

const generateUniqueSlug = async (title, excludeCourseId) => {
  const baseSlug = slugify(String(title || ""), {
    lower: true,
    strict: true,
  }) || `course-${Date.now()}`;

  let slug = baseSlug;
  let suffix = 1;

  while (
    await Course.exists({
      slug,
      ...(excludeCourseId ? { _id: { $ne: excludeCourseId } } : {}),
    })
  ) {
    slug = `${baseSlug}-${suffix++}`;
  }

  return slug;
};

const {
  generateCourseStructureAI,
  generateChapterContentAI,
  generateGlossaryAI,
  generateRoadmapAI,
  prefetchFirstModuleAI,
  generateQuizAI,
  explainQuizAnswerAI,
} = require("../services/courseService");

exports.generateQuiz = async (req, res) => {
  try {
    const {
      courseId,
      moduleIndex,
      chapterIndex,
      chapterContent,
      scope = "chapter",
      force = false,
    } = req.body;

    if (!courseId || moduleIndex === undefined) {
      return res.status(400).json({ message: "Missing courseId or moduleIndex" });
    }

    if (scope !== "module" && chapterIndex === undefined) {
      return res.status(400).json({ message: "Missing chapterIndex" });
    }

    const course = await Course.findOne({
      _id: courseId,
      user: req.user._id,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const { module, chapter, target, quiz, error } = getQuizTarget(
      course,
      scope,
      moduleIndex,
      chapterIndex
    );

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (!force && quiz.length) {
      return res.json({
        success: true,
        quiz,
        count: quiz.length,
        cached: true,
        course,
      });
    }

    const quizContext =
      scope === "module"
        ? module.chapters
          .map((ch, index) => `Chapter ${index + 1}: ${ch.title}\n${ch.content || ""}`)
          .join("\n\n")
          .slice(0, 8000)
        : chapterContent || chapter.content || "";

    const quizTitle =
      scope === "module"
        ? { title: `${module.title} Module Review` }
        : chapter;

    const generatedQuiz = await generateQuizAI(course, module, quizTitle, quizContext);
    target.quiz = normalizeQuizForStorage(generatedQuiz);

    await course.save();

    res.json({
      success: true,
      quiz: target.quiz,
      count: target.quiz.length,
      cached: false,
      course,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Quiz generation failed",
    });
  }
};

exports.submitQuizAttempt = async (req, res) => {
  try {
    const {
      courseId,
      moduleIndex,
      chapterIndex,
      scope = "chapter",
      answers = [],
    } = req.body;

    if (!courseId || moduleIndex === undefined) {
      return res.status(400).json({ message: "Missing courseId or moduleIndex" });
    }

    if (scope !== "module" && chapterIndex === undefined) {
      return res.status(400).json({ message: "Missing chapterIndex" });
    }

    const course = await Course.findOne({
      _id: courseId,
      user: req.user._id,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const { module, chapter, target, title, quiz, error } = getQuizTarget(
      course,
      scope,
      moduleIndex,
      chapterIndex
    );

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (!quiz.length) {
      return res.status(400).json({ message: "Generate the quiz before submitting" });
    }

    if (!Array.isArray(answers) || answers.length !== quiz.length) {
      return res.status(400).json({ message: "Please answer all quiz questions" });
    }

    const correctAnswers = quiz.reduce(
      (count, question, index) => count + (answers[index] === question.answer ? 1 : 0),
      0
    );
    const score = Math.round((correctAnswers / quiz.length) * 100);
    const passed = score >= PASS_SCORE;

    target.quizAttempts = (target.quizAttempts || 0) + 1;
    target.lastQuizScore = score;
    target.bestQuizScore = Math.max(target.bestQuizScore || 0, score);
    target.quizLastAttemptAt = new Date();

    if (passed) {
      target.quizPassed = true;
      target.isCompleted = true;
    }

    recalculateCourseProgress(course);
    await course.save();

    await QuizAttempt.create({
      user: req.user._id,
      course: course._id,
      scope,
      moduleIndex,
      chapterIndex: scope === "chapter" ? chapterIndex : undefined,
      chapterTitle: scope === "chapter" ? chapter?.title : title,
      moduleTitle: module.title,
      score,
      correctAnswers,
      totalQuestions: quiz.length,
      passed,
    });

    await recordActivity({
      user: req.user._id,
      type: "quiz_taken",
      description: `${passed ? "Passed" : "Attempted"} ${title} with ${score}%`,
      course: course._id,
      moduleIndex,
      chapterIndex: scope === "chapter" ? chapterIndex : undefined,
      score,
    });

    if (passed && scope === "module") {
      await recordActivity({
        user: req.user._id,
        type: "module_completed",
        description: `Completed module ${module.title}`,
        course: course._id,
        moduleIndex,
        score,
      });
    }

    res.json({
      success: true,
      score,
      correctAnswers,
      totalQuestions: quiz.length,
      passed,
      passScore: PASS_SCORE,
      progress: course.progress,
      course,
    });
  } catch (error) {
    console.error("submitQuizAttempt error:", error);
    res.status(500).json({ message: "Quiz submission failed" });
  }
};

exports.markChapterComplete = async (req, res) => {
  try {
    const { courseId, moduleIndex, chapterIndex } = req.body;

    if (!courseId || moduleIndex === undefined || chapterIndex === undefined) {
      return res.status(400).json({ message: "Missing courseId, moduleIndex, or chapterIndex" });
    }

    const course = await Course.findOne({
      _id: courseId,
      user: req.user._id,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const module = course.modules[moduleIndex];
    const chapter = module?.chapters?.[chapterIndex];

    if (!chapter) {
      return res.status(400).json({ message: "Invalid module or chapter index" });
    }

    if (!chapter.isCompleted) {
      chapter.isCompleted = true;
      await recordActivity({
        user: req.user._id,
        type: "chapter_completed",
        description: `Completed ${chapter.title}`,
        course: course._id,
        moduleIndex,
        chapterIndex,
      });
    }

    recalculateCourseProgress(course);
    await course.save();

    res.json({
      success: true,
      progress: course.progress,
      course,
    });
  } catch (err) {
    console.error("markChapterComplete error:", err);
    res.status(500).json({
      message: "Progress update failed",
    });
  }
};

exports.getDashboardActivitySummary = async (req, res) => {
  try {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 120);

    const activities = await Activity.find({
      user: req.user._id,
      timestamp: { $gte: since },
    }).select("timestamp type score");

    res.json(buildHeatmap(activities, 98));
  } catch (error) {
    console.error("getDashboardActivitySummary error:", error);
    res.status(500).json({ message: "Failed to fetch activity summary" });
  }
};

exports.getModuleArticles = async (req, res) => {
  try {
    const { courseTitle, moduleTitle, chapters = [], courseId, moduleIndex } = req.body;

    if (!courseTitle || !moduleTitle) {
      return res.status(400).json({
        message: "courseTitle and moduleTitle are required",
      });
    }

    let courseDoc = null;
    let courseModule = null;
    if (courseId && moduleIndex !== undefined) {
      courseDoc = await Course.findOne({ _id: courseId, user: req.user._id });
      courseModule = courseDoc?.modules?.[moduleIndex];
      if (courseModule?.articleResources?.length) {
        return res.json({
          success: true,
          articles: courseModule.articleResources,
          cached: true,
        });
      }
    }

    const cacheKey = `articles:${courseTitle}:${moduleTitle}:${JSON.stringify(chapters)}`;
    const cached = getCached(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        articles: cached,
        cached: true,
      });
    }

    const query = `${courseTitle} ${moduleTitle} ${chapters.slice(0, 5).join(" ")} tutorial guide documentation examples best practices`
      .replace(/\s+/g, " ")
      .trim();

    const searchRes = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google",
        q: query,
        api_key: process.env.SERP_API_KEY,
        num: 8,
      },
      timeout: 10000,
    });

    const seenDomains = new Set();
    const articles = (searchRes.data?.organic_results || [])
      .filter((item) => {
        try {
          const domain = new URL(item.link).hostname;
          if (seenDomains.has(domain)) return false;
          seenDomains.add(domain);
          return true;
        } catch {
          return false;
        }
      })
      .map((item, index) => ({
        title: cleanText(item.title || "Untitled Article"),
        link: item.link,
        snippet: cleanText(item.snippet || "Explore this learning resource."),
        displayLink: cleanText(item.source || new URL(item.link).hostname),
        thumbnail: item.thumbnail || null,
        type: "ARTICLE",
        readingTime: `${Math.max(3, Math.min(12, Math.ceil((item.snippet || "").split(" ").length / 35) + 3))} min`,
        lessonOrder: index + 1,
        topicTitle:
          (Array.isArray(chapters) && (chapters[index % chapters.length]?.title || chapters[index % chapters.length])) ||
          moduleTitle,
      }))
      .slice(0, 8);

    setCache(cacheKey, articles);
    if (courseDoc && courseModule) {
      courseModule.articleResources = articles;
      await courseDoc.save();
    }

    return res.json({
      success: true,
      articles,
      cached: false,
    });
  } catch (err) {
    console.error("getModuleArticles error:", err?.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message:
        err?.response?.data?.error ||
        err.message ||
        "Failed to fetch articles",
    });
  }
};

const persistentMarkChapterComplete = exports.markChapterComplete;

/* =========================================================
   🔹 1. GENERATE COURSE STRUCTURE (NO DB SAVE)
========================================================= */
exports.generateCourseStructure = async (req, res) => {
  try {
    const { title } = req.body;

    const structure = await generateCourseStructureAI(title);

    res.json({
      success: true,
      structure,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error generating course structure",
    });
  }
};

/* =========================================================
   🔹 2. ENROLL COURSE + PREFETCH FIRST MODULE ⚡
========================================================= */
exports.enrollCourse = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const modules = Array.isArray(req.body.modules)
      ? req.body.modules
      : [];

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const user = await User.findById(req.user._id);

    const activeCourses =
      await Course.countDocuments({
        user: req.user._id,
      });

    if (
      user.plan === "free" &&
      activeCourses >= FREE_ACTIVE_COURSE_LIMIT
    ) {
      return res.status(403).json({
        success: false,
        code: "COURSE_LIMIT_REACHED",
        limit: FREE_ACTIVE_COURSE_LIMIT,
        message:
          "You have reached your free plan course limit.",
      });
    }

    const slug = await generateUniqueSlug(title);

    const course = await Course.create({
      title,
      slug,
      modules,
      user: req.user._id,
      enrolled: true,
      progress: 0,
    });

    await recordActivity({
      user: req.user._id,
      type: "course_enrolled",
      description: `Enrolled in ${course.title}`,
      course: course._id,
    });

    res.status(201).json({
      success: true,
      course,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Enroll failed" });
  }
};
/* =========================================================
   🔹 3. GET COURSE (SMART RESPONSE)
========================================================= */
exports.getCourse = async (req, res) => {
  try {
    const param = req.params.id;

    // Build base query with authenticated user
    const baseQuery = { user: req.user._id };

    // If param looks like an ObjectId, query by _id, otherwise treat as slug
    let query;
    if (mongoose.Types.ObjectId.isValid(param)) {
      query = { ...baseQuery, _id: param };
    } else {
      query = { ...baseQuery, slug: param };
    }

    const course = await Course.findOne(query);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ success: true, course });
  } catch (err) {
    console.error("getCourse error:", err);
    res.status(500).json({ message: "Failed to fetch course" });
  }
};

/* =========================================================
   🔹 4. GENERATE CHAPTER CONTENT (CACHED + FAST)
========================================================= */
exports.generateChapterContent = async (req, res) => {
  try {
    const { courseId, moduleIndex, chapterIndex } = req.body;

    if (!courseId || moduleIndex === undefined || chapterIndex === undefined) {
      return res.status(400).json({ message: "Missing courseId, moduleIndex, or chapterIndex" });
    }

    const course = await Course.findOne({
      _id: courseId,
      user: req.user._id,
    });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const module = course.modules[moduleIndex];
    if (!module) {
      return res.status(400).json({ message: "Invalid module index" });
    }

    const chapter = module.chapters[chapterIndex];
    if (!chapter) {
      return res.status(400).json({ message: "Invalid chapter index" });
    }

    // ✅ Cache check (NO RE-GENERATION)
    if (chapter.content && chapter.content.length > 20) {
      return res.json({
        success: true,
        content: chapter.content,
        cached: true,
      });
    }

    const content = await generateChapterContentAI(
      course.title,
      chapter.title
    );

    chapter.content = content;

    await course.save();

    await recordActivity({
      user: req.user._id,
      type: "chapter_completed",
      description: `Generated content for ${chapter.title}`,
      course: course._id,
      moduleIndex,
      chapterIndex,
    });

    res.json({
      success: true,
      content,
      cached: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Content generation failed",
    });
  }
};

/* =========================================================
   🔹 5. MARK CHAPTER COMPLETE + PROGRESS
========================================================= */
exports.markChapterComplete = async (req, res) => {
  try {
    const { courseId, moduleIndex, chapterIndex } = req.body;

    if (!courseId || moduleIndex === undefined || chapterIndex === undefined) {
      return res.status(400).json({ message: "Missing courseId, moduleIndex, or chapterIndex" });
    }

    const course = await Course.findOne({
      _id: courseId,
      user: req.user._id,
    });

    const chapter =
      course.modules[moduleIndex].chapters[chapterIndex];

    if (!chapter.isCompleted) {
      chapter.isCompleted = true;
    }

    // 📊 Calculate Progress
    let total = 0;
    let completed = 0;

    course.modules.forEach((mod) => {
      mod.chapters.forEach((ch) => {
        total++;
        if (ch.isCompleted) completed++;
      });
    });

    course.progress =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    await course.save();

    res.json({
      success: true,
      progress: course.progress,
    });
  } catch (err) {
    res.status(500).json({
      message: "Progress update failed",
    });
  }
};

/* =========================================================
   🔹 6. GLOSSARY (OPTIONAL CACHE READY)
========================================================= */
exports.getGlossary = async (req, res) => {
  try {
    const { title, courseId, modules } = req.body;

    if (!title && !courseId) {
      return res.status(400).json({ message: "title or courseId is required" });
    }

    let courseTitle = title;
    let courseModules = modules;

    if (courseId) {
      const course = await Course.findOne({
        _id: courseId,
        user: req.user._id,
      });
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      courseTitle = course.title;
      courseModules = course.modules;
    }

    const glossary = await generateGlossaryAI(courseTitle, courseModules);

    res.json({
      success: true,
      glossary,
      count: glossary.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Glossary generation failed",
    });
  }
};

/* =========================================================
   🔹 7. ROADMAP (mind-map tree)
========================================================= */
exports.getRoadmap = async (req, res) => {
  try {
    const { title, courseId, modules } = req.body;

    if (!title && !courseId) {
      return res.status(400).json({ message: "title or courseId is required" });
    }

    let courseTitle = title;
    let courseModules = modules;

    if (courseId) {
      const course = await Course.findOne({
        _id: courseId,
        user: req.user._id,
      });
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      courseTitle = course.title;
      courseModules = course.modules;
    }

    const roadmap = await generateRoadmapAI(courseTitle, courseModules);

    res.json({
      success: true,
      roadmap,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Roadmap generation failed",
    });
  }
};


const legacyGenerateQuizUnsaved = async (req, res) => {
  try {
    const { courseId, moduleIndex, chapterIndex, chapterContent } = req.body;

    if (!courseId || moduleIndex === undefined || chapterIndex === undefined) {
      return res.status(400).json({ message: "Missing courseId, moduleIndex, or chapterIndex" });
    }

    const course = await Course.findOne({
      _id: courseId,
      user: req.user._id,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const module = course.modules[moduleIndex];
    if (!module) {
      return res.status(400).json({ message: "Invalid module index" });
    }

    const chapter = module.chapters[chapterIndex];
    if (!chapter) {
      return res.status(400).json({ message: "Invalid chapter index" });
    }

    const content =
      chapterContent ||
      chapter.content ||
      "";

    const quiz = await generateQuizAI(course, module, chapter, content);

    res.json({
      success: true,
      quiz,
      count: quiz.length,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Quiz generation failed",
    });
  }
};

exports.explainQuizAnswer = async (req, res) => {
  try {
    const {
      courseId,
      moduleIndex,
      chapterIndex,
      chapterContent,
      question,
      options,
      correctAnswer,
      selectedAnswer,
    } = req.body;

    if (
      !courseId ||
      !question ||
      !Array.isArray(options) ||
      options.length < 4 ||
      !correctAnswer ||
      !selectedAnswer
    ) {
      return res.status(400).json({
        message:
          "Missing courseId, question, options (4+), correctAnswer, or selectedAnswer",
      });
    }

    if (selectedAnswer === correctAnswer) {
      return res.status(400).json({
        message: "Explanation is only for incorrect answers",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      user: req.user._id,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const module = course.modules[moduleIndex];
    const chapter = module?.chapters?.[chapterIndex];

    const explanation = await explainQuizAnswerAI({
      courseTitle: course.title,
      moduleTitle: module?.title || "",
      chapterTitle: chapter?.title || "",
      chapterContent: chapterContent || chapter?.content || "",
      question,
      options,
      correctAnswer,
      selectedAnswer,
    });

    res.json({
      success: true,
      explanation,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Explanation failed",
    });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    let courses = await Course.find({ user: req.user._id })
      .select("title progress slug createdAt")
      .sort({ createdAt: -1 });

    // Ensure each course has a slug; generate and persist if missing
    const needsUpdate = [];
    for (const courseItem of courses) {
      if (!courseItem.slug) {
        const slug = await generateUniqueSlug(courseItem.title, courseItem._id);
        courseItem.slug = slug;
        needsUpdate.push({ _id: courseItem._id, slug });
      }
    }

    // Persist slugs for any courses that were missing them
    if (needsUpdate.length) {
      await Promise.all(
        needsUpdate.map((u) => Course.findByIdAndUpdate(u._id, { slug: u.slug }))
      );
    }

    res.json({ courses });
  } catch (err) {
    console.error("getMyCourses error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard courses" });
  }
};

/* =========================================================
   🔹 VIDEO & ARTICLE CACHE (30 min TTL)
========================================================= */
const apiCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const getCached = (key) => {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    apiCache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (key, data) => {
  apiCache.set(key, { data, ts: Date.now() });
};

const cleanText = (value = "") =>
  String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const getCourseCounts = (course) => {
  const modules = Array.isArray(course.modules) ? course.modules : [];
  return {
    moduleCount: modules.length,
    chapterCount: modules.reduce(
      (total, module) => total + (module.chapters?.length || 0),
      0
    ),
  };
};

const buildCourseTags = (course) => {
  const stopWords = new Set([
    "and",
    "the",
    "for",
    "with",
    "from",
    "course",
    "learning",
    "complete",
    "beginner",
  ]);

  const titleTags = cleanText(course.title || "")
    .split(/[^a-z0-9+#.]+/i)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 2 && !stopWords.has(tag.toLowerCase()));

  const moduleTags = (course.modules || [])
    .slice(0, 3)
    .map((module) => cleanText(module.title || "").split(/[^a-z0-9+#.]+/i)[0])
    .filter((tag) => tag && tag.length > 2);

  return [...new Set([...titleTags, ...moduleTags])]
    .slice(0, 3)
    .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1));
};

const findCourseImage = async (courseTitle) => {
  if (!process.env.SERP_API_KEY) return null;

  const cacheKey = `course-image:${cleanText(courseTitle).toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  try {
    const imageRes = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_images",
        q: `${courseTitle} online course learning`,
        api_key: process.env.SERP_API_KEY,
        safe: "active",
        ijn: 0,
      },
      timeout: 7000,
    });

    const result = (imageRes.data?.images_results || []).find(
      (item) => item?.original || item?.thumbnail
    );

    const image = result
      ? {
        imageUrl: result.thumbnail || result.original,
        imageSource: cleanText(result.source || result.title || "Google Images"),
      }
      : null;

    setCache(cacheKey, image);
    return image;
  } catch (err) {
    console.error("findCourseImage error:", err?.response?.data || err.message);
    setCache(cacheKey, null);
    return null;
  }
};

const ensureCourseImage = async (courseItem) => {
  if (courseItem.imageUrl) return false;

  const image = await findCourseImage(courseItem.title);
  if (!image?.imageUrl) return false;

  courseItem.imageUrl = image.imageUrl;
  courseItem.imageSource = image.imageSource;
  courseItem.imageFetchedAt = new Date();
  return true;
};

const pickThumbnail = (thumbnails = {}) =>
  thumbnails.maxres?.url ||
  thumbnails.standard?.url ||
  thumbnails.high?.url ||
  thumbnails.medium?.url ||
  thumbnails.default?.url ||
  null;

const parseDuration = (duration = "") => {
  const match = String(duration).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  return hours
    ? [hours, String(minutes).padStart(2, "0"), String(seconds).padStart(2, "0")].join(":")
    : [minutes, String(seconds).padStart(2, "0")].join(":");
};

const durationToSeconds = (duration = "") => {
  const match = String(duration).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  return (
    Number(match[1] || 0) * 3600 +
    Number(match[2] || 0) * 60 +
    Number(match[3] || 0)
  );
};

const normalizeResourceQuery = (courseTitle, moduleTitle, chapters = []) => {
  const chapterTerms = Array.isArray(chapters)
    ? chapters
      .map((chapter) => cleanText(chapter?.title || chapter))
      .filter(Boolean)
      .slice(0, 3)
      .join(" ")
    : "";

  return cleanText(`${courseTitle} ${moduleTitle} ${chapterTerms}`);
};

const buildSearchTerms = (courseTitle, moduleTitle, chapters = []) => {
  const terms = [courseTitle, moduleTitle];

  if (Array.isArray(chapters)) {
    chapters.slice(0, 3).forEach((chapter) => {
      const title = chapter?.title || chapter;
      if (title) terms.push(title);
    });
  }

  return terms
    .flatMap((term) =>
      cleanText(term)
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/i)
    )
    .filter((term) => term.length >= 3)
    .filter((term, index, list) => list.indexOf(term) === index);
};

const isShortVideo = (video) => {
  const haystack = `${video.title || ""} ${video.description || ""}`.toLowerCase();
  return (
    video.durationSeconds < 240 ||
    haystack.includes("#shorts") ||
    haystack.includes(" youtube shorts") ||
    /\bshorts?\b/.test(haystack) ||
    /\breels?\b/.test(haystack) ||
    /\btiktok\b/.test(haystack)
  );
};

const scoreVideoRelevance = (video, searchTerms) => {
  const haystack = `${video.title || ""} ${video.description || ""}`.toLowerCase();
  const matchedTerms = searchTerms.filter((term) => haystack.includes(term));
  const tutorialBoost =
    /\b(full|complete|course|tutorial|lesson|explained|masterclass|guide)\b/.test(haystack)
      ? 2
      : 0;
  const moduleBoost = matchedTerms.length >= 2 ? 2 : 0;
  const playlistBoost = video.sourceType === "playlist" ? 1 : 0;

  return matchedTerms.length + tutorialBoost + moduleBoost + playlistBoost;
};

const uniqueBy = (items, keyFn) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/* =========================================================
   🔹 GET MODULE VIDEOS (YouTube Data API v3)
========================================================= */
exports.getModuleVideos = async (req, res) => {
  try {
    const { courseTitle, moduleTitle, chapters = [], courseId, moduleIndex } = req.body;

    if (!courseTitle || !moduleTitle) {
      return res.status(400).json({ message: "courseTitle and moduleTitle are required" });
    }

    let courseDoc = null;
    let courseModule = null;
    if (courseId && moduleIndex !== undefined) {
      courseDoc = await Course.findOne({ _id: courseId, user: req.user._id });
      courseModule = courseDoc?.modules?.[moduleIndex];
      if (courseModule?.videoResources?.length) {
        return res.json({ success: true, videos: courseModule.videoResources, cached: true });
      }
    }

    const cacheKey = `videos:${courseTitle}:${moduleTitle}:${JSON.stringify(chapters).slice(0, 200)}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ success: true, videos: cached, cached: true });
    }

    const baseQuery = normalizeResourceQuery(courseTitle, moduleTitle, chapters);
    const searchTerms = buildSearchTerms(courseTitle, moduleTitle, chapters);
    const videoQuery = `${baseQuery} full tutorial complete lesson`;
    const playlistQuery = `${baseQuery} playlist complete course`;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: "YouTube API key not configured" });
    }

    const [playlistSearchRes, videoSearchRes] = await Promise.all([
      axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
          part: "snippet",
          q: playlistQuery,
          type: "playlist",
          order: "relevance",
          maxResults: 1,
          key: apiKey,
          relevanceLanguage: "en",
          safeSearch: "moderate",
        },
      }),
      axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
          part: "snippet",
          q: videoQuery,
          type: "video",
          order: "relevance",
          maxResults: 8,
          key: apiKey,
          videoEmbeddable: true,
          videoDuration: "long",
          relevanceLanguage: "en",
          safeSearch: "moderate",
        },
      }),
    ]);

    const playlist = playlistSearchRes.data.items?.[0];
    let playlistItems = [];

    if (playlist?.id?.playlistId) {
      const playlistItemsRes = await axios.get(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          params: {
            part: "snippet,contentDetails",
            playlistId: playlist.id.playlistId,
            maxResults: 6,
            key: apiKey,
          },
        }
      );
      playlistItems = playlistItemsRes.data.items || [];
    }

    const playlistVideos = playlistItems
      .map((item, index) => ({
        videoId: item.contentDetails?.videoId,
        title: cleanText(item.snippet?.title),
        thumbnail: pickThumbnail(item.snippet?.thumbnails),
        instructor: cleanText(item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle),
        publishedAt: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt,
        description: cleanText(item.snippet?.description),
        collectionTitle: cleanText(playlist?.snippet?.title),
        sourceType: "playlist",
        lessonOrder: index + 1,
      }))
      .filter(
        (item) =>
          item.videoId &&
          item.title &&
          item.title !== "Private video" &&
          item.title !== "Deleted video"
      );

    const directVideos = (videoSearchRes.data.items || [])
      .map((item, index) => ({
        videoId: item.id?.videoId,
        title: cleanText(item.snippet?.title),
        thumbnail: pickThumbnail(item.snippet?.thumbnails),
        instructor: cleanText(item.snippet?.channelTitle),
        publishedAt: item.snippet?.publishedAt,
        description: cleanText(item.snippet?.description),
        collectionTitle: "",
        sourceType: "lesson",
        lessonOrder: playlistVideos.length + index + 1,
      }))
      .filter((item) => item.videoId && item.title);

    let videos = uniqueBy([...playlistVideos, ...directVideos], (item) => item.videoId).slice(0, 10);

    if (videos.length) {
      const detailsRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          part: "contentDetails,statistics,snippet,status",
          id: videos.map((item) => item.videoId).join(","),
          key: apiKey,
        },
      });

      const detailsById = new Map(
        (detailsRes.data.items || []).map((item) => [item.id, item])
      );

      videos = videos
        .filter((video) => {
          const details = detailsById.get(video.videoId);
          return !details?.status || details.status.embeddable !== false;
        })
        .map((video, index) => {
          const details = detailsById.get(video.videoId);
          return {
            ...video,
            title: cleanText(details?.snippet?.title || video.title),
            thumbnail: pickThumbnail(details?.snippet?.thumbnails) || video.thumbnail,
            instructor: cleanText(details?.snippet?.channelTitle || video.instructor),
            description: cleanText(details?.snippet?.description || video.description),
            duration: parseDuration(details?.contentDetails?.duration),
            durationSeconds: durationToSeconds(details?.contentDetails?.duration),
            viewCount: Number(details?.statistics?.viewCount || 0),
          };
        })
        .filter((video) => !isShortVideo(video))
        .map((video) => ({
          ...video,
          relevanceScore: scoreVideoRelevance(video, searchTerms),
        }))
        .filter((video) => video.relevanceScore >= 3)
        .sort((a, b) => {
          if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          return (b.viewCount || 0) - (a.viewCount || 0);
        })
        .slice(0, 6)
        .map((video, index) => ({
          ...video,
          lessonOrder: index + 1,
          topicTitle:
            (Array.isArray(chapters) && (chapters[index % chapters.length]?.title || chapters[index % chapters.length])) ||
            moduleTitle,
        }));
    }

    videos = videos.map((video) => ({
      videoId: video.videoId,
      title: video.title,
      duration: video.duration,
      lessonOrder: video.lessonOrder,
      topicTitle: video.topicTitle || moduleTitle,
    }));

    setCache(cacheKey, videos);
    if (courseDoc && courseModule) {
      courseModule.videoResources = videos;
      await courseDoc.save();
    }

    res.json({ success: true, videos, cached: false });
  } catch (err) {
    console.error("getModuleVideos error:", err?.response?.data || err.message);
    res.status(500).json({
      message: err?.response?.data?.error?.message || "Failed to fetch videos",
    });
  }
};

/* =========================================================
   🔹 GET MODULE ARTICLES (SerpAPI)
========================================================= */
exports.getModuleArticles = async (req, res) => {
  try {
    const { courseTitle, moduleTitle, chapters = [], courseId, moduleIndex } = req.body;

    if (!courseTitle || !moduleTitle) {
      return res.status(400).json({
        message: "courseTitle and moduleTitle are required",
      });
    }

    // ✅ Cache key
    const cacheKey = `articles:${courseTitle}:${moduleTitle}:${JSON.stringify(
      chapters
    )}`;

    const cached = getCached(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        articles: cached,
        cached: true,
      });
    }

    // ✅ Smart semantic query
    const query = `
      ${courseTitle}
      ${moduleTitle}
      ${chapters.slice(0, 5).join(" ")}
      tutorial guide documentation examples best practices
    `
      .replace(/\s+/g, " ")
      .trim();

    // ✅ Fetch from SerpAPI
    const searchRes = await axios.get(
      "https://serpapi.com/search.json",
      {
        params: {
          engine: "google",
          q: query,
          api_key: process.env.SERP_API_KEY,
          num: 8,
        },
        timeout: 10000,
      }
    );

    const results = searchRes.data?.organic_results || [];

    // ✅ Remove duplicate domains
    const seenDomains = new Set();

    const articles = results
      .filter((item) => {
        try {
          const domain = new URL(item.link).hostname;

          if (seenDomains.has(domain)) {
            return false;
          }

          seenDomains.add(domain);

          return true;
        } catch {
          return false;
        }
      })
      .map((item, index) => ({
        title: cleanText(item.title || "Untitled Article"),

        link: item.link,

        snippet: cleanText(
          item.snippet || "Explore this learning resource."
        ),

        displayLink: cleanText(item.source || new URL(item.link).hostname),

        thumbnail:
          item.thumbnail ||
          item.rich_snippet?.top?.extensions?.[0] ||
          null,

        type: "ARTICLE",

        readingTime: `${Math.max(
          3,
          Math.min(
            12,
            Math.ceil(
              (item.snippet || "").split(" ").length / 35
            ) + 3
          )
        )} min`,

        lessonOrder: index + 1,
      }))
      .slice(0, 8);

    // ✅ Cache results
    setCache(cacheKey, articles);

    return res.json({
      success: true,
      articles,
      cached: false,
    });
  } catch (err) {
    console.error(
      "getModuleArticles error:",
      err?.response?.data || err.message
    );

    return res.status(500).json({
      success: false,
      message:
        err?.response?.data?.error ||
        err.message ||
        "Failed to fetch articles",
    });
  }
};


/* =========================================================
   🔹 DASHBOARD ENHANCEMENTS (Fixed & Optimized)
========================================================= */

// Get Recent Activity
exports.getRecentActivity = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(12)
      .populate('course', 'title slug');

    const formatted = activities.map(act => ({
      description: act.description,
      time: new Date(act.timestamp).toLocaleDateString('en-IN', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      type: act.type,
      course: act.course ? act.course.title : null,
      path: act.course ? `/courses/${act.course.slug || act.course._id}` : "/dashboard",
    }));

    res.json({ activities: formatted });
  } catch (error) {
    console.error("getRecentActivity error:", error);
    res.status(500).json({ message: "Failed to fetch activity" });
  }
};

// Get Last Quiz
exports.getLastQuiz = async (req, res) => {
  try {
    const lastQuiz = await QuizAttempt.findOne({ user: req.user._id })
      .sort({ timestamp: -1 })
      .populate('course', 'title');

    if (!lastQuiz) {
      return res.json({
        score: 0,
        chapter: "No quiz yet",
        course: "—",
        courseId: null
      });
    }

    res.json({
      score: lastQuiz.score,
      chapter: lastQuiz.chapterTitle || "Unknown Chapter",
      course: lastQuiz.course?.title || "Unknown Course",
      courseId: lastQuiz.course?._id
    });
  } catch (error) {
    console.error("getLastQuiz error:", error);
    res.status(500).json({ message: "Failed to fetch last quiz" });
  }
};

// Get Personalized Recommendations
exports.getRecommendations = async (req, res) => {
  try {
    // Using your existing Course model (per user)
    const userCourses = await Course.find({
      user: req.user._id,
      progress: { $lt: 100 }
    }).sort({ progress: -1, createdAt: -1 }).limit(6);

    const recommendations = [];

    if (userCourses.length > 0) {
      userCourses.forEach(course => {
        recommendations.push({
          title: `Continue ${course.title}`,
          reason: `${100 - course.progress}% remaining`,
          type: "Continue Learning",
          link: `/courses/${course.slug || course._id}`
        });
      });
    } else {
      // Fallback recommendations
      recommendations.push(
        {
          title: "Advanced JavaScript Concepts",
          reason: "Popular follow-up after basics",
          type: "Suggested Course",
          link: "/courses"
        },
        {
          title: "React Performance Tips",
          reason: "Based on your learning pattern",
          type: "Article",
          link: "#"
        }
      );
    }

    res.json({ recommendations });
  } catch (error) {
    console.error("getRecommendations error:", error);
    res.status(500).json({ message: "Failed to fetch recommendations" });
  }
};

exports.markChapterComplete = persistentMarkChapterComplete;

const areAllModulesPassed = (course) =>
  Array.isArray(course.modules) &&
  course.modules.length > 0 &&
  course.modules.every((module) => Boolean(module.quizPassed));

const refreshFinalQuizUnlock = (course) => {
  course.finalQuizUnlocked = areAllModulesPassed(course);
  if (course.finalQuizPassed) {
    course.progress = 100;
  } else if (course.finalQuizUnlocked) {
    course.progress = Math.max(course.progress || 0, 95);
  }
};

const getFinalAwareQuizTarget = (course, scope, moduleIndex, chapterIndex) => {
  if (scope === "final") {
    return {
      target: course,
      title: "Final Course Assessment",
      quiz: course.finalQuiz || [],
    };
  }

  return getQuizTarget(course, scope, moduleIndex, chapterIndex);
};

const buildCourseResume = (course) => {
  const modules = course.modules || [];

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
    const module = modules[moduleIndex];
    const previousModulePassed = moduleIndex === 0 || modules[moduleIndex - 1]?.quizPassed;

    if (!previousModulePassed) {
      return {
        type: "locked_module",
        moduleIndex,
        moduleTitle: module.title,
        label: `Module ${moduleIndex + 1} locked`,
      };
    }

    for (let chapterIndex = 0; chapterIndex < (module.chapters || []).length; chapterIndex += 1) {
      const chapter = module.chapters[chapterIndex];
      const previousChapterPassed =
        chapterIndex === 0 || module.chapters[chapterIndex - 1]?.quizPassed;

      if (!previousChapterPassed) {
        return {
          type: "locked_chapter",
          moduleIndex,
          chapterIndex,
          moduleTitle: module.title,
          chapterTitle: chapter.title,
          label: `Unlock ${chapter.title}`,
        };
      }

      if (!chapter.content) {
        return {
          type: "chapter_content",
          moduleIndex,
          chapterIndex,
          moduleTitle: module.title,
          chapterTitle: chapter.title,
          label: `Generate ${chapter.title}`,
        };
      }

      if (!chapter.quizPassed) {
        return {
          type: chapter.quiz?.length ? "chapter_quiz" : "chapter_quiz_generate",
          moduleIndex,
          chapterIndex,
          moduleTitle: module.title,
          chapterTitle: chapter.title,
          label: chapter.quiz?.length
            ? `Resume quiz: ${chapter.title}`
            : `Generate quiz: ${chapter.title}`,
        };
      }
    }

    if (!module.quizPassed) {
      return {
        type: module.quiz?.length ? "module_quiz" : "module_quiz_generate",
        moduleIndex,
        moduleTitle: module.title,
        label: module.quiz?.length
          ? `Resume module quiz: ${module.title}`
          : `Generate module quiz: ${module.title}`,
      };
    }
  }

  if (course.finalQuizUnlocked && !course.finalQuizPassed) {
    return {
      type: course.finalQuiz?.length ? "final_quiz" : "final_quiz_generate",
      label: course.finalQuiz?.length ? "Resume final assessment" : "Generate final assessment",
    };
  }

  return {
    type: "completed",
    label: "Course completed",
  };
};

exports.generateQuiz = async (req, res) => {
  try {
    const {
      courseId,
      moduleIndex,
      chapterIndex,
      chapterContent,
      scope = "chapter",
      force = false,
    } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Missing courseId" });
    }

    if (scope !== "final" && moduleIndex === undefined) {
      return res.status(400).json({ message: "Missing moduleIndex" });
    }

    if (scope === "chapter" && chapterIndex === undefined) {
      return res.status(400).json({ message: "Missing chapterIndex" });
    }

    const course = await Course.findOne({
      _id: courseId,
      user: req.user._id,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    refreshFinalQuizUnlock(course);

    if (scope === "final" && !course.finalQuizUnlocked) {
      return res.status(403).json({ message: "Complete every module quiz to unlock the final assessment" });
    }

    const { module, chapter, target, quiz, error } = getFinalAwareQuizTarget(
      course,
      scope,
      moduleIndex,
      chapterIndex
    );

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (!force && quiz.length) {
      return res.json({
        success: true,
        quiz,
        count: quiz.length,
        cached: true,
        course,
      });
    }

    const quizContext =
      scope === "final"
        ? course.modules
          .map((mod, modIndex) =>
            [
              `Module ${modIndex + 1}: ${mod.title}`,
              ...(mod.chapters || []).map(
                (ch, chIndex) => `Chapter ${chIndex + 1}: ${ch.title}\n${ch.content || ""}`
              ),
            ].join("\n")
          )
          .join("\n\n")
          .slice(0, 18000)
        : scope === "module"
          ? module.chapters
            .map((ch, index) => `Chapter ${index + 1}: ${ch.title}\n${ch.content || ""}`)
            .join("\n\n")
            .slice(0, 8000)
          : chapterContent || chapter.content || "";

    const quizTitle =
      scope === "final"
        ? { title: "Final Course Assessment" }
        : scope === "module"
          ? { title: `${module.title} Module Review` }
          : chapter;

    const questionCount = scope === "final" ? 50 : 10;
    const generatedQuiz = await generateQuizAI(
      course,
      scope === "final" ? null : module,
      quizTitle,
      quizContext,
      questionCount
    );

    if (scope === "final") {
      course.finalQuiz = normalizeQuizForStorage(generatedQuiz);
    } else {
      target.quiz = normalizeQuizForStorage(generatedQuiz);
    }

    await course.save();

    res.json({
      success: true,
      quiz: scope === "final" ? course.finalQuiz : target.quiz,
      count: questionCount,
      cached: false,
      course,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message || "Quiz generation failed",
    });
  }
};

exports.submitQuizAttempt = async (req, res) => {
  try {
    const {
      courseId,
      moduleIndex,
      chapterIndex,
      scope = "chapter",
      answers = [],
    } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Missing courseId" });
    }

    if (scope !== "final" && moduleIndex === undefined) {
      return res.status(400).json({ message: "Missing moduleIndex" });
    }

    if (scope === "chapter" && chapterIndex === undefined) {
      return res.status(400).json({ message: "Missing chapterIndex" });
    }

    const course = await Course.findOne({
      _id: courseId,
      user: req.user._id,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    refreshFinalQuizUnlock(course);

    if (scope === "final" && !course.finalQuizUnlocked) {
      return res.status(403).json({ message: "Complete every module quiz to unlock the final assessment" });
    }

    const { module, chapter, target, title, quiz, error } = getFinalAwareQuizTarget(
      course,
      scope,
      moduleIndex,
      chapterIndex
    );

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (!quiz.length) {
      return res.status(400).json({ message: "Generate the quiz before submitting" });
    }

    if (!Array.isArray(answers) || answers.length !== quiz.length) {
      return res.status(400).json({ message: "Please answer all quiz questions" });
    }

    const correctAnswers = quiz.reduce(
      (count, question, index) => count + (answers[index] === question.answer ? 1 : 0),
      0
    );
    const score = Math.round((correctAnswers / quiz.length) * 100);
    const passed = score >= PASS_SCORE;
    const now = new Date();

    if (scope === "final") {
      course.finalQuizAttempts = (course.finalQuizAttempts || 0) + 1;
      course.finalQuizLastScore = score;
      course.finalQuizBestScore = Math.max(course.finalQuizBestScore || 0, score);
      course.finalQuizLastAttemptAt = now;
      if (passed) {
        course.finalQuizPassed = true;
      }
    } else {
      target.quizAttempts = (target.quizAttempts || 0) + 1;
      target.lastQuizScore = score;
      target.bestQuizScore = Math.max(target.bestQuizScore || 0, score);
      target.quizLastAttemptAt = now;

      if (passed) {
        target.quizPassed = true;
        target.isCompleted = true;
      }
    }

    recalculateCourseProgress(course);
    refreshFinalQuizUnlock(course);
    await course.save();

    await QuizAttempt.create({
      user: req.user._id,
      course: course._id,
      scope,
      moduleIndex: scope === "final" ? undefined : moduleIndex,
      chapterIndex: scope === "chapter" ? chapterIndex : undefined,
      chapterTitle:
        scope === "final"
          ? "Final Course Assessment"
          : scope === "chapter"
            ? chapter?.title
            : title,
      moduleTitle: scope === "final" ? "Full course" : module?.title,
      score,
      correctAnswers,
      totalQuestions: quiz.length,
      passed,
    });

    await recordActivity({
      user: req.user._id,
      type: "quiz_taken",
      description: `${passed ? "Passed" : "Attempted"} ${title} with ${score}%`,
      course: course._id,
      moduleIndex: scope === "final" ? undefined : moduleIndex,
      chapterIndex: scope === "chapter" ? chapterIndex : undefined,
      score,
    });

    if (passed && scope === "module") {
      await recordActivity({
        user: req.user._id,
        type: "module_completed",
        description: `Completed module ${module.title}`,
        course: course._id,
        moduleIndex,
        score,
      });
    }

    res.json({
      success: true,
      score,
      correctAnswers,
      totalQuestions: quiz.length,
      passed,
      passScore: PASS_SCORE,
      progress: course.progress,
      course,
    });
  } catch (error) {
    console.error("submitQuizAttempt error:", error);
    res.status(500).json({ message: "Quiz submission failed" });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ user: req.user._id }).sort({ createdAt: -1 });
    const saves = [];

    for (const courseItem of courses) {
      if (!courseItem.slug) {
        courseItem.slug = await generateUniqueSlug(courseItem.title, courseItem._id);
      }
      await ensureCourseImage(courseItem);
      recalculateCourseProgress(courseItem);
      refreshFinalQuizUnlock(courseItem);
      saves.push(courseItem.save());
    }

    if (saves.length) {
      await Promise.all(saves);
    }

    res.json({
      courses: courses.map((courseItem) => {
        const plain = courseItem.toObject();
        return {
          _id: plain._id,
          title: plain.title,
          slug: plain.slug,
          progress: plain.progress || 0,
          createdAt: plain.createdAt,
          imageUrl: plain.imageUrl || "",
          imageSource: plain.imageSource || "",
          tags: buildCourseTags(plain),
          ...getCourseCounts(plain),
          finalQuizUnlocked: Boolean(plain.finalQuizUnlocked),
          finalQuizPassed: Boolean(plain.finalQuizPassed),
          resume: buildCourseResume(plain),
        };
      }),
    });
  } catch (err) {
    console.error("getMyCourses error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard courses" });
  }
};

exports.getDashboardActivitySummary = async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user._id);
    const enrolledYear = user ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();

    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const activities = await Activity.find({
      user: req.user._id,
      timestamp: { $gte: startDate, $lte: endDate },
    }).select("timestamp type score");

    const summary = buildHeatmap(activities, year);
    summary.enrolledYear = enrolledYear;

    res.json(summary);
  } catch (error) {
    console.error("getDashboardActivitySummary error:", error);
    res.status(500).json({ message: "Failed to fetch activity summary" });
  }
};


exports.getCourseUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const activeCourses = await Course.countDocuments({
      user: req.user._id,
    });

    res.json({
      success: true,
      plan: user?.plan || "free",
      activeCourses,
      limit:
        user?.plan === "pro"
          ? null
          : FREE_ACTIVE_COURSE_LIMIT,
    });
  } catch (error) {
    console.error("Usage fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch usage",
    });
  }
};