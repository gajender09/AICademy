import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  generateCourse,
  getSubtopicContent,
  getQuiz,
} from "../../services/courseService";

import "../../styles/CourseDetailsPage.css";

const CourseDetailsPage = () => {
  const { courseId } = useParams();

  const [modules, setModules] = useState([]);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [expandedSubtopic, setExpandedSubtopic] = useState(null);

  const [subtopicContent, setSubtopicContent] = useState({});
  const [quizQuestions, setQuizQuestions] = useState([]);

  const [userAnswers, setUserAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeSection, setActiveSection] = useState("content");

  /* ================= FETCH COURSE ================= */
  const fetchCourseModules = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await generateCourse(courseId);
      setModules(data.modules || []);
    } catch (err) {
      setError("Failed to load course");
    }

    setLoading(false);
  };

  /* ================= LAZY LOAD SUBTOPIC ================= */
  const fetchSubtopicContentHandler = async (chapterIndex, subtopicIndex) => {
    const key = `${chapterIndex}-${subtopicIndex}`;

    // ✅ frontend cache
    if (subtopicContent[key]) return;

    try {
      const { data } = await getSubtopicContent({
        courseId,
        chapterIndex,
        subtopicIndex,
      });

      setSubtopicContent((prev) => ({
        ...prev,
        [key]: data.content,
      }));
    } catch {
      toast.error("Failed to load content");
    }
  };

  /* ================= QUIZ ================= */
  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const { data } = await getQuiz(courseId);
      setQuizQuestions(data);
    } catch {
      setError("Failed to load quiz");
    }
    setLoading(false);
  };

  const handleQuizSubmit = () => {
    let score = 0;

    quizQuestions.forEach((q, index) => {
      if (userAnswers[index] === q.correct) score++;
    });

    const percentage = (score / quizQuestions.length) * 100;
    setQuizScore(percentage);
  };

  const retakeQuiz = () => {
    setUserAnswers({});
    setQuizScore(null);
  };

  /* ================= USE EFFECT ================= */
  useEffect(() => {
    if (activeSection === "content" && modules.length === 0) {
      fetchCourseModules();
    }

    if (activeSection === "quiz" && quizQuestions.length === 0) {
      fetchQuiz();
    }
  }, [activeSection]);

  /* ================= UI ================= */
  return (
    <div className="course-details-page">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>{courseId}</h2>

        <button onClick={() => setActiveSection("content")}>
          📖 Content
        </button>

        <button onClick={() => setActiveSection("quiz")}>
          🧠 Quiz
        </button>
      </div>

      {/* MAIN */}
      <div className="main-content">
        {loading && <p>⏳ Loading...</p>}
        {error && <p className="error">{error}</p>}

        {/* ================= CONTENT ================= */}
        {activeSection === "content" && (
          <div>
            <h1>Course Content</h1>

            {modules.length === 0 ? (
              <button onClick={fetchCourseModules}>
                Generate Course
              </button>
            ) : (
              modules.map((chapter, index) => (
                <div key={index} className="chapter">
                  <div
                    className="chapter-header"
                    onClick={() =>
                      setExpandedChapter(
                        expandedChapter === index ? null : index
                      )
                    }
                  >
                    <h3>{chapter.title}</h3>
                  </div>

                  {expandedChapter === index && (
                    <ul>
                      {chapter.subtopics.map((sub, i) => {
                        const key = `${index}-${i}`;

                        return (
                          <li key={i}>
                            <div
                              onClick={() => {
                                setExpandedSubtopic(
                                  expandedSubtopic === key ? null : key
                                );
                                fetchSubtopicContentHandler(index, i);
                              }}
                              className="subtopic-title"
                            >
                              {sub.title || sub}
                            </div>

                            {expandedSubtopic === key && (
                              <div className="subtopic-content">
                                {subtopicContent[key] ? (
                                  <p>{subtopicContent[key]}</p>
                                ) : (
                                  <p>Loading content...</p>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= QUIZ ================= */}
        {activeSection === "quiz" && (
          <div>
            <h1>Quiz</h1>

            {quizQuestions.length === 0 ? (
              <button onClick={fetchQuiz}>Load Quiz</button>
            ) : quizScore === null ? (
              <div>
                {quizQuestions.map((q, index) => (
                  <div key={index}>
                    <h3>
                      {index + 1}. {q.question}
                    </h3>

                    {q.options.map((opt, i) => (
                      <label key={i}>
                        <input
                          type="radio"
                          name={`q-${index}`}
                          value={String.fromCharCode(65 + i)}
                          onChange={() =>
                            setUserAnswers((prev) => ({
                              ...prev,
                              [index]: String.fromCharCode(65 + i),
                            }))
                          }
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ))}

                <button onClick={handleQuizSubmit}>Submit</button>
              </div>
            ) : (
              <div>
                <h2>Your Score: {quizScore.toFixed(1)}%</h2>
                <button onClick={retakeQuiz}>Retake</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailsPage;