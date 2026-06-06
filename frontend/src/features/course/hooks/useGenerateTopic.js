import { useState } from "react";
import {
  generateChapterContent,
  markComplete,
} from "../services/courseApi";

export const useGenerateTopic = (course, setCourse) => {
  const [loadingKey, setLoadingKey] = useState(null);

  // 🔹 Generate Chapter
  const handleGenerate = async (moduleIndex, chapterIndex) => {
    const key = `${moduleIndex}-${chapterIndex}`;

    try {
      setLoadingKey(key);

      const res = await generateChapterContent({
        courseId: course._id,
        moduleIndex,
        chapterIndex,
      });

      const updated = { ...course };
      updated.modules[moduleIndex].chapters[chapterIndex].content =
        res.data.content;

      setCourse(updated);

    } catch (err) {
      console.error(err);
      alert("Failed to generate");
    } finally {
      setLoadingKey(null);
    }
  };

  // 🔹 Mark Complete
  const handleComplete = async (moduleIndex, chapterIndex) => {
    try {
      const res = await markComplete({
        courseId: course._id,
        moduleIndex,
        chapterIndex,
      });

      const updated = { ...course };
      updated.modules[moduleIndex].chapters[
        chapterIndex
      ].isCompleted = true;
      updated.progress = res.data.progress;

      setCourse(updated);

    } catch (err) {
      console.error(err);
    }
  };

  return {
    loadingKey,
    handleGenerate,
    handleComplete,
  };
};