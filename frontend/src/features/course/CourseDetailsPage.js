// src/features/course/CourseDetailsPage.js

import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { FaLayerGroup, FaBookOpen, FaPlay } from "react-icons/fa";

import "./styles/ContentTab.css";
import "./styles/CourseDetailsPage.css";
import "./styles/CourseSidebar.css";
import "./styles/RoadmapTab.css";
import "./styles/GlossaryTab.css";

import CourseHeader from "./components/CourseHeader";
import CourseSidebar from "./components/CourseSidebar";

import ArticlesTab from "./components/ArticlesTab";
import ContentTab from "./components/ContentTab";
import GlossaryTab from "./components/GlossaryTab";
import RoadmapTab from "./components/RoadmapTab";
import VideosTab from "./components/VideosTab";
import FinalQuizTab from "./components/FinalQuizTab";

import {
  enrollCourse,
  getCourse,
} from "./services/courseApi";

const CourseDetailsPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "content");
  const [loading, setLoading] = useState(false);

  /* =====================================================
     ✅ INITIAL COURSE STATE (FROM GENERATE)
  ===================================================== */
  const [course, setCourse] = useState(() => {
    if (location.state?.title && Array.isArray(location.state?.modules)) {
      return {
        title: location.state.title,
        modules: location.state.modules,
        progress: location.state.progress || 0,
      };
    }
    return null;
  });

  /* =====================================================
     🚨 HANDLE REFRESH / DIRECT URL
  ===================================================== */
  useEffect(() => {
    if (!course && !slug) {
      // If there is no course state and no slug param, send user back to course list
      navigate("/courses");
    }
  }, [course, slug, navigate]);

  useEffect(() => {
    const fetchCourseFromUrl = async () => {
      if (!course && slug) {
        try {
          setLoading(true);
          const res = await getCourse(slug);
          setCourse(res.course);
        } catch (err) {
          console.error("Failed to fetch course:", err);
          navigate("/courses");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCourseFromUrl();
  }, [slug, course, navigate]);

  /* =====================================================
     🔹 HANDLE ENROLL
  ===================================================== */
const handleEnroll = async () => {
  try {
    setLoading(true);

    const res = await enrollCourse({
      title: course.title,
      modules: course.modules,
    });

    const savedCourse = res.course;

    if (!savedCourse || !savedCourse._id) {
      alert("Error: Course not saved properly");
      return;
    }

    // ✅ Update local course state with ID
    setCourse(savedCourse);

    // ✅ Emit event for dashboard
    window.dispatchEvent(
      new CustomEvent("aicademy:courseGenerated", {
        detail: {
          course: {
            _id: savedCourse._id,
            title: savedCourse.title,
            modules: savedCourse.modules?.length || 0,
            chapters:
              savedCourse.modules?.reduce(
                (acc, m) => acc + (m.chapters?.length || 0),
                0
              ) || 0,
          },
        },
      })
    );

  } catch (err) {
    console.error(err);
    alert("Enroll failed: " + (err.message || "Unknown error"));
  } finally {
    setLoading(false);
  }
};

  /* =====================================================
     🔹 TAB RENDER
  ===================================================== */
  const renderTab = () => {
    switch (activeTab) {
      case "roadmap":
        return <RoadmapTab course={course} />;

      case "glossary":
        return <GlossaryTab course={course} />;

      case "content":
        return (
          <ContentTab
            course={course}
            setCourse={setCourse}
          />
        );

      case "videos":
        return <VideosTab course={course} />;

      case "articles":
        return <ArticlesTab course={course} />;

      case "final":
        return <FinalQuizTab course={course} setCourse={setCourse} />;

      default:
        return (
          <ContentTab
            course={course}
            setCourse={setCourse}
          />
        );
    }
  };

  /* =====================================================
     🚨 LOADING / UNLOCK (COURSE CARD STYLE)
  ===================================================== */
  if (!course?._id) {
    if (loading && !course) {
      return (
        <div className="course-locked">
          <div className="dashboard-course-card unlock-card skeleton-card" style={{ minHeight: 360 }} />
        </div>
      );
    }

    const moduleCount = course?.modules?.length || 0;
    const chapterCount =
      course?.modules?.reduce(
        (acc, m) => acc + (m.chapters?.length || 0),
        0
      ) || 0;

    return (
      <div className="course-locked">
        <article className="dashboard-course-card unlock-card">

          <div className="dashboard-course-media unlock-media">
            <span className="dashboard-course-status">
              Preview
            </span>
            <h1 className="unlock-media-title">
              {course?.title || "Untitled Course"}
            </h1>
          </div>

          <div className="dashboard-course-body">

            <div className="dashboard-course-tags" aria-label="Course tags">
              <span>AI Generated</span>
            </div>

            <div className="dashboard-course-facts">
              <span>
                <FaLayerGroup /> {moduleCount} Modules
              </span>
              <span>
                <FaBookOpen /> {chapterCount} Chapters
              </span>
            </div>

            <p className="unlock-subtitle">
              Unlock the full course — roadmap, content, quizzes and more.
            </p>

            <div className="dashboard-course-footer">
              <button
                className="dashboard-course-action"
                type="button"
                onClick={handleEnroll}
                disabled={loading}
              >
                <FaPlay />
                {loading ? "Enrolling..." : "Enroll Now"}
              </button>
            </div>

          </div>

        </article>
      </div>
    );
  }

  return (
    <div className="course-details-layout">

      {/* SIDEBAR */}
      <CourseSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        course={course}
      />

      {/* MAIN */}
      <div className="course-main">

        <CourseHeader
          title={course.title}
          modules={course.modules}
          progress={course.progress || 0}
          enrolled={!!course._id}
          onEnroll={handleEnroll}
          loading={loading}
        />

        <div className="course-content-wrapper">
          {renderTab()}
        </div>

      </div>
    </div>
  );
};

export default CourseDetailsPage;