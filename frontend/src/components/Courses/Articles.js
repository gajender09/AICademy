import React, { useEffect, useState } from "react";
import "../../styles/Articles.css";

const ArticlesPage = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetch("/api/fetch-articles") // Backend API call
      .then((res) => res.json())
      .then((data) => setArticles(data.articles));
  }, []);

  return (
    <div className="articles-page">
      <h2>Suggested Articles</h2>
      <ul>
        {articles.map((article, index) => (
          <li key={index}>
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              {article.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArticlesPage;
