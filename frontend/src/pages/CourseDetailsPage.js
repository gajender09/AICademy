import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/CourseDetailsPage.css";

const CourseDetailsPage = () => {
    const { courseId } = useParams(); // courseId = Course Name
    const [activeSection, setActiveSection] = useState("roadmap");
    const [articles, setArticles] = useState([]);
    const [videos, setVideos] = useState([]);
    const [roadmap, setRoadmap] = useState("Click on Roadmap to generate content...");
    const [loading, setLoading] = useState(false);

    const YOUTUBE_API_KEY = "AIzaSyC6LheDiy_C_vxI7h-g3gbjdJbJQXYnWN4"; // YouTube API key
    const NEWS_API_KEY = "9ec2c25e3b6d4a10a49a3ba2a9f62238"; // NewsAPI key

    useEffect(() => {
        if (activeSection === "videos" && videos.length === 0) {
            fetchYouTubeVideos();
        } else if (activeSection === "articles" && articles.length === 0) {
            fetchArticles();
        }
    }, [activeSection]);

    // ✅ Fetch Articles from NewsAPI
    const fetchArticles = async () => {
        try {
            const response = await fetch(
                `https://newsapi.org/v2/everything?q=${encodeURIComponent(courseId)}&apiKey=${NEWS_API_KEY}`
            );
            const data = await response.json();
            if (data.articles) {
                setArticles(data.articles.slice(0, 7)); // Limit articles to 7
            }
        } catch (error) {
            console.error("Error fetching articles:", error);
            setArticles([]);
        }
    };

    // ✅ Fetch YouTube Videos
    const fetchYouTubeVideos = async () => {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${courseId}&type=video&maxResults=5&order=viewCount&key=${YOUTUBE_API_KEY}`
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
            <aside className="sidebar">
                <ul>
                    {["roadmap", "glossary", "content", "articles", "videos"].map((section) => (
                        <li key={section} className={activeSection === section ? "active" : ""} onClick={() => setActiveSection(section)}>
                            {section.charAt(0).toUpperCase() + section.slice(1)}
                        </li>
                    ))}
                </ul>
            </aside>

            {/* Main Content */}
            <div className="content">
                <h2>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h2>

                {/* Videos Section */}
                {activeSection === "videos" && (
                    <div className="video-list">
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
                    <div className="articles-list">
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