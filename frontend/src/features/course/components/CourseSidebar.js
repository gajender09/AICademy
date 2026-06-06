import { useState } from "react";
import {
    FaAngleLeft,
    FaAngleRight,
    FaBookOpen,
    FaListAlt,
    FaLock,
    FaMap,
    FaNewspaper,
    FaTrophy,
    FaVideo,
} from "react-icons/fa";

import "../styles/CourseSidebar.css";

const tabs = [
  { key: "content", label: "Content", icon: <FaBookOpen /> },
  { key: "roadmap", label: "Roadmap", icon: <FaMap /> },
  { key: "glossary", label: "Glossary", icon: <FaListAlt /> },
  { key: "videos", label: "Videos", icon: <FaVideo /> },
  { key: "articles", label: "Articles", icon: <FaNewspaper /> },
  { key: "final", label: "Final Quiz", icon: <FaTrophy />, gated: true },
];

const allModulesPassed = (course) =>
  course?.modules?.length > 0 && course.modules.every((module) => module.quizPassed);

const CourseSidebar = ({ activeTab, setActiveTab, course }) => {
  const [collapsed, setCollapsed] = useState(false);
  const finalUnlocked = Boolean(course?.finalQuizUnlocked || allModulesPassed(course));

  return (
    <aside className={`course-sidebar ${collapsed ? "collapsed" : ""}`}>
      <button
        className="collapse-toggle"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
      </button>

      <div className="sidebar-title">
        <span>Navigation</span>
      </div>

      <div className="sidebar-list">
        {tabs.map((tab) => {
          const locked = tab.gated && !finalUnlocked;

          return (
          <button
            key={tab.key}
            className={`sidebar-item ${activeTab === tab.key ? "active" : ""} ${
              locked ? "sidebar-item--locked" : ""
            }`}
            onClick={() => setActiveTab(tab.key)}
            title={locked ? "Complete all module quizzes to unlock" : tab.label}
          >
            <span className="sidebar-icon">{tab.icon}</span>
            <span className="sidebar-label">{tab.label}</span>
            {locked && <span className="sidebar-lock"><FaLock /></span>}
          </button>
          );
        })}
      </div>
    </aside>
  );
};

export default CourseSidebar;
