// src/features/course/components/ArticlesTab.js

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaBookReader,
  FaChevronDown,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaLayerGroup,
  FaNewspaper,
  FaSearch,
} from "react-icons/fa";
import { getModuleArticles } from "../services/courseApi";
import "../styles/ArticlesTab.css";

const getModuleTitle = (module, index) =>
  module?.title || `Module ${index + 1}`;

const getChapterTitles = (module) =>
  (module?.chapters || []).map((chapter) => chapter?.title).filter(Boolean);

const ArticlesTab = ({ course }) => {
  const modules = useMemo(() => course?.modules || [], [course?.modules]);
  const [activeModule, setActiveModule] = useState(0);
  const [openModules, setOpenModules] = useState({ 0: true });
  const [resources, setResources] = useState({});
  const [activeArticleLink, setActiveArticleLink] = useState("");
  const [query, setQuery] = useState("");
  const loadingModulesRef = useRef(new Set());

  const loadModule = useCallback(
    async (moduleIndex) => {
      const module = modules[moduleIndex];
      const loadKey = `${course?._id || course?.title || "course"}:${moduleIndex}`;
      if (
        !course?.title ||
        !module ||
        loadingModulesRef.current.has(loadKey) ||
        resources[moduleIndex]?.loading ||
        resources[moduleIndex]?.loaded
      ) {
        return;
      }

      loadingModulesRef.current.add(loadKey);
      setResources((prev) => ({
        ...prev,
        [moduleIndex]: {
          ...(prev[moduleIndex] || {}),
          loading: true,
          error: "",
        },
      }));

      try {
        const res = await getModuleArticles({
          courseTitle: course.title,
          moduleTitle: getModuleTitle(module, moduleIndex),
          chapters: getChapterTitles(module),
        });

        const articles = Array.isArray(res.articles) ? res.articles : [];

        setResources((prev) => ({
          ...prev,
          [moduleIndex]: {
            items: articles,
            loading: false,
            loaded: true,
            error: "",
          },
        }));

        if (moduleIndex === activeModule && articles[0]?.link) {
          setActiveArticleLink((current) => current || articles[0].link);
        }
      } catch (err) {
        setResources((prev) => ({
          ...prev,
          [moduleIndex]: {
            items: [],
            loading: false,
            loaded: true,
            error:
              err.response?.data?.message ||
              err.message ||
              "Could not load articles for this module.",
          },
        }));
      } finally {
        loadingModulesRef.current.delete(loadKey);
      }
    },
    [activeModule, course?._id, course?.title, modules, resources]
  );

  useEffect(() => {
    if (modules.length) {
      setActiveModule(0);
      setOpenModules({ 0: true });
      setActiveArticleLink("");
      setQuery("");
      setResources({});
      loadingModulesRef.current.clear();
    }
  }, [course?._id, modules.length]);

  useEffect(() => {
    if (modules.length) {
      loadModule(activeModule);
    }
  }, [activeModule, loadModule, modules.length]);

  const currentState = resources[activeModule] || {};
  const currentArticles = useMemo(
    () => resources[activeModule]?.items || [],
    [activeModule, resources]
  );
  const filteredArticles = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return currentArticles;
    return currentArticles.filter((article) =>
      [article.title, article.snippet, article.displayLink]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [currentArticles, query]);

  const selectedArticle =
    filteredArticles.find((article) => article.link === activeArticleLink) ||
    filteredArticles[0] ||
    null;

  const selectModule = (moduleIndex) => {
    setActiveModule(moduleIndex);
    setOpenModules((prev) => ({ ...prev, [moduleIndex]: true }));
    const firstArticle = resources[moduleIndex]?.items?.[0];
    setActiveArticleLink(firstArticle?.link || "");
    setQuery("");
  };

  const toggleModule = (moduleIndex) => {
    const firstArticle = resources[moduleIndex]?.items?.[0];

    setActiveModule(moduleIndex);

    // ✅ Auto collapse others
    setOpenModules({
      [moduleIndex]: !openModules[moduleIndex],
    });

    setActiveArticleLink(firstArticle?.link || "");

    setQuery("");
  };

  if (!modules.length) {
    return (
      <div className="articles-container">
        <div className="articles-empty">
          <FaNewspaper />
          <h4>No modules available</h4>
          <p>Enroll in a generated course to unlock curated reading.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="articles-container">
      <header className="articles-tab-header">
        <span className="articles-tab-icon">
          <FaNewspaper />
        </span>
        <div>
          <h2>Reading Desk</h2>
          <p>Articles organized around each module for deeper study.</p>
        </div>
      </header>

      <div className="articles-workspace">
        <aside className="articles-module-rail" aria-label="Article modules">
          {modules.map((module, moduleIndex) => {
            const moduleState = resources[moduleIndex] || {};
            const isOpen = Boolean(openModules[moduleIndex]);
            const isActive = moduleIndex === activeModule;

            return (
              <section
                key={`${getModuleTitle(module, moduleIndex)}-${moduleIndex}`}
                className={`article-module-card ${isActive ? "article-module-card--active" : ""
                  }`}
              >
                <button
                  type="button"
                  className="article-module-toggle"
                  onClick={() => toggleModule(moduleIndex)}
                  aria-expanded={isOpen}
                >
                  <span
                    className={`article-module-chevron ${isOpen ? "" : "article-module-chevron--closed"
                      }`}
                  >
                    <FaChevronDown />
                  </span>
                  <span className="article-module-index">{moduleIndex + 1}</span>
                  <span className="article-module-title">
                    {getModuleTitle(module, moduleIndex)}
                  </span>
                  <span className="article-module-count">
                    <FaLayerGroup />
                    {moduleState.items?.length || module.chapters?.length || 0}
                  </span>
                </button>

                {isOpen && (
                  <div className="article-module-body">
                    {moduleState.loading && (
                      <div className="article-mini-loading">Curating reads...</div>
                    )}

                    {moduleState.error && (
                      <div className="articles-error">
                        <FaExclamationTriangle /> {moduleState.error}
                      </div>
                    )}

                    {!moduleState.loading &&
                      !moduleState.error &&
                      (moduleState.items || []).slice(0, 4).map((article) => (
                        <button
                          key={article.link}
                          type="button"
                          className={`article-track-item ${selectedArticle?.link === article.link
                              ? "article-track-item--active"
                              : ""
                            }`}
                          onClick={() => {
                            selectModule(moduleIndex);
                            setActiveArticleLink(article.link);
                          }}
                        >
                          <span className="article-track-order">
                            {String(article.lessonOrder || 1).padStart(2, "0")}
                          </span>
                          <span className="article-track-copy">
                            <span>{article.title}</span>
                            <small>{article.readingTime || "Quick read"}</small>
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </section>
            );
          })}
        </aside>

        <section className="article-reader-panel">
          <div className="article-searchbar">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search within this module"
              aria-label="Search module articles"
            />
          </div>

          {currentState.loading && (
            <div className="article-reader-placeholder">
              <div className="article-skeleton-title" />
              <div className="article-skeleton-line" />
              <div className="article-skeleton-line article-skeleton-line--wide" />
            </div>
          )}

          {!currentState.loading && currentState.error && (
            <div className="article-reader-placeholder article-reader-placeholder--error">
              <FaExclamationTriangle />
              <p>{currentState.error}</p>
            </div>
          )}

          {!currentState.loading && !currentState.error && selectedArticle && (
            <article className="article-reader">
              {selectedArticle.thumbnail && (
                <img
                  className="article-reader-image"
                  src={selectedArticle.thumbnail}
                  alt=""
                  loading="lazy"
                />
              )}

              <div className="article-reader-kicker">
                <span>
                  Module {activeModule + 1} / Read {selectedArticle.lessonOrder || 1}
                </span>
                <span>{selectedArticle.readingTime || "Quick read"}</span>
                <span>{selectedArticle.type || "ARTICLE"}</span>
              </div>

              <h3>{selectedArticle.title}</h3>
              <p>{selectedArticle.snippet}</p>

              <div className="article-reader-source">
                <FaBookReader />
                <span>{selectedArticle.displayLink || "Reference library"}</span>
              </div>

              <a
                className="article-open-btn"
                href={selectedArticle.link}
                target="_blank"
                rel="noreferrer"
              >
                Open full reading <FaExternalLinkAlt />
              </a>
            </article>
          )}

          {!currentState.loading &&
            !currentState.error &&
            currentState.loaded &&
            !filteredArticles.length && (
              <div className="article-reader-placeholder">
                <FaNewspaper />
                <p>No articles match this search.</p>
              </div>
            )}

          {!currentState.loading &&
            !currentState.error &&
            !currentState.loaded && (
              <div className="article-reader-placeholder">
                <FaNewspaper />
                <p>Select a module to load curated readings.</p>
              </div>
            )}

          {!!filteredArticles.length && (
            <div className="article-grid">
              {filteredArticles.map((article) => (
                <button
                  type="button"
                  key={article.link}
                  className={`article-card ${selectedArticle?.link === article.link ? "article-card--active" : ""
                    }`}
                  onClick={() => setActiveArticleLink(article.link)}
                >
                  <span className="article-card-meta">
                    {article.readingTime || "Quick read"} / {article.type || "ARTICLE"}
                  </span>
                  <strong>{article.title}</strong>
                  <span>{article.snippet}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ArticlesTab;
