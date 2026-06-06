const { model } = require("../config/gemini");

/* =========================================================
   🔹 UTILITY: CLEAN JSON (handles broken Gemini output)
========================================================= */
const cleanJSON = (text) => {
  try {
    let cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.search(/[\[{]/);
    const end = Math.max(
      cleaned.lastIndexOf("]"),
      cleaned.lastIndexOf("}")
    );

    if (start === -1 || end === -1) {
      throw new Error("No JSON found");
    }

    cleaned = cleaned.substring(start, end + 1);

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ JSON PARSE ERROR:", err.message);
    throw new Error("Invalid JSON from AI");
  }
};

/* =========================================================
   🔹 UTILITY: RETRY WRAPPER (handles AI failures)
========================================================= */
const withRetry = async (fn, retries = 2) => {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    console.log("🔁 Retrying AI call...");
    return withRetry(fn, retries - 1);
  }
};

/* =========================================================
   🔹 1. GENERATE COURSE STRUCTURE (FAST + STABLE)
========================================================= */
exports.generateCourseStructureAI = async (title) => {
  const prompt = `
You are an expert educator.

Generate a structured course for:

Course: ${title}

Return ONLY JSON:

[
  {
    "title": "Module Name",
    "chapters": [
      { "title": "Chapter 1" },
      { "title": "Chapter 2" }
    ]
  }
]

Rules:
- 5 modules
- Each module has 4-5 chapters
- Beginner to advanced progression
- No extra text
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return cleanJSON(text);
};

/* =========================================================
   🔹 2. PREFETCH FIRST MODULE (UX OPTIMIZATION ⚡)
========================================================= */
exports.prefetchFirstModuleAI = async (course, modules) => {
  try {
    const firstModule = modules[0];

    const promises = firstModule.chapters.map((ch) =>
      model.generateContent(`
Course: ${course}
Chapter: ${ch.title}

Explain clearly with:
- headings
- examples
- simple explanation
`)
    );

    const results = await Promise.all(promises);

    const contents = await Promise.all(
      results.map(async (r) => (await r.response.text()))
    );

    return contents; // array of chapter contents
  } catch (err) {
    console.error("Prefetch error:", err.message);
    return [];
  }
};

/* =========================================================
   🔹 3. GENERATE CHAPTER CONTENT (CACHED + FAST)
========================================================= */
exports.generateChapterContentAI = async (course, chapter) => {
  const prompt = `
You are an expert instructor.

Course: ${course}
Chapter: ${chapter}

Instructions:
- Use headings
- Use simple explanation
- Add examples
- Add code if needed
- Keep it structured

Output:
Clean readable content
`;

  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    return await result.response.text();
  });
};

const buildCourseContext = (courseTitle, modules = []) => {
  if (!Array.isArray(modules) || !modules.length) return "";

  return modules
    .map((mod, i) => {
      const chapters =
        mod.chapters?.map((ch) => ch.title).filter(Boolean).join(", ") ||
        "—";
      return `Module ${i + 1}: ${mod.title} → Chapters: ${chapters}`;
    })
    .join("\n");
};

const normalizeGlossaryItem = (item) => {
  if (typeof item === "string") {
    const idx = item.indexOf(":");
    if (idx === -1) return null;
    const term = item.slice(0, idx).trim();
    const definition = item.slice(idx + 1).trim();
    if (!term || !definition) return null;
    return { term, definition, category: "General" };
  }

  const term = String(item.term || item.name || "").trim();
  const definition = String(item.definition || item.meaning || "").trim();
  if (!term || !definition) return null;

  return {
    term,
    definition,
    category: String(item.category || "General").trim(),
  };
};

const normalizeGlossary = (raw) => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.terms)
      ? raw.terms
      : Array.isArray(raw?.glossary)
        ? raw.glossary
        : null;

  if (!list) throw new Error("Glossary must be an array");

  const items = list.map(normalizeGlossaryItem).filter(Boolean);
  if (items.length < 8) {
    throw new Error(`Expected at least 8 glossary terms, got ${items.length}`);
  }
  return items.slice(0, 30);
};

const sanitizeNode = (node) => {
  if (!node || typeof node !== "object") {
    return {
      label: "Unnamed Node",
      description: "",
      children: [],
    };
  }

  const label = String(node.label || node.title || node.name || "Unnamed Node").trim();
  const description = String(node.description || node.summary || "").trim();
  const children = Array.isArray(node.children)
    ? node.children.map(sanitizeNode)
    : [];

  return {
    label,
    description,
    children,
  };
};

const normalizeRoadmap = (raw) => {
  let root = null;

  if (raw?.root) root = sanitizeNode(raw.root);
  else if (raw?.label || raw?.title) root = sanitizeNode(raw);
  else if (Array.isArray(raw)) {
    const children = raw.map(sanitizeNode);
    root = {
      label: "Learning Path",
      description: "",
      children,
    };
  } else {
    root = sanitizeNode(raw);
  }

  if (!root) throw new Error("Invalid roadmap structure");
  if (!root.label) {
    root.label = "Learning Path";
  }

  return root;
};

/* =========================================================
   🔹 4. GENERATE GLOSSARY
========================================================= */
exports.generateGlossaryAI = async (courseTitle, modules = []) => {
  const context = buildCourseContext(courseTitle, modules);

  const prompt = `
You are an expert educator.

Create a glossary for the course: ${courseTitle}
${context ? `\nCourse structure:\n${context}\n` : ""}

Return ONLY JSON (no markdown):

{
  "terms": [
    {
      "term": "Keyword",
      "definition": "Clear short definition in 1-2 sentences.",
      "category": "Foundations"
    }
  ]
}

Rules:
- 15–20 terms
- Terms must match this course and its modules
- Categories like: Foundations, Core Concepts, Tools, Advanced
- Definitions simple and beginner-friendly
`;

  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return normalizeGlossary(cleanJSON(text));
  });
};

/* =========================================================
   🔹 5. GENERATE ROADMAP (mind-map tree)
========================================================= */
exports.generateRoadmapAI = async (courseTitle, modules = []) => {
  const context = buildCourseContext(courseTitle, modules);

  const prompt = `
You are an expert curriculum designer.

Create a learning roadmap mind map for: ${courseTitle}
${context ? `\nAlign branches with this course structure:\n${context}\n` : ""}

Return ONLY JSON (no markdown). Do NOT wrap the root node in a "root" object. Return the root node directly as the main JSON object:

{
  "label": "${courseTitle}",
  "description": "One-line overview of the full learning journey",
  "children": [
    {
      "label": "Phase name (e.g. Foundations)",
      "description": "What the learner achieves in this phase",
      "children": [
        {
          "label": "Topic or skill",
          "description": "Short actionable focus",
          "children": []
        }
      ]
    }
  ]
}

Rules:
- children: 3–5 main phases (Beginner → Advanced progression)
- Each phase: 2–4 child topics
- Topics may have 0–2 sub-topics if helpful
- Labels concise (max 6 words)
- Descriptions max 20 words
- Logical order for self-paced learning
`;

  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return normalizeRoadmap(cleanJSON(text));
  });
};



const normalizeQuizItem = (item) => {
  if (!item || typeof item.question !== "string") return null;

  let options = Array.isArray(item.options)
    ? item.options.map((o) => String(o).trim()).filter(Boolean)
    : [];

  if (options.length < 4) return null;
  options = options.slice(0, 4);

  const answerRaw = String(item.answer || "").trim();
  if (!answerRaw) return null;

  let answer = options.find((o) => o === answerRaw);
  if (!answer) {
    const idx = options.findIndex(
      (o) => o.toLowerCase() === answerRaw.toLowerCase()
    );
    if (idx === -1) return null;
    answer = options[idx];
  }

  return {
    question: item.question.trim(),
    options,
    answer,
  };
};

const normalizeQuiz = (raw, count = 10) => {
  if (!Array.isArray(raw)) {
    throw new Error("Quiz must be an array");
  }

  const items = raw.map(normalizeQuizItem).filter(Boolean);

  if (items.length < count) {
    throw new Error(
      `Expected at least ${count} valid questions, got ${items.length}`
    );
  }

  return items.slice(0, count);
};

exports.generateQuizAI = async (course, module, chapter, chapterContent = "", count = 10) => {
  const contentSnippet = chapterContent
    ? `\nStudy material (use for accurate questions):\n${String(chapterContent).slice(0, count > 10 ? 18000 : 6000)}\n`
    : "";

  const prompt = `
You are an expert educator.

Create exactly ${count} multiple choice questions for:

Course: ${course.title}
Module: ${module?.title || "Full course assessment"}
Topic: ${chapter.title}
${contentSnippet}

Return ONLY a JSON array (no markdown, no commentary):

[
  {
    "question": "Clear question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A"
  }
]

Rules:
- Exactly ${count} questions
- Each question has exactly 4 distinct options
- "answer" must exactly match one of the four options (same spelling)
- Mix difficulty: recall, application, and one slightly challenging question
- Questions must be relevant to the topic${chapterContent ? " and study material" : ""}
- No duplicate questions
`;

  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return normalizeQuiz(cleanJSON(text), count);
  });
};

exports.explainQuizAnswerAI = async ({
  courseTitle,
  moduleTitle,
  chapterTitle,
  chapterContent = "",
  question,
  options,
  correctAnswer,
  selectedAnswer,
}) => {
  const material = chapterContent
    ? `\nChapter material (reference):\n${String(chapterContent).slice(0, 4000)}\n`
    : "";

  const prompt = `
You are a friendly tutor. A student missed a quiz question.

Course: ${courseTitle}
Module: ${moduleTitle}
Chapter: ${chapterTitle}
${material}

Question: ${question}
Options: ${options.join(" | ")}
Correct answer: ${correctAnswer}
Student chose: ${selectedAnswer}

Reply in 2–4 short plain sentences only:
- Why the correct answer is right
- Why the student's choice was wrong
No headings, bullets, or markdown.
`;

  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    return (await result.response.text()).trim();
  });
};
