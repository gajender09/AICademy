import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaStream, FaBookOpen, FaNewspaper, FaVideo, FaListUl } from "react-icons/fa"; // Icons
import "../styles/CourseDetailsPage.css";

const CourseDetailsPage = () => {
    const { courseId } = useParams(); // courseId = Course Name
    const [activeSection, setActiveSection] = useState("roadmap");
    const [articles, setArticles] = useState([]);
    const [videos, setVideos] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar toggle state

    useEffect(() => {
        if (activeSection === "videos" && videos.length === 0) {
            fetchYouTubeVideos();
        } else if (activeSection === "articles" && articles.length === 0) {
            fetchArticles();
        }
    }, [activeSection]);

    // Fetch Articles
    const fetchArticles = async () => {
        try {
            const response = await fetch(
                `https://newsapi.org/v2/everything?q=${encodeURIComponent(courseId)}&apiKey=${process.env.REACT_APP_NEWS_API_KEY}`
            );
            const data = await response.json();
            if (data.articles) setArticles(data.articles.slice(0, 7)); // Limit to 7 articles
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
    

    return (
        <div className="course-details-container">
            {/* Sidebar */}
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
                </ul>
            </aside>

            {/* Main Content */}
            <div className="content">
                <h2>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h2>

                {/* Videos Section */}
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

                {/* Articles Section */}
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
            </div>
        </div>
    );
};

export default CourseDetailsPage;
