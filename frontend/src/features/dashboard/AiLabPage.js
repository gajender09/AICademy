import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaRobot,
  FaPaperPlane,
  FaGraduationCap,
  FaCheck,
  FaTimes,
  FaRedoAlt,
  FaGamepad,
} from "react-icons/fa";

import "../../styles/StudentDashboard.css"; // Reuse dashboard base styles

const DEFAULT_QUESTIONS = [
  {
    q: "Which of the following is a primary goal of unsupervised learning?",
    options: [
      "Predicting continuous values",
      "Finding hidden patterns in unlabeled data",
      "Classifying input data into pre-defined categories",
      "Maximizing rewards in a game loop",
    ],
    answer: 1,
    explanation: "Unsupervised learning aims to find patterns, structures, or anomalies in data that doesn't have labeled responses.",
  },
  {
    q: "What does a neural network's activation function primarily accomplish?",
    options: [
      "Normalizes the weight matrix",
      "Speeds up the CPU execution",
      "Introduces non-linearity so the network can learn complex patterns",
      "Initializes the random weights",
    ],
    answer: 2,
    explanation: "Without activation functions like ReLU or Sigmoid, neural networks would behave like simple linear models, unable to learn complex representation limits.",
  },
  {
    q: "In Web Development, what is the primary role of an API?",
    options: [
      "To design user interface buttons",
      "To query databases directly using SQL syntax",
      "To facilitate communication between different software systems",
      "To host website server assets",
    ],
    answer: 2,
    explanation: "An API (Application Programming Interface) acts as a bridge that allows different software applications to communicate and transfer data.",
  },
];

const AiLabPage = () => {
  const { courses = [], user } = useOutletContext();

  // Chat Buddy State
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?._id || "");
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "ai",
      text: `Hello ${user?.name?.split(" ")[0] || "Learner"}! I am your AI Study Buddy. Select any course above, and let's explore topics, clear doubts, or build code together!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Quiz Generator State
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState(DEFAULT_QUESTIONS);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizTopic, setQuizTopic] = useState("");

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  const selectedCourse = courses.find((c) => c._id === selectedCourseId) || courses[0];

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = {
      sender: "user",
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let aiResponseText = "";
      const query = inputMessage.toLowerCase();

      if (query.includes("hello") || query.includes("hi")) {
        aiResponseText = `Hey there! How is your learning journey going? Ask me any questions about "${selectedCourse?.title || "your studies"}"!`;
      } else if (query.includes("concept") || query.includes("explain")) {
        aiResponseText = `Let's break down the concepts in "${selectedCourse?.title || "this course"}". We build modular components, explore parameters, and use automated feedback to ensure mastery. What specific chapter or line is confusing?`;
      } else if (query.includes("project") || query.includes("example")) {
        aiResponseText = `A great practice project for "${selectedCourse?.title || "your course"}" would be building a small, end-to-end sandbox application. For example, structuring a dashboard layout that fetches real-time course completions, computes averages, and styles cards with custom glass gradients!`;
      } else {
        aiResponseText = `That is a stellar question. In the context of "${selectedCourse?.title || "your course"}", it is crucial to focus on core design structures, consistency, and practical testing. Let me know if you would like me to generate a quick practice quiz to check your knowledge!`;
      }

      const aiMsg = {
        sender: "ai",
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestionClick = (questionText) => {
    setInputMessage(questionText);
  };

  // Generate Quiz
  const handleGenerateQuiz = () => {
    setQuizActive(true);
    setQuizSubmitted(false);
    setSelectedAnswers({});

    // If a topic is supplied, customize questions slightly
    if (quizTopic.trim()) {
      const topicName = quizTopic.trim();
      const customized = [
        {
          q: `Which of the following describes the core fundamental concept of: ${topicName}?`,
          options: [
            "It is a deprecated programming standard",
            "It represents a structured paradigm designed to optimize performance and logic flow",
            "It is used exclusively in front-end stylesheet designs",
            "It refers to high-frequency hardware components",
          ],
          answer: 1,
          explanation: `${topicName} is a fundamental concept applied to optimize overall system architectures and program logic.`,
        },
        {
          q: `What is a common pitfall when implementing ${topicName}?`,
          options: [
            "Excessive memory optimization leaks",
            "Lack of proper configuration, resulting in structural styling inconsistencies",
            "Over-complex abstraction layers that make the system harder to scale and maintain",
            "Both B and C",
          ],
          answer: 3,
          explanation: "Inexperienced developers often over-complicate system designs or fail to set basic configs properly, leading to bugs.",
        },
        {
          q: `Which tool is most commonly associated with testing or validating ${topicName}?`,
          options: [
            "Modern integration testing suites and unit tests",
            "Compiler warning levels",
            "Visual mockups",
            "Hardware performance monitors",
          ],
          answer: 0,
          explanation: "Standard testing practices like unit/integration suites are critical to validating functional reliability.",
        },
      ];
      setQuizQuestions(customized);
    } else {
      setQuizQuestions(DEFAULT_QUESTIONS);
    }
  };

  const handleAnswerSelect = (qIdx, optIdx) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optIdx,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) score++;
    });
    return score;
  };

  return (
    <main className="dashboard-main">
      {/* Header */}
      <section className="dashboard-hero-card">
        <div className="dashboard-hero-content">
          <span className="dashboard-hero-badge">AI Assistant Playground</span>
          <h1 className="dashboard-hero-title">Welcome to the AI Lab</h1>
          <p className="dashboard-hero-quote" style={{ fontStyle: "normal", padding: "16px 20px" }}>
            <span>Interact with your AI Study Buddy or generate practice quizzes on any subject instantly.</span>
          </p>
        </div>
      </section>

      <div className="dashboard-two-column">
        {/* Column 1: AI Study Buddy Chat */}
        <section className="dashboard-section" style={{ minWidth: 0 }}>
          <div className="dashboard-section-head">
            <h2 className="dashboard-section-title"><FaRobot /> AI Study Buddy</h2>
            <div className="heatmap-year-select-wrap" style={{ minWidth: "150px" }}>
              <select
                className="heatmap-year-select"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
                {!courses.length && <option value="">No Courses Enrolled</option>}
              </select>
            </div>
          </div>

          <div className="recent-activity-list chat-workspace-container" style={{ maxHeight: "none", height: "460px" }}>
            <div className="chat-messages-scroll-area">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-message-bubble ${msg.sender}`}>
                  <div className="bubble-icon-wrapper">
                    {msg.sender === "ai" ? <FaRobot /> : <FaGraduationCap />}
                  </div>
                  <div className="bubble-body">
                    <p className="bubble-text">{msg.text}</p>
                    <span className="bubble-time">{msg.time}</span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="chat-message-bubble ai typing">
                  <div className="bubble-icon-wrapper"><FaRobot /></div>
                  <div className="bubble-body">
                    <div className="typing-loader">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-quick-suggestions">
              <button onClick={() => handleQuickQuestionClick("Summarize the main concepts of this course.")}>
                Summarize Concepts
              </button>
              <button onClick={() => handleQuickQuestionClick("Provide a real-world coding or design project example.")}>
                Suggest Project
              </button>
              <button onClick={() => handleQuickQuestionClick("How can I prepare for the quizzes?")}>
                Prep Advice
              </button>
            </div>

            <form className="chat-input-bar" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Ask your AI tutor anything..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              <button type="submit" disabled={isTyping || !inputMessage.trim()}>
                <FaPaperPlane />
              </button>
            </form>
          </div>
        </section>

        {/* Column 2: Quick Quiz Generator */}
        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <h2 className="dashboard-section-title"><FaGamepad /> AI Quiz Generator</h2>
          </div>

          {!quizActive ? (
            <div className="activity-heatmap-card quiz-generator-setup-card" style={{ height: "460px", justifyContent: "center", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ textAlign: "center" }}>
                <span className="dashboard-hero-badge" style={{ marginBottom: "16px" }}>Skill Check</span>
                <h3 className="continue-card-title">Practice Makes Perfect</h3>
                <p className="continue-card-desc" style={{ marginTop: "8px" }}>
                  Generate a custom multiple choice quiz to test your comprehension.
                </p>
              </div>

              <div className="input-group">
                <label>Enter Topic (leave blank for general concepts)</label>
                <input
                  type="text"
                  placeholder="e.g. React hooks, Neural networks, SQL joins..."
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  style={{ marginTop: "8px" }}
                />
              </div>

              <button className="dashboard-cta-btn" onClick={handleGenerateQuiz}>
                Generate Practice Quiz
              </button>
            </div>
          ) : (
            <div className="activity-heatmap-card quiz-workspace-panel" style={{ height: "460px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
              <div className="quiz-workspace-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--cream-3)", paddingBottom: "12px", marginBottom: "16px" }}>
                <span className="continue-card-tag" style={{ margin: 0 }}>Practice Quiz</span>
                {quizSubmitted && (
                  <strong className="dashboard-stat-value" style={{ fontSize: "18px" }}>
                    Score: {calculateScore()} / {quizQuestions.length}
                  </strong>
                )}
              </div>

              <div className="quiz-questions-list" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
                {quizQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="quiz-question-item">
                    <p className="quiz-question-text" style={{ fontWeight: 700, fontSize: "14px", color: "var(--ink)", marginBottom: "10px" }}>
                      {qIdx + 1}. {q.q}
                    </p>
                    <div className="quiz-options-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[qIdx] === optIdx;
                        const isCorrect = q.answer === optIdx;
                        let optionClass = "";

                        if (quizSubmitted) {
                          if (isCorrect) optionClass = "correct";
                          else if (isSelected) optionClass = "incorrect";
                        } else if (isSelected) {
                          optionClass = "selected";
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            className={`quiz-option-btn ${optionClass}`}
                            onClick={() => handleAnswerSelect(qIdx, optIdx)}
                          >
                            <span className="option-choice-bullet">
                              {quizSubmitted && isCorrect ? <FaCheck /> : quizSubmitted && isSelected && !isCorrect ? <FaTimes /> : String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="option-choice-text">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && (
                      <div className="quiz-explanation-box" style={{ marginTop: "10px", padding: "10px 12px", background: "var(--cream-2)", borderRadius: "8px", fontSize: "12px", borderLeft: "3px solid var(--forest)" }}>
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="quiz-workspace-footer" style={{ borderTop: "1px solid var(--cream-3)", paddingTop: "14px", marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                {!quizSubmitted ? (
                  <button
                    className="dashboard-cta-btn"
                    onClick={() => setQuizSubmitted(true)}
                    disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                    style={{ padding: "8px 20px", fontSize: "12px" }}
                  >
                    Submit Answers
                  </button>
                ) : (
                  <>
                    <button
                      className="dashboard-continue-btn"
                      onClick={() => setQuizActive(false)}
                      style={{ padding: "8px 20px", fontSize: "12px", background: "var(--cream-2)", border: "1px solid var(--cream-3)", color: "var(--ink-2)" }}
                    >
                      Exit Lab
                    </button>
                    <button
                      className="dashboard-cta-btn"
                      onClick={handleGenerateQuiz}
                      style={{ padding: "8px 20px", fontSize: "12px" }}
                    >
                      <FaRedoAlt /> Try Again
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AiLabPage;
