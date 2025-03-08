import React, { useEffect, useState } from "react";
import "../../styles/YouTubeVideos.css";

const YouTubePage = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetch("/api/youtube-videos") // Backend API call
      .then((res) => res.json())
      .then((data) => setVideos(data.videos));
  }, []);

  return (
    <div className="youtube-page">
      <h2>Recommended YouTube Videos</h2>
      <div className="video-list">
        {videos.map((video, index) => (
          <iframe
            key={index}
            src={`https://www.youtube.com/embed/${video.id}`}
            title={video.title}
            allowFullScreen
          />
        ))}
      </div>
    </div>
  );
};

export default YouTubePage;
