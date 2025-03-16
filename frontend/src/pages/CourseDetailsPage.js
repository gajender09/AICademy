import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaStream, FaBookOpen, FaNewspaper, FaVideo, FaListUl, FaQuestion } from "react-icons/fa";
import "../styles/CourseDetailsPage.css";
import axios from "axios";

const CourseDetailsPage = () => {
    const { courseId } = useParams();
    const [activeSection, setActiveSection] = useState("roadmap");
    const [articles, setArticles] = useState([]);
    const [videos, setVideos] = useState([]);
    const [quiz, setQuiz] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userAnswers, setUserAnswers] = useState({});
    const [score, setScore] = useState(null);
    const [glossary, setGlossary] = useState([]);

    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user ? user._id : null;

    const handleAnswerChange = (questionIndex, selectedAnswer) => {
        setUserAnswers((prevAnswers) => ({
            ...prevAnswers,
            [questionIndex]: selectedAnswer,
        }));
    };

    const submitQuiz = async () => {
        if (!Array.isArray(quiz)) {
            console.error("Quiz is not an array:", quiz);
            return;
        }

        let correctCount = 0;
        quiz.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            const correctAnswer = question.correct_answer;
            if (userAnswer === correctAnswer) {
                correctCount++;
            }
        });

        const totalQuestions = quiz.length;
        const scoreText = `You scored ${correctCount} out of ${totalQuestions}`;
        setScore(scoreText);

        if (!userId) {
            console.error("User ID not found. Please log in.");
            return;
        }

        try {
            await axios.post("http://localhost:5000/api/quiz-results", {
                courseId,
                userId,
                score: scoreText,
            });
            console.log("Quiz result saved successfully!");
        } catch (error) {
            console.error("Failed to save quiz result:", error);
        }
    };

    const shuffleArray = (array) => {
        return [...array].sort(() => Math.random() - 0.5);
    };

    const handleFallback = {
        "c++": [
            { question: "What is the correct syntax to output 'Hello World' in C++?", answers: ["cout << 'Hello World';", "print('Hello World')", "printf('Hello World');", "echo 'Hello World';"], correct_answer: "cout << 'Hello World';" },
            { question: "Which keyword is used to define a class in C++?", answers: ["class", "struct", "object", "type"], correct_answer: "class" },
            { question: "What does 'int main()' signify?", answers: ["Main loop", "Entry point of program", "Variable declaration", "Function call"], correct_answer: "Entry point of program" },
        ],
        "web development": [
            { question: "What does HTML stand for?", answers: ["Hyper Text Markup Language", "High Text Markup Language", "Hyperlink Text Mode Language", "Home Tool Markup Language"], correct_answer: "Hyper Text Markup Language" },
            { question: "Which language is used for styling web pages?", answers: ["JavaScript", "HTML", "CSS", "Python"], correct_answer: "CSS" },
            { question: "What does CSS stand for?", answers: ["Cascading Style Sheets", "Creative Style Sheets", "Computer Style Sheets", "Custom Style Sheets"], correct_answer: "Cascading Style Sheets" },
        ],
    };

    useEffect(() => {
        if (activeSection === "videos" && videos.length === 0) {
            fetchYouTubeVideos();
        } else if (activeSection === "articles" && articles.length === 0) {
            fetchArticles();
        } else if (activeSection === "quiz") {
            fetchQuiz(courseId);
        } else if (activeSection === "glossary") {
            fetchGlossary();
        }
    }, [activeSection, courseId]);

    // Fetch Articles
    const fetchArticles = async () => {
        try {
            const response = await fetch(
                `https://newsapi.org/v2/everything?q=${encodeURIComponent(courseId)}&apiKey=${process.env.REACT_APP_NEWS_API_KEY}`
            );
            const data = await response.json();
            if (data.articles) setArticles(data.articles.slice(0, 7));
        } catch (error) {
            console.error("Error fetching articles:", error);
            setArticles([]);
        }
    };

    // Fetch YouTube Videos
    const fetchYouTubeVideos = async () => {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${courseId} tutorial|course|lecture&type=video&videoDuration=medium&maxResults=5&order=relevance&key=${process.env.REACT_APP_YOUTUBE_API_KEY}`
            );
            const data = await response.json();
            setVideos(data.items || []);
        } catch (error) {
            console.error("Error fetching videos:", error);
            setVideos([]);
        }
    };

    // Fetch Quiz
    const fetchQuiz = async (courseId) => {
        try {
            const response = await fetch(
                `https://quizapi.io/api/v1/questions?apiKey=XPzVJkhoTJNSQSpHxjEjFWDO6nVbNLV22wD3QCZa&limit=10&tags=${courseId}`
            );
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                console.warn(`QuizAPI returned no questions for ${courseId}. Falling back to OpenTDB.`);
                return fetchOpenTDBQuiz(courseId);
            }

            const processedQuiz = data.map((question) => {
                const answersObj = question.answers || {};
                const answers = Object.values(answersObj).filter((ans) => ans);
                return {
                    ...question,
                    answers: shuffleArray(answers),
                    correct_answer: question.correct_answer,
                };
            });

            setQuiz(shuffleArray(processedQuiz));
        } catch (error) {
            console.error("QuizAPI failed:", error);
            fetchOpenTDBQuiz(courseId);
        }
    };

    const fetchOpenTDBQuiz = async (courseId) => {
        const categoryMap = {
            "c++": 18,
            "web development": 18,
        };
        const category = categoryMap[courseId.toLowerCase()] || 18;
        try {
            const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${category}&type=multiple`);
            const data = await response.json();
            const processedQuiz = data.results.map((q) => ({
                question: q.question,
                answers: shuffleArray([...q.incorrect_answers, q.correct_answer]),
                correct_answer: q.correct_answer,
            }));
            setQuiz(shuffleArray(processedQuiz));
            setUserAnswers({});
            setScore(null);
        } catch (error) {
            console.error("OpenTDB failed:", error);
            handleFallback(courseId);
        }
    };

    // Fetch Glossary
    const fetchGlossary = async () => {
        try {
            const terms = {
                "c++": ["class", "inheritance", "polymorphism", "template", "pointer"],
                "web development": ["html", "css", "javascript", "api", "responsive design"],
            };

            const glossaryData = await Promise.all(
                terms[courseId.toLowerCase()].map(async (term) => {
                    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${term}`);
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        return {
                            term: term,
                            definition: data[0].meanings[0].definitions[0].definition,
                        };
                    }
                    return null;
                })
            );

            setGlossary(glossaryData.filter((item) => item !== null));
        } catch (error) {
            console.error("Error fetching glossary:", error);
            setGlossary([]);
        }
    };


    return (
        <div className="course-details-container">
            <aside className={`sidebar ${isSidebarOpen ? "open" : "collapsed"}`}>
                <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    ☰
                </button>
                <ul>
                    <li className={activeSection === "roadmap" ? "active" : ""} onClick={() => setActiveSection("roadmap")}>
                        <FaStream /> {isSidebarOpen && "Roadmap"}
                    </li>
                    <li className={activeSection === "glossary" ? "active" : ""} onClick={() => setActiveSection("glossary")}>
                        <FaBookOpen /> {isSidebarOpen && "Glossary"}
                    </li>
                    <li className={activeSection === "content" ? "active" : ""} onClick={() => setActiveSection("content")}>
                        <FaListUl /> {isSidebarOpen && "Curated Content"}
                    </li>
                    <li className={activeSection === "articles" ? "active" : ""} onClick={() => setActiveSection("articles")}>
                        <FaNewspaper /> {isSidebarOpen && "Suggested Articles"}
                    </li>
                    <li className={activeSection === "videos" ? "active" : ""} onClick={() => setActiveSection("videos")}>
                        <FaVideo /> {isSidebarOpen && "YouTube Videos"}
                    </li>
                    <li className={activeSection === "quiz" ? "active" : ""} onClick={() => setActiveSection("quiz")}>
                        <FaQuestion /> {isSidebarOpen && "Attempt Quiz"}
                    </li>
                </ul>
            </aside>

            <div className="content">
                <h2>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h2>

                {activeSection === "videos" && (
                    <div className="video-grid">
                        {videos.length > 0 ? (
                            videos.map((video) => (
                                <div key={video.id.videoId} className="video-card">
                                    <img src={video.snippet.thumbnails.medium.url} alt={video.snippet.title} />
                                    <h3>{video.snippet.title}</h3>
                                    <a href={`https://www.youtube.com/watch?v=${video.id.videoId}`} target="_blank" rel="noopener noreferrer">
                                        Watch on YouTube
                                    </a>
                                </div>
                            ))
                        ) : (
                            <p>No videos found.</p>
                        )}
                    </div>
                )}

                {activeSection === "articles" && (
                    <div className="articles-grid">
                        {articles.length > 0 ? (
                            articles.map((article, index) => (
                                <div key={index} className="article-card">
                                    <img src={article.urlToImage || "https://via.placeholder.com/150"} alt={article.title} />
                                    <h3>{article.title}</h3>
                                    <p>{article.description}</p>
                                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                                        Read More
                                    </a>
                                </div>
                            ))
                        ) : (
                            <p>No articles found.</p>
                        )}
                    </div>
                )}

                {activeSection === "quiz" && (
                    <div className="quiz-container">
                        {quiz.length > 0 ? (
                            quiz.map((question, index) => (
                                <div key={index} className="quiz-card">
                                    <h3>Q{index + 1}: {question.question}</h3>
                                    <ul>
                                        {question.answers.map((answer, i) => (
                                            <li key={i}>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={`question-${index}`}
                                                        value={answer}
                                                        onChange={() => handleAnswerChange(index, answer)}
                                                        checked={userAnswers[index] === answer}
                                                    />
                                                    {answer}
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <p>No quizzes available for {courseId}.</p>
                        )}
                        {quiz.length > 0 && (
                            <>
                                <button onClick={submitQuiz}>Submit Quiz</button>
                                {score && <p className="score">{score}</p>}
                            </>
                        )}
                    </div>
                )}

                {activeSection === "glossary" && (
                    <div className="glossary-container">
                        {glossary.length > 0 ? (
                            glossary.map((item, index) => (
                                <div key={index} className="glossary-card">
                                    <h3>{item.term}</h3>
                                    <p>{item.definition}</p>
                                </div>
                            ))
                        ) : (
                            <p>No glossary terms available for {courseId}.</p>
                        )}
                    </div>
                )}

            </div>
        </div >
    );
};

export default CourseDetailsPage;
