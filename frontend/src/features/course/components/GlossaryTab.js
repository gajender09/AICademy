import { useEffect, useMemo, useState } from "react";
import { FaBook, FaChevronDown, FaSearch, FaSyncAlt } from "react-icons/fa";
import { getGlossary } from "../services/courseApi";
import "../styles/GlossaryTab.css";

const storageKey = (courseId) => `glossary_${courseId}`;

const GlossaryTab = ({ course }) => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!course?._id) return;
    try {
      const saved = localStorage.getItem(storageKey(course._id));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setTerms(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, [course?._id]);

  const handleGenerate = async () => {
    if (!course?._id) return;

    setLoading(true);
    setError("");

    try {
      const res = await getGlossary({
        courseId: course._id,
        title: course.title,
        modules: course.modules,
      });

      if (!res.glossary?.length) {
        throw new Error("No glossary terms returned");
      }

      setTerms(res.glossary);
      setExpanded({});
      localStorage.setItem(
        storageKey(course._id),
        JSON.stringify(res.glossary)
      );
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate glossary"
      );
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return terms;
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q)
    );
  }, [terms, search]);

  const categories = useMemo(() => {
    const map = {};
    filtered.forEach((t, i) => {
      const cat = t.category || "General";
      if (!map[cat]) map[cat] = [];
      map[cat].push({ ...t, _index: i });
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const toggleTerm = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    const next = {};
    filtered.forEach((t, i) => {
      next[`${t.term}-${i}`] = true;
    });
    setExpanded(next);
  };

  const collapseAll = () => setExpanded({});

  return (
    <div className="glossary-tab">
      <header className="aux-tab-header">
        <div className="aux-tab-header-text">
          <span className="aux-tab-badge">
            <FaBook /> Glossary
          </span>
          <h2 className="aux-tab-title">Course Glossary</h2>
          <p className="aux-tab-desc">
            Key terms for <strong>{course?.title}</strong> — search and expand
            definitions as you study.
          </p>
        </div>

        <div className="aux-tab-actions">
          <button
            type="button"
            className="aux-tab-btn aux-tab-btn--primary"
            onClick={handleGenerate}
            disabled={loading || !course?._id}
          >
            {loading
              ? "Generating…"
              : terms.length
                ? "Regenerate"
                : "Generate Glossary"}
          </button>
          {terms.length > 0 && (
            <button
              type="button"
              className="aux-tab-btn aux-tab-btn--ghost"
              onClick={handleGenerate}
              disabled={loading}
              aria-label="Regenerate glossary"
            >
              <FaSyncAlt />
            </button>
          )}
        </div>
      </header>

      {error && <p className="aux-tab-error">{error}</p>}

      {loading && (
        <div className="aux-tab-loading">
          <div className="aux-tab-spinner" />
          <p>Building glossary…</p>
        </div>
      )}

      {!loading && !terms.length && !error && (
        <div className="aux-tab-empty">
          <FaBook className="aux-tab-empty-icon" />
          <p>Generate 15+ AI terms tailored to your course modules.</p>
        </div>
      )}

      {!loading && terms.length > 0 && (
        <>
          <div className="glossary-toolbar">
            <div className="glossary-search">
              <FaSearch aria-hidden="true" />
              <input
                type="search"
                placeholder="Search terms, definitions, categories…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search glossary"
              />
            </div>
            <span className="glossary-count">
              {filtered.length} / {terms.length} terms
            </span>
            <div className="glossary-toolbar-actions">
              <button type="button" className="mindmap-tool-btn" onClick={expandAll}>
                Expand all
              </button>
              <button type="button" className="mindmap-tool-btn" onClick={collapseAll}>
                Collapse all
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="glossary-no-results">No terms match your search.</p>
          ) : (
            <div className="glossary-groups">
              {categories.map(([category, items]) => (
                <section key={category} className="glossary-group">
                  <h3 className="glossary-group-title">{category}</h3>
                  <ul className="glossary-list">
                    {items.map((item) => {
                      const key = `${item.term}-${item._index}`;
                      const isOpen = expanded[key];

                      return (
                        <li key={key} className="glossary-item">
                          <button
                            type="button"
                            className="glossary-item-head"
                            onClick={() => toggleTerm(key)}
                            aria-expanded={Boolean(isOpen)}
                          >
                            <FaChevronDown
                              className={
                                isOpen ? "" : "glossary-chevron--closed"
                              }
                            />
                            <span className="glossary-term">{item.term}</span>
                          </button>
                          {isOpen && (
                            <div className="glossary-item-body">
                              <p>{item.definition}</p>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GlossaryTab;
