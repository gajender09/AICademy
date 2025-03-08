import React, { useEffect, useState } from "react";
import "../../styles/Roadmap.css";

const RoadmapPage = () => {
  const [roadmap, setRoadmap] = useState([]);

  useEffect(() => {
    fetch("/api/generate-roadmap") // Backend API call
      .then((res) => res.json())
      .then((data) => setRoadmap(data.roadmap));
  }, []);

  return (
    <div className="roadmap-page">
      <h2>Learning Roadmap</h2>
      <ul>
        {roadmap.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ul>
    </div>
  );
};

export default RoadmapPage;
