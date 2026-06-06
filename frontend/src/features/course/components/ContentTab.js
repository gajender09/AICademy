// src/features/course/components/ContentTab.js

import { motion } from "framer-motion";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import MarkdownContent from "./MarkdownContent";
import "../styles/ContentTab.css";

import ChapterQuiz from "./ChapterQuiz";
import { generateChapterContent, markComplete } from "../services/courseApi";

const chapterCollapseKey = (mIndex, cIndex) => `${mIndex}-${cIndex}`;

const hasContent = (chapter) => Boolean(chapter?.content && chapter.content.length > 20);

const ContentTab = ({ course, setCourse }) => {
  const [loadingKey, setLoadingKey] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});

  const isModuleExpanded = (mIndex) => expandedModules[mIndex] !== false;
  const isChapterExpanded = (mIndex, cIndex) =>
    expandedChapters[chapterCollapseKey(mIndex, cIndex)] !== false;

  const isModuleUnlocked = (mIndex) =>
    mIndex === 0 || Boolean(course.modules?.[mIndex - 1]?.quizPassed);

  const isChapterUnlocked = (module, mIndex, cIndex) =>
    isModuleUnlocked(mIndex) &&
    (cIndex === 0 || Boolean(module.chapters?.[cIndex - 1]?.quizPassed));

  const isModuleReadyForQuiz = (module, mIndex) =>
    isModuleUnlocked(mIndex) &&
    module.chapters?.length > 0 &&
    module.chapters.every((chapter) => chapter.quizPassed);

  const toggleModule = (mIndex) => {
    setExpandedModules((prev) => ({
      ...prev,
      [mIndex]: !isModuleExpanded(mIndex),
    }));
  };

  const toggleChapter = (mIndex, cIndex) => {
    const key = chapterCollapseKey(mIndex, cIndex);
    setExpandedChapters((prev) => ({
      ...prev,
      [key]: !isChapterExpanded(mIndex, cIndex),
    }));
  };

  const replaceCourseFromResponse = (res) => {
    if (res?.course) {
      setCourse(res.course);
    }
  };

  const updateChapter = (mIndex, cIndex, patch) => {
    setCourse((prev) => {
      const modules = prev.modules.map((module, moduleIdx) => {
        if (moduleIdx !== mIndex) return module;
        return {
          ...module,
          chapters: module.chapters.map((chapter, chapterIdx) =>
            chapterIdx === cIndex ? { ...chapter, ...patch } : chapter
          ),
        };
      });

      return { ...prev, modules };
    });
  };

  const generateContent = async (mIndex, cIndex) => {
    const key = chapterCollapseKey(mIndex, cIndex);
    setLoadingKey(key);

    try {
      const res = await generateChapterContent({
        courseId: course._id,
        moduleIndex: mIndex,
        chapterIndex: cIndex,
      });

      updateChapter(mIndex, cIndex, { content: res.content });
      setExpandedChapters((prev) => ({ ...prev, [key]: true }));
      setExpandedModules((prev) => ({ ...prev, [mIndex]: true }));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error generating content");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleComplete = async (mIndex, cIndex) => {
    try {
      const res = await markComplete({
        courseId: course._id,
        moduleIndex: mIndex,
        chapterIndex: cIndex,
      });

      replaceCourseFromResponse(res);
    } catch (err) {
      console.error("Error marking chapter complete:", err);
      alert("Failed to mark chapter as complete");
    }
  };

  return (
    <div className="content-container">
      {course.modules?.map((module, mIndex) => {
        const moduleOpen = isModuleExpanded(mIndex);
        const moduleUnlocked = isModuleUnlocked(mIndex);
        const moduleReadyForQuiz = isModuleReadyForQuiz(module, mIndex);

        return (
          <div
            key={mIndex}
            className={`module-card ${moduleOpen ? "" : "module-card--collapsed"} ${
              moduleUnlocked ? "" : "module-card--locked"
            }`}
          >
            <button
              type="button"
              className="module-meta module-meta-toggle"
              onClick={() => toggleModule(mIndex)}
              aria-expanded={moduleOpen}
              aria-label={moduleOpen ? "Collapse module" : "Expand module"}
            >
              <span
                className={`collapse-icon ${moduleOpen ? "" : "collapse-icon--closed"}`}
                aria-hidden="true"
              >
                <FaChevronDown />
              </span>
              <span className="module-index">M{mIndex + 1}</span>
              <p className="module-title">{module.title}</p>
              <span className="module-summary">
                {module.quizPassed ? "Module passed" : `${module.chapters.length} Chapters`}
              </span>
            </button>

            {moduleOpen && !moduleUnlocked && (
              <div className="locked">
                Complete the previous module quiz to unlock this module.
              </div>
            )}

            {moduleOpen &&
              moduleUnlocked &&
              module.chapters.map((ch, cIndex) => {
                const contentReady = hasContent(ch);
                const isLoading = loadingKey === chapterCollapseKey(mIndex, cIndex);
                const chapterUnlocked = isChapterUnlocked(module, mIndex, cIndex);
                const chapterOpen = isChapterExpanded(mIndex, cIndex);
                const canCollapseChapter = contentReady;

                return (
                  <motion.div
                    key={cIndex}
                    className={`chapter-card ${
                      canCollapseChapter && !chapterOpen ? "chapter-card--collapsed" : ""
                    } ${chapterUnlocked ? "" : "chapter-card--locked"}`}
                  >
                    <div className="chapter-row">
                      {canCollapseChapter && (
                        <button
                          type="button"
                          className="collapse-btn chapter-collapse-btn"
                          onClick={() => toggleChapter(mIndex, cIndex)}
                          aria-expanded={chapterOpen}
                          aria-label={
                            chapterOpen ? "Collapse chapter content" : "Expand chapter content"
                          }
                        >
                          <FaChevronDown className={chapterOpen ? "" : "collapse-icon--closed"} />
                        </button>
                      )}
                      <h4>{ch.title}</h4>
                      {!contentReady && chapterUnlocked && (
                        <button
                          className="generate-btn"
                          disabled={!course._id || isLoading}
                          onClick={() => generateContent(mIndex, cIndex)}
                        >
                          {isLoading ? "Generating..." : "Generate"}
                        </button>
                      )}
                      {ch.quizPassed && <span className="chapter-state-pill">Quiz passed</span>}
                    </div>

                    {!chapterUnlocked && (
                      <div className="locked">
                        Complete the previous quiz to unlock this chapter.
                      </div>
                    )}

                    {canCollapseChapter && !chapterOpen && (
                      <p className="chapter-collapsed-hint">
                        Content hidden - use the arrow to expand
                      </p>
                    )}

                    {chapterUnlocked && contentReady && chapterOpen && (
                      <div className="content-box">
                        <MarkdownContent content={ch.content} />

                        <ChapterQuiz
                          courseId={course._id}
                          moduleIndex={mIndex}
                          chapterIndex={cIndex}
                          chapterContent={ch.content}
                          initialQuiz={ch.quiz}
                          quizPassed={ch.quizPassed}
                          onQuizSubmitted={replaceCourseFromResponse}
                        />

                        {ch.quizPassed && !ch.isCompleted && (
                          <button onClick={() => handleComplete(mIndex, cIndex)}>
                            Mark Complete
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}

            {moduleOpen && moduleUnlocked && moduleReadyForQuiz && (
              <div className="module-quiz-panel">
                <ChapterQuiz
                  courseId={course._id}
                  moduleIndex={mIndex}
                  chapterIndex={null}
                  initialQuiz={module.quiz}
                  quizPassed={module.quizPassed}
                  onQuizSubmitted={replaceCourseFromResponse}
                  scope="module"
                  title="Module Quiz"
                  description="Pass this module review to unlock the next module."
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ContentTab;
