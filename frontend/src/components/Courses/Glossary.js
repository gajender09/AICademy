import React, { useEffect, useState } from "react";
import "../../styles/Glossary.css";

const GlossaryPage = () => {
  const [glossary, setGlossary] = useState([]);

  useEffect(() => {
    fetch("/api/generate-glossary") // Backend API call
      .then((res) => res.json())
      .then((data) => setGlossary(data.terms));
  }, []);

  return (
    <div className="glossary-page">
      <h2>Glossary</h2>
      <ul>
        {glossary.map((term, index) => (
          <li key={index}>
            <strong>{term.word}:</strong> {term.definition}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GlossaryPage;
