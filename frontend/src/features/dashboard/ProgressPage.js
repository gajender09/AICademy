import { useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  FaTrophy,
  FaCalendarCheck,
  FaAward,
  FaCheckCircle,
  FaLock,
  FaFire,
  FaBookOpen,
} from "react-icons/fa";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "../../styles/StudentDashboard.css"; // Reuse dashboard base styles

const ProgressPage = () => {
  const { courses = [], activitySummary = {}, lastQuiz = {}, loading } = useOutletContext();
  const navigate = useNavigate();

  const avgProgress = useMemo(() => {
    if (!courses.length) return 0;
    const total = courses.reduce((sum, course) => sum + (course.progress || 0), 0);
    return Math.round(total / courses.length);
  }, [courses]);

  const completedCount = useMemo(() => {
    return courses.filter((c) => c.progress === 100).length;
  }, [courses]);

  // Aggregate monthly activity counts from heatmap
  const monthlyActivityData = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const counts = Array(12).fill(0);

    if (activitySummary.heatmap && Array.isArray(activitySummary.heatmap)) {
      activitySummary.heatmap.forEach((day) => {
        const dateObj = new Date(day.date);
        if (!isNaN(dateObj.getTime())) {
          const m = dateObj.getMonth();
          counts[m] += day.count || 0;
        }
      });
    }

    return months.map((name, index) => ({
      name,
      Activities: counts[index],
    }));
  }, [activitySummary.heatmap]);

  // Define Achievements list
  const achievements = useMemo(() => {
    const list = [
      {
        id: "pioneer",
        title: "AI Pioneer",
        desc: "Enroll in your first AI-generated course",
        icon: <FaBookOpen />,
        unlocked: courses.length > 0,
      },
      {
        id: "streak_3",
        title: "Triple Threat",
        desc: "Reach a 3-day learning streak",
        icon: <FaFire />,
        unlocked: activitySummary.longestStreak >= 3,
      },
      {
        id: "streak_7",
        title: "Weekly Warrior",
        desc: "Reach a 7-day learning streak",
        icon: <FaCalendarCheck />,
        unlocked: activitySummary.longestStreak >= 7,
      },
      {
        id: "graduate",
        title: "Workspace Graduate",
        desc: "Complete at least one course fully",
        icon: <FaAward />,
        unlocked: completedCount > 0,
      },
      {
        id: "quiz_champ",
        title: "Quiz Overlord",
        desc: "Score 90% or higher on any quiz",
        icon: <FaTrophy />,
        unlocked: lastQuiz && lastQuiz.score >= 90,
      },
      {
        id: "polymath",
        title: "Curious Mind",
        desc: "Enroll in 3 or more courses",
        icon: <FaCheckCircle />,
        unlocked: courses.length >= 3,
      },
    ];
    return list;
  }, [courses, activitySummary, completedCount, lastQuiz]);

  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => a.unlocked).length;
  }, [achievements]);

  if (loading && !courses.length) {
    return (
      <main className="dashboard-main">
        <section className="dashboard-section skeleton-card" style={{ height: 220 }}></section>
        <section className="dashboard-section skeleton-card" style={{ height: 300 }}></section>
      </main>
    );
  }

  return (
    <main className="dashboard-main">
      {/* Header */}
      <section className="dashboard-hero-card">
        <div className="dashboard-hero-content">
          <span className="dashboard-hero-badge">Analytics & Badges</span>
          <h1 className="dashboard-hero-title">Your Learning Progress</h1>
          <p className="dashboard-hero-quote" style={{ fontStyle: "normal", padding: "16px 20px" }}>
            <span>Visualise your milestones, activities, and unlocked certifications.</span>
          </p>
        </div>
      </section>

      {/* Overview Stats */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{activitySummary.totalActivities || 0}</span>
          <span className="dashboard-stat-label">Total Actions</span>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{avgProgress}%</span>
          <span className="dashboard-stat-label">Average Progress</span>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{unlockedCount} / {achievements.length}</span>
          <span className="dashboard-stat-label">Badges Earned</span>
        </div>
        <div className="dashboard-stat-card dashboard-stat-card--accent">
          <span className="dashboard-stat-value">{activitySummary.longestStreak || 0}d</span>
          <span className="dashboard-stat-label">Max Streak</span>
        </div>
      </div>

      {/* Activity Chart Section */}
      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <h2 className="dashboard-section-title"><FaCalendarCheck /> Yearly Learning Activity</h2>
          <span className="dashboard-course-count">{activitySummary.activeDays || 0} active days</span>
        </div>
        <div className="activity-heatmap-card" style={{ padding: "24px 20px" }}>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--forest)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--forest)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--cream-3)" />
                <XAxis
                  dataKey="name"
                  stroke="var(--ink-3)"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--ink-3)"
                  fontSize={11}
                  fontWeight={600}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--parchment)",
                    borderColor: "var(--cream-3)",
                    borderRadius: "8px",
                    color: "var(--ink)",
                    fontSize: "12px",
                    fontWeight: "600",
                    boxShadow: "var(--shadow-soft)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Activities"
                  stroke="var(--forest)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorActivities)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <div className="dashboard-two-column dashboard-two-column--balanced">
        {/* Achievements / Badges Grid */}
        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <h2 className="dashboard-section-title"><FaTrophy /> Unlocked Badges</h2>
          </div>
          <div className="recent-activity-list" style={{ maxHeight: "none" }}>
            <div className="achievements-display-grid">
              {achievements.map((a) => (
                <div key={a.id} className={`achievement-badge-card ${a.unlocked ? "unlocked" : "locked"}`}>
                  <div className="badge-visual-wrapper">
                    {a.unlocked ? a.icon : <FaLock className="lock-icon" />}
                  </div>
                  <div className="badge-details">
                    <h4>{a.title}</h4>
                    <p>{a.desc}</p>
                    <span className="badge-status-pill">
                      {a.unlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Course Breakdowns */}
        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <h2 className="dashboard-section-title"><FaAward /> Course Breakdown</h2>
          </div>
          <div className="recent-activity-list" style={{ maxHeight: "none" }}>
            <div className="course-progress-details-list">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <div key={course._id} className="course-progress-item-detail">
                    <div className="course-progress-item-header">
                      <h4>{course.title}</h4>
                      <span>{course.progress || 0}%</span>
                    </div>
                    <div className="dashboard-progress-bar" style={{ height: "6px", margin: "8px 0" }}>
                      <div
                        className="dashboard-progress-fill"
                        style={{ width: `${course.progress || 0}%` }}
                      />
                    </div>
                    <div className="course-progress-meta-info">
                      <span>{course.moduleCount || 0} Modules / {course.chapterCount || 0} Chapters</span>
                      <button
                        className="course-progress-link-btn"
                        onClick={() =>
                          navigate(`/courses/${course.slug || course._id}`, {
                            state: { _id: course._id, resume: course.resume, activeTab: "content" },
                          })
                        }
                      >
                        {course.progress === 100 ? "Review Workspace" : "Continue Study"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ height: "200px" }}>
                  No courses enrolled yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProgressPage;
