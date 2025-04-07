import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/CourseDetailsPage.css";
import { toast } from "react-toastify"; // Assuming you use react-toastify for notifications

const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("content");
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [expandedSubtopic, setExpandedSubtopic] = useState(null);
  const [subtopicContent, setSubtopicContent] = useState({});
  const [modules, setModules] = useState([]);
  const [glossary, setGlossary] = useState([]);
  const [roadmap, setRoadmap] = useState([]);
  const [articles, setArticles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completedSubtopics, setCompletedSubtopics] = useState({});
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
  const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
  const GOOGLE_CSE_ID = process.env.REACT_APP_GOOGLE_CSE_ID;
  const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

  useEffect(() => {
    const savedCourses = JSON.parse(localStorage.getItem("enrolledCourses")) || [];
    const savedCourse = savedCourses.find((course) => course.courseId === courseId);
    if (savedCourse) {
      setModules(savedCourse.modules || []);
      setCompletedSubtopics(savedCourse.completedSubtopics || {}); // Load saved progress
      setIsEnrolled(true);
    } else {
      setIsEnrolled(false);
    }
  }, [courseId]);

  const getFallbackModules = (course) => [
    { title: `Chapter 1: Introduction to ${course}`, subtopics: ["What is " + course + "?", "Setting up Environment", "First Program"] },
    { title: `Chapter 2: Core Concepts of ${course}`, subtopics: ["Fundamentals", "Techniques", "Examples"] },
  ];

  const fetchCourseModules = async () => {
    setLoading(true);
    setModules(getFallbackModules(courseId));
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a detailed course module breakdown for ${courseId} with chapters and subtopics in this format:\nChapter 1: [Title]\n- [Subtopic]\n- [Subtopic]\nChapter 2: [Title]\n- [Subtopic]\n- [Subtopic]`,
                  },
                ],
              },
            ],
          }),
        }
      );
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (rawText) {
        const newModules = parseModules(rawText);
        setModules(newModules);
      }
    } catch (error) {
      setError(`Failed to fetch modules: ${error.message}. Using fallback.`);
    }
    setLoading(false);
  };

  const parseModules = (text) => {
    const lines = text.split("\n").filter((line) => line.trim());
    const chapters = [];
    let currentChapter = null;
    lines.forEach((line) => {
      if (line.match(/^Chapter \d+/i)) {
        currentChapter = { title: line, subtopics: [] };
        chapters.push(currentChapter);
      } else if (line.startsWith("-") && currentChapter) {
        currentChapter.subtopics.push(line.replace("-", "").trim());
      }
    });
    return chapters.length > 0 ? chapters : getFallbackModules(courseId);
  };

  const fetchSubtopicContent = async (chapterTitle, subtopic) => {
    setLoading(true);
    const prompt = `Generate structured and engaging content for the subtopic "${subtopic}" under the chapter "${chapterTitle}" for the course "${courseId}". Use Markdown syntax with:
- # Headings for main sections
- ## Subheadings for subsections
- - Bullet points for lists
- \`\`\`code\`\`\` for code snippets (e.g., JavaScript, Python examples)
Keep it concise, interactive, and educational (2-3 paragraphs worth).`;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "Content not available.";
      setSubtopicContent((prev) => ({ ...prev, [`${chapterTitle}-${subtopic}`]: content }));
    } catch (error) {
      setError(`Failed to fetch subtopic content: ${error.message}`);
      setSubtopicContent((prev) => ({ ...prev, [`${chapterTitle}-${subtopic}`]: "Error loading content." }));
    }
    setLoading(false);
  };

  const parseContent = (content) => {
    if (!content || typeof content !== "string") return { lines: [], hasCode: false };
    const lines = content.split("\n").map((line) => line.trim());
    const parsed = [];
    let inCodeBlock = false;
    let codeBlock = [];

    lines.forEach((line) => {
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          parsed.push({ type: "code", content: codeBlock.join("\n") });
          codeBlock = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
      } else if (inCodeBlock) {
        codeBlock.push(line);
      } else if (line.startsWith("# ")) {
        parsed.push({ type: "heading", level: 1, content: line.replace("# ", "") });
      } else if (line.startsWith("## ")) {
        parsed.push({ type: "heading", level: 2, content: line.replace("## ", "") });
      } else if (line.startsWith("- ")) {
        parsed.push({ type: "bullet", content: line.replace("- ", "") });
      } else if (line) {
        parsed.push({ type: "paragraph", content: line });
      }
    });

    if (inCodeBlock && codeBlock.length > 0) {
      parsed.push({ type: "code", content: codeBlock.join("\n") });
    }

    return { lines: parsed, hasCode: parsed.some((item) => item.type === "code") };
  };

  const fetchGlossary = async () => {
    setLoading(true);
    setGlossary([`Term 1: Basic definition related to ${courseId}`, `Term 2: Another key concept`]);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Generate a glossary of 5-10 key terms for ${courseId} in this format:\nTerm: Definition\nTerm: Definition` }] }],
          }),
        }
      );
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (rawText) {
        const glossaryItems = rawText.split("\n").filter((line) => line.includes(":")).map((line) => line.trim());
        setGlossary(glossaryItems.length > 0 ? glossaryItems : [`Term: Definition not available for ${courseId}`]);
      }
    } catch (error) {
      setError("Failed to fetch glossary, using fallback.");
    }
    setLoading(false);
  };

  const fetchRoadmap = async () => {
    setLoading(true);
    const fallbackRoadmap = [
      { phase: "Phase 1: Foundation", steps: ["Learn the basics of " + courseId, "Set up your environment", "Write your first program"] },
      { phase: "Phase 2: Intermediate", steps: ["Understand core concepts", "Practice with examples", "Explore advanced techniques"] },
    ];
    setRoadmap(fallbackRoadmap);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a step-by-step roadmap for learning ${courseId} with phases and steps. Format it as a JSON array of objects, where each object has a 'phase' (e.g., "Phase 1: Foundation") and a 'steps' array. Each step should be a string (e.g., ["Learn basics", "Set up environment"]). Ensure each phase has 2-3 steps with clear descriptions.`,
                  },
                ],
              },
            ],
          })
        }
      );
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (rawText) {
        try {
          const parsedRoadmap = JSON.parse(rawText.replace(/```json/, "").replace(/```/, "").trim());
          if (Array.isArray(parsedRoadmap) && parsedRoadmap.every((item) => item.phase && Array.isArray(item.steps))) {
            setRoadmap(parsedRoadmap);
          } else {
            setError("Invalid roadmap format from API, using fallback.");
          }
        } catch (e) {
          setError("Failed to parse roadmap JSON, using fallback.");
        }
      }
    } catch (error) {
      setError(`Failed to fetch roadmap: ${error.message}. Using fallback.`);
    }
    setLoading(false);
  };

  const fetchArticles = async () => {
    setLoading(true);
    setArticles([]);
    setError(null);

    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
      setError("Google API Key or CSE ID is missing.");
      setLoading(false);
      return;
    }

    try {
      const query = `"${courseId} tutorial" site:geeksforgeeks.org OR site:w3schools.com OR site:tutorialspoint.com OR site:codecademy.com OR site:freecodecamp.org`;
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${GOOGLE_CSE_ID}&key=${GOOGLE_API_KEY}&num=10`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const validSites = ["geeksforgeeks.org", "w3schools.com", "tutorialspoint.com", "codecademy.com", "freecodecamp.org"];
        const courseRegex = new RegExp(`\\b${courseId.toLowerCase()}\\b`, "i");

        const filteredArticles = data.items
          .filter((item) => {
            const title = item.title.toLowerCase();
            const snippet = item.snippet.toLowerCase();
            const hostname = new URL(item.link).hostname.replace("www.", "");
            const isEducationalSite = validSites.some((site) => hostname.includes(site));
            const isRelevant = courseRegex.test(title) || courseRegex.test(snippet);
            return isEducationalSite && isRelevant;
          })
          .map((item) => ({
            title: item.title,
            description: item.snippet || "No description available",
            url: item.link,
            source: new URL(item.link).hostname.replace("www.", ""),
          }));

        const uniqueArticles = [...new Map(filteredArticles.map((item) => [item.url, item])).values()];
        setArticles(uniqueArticles.slice(0, 6));
        if (uniqueArticles.length === 0) setError(`No relevant "${courseId}" tutorials found.`);
      } else {
        setError(`No articles found for "${courseId}".`);
      }
    } catch (error) {
      setError(`Failed to fetch articles: ${error.message}`);
    }
    setLoading(false);
  };

  const fetchVideos = async () => {
    setLoading(true);
    setVideos([]);
    if (!YOUTUBE_API_KEY) {
      setError("YouTube API Key is missing.");
      setLoading(false);
      return;
    }

    try {
      const query = `${courseId} tutorial lecture`;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        setVideos(data.items);
      } else {
        setError("No videos found.");
      }
    } catch (error) {
      setError(`Failed to fetch videos: ${error.message}`);
    }
    setLoading(false);
  };

  const fetchQuizQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate exactly 10 multiple-choice quiz questions for ${courseId}. Format each question strictly as:\nQ: [Question]\nA: [Option1]\nB: [Option2]\nC: [Option3]\nD: [Option4]\nCorrect: [A/B/C/D]\nSeparate each question with exactly two blank lines (\n\n).`,
                  },
                ],
              },
            ],
          })
        }
      );
      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawText) throw new Error("No content returned from Gemini API");
  
      const questionBlocks = rawText.split("\n\n").filter((block) => block.trim());
      const questions = questionBlocks.map((block, index) => {
        const lines = block.split("\n").filter((line) => line.trim());
        if (lines.length !== 6 || !lines[0].startsWith("Q:") || !lines[5].startsWith("Correct:")) {
          return {
            question: `Default Question ${index + 1} for ${courseId}`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct: "A",
          };
        }
  
        return {
          question: lines[0].replace("Q: ", ""),
          options: [
            lines[1].replace("A: ", ""),
            lines[2].replace("B: ", ""),
            lines[3].replace("C: ", ""),
            lines[4].replace("D: ", ""),
          ],
          correct: lines[5].replace("Correct: ", ""),
        };
      }).slice(0, 10);
  
      if (questions.length < 10) {
        for (let i = questions.length; i < 10; i++) {
          questions.push({
            question: `Fallback Question ${i + 1} for ${courseId}`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct: "A",
          });
        }
      }
  
      setQuizQuestions(questions);
    } catch (error) {
      setError(`Quiz fetch error: ${error.message}`);
      setQuizQuestions(
        Array(10)
          .fill()
          .map((_, i) => ({
            question: `Fallback Q${i + 1}: What is ${courseId}?`,
            options: ["A programming topic", "A tool", "A database", "None"],
            correct: "A",
          }))
      );
    }
    setLoading(false);
  };
  
  const handleQuizSubmit = () => {
    if (quizQuestions.length === 0) {
      fetchQuizQuestions(); // Fetch new questions if not already fetched
      return;
    }
    let score = 0;
    quizQuestions.forEach((q, index) => {
      if (userAnswers[index] === q.correct) score++;
    });
    const percentage = (score / quizQuestions.length) * 100;
    setQuizScore(percentage);
    fetchRecommendations(percentage);
    setUserAnswers({}); // Reset answers for next attempt
    fetchQuizQuestions(); // Fetch new questions for next attempt
  };
  const toggleSubtopicCompletion = (chapterTitle, subtopic) => {
    const key = `${chapterTitle}-${subtopic}`;
    setCompletedSubtopics((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      const savedCourses = JSON.parse(localStorage.getItem("enrolledCourses")) || [];
      const updatedCourses = savedCourses.map((course) =>
        course.courseId === courseId ? { ...course, completedSubtopics: newState } : course
      );
      localStorage.setItem("enrolledCourses", JSON.stringify(updatedCourses));
      return newState;
    });
  };

  const calculateProgress = () => {
    const totalSubtopics = modules.reduce((sum, chapter) => sum + chapter.subtopics.length, 0);
    const completedCount = Object.values(completedSubtopics).filter(Boolean).length;
    return totalSubtopics > 0 ? Math.round((completedCount / totalSubtopics) * 100) : 0;
  };

  const handleEnroll = () => {
    if (isEnrolled) {
      toast.info(`You are already enrolled in ${courseId}!`);
      return;
    }
    const courseData = {
      courseId,
      modules: modules.length > 0 ? modules : getFallbackModules(courseId),
      completedSubtopics: {},
      lastAccessed: new Date().toISOString(),
    };
    const savedCourses = JSON.parse(localStorage.getItem("enrolledCourses")) || [];
    const isAlreadyEnrolled = savedCourses.some((course) => course.courseId === courseId);
    if (!isAlreadyEnrolled) {
      localStorage.setItem("enrolledCourses", JSON.stringify([...savedCourses, courseData]));
      setIsEnrolled(true);
      toast.success(`Enrolled in ${courseId} successfully!`);
    } else {
      toast.info(`You are already enrolled in ${courseId}!`);
    }
  };

  const handleUnroll = () => {
    if (!isEnrolled) {
      toast.info(`You are not enrolled in ${courseId}!`);
      return;
    }
    const savedCourses = JSON.parse(localStorage.getItem("enrolledCourses")) || [];
    const updatedCourses = savedCourses.filter((course) => course.courseId !== courseId);
    localStorage.setItem("enrolledCourses", JSON.stringify(updatedCourses));
    setIsEnrolled(false);
    setModules([]);
    setCompletedSubtopics({});
    toast.success(`Unrolled from ${courseId} successfully!`);
  };


  const fetchRecommendations = async (score) => {
    setLoading(true);
    setRecommendations([]);
    try {
      const query = `${courseId} tutorial ${score < 80 ? "beginner" : "advanced"} site:geeksforgeeks.org OR site:w3schools.com OR site:tutorialspoint.com OR site:codecademy.com OR site:freecodecamp.org`;
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${GOOGLE_CSE_ID}&key=${GOOGLE_API_KEY}&num=5`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Google API error: ${response.status}`);
      const data = await response.json();

      const recs = data.items?.map((item) => ({
        title: item.title,
        description: item.snippet || "No description available",
        url: item.link,
        source: new URL(item.link).hostname.replace("www.", ""),
      })) || [];
      setRecommendations(recs);
    } catch (error) {
      setError(`Recommendations fetch error: ${error.message}`);
      setRecommendations([{ title: "Sample Article", description: "Learn more about " + courseId, url: "#", source: "example.com" }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeSection === "content" && modules.length === 0 && !isEnrolled) fetchCourseModules();
    else if (activeSection === "glossary" && glossary.length === 0) fetchGlossary();
    else if (activeSection === "roadmap" && roadmap.length === 0) fetchRoadmap();
    else if (activeSection === "articles" && articles.length === 0) fetchArticles();
    else if (activeSection === "videos" && videos.length === 0) fetchVideos();
    else if (activeSection === "quiz" && quizQuestions.length === 0) fetchQuizQuestions();
  }, [activeSection, isEnrolled]);

  return (
    <div className="course-details-page">
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? "◄" : "►"}
        </button>
        {sidebarOpen && (
          <div className="sidebar-content">
            <h2>{courseId}</h2>
            <p>Progress: {calculateProgress()}%</p>
            <nav className="sidebar-nav">
              <button
                onClick={() => setActiveSection("content")}
                className={`nav-item ${activeSection === "content" ? "active" : ""}`}
              >
                📖 Content
              </button>
              <button
                onClick={() => setActiveSection("glossary")}
                className={`nav-item ${activeSection === "glossary" ? "active" : ""}`}
              >
                📚 Glossary
              </button>
              <button
                onClick={() => setActiveSection("roadmap")}
                className={`nav-item ${activeSection === "roadmap" ? "active" : ""}`}
              >
                🛤️ Roadmap
              </button>
              <button
                onClick={() => setActiveSection("articles")}
                className={`nav-item ${activeSection === "articles" ? "active" : ""}`}
              >
                📰 Articles
              </button>
              <button
                onClick={() => setActiveSection("videos")}
                className={`nav-item ${activeSection === "videos" ? "active" : ""}`}
              >
                🎥 Videos
              </button>
              <button
                onClick={() => setActiveSection("quiz")}
                className={`nav-item ${activeSection === "quiz" ? "active" : ""}`}
              >
                🧠 Quiz
              </button>
            </nav>
          </div>
        )}
      </div>

      <div className="main-content">
        {loading && <div className="loader">⏳ Loading...</div>}
        {error && <div className="error">❌ {error}</div>}
        {!loading && !error && (
          <>
            {activeSection === "content" && (
              <div className="content-section">
                <h1 className="section-title">Course Content</h1>
                {!isEnrolled ? (
                  <button className="enroll-btn" onClick={handleEnroll}>
                    Enroll in Course
                  </button>
                ) : (
                  <button className="unroll-btn" onClick={handleUnroll}>
                    Unroll from Course
                  </button>
                )}
                <div className="progress-bar" style={{ width: `${calculateProgress()}%` }}></div>
                <div className="chapters-container">
                  {modules.length > 0 ? (
                    modules.map((chapter, index) => (
                      <div key={index} className="chapter-card">
                        <div
                          className="chapter-header"
                          onClick={() => setExpandedChapter(expandedChapter === index ? null : index)}
                        >
                          <h3 className="chapter-title">{chapter.title}</h3>
                          <span className="expand-toggle">{expandedChapter === index ? "▲" : "▼"}</span>
                        </div>
                        {expandedChapter === index && (
                          <ul className="subtopics-list">
                            {chapter.subtopics.map((subtopic, i) => {
                              const key = `${chapter.title}-${subtopic}`;
                              const isCompleted = completedSubtopics[key] || false;
                              return (
                                <li key={i} className="subtopic-item">
                                  <div className="subtopic-header">
                                    <input
                                      type="checkbox"
                                      checked={isCompleted}
                                      onChange={() => toggleSubtopicCompletion(chapter.title, subtopic)}
                                    />
                                    <span
                                      className="subtopic-title"
                                      onClick={() => {
                                        setExpandedSubtopic(
                                          expandedSubtopic === `${index}-${i}` ? null : `${index}-${i}`
                                        );
                                        if (!subtopicContent[key]) fetchSubtopicContent(chapter.title, subtopic);
                                      }}
                                    >
                                      {subtopic}
                                    </span>
                                    <span className="expand-toggle">
                                      {expandedSubtopic === `${index}-${i}` ? "▲" : "▼"}
                                    </span>
                                  </div>
                                  {expandedSubtopic === `${index}-${i}` && (
                                    <div className="subtopic-content">
                                      {(() => {
                                        const { lines } = parseContent(subtopicContent[key] || "");
                                        return lines.map((line, idx) => {
                                          if (line.type === "heading") {
                                            return line.level === 1 ? (
                                              <h1 key={idx}>{line.content}</h1>
                                            ) : (
                                              <h2 key={idx}>{line.content}</h2>
                                            );
                                          } else if (line.type === "bullet") {
                                            return <li key={idx}>{line.content}</li>;
                                          } else if (line.type === "code") {
                                            return <pre key={idx}><code>{line.content}</code></pre>;
                                          } else {
                                            return <p key={idx}>{line.content}</p>;
                                          }
                                        });
                                      })()}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>No content available yet. Enroll to generate the course.</p>
                  )}
                </div>
              </div>
            )}

            {activeSection === "glossary" && (
              <div className="glossary-section">
                <h1 className="section-title">Glossary</h1>
                <div className="glossary-grid">
                  {glossary.map((item, index) => {
                    const [term, definition] = item.split(": ");
                    return (
                      <div key={index} className="glossary-card">
                        <h3 className="glossary-term">{term || "Unknown Term"}</h3>
                        <p className="glossary-definition">{definition || "Definition not available"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeSection === "roadmap" && (
              <div className="roadmap-section">
                <h1 className="section-title">Learning Roadmap</h1>
                <div className="roadmap-container">
                  {roadmap.map((phase, index) => (
                    <div key={index} className="roadmap-phase">
                      <h2 className="phase-title">{phase.phase}</h2>
                      <hr className="phase-separator" />
                      <ul className="roadmap-steps">
                        {phase.steps.map((step, i) => (
                          <li key={i} className="roadmap-step">{step}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "articles" && (
              <div className="articles-section">
                <h1 className="section-title">{courseId} Tutorials & Articles</h1>
                {articles.length > 0 ? (
                  <div className="articles-grid">
                    {articles.map((article, index) => (
                      <div key={index} className="article-card">
                        <div className={`article-source ${article.source}`}>{article.source}</div>
                        <h3 className="article-title">{article.title}</h3>
                        <p className="article-summary">{article.description}</p>
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="article-link">
                          Read More
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-articles">No {courseId} tutorials found.</p>
                )}
              </div>
            )}

            {activeSection === "videos" && (
              <div className="videos-section">
                <h1 className="section-title">Top {courseId} Tutorials & Lectures</h1>
                {videos.length > 0 ? (
                  <div className="videos-grid">
                    {videos.map((video, index) => (
                      <div key={index} className="video-card">
                        <img src={video.snippet.thumbnails.medium.url} alt={video.snippet.title} className="video-thumbnail" />
                        <h3 className="video-title">{video.snippet.title}</h3>
                        <a href={`https://www.youtube.com/watch?v=${video.id.videoId}`} target="_blank" rel="noopener noreferrer" className="video-link">
                          Watch Now
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-videos">No {courseId} videos available.</p>
                )}
              </div>
            )}

            {activeSection === "quiz" && (
              <div className="quiz-section">
                <h1 className="section-title">{courseId} Quiz</h1>
                {quizQuestions.length > 0 ? (
                  <>
                    {quizScore === null ? (
                      <div className="quiz-container">
                        {quizQuestions.map((q, index) => (
                          <div key={index} className="quiz-question">
                            <h3>{index + 1}. {q.question}</h3>
                            {q.options.map((option, optIdx) => (
                              <label key={optIdx} className="quiz-option">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={String.fromCharCode(65 + optIdx)}
                                  checked={userAnswers[index] === String.fromCharCode(65 + optIdx)}
                                  onChange={() => setUserAnswers((prev) => ({ ...prev, [index]: String.fromCharCode(65 + optIdx) }))}
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        ))}
                        <button className="submit-quiz" onClick={handleQuizSubmit}>
                          Submit Quiz
                        </button>
                      </div>
                    ) : (
                      <div className="quiz-results">
                        <h2>Your Score: {quizScore.toFixed(1)}% ({Math.round(quizScore / 10)}/10)</h2>
                        <div className="answers-review">
                          <h3>Review Your Answers:</h3>
                          {quizQuestions.map((q, index) => (
                            <div key={index} className={`answer-item ${userAnswers[index] === q.correct ? "correct" : "incorrect"}`}>
                              <p><strong>Q:</strong> {q.question}</p>
                              <p><strong>Your Answer:</strong> {userAnswers[index] || "Not answered"} ({q.options[userAnswers[index]?.charCodeAt(0) - 65] || "N/A"})</p>
                              <p><strong>Correct Answer:</strong> {q.correct} ({q.options[q.correct.charCodeAt(0) - 65]})</p>
                            </div>
                          ))}
                        </div>
                        <h3>Recommended Articles:</h3>
                        <div className="recommendations-grid">
                          {recommendations.map((rec, index) => (
                            <div key={index} className="recommendation-card">
                              <div className={`article-source ${rec.source}`}>{rec.source}</div>
                              <h4>{rec.title}</h4>
                              <p>{rec.description}</p>
                              <a href={rec.url} target="_blank" rel="noopener noreferrer" className="article-link">
                                Read More
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p>No quiz questions available yet.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CourseDetailsPage;