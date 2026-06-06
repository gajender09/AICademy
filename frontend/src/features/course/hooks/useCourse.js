import { useState } from "react";
import {
  generateCourseStructure,
  enrollCourse,
  getCourse,
} from "../services/courseApi";

export const useCourse = () => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Generate
  const handleGenerate = async (title) => {
    try {
      setLoading(true);

      const res = await generateCourseStructure(title);

      setCourse({
        title,
        modules: res.data.structure,
        enrolled: false,
      });

      return res.data.structure;
    } catch (err) {
      console.error(err);
      alert("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Enroll
  const handleEnroll = async () => {
    try {
      setLoading(true);

      const res = await enrollCourse(course);

      setCourse(res.data.course);

      return res.data.course;
    } catch (err) {
      console.error(err);
      alert("Enroll failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch course (resume)
  const handleGetCourse = async (id) => {
    try {
      setLoading(true);

      const res = await getCourse(id);

      setCourse(res.data.course);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    course,
    loading,
    handleGenerate,
    handleEnroll,
    handleGetCourse,
  };
};