import { useEffect, useState } from "react";
import { FaMap, FaSyncAlt } from "react-icons/fa";
import { getRoadmap } from "../services/courseApi";
import RoadmapMindmap from "./RoadmapMindmap";
import "../styles/RoadmapTab.css";

const storageKey = (courseId) => `roadmap_${courseId}`;

const RoadmapTab = ({ course }) => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!course?._id) return;
    try {
      const saved = localStorage.getItem(storageKey(course._id));
      if (saved) {
        setRoadmap(JSON.parse(saved));
      }
    } catch {
      /* ignore */
    }
  }, [course?._id]);

  const handleGenerate = async (regenerate = false) => {
    if (!course?._id) return;

    setLoading(true);
    setError("");

    try {
      const res = await getRoadmap({
        courseId: course._id,
        title: course.title,
        modules: course.modules,
      });

      if (!res.roadmap) {
        throw new Error("No roadmap returned");
      }

      setRoadmap(res.roadmap);
      localStorage.setItem(
        storageKey(course._id),
        JSON.stringify(res.roadmap)
      );
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate roadmap"
      );
      if (!regenerate) setRoadmap(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="roadmap-tab">
      <header className="aux-tab-header">
        <div className="aux-tab-header-text">
          <span className="aux-tab-badge">
            <FaMap /> Roadmap
          </span>
          <h2 className="aux-tab-title">Learning Mind Map</h2>
          <p className="aux-tab-desc">
            AI-built interactive path for <strong>{course?.title}</strong> — zoom, pan, and drag nodes to explore the curriculum.
          </p>
        </div>

        <div className="aux-tab-actions">
          <button
            type="button"
            className="aux-tab-btn aux-tab-btn--primary"
            onClick={() => handleGenerate(Boolean(roadmap))}
            disabled={loading || !course?._id}
          >
            {loading
              ? "Generating…"
              : roadmap
                ? "Regenerate"
                : "Generate Roadmap"}
          </button>
          {roadmap && (
            <button
              type="button"
              className="aux-tab-btn aux-tab-btn--ghost"
              onClick={() => handleGenerate(true)}
              disabled={loading}
              aria-label="Regenerate roadmap"
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
          <p>Building your mind map…</p>
        </div>
      )}

      {!loading && !roadmap && !error && (
        <div className="aux-tab-empty">
          <FaMap className="aux-tab-empty-icon" />
          <p>Generate an interactive visual roadmap aligned with your course modules.</p>
        </div>
      )}

      {!loading && roadmap && (
        <RoadmapMindmap roadmap={roadmap} />
      )}
    </div>
  );
};

export default RoadmapTab;

