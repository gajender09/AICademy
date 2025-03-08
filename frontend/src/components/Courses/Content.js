import React, { useEffect, useState } from "react";
import "../../styles/Content.css";

const ContentPage = () => {
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch("/api/generate-content") // Backend API call
      .then((res) => res.json())
      .then((data) => setContent(data.content));
  }, []);

  return (
    <div className="content-page">
      <h2>Curated Content</h2>
      <p>{content || "Loading content..."}</p>
    </div>
  );
};

export default ContentPage;
