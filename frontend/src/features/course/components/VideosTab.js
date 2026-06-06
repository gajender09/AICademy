// src/features/course/components/VideosTab.js

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaChevronDown,
  FaClock,
  FaExclamationTriangle,
  FaLayerGroup,
  FaPlay,
  FaStepBackward,
  FaStepForward,
  FaVideo,
} from "react-icons/fa";
import { getModuleVideos } from "../services/courseApi";
import "../styles/VideosTab.css";

const getModuleTitle = (module, index) =>
  module?.title || `Module ${index + 1}`;

const getChapterTitles = (module) =>
  (module?.chapters || []).map((chapter) => chapter?.title).filter(Boolean);

const formatViews = (value) => {
  const count = Number(value || 0);
  if (!count) return "Curated lesson";
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
  if (count >= 1000) return `${Math.round(count / 1000)}K views`;
  return `${count} views`;
};

const VideosTab = ({ course }) => {
  const modules = useMemo(() => course?.modules || [], [course?.modules]);
  const [activeModule, setActiveModule] = useState(0);
  const [openModules, setOpenModules] = useState({ 0: true });
  const [resources, setResources] = useState({});
  const [activeVideoId, setActiveVideoId] = useState("");
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
        const res = await getModuleVideos({
          courseTitle: course.title,
          moduleTitle: getModuleTitle(module, moduleIndex),
          chapters: getChapterTitles(module),
        });

        const videos = Array.isArray(res.videos) ? res.videos : [];

        setResources((prev) => ({
          ...prev,
          [moduleIndex]: {
            items: videos,
            loading: false,
            loaded: true,
            error: "",
          },
        }));

        if (moduleIndex === activeModule && videos[0]?.videoId) {
          setActiveVideoId((current) => current || videos[0].videoId);
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
              "Could not load lessons for this module.",
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
      setActiveVideoId("");
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
  const currentVideos = currentState.items || [];
  const selectedVideo =
    currentVideos.find((video) => video.videoId === activeVideoId) ||
    currentVideos[0] ||
    null;
  const selectedIndex = selectedVideo
    ? currentVideos.findIndex((video) => video.videoId === selectedVideo.videoId)
    : -1;

  const selectModule = (moduleIndex) => {
    setActiveModule(moduleIndex);
    setOpenModules((prev) => ({ ...prev, [moduleIndex]: true }));
    const firstVideo = resources[moduleIndex]?.items?.[0];
    setActiveVideoId(firstVideo?.videoId || "");
  };

  const toggleModule = (moduleIndex) => {
    const isSwitchingModule = moduleIndex !== activeModule;
    setActiveModule(moduleIndex);
    setOpenModules((prev) => ({
      ...prev,
      [moduleIndex]: isSwitchingModule ? true : !prev[moduleIndex],
    }));
    const firstVideo = resources[moduleIndex]?.items?.[0];
    setActiveVideoId(firstVideo?.videoId || "");
  };

  const selectVideo = (video) => {
    setActiveVideoId(video.videoId);
  };

  const moveVideo = (direction) => {
    if (!currentVideos.length) return;
    const nextIndex = Math.min(
      currentVideos.length - 1,
      Math.max(0, selectedIndex + direction)
    );
    setActiveVideoId(currentVideos[nextIndex]?.videoId || "");
  };

  if (!modules.length) {
    return (
      <div className="videos-container">
        <div className="videos-empty">
          <span className="videos-empty-icon">
            <FaVideo />
          </span>
          <h4>No modules available</h4>
          <p>Enroll in a generated course to unlock video lessons.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="videos-container">
      <header className="videos-tab-header">
        <span className="videos-tab-icon">
          <FaVideo />
        </span>
        <div>
          <h2>Lesson Studio</h2>
          <p>Module-by-module videos arranged as a focused learning path.</p>
        </div>
      </header>

      <div className="video-studio">
        <aside className="video-module-rail" aria-label="Video modules">
          {modules.map((module, moduleIndex) => {
            const moduleState = resources[moduleIndex] || {};
            const isOpen = Boolean(openModules[moduleIndex]);
            const isActive = moduleIndex === activeModule;

            return (
              <section
                key={`${getModuleTitle(module, moduleIndex)}-${moduleIndex}`}
                className={`video-module-card ${isActive ? "video-module-card--active" : ""}`}
              >
                <button
                  type="button"
                  className="video-module-toggle"
                  onClick={() => toggleModule(moduleIndex)}
                  aria-expanded={isOpen}
                >
                  <span
                    className={`video-module-chevron ${
                      isOpen ? "" : "video-module-chevron--closed"
                    }`}
                  >
                    <FaChevronDown />
                  </span>
                  <span className="video-module-index">{moduleIndex + 1}</span>
                  <span className="video-module-title">
                    {getModuleTitle(module, moduleIndex)}
                  </span>
                  <span className="video-module-count">
                    <FaLayerGroup />
                    {moduleState.items?.length || module.chapters?.length || 0}
                  </span>
                </button>

                {isOpen && (
                  <div className="video-module-body">
                    {moduleState.loading && (
                      <div className="video-mini-loading">Finding best lessons...</div>
                    )}

                    {moduleState.error && (
                      <div className="videos-error">
                        <FaExclamationTriangle /> {moduleState.error}
                      </div>
                    )}

                    {!moduleState.loading &&
                      !moduleState.error &&
                      (moduleState.items || []).map((video) => (
                        <button
                          key={video.videoId}
                          type="button"
                          className={`video-track-item ${
                            selectedVideo?.videoId === video.videoId
                              ? "video-track-item--active"
                              : ""
                          }`}
                          onClick={() => {
                            selectModule(moduleIndex);
                            selectVideo(video);
                          }}
                        >
                          <span className="video-track-order">
                            {String(video.lessonOrder || 1).padStart(2, "0")}
                          </span>
                          <span className="video-track-copy">
                            <span>{video.title}</span>
                            <small>{video.duration || "Lesson"}</small>
                          </span>
                        </button>
                      ))}

                    {!moduleState.loading &&
                      !moduleState.error &&
                      moduleState.loaded &&
                      !moduleState.items?.length && (
                        <div className="videos-empty videos-empty--compact">
                          <h4>No lesson matches found</h4>
                          <p>Try regenerating this course with more specific module names.</p>
                        </div>
                      )}
                  </div>
                )}
              </section>
            );
          })}
        </aside>

        <section className="video-player-panel">
          {currentState.loading && !selectedVideo && (
            <div className="video-player-placeholder">
              <div className="video-skeleton-frame" />
              <p>Preparing your module lessons...</p>
            </div>
          )}

          {!currentState.loading && currentState.error && !selectedVideo && (
            <div className="video-player-placeholder video-player-placeholder--error">
              <FaExclamationTriangle />
              <p>{currentState.error}</p>
            </div>
          )}

          {selectedVideo && (
            <>
              <div className="video-player-shell">
                <iframe
                  title={selectedVideo.title}
                  src={`https://www.youtube-nocookie.com/embed/${selectedVideo.videoId}?rel=0&modestbranding=1&playsinline=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div className="video-player-meta">
                <div>
                  <span className="video-player-module-badge">
                    Module {activeModule + 1} / Lesson {selectedIndex + 1}
                  </span>
                  <h3>{selectedVideo.title}</h3>
                  <p>{selectedVideo.description || "A focused lesson selected for this module."}</p>
                </div>
                <div className="video-player-stats">
                  <span>
                    <FaClock />
                    {selectedVideo.duration || "Self paced"}
                  </span>
                  <span>{formatViews(selectedVideo.viewCount)}</span>
                </div>
              </div>

              <div className="video-player-controls">
                <button
                  type="button"
                  onClick={() => moveVideo(-1)}
                  disabled={selectedIndex <= 0}
                  aria-label="Previous lesson"
                  title="Previous lesson"
                >
                  <FaStepBackward />
                </button>
                <button
                  type="button"
                  className="video-player-primary"
                  onClick={() => {
                    const iframe = document.querySelector(".video-player-shell iframe");
                    iframe?.focus();
                  }}
                >
                  <FaPlay /> Continue
                </button>
                <button
                  type="button"
                  onClick={() => moveVideo(1)}
                  disabled={selectedIndex === -1 || selectedIndex >= currentVideos.length - 1}
                  aria-label="Next lesson"
                  title="Next lesson"
                >
                  <FaStepForward />
                </button>
              </div>
            </>
          )}

          {!currentState.loading && !currentState.error && !selectedVideo && (
            <div className="video-player-placeholder">
              <FaPlay />
              <p>Select a module lesson to start watching.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default VideosTab;
