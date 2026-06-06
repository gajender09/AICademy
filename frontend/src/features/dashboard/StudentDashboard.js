import { useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  FaArrowRight,
  FaBookOpen,
  FaChartLine,
  FaFire,
  FaPlay,
  FaTrophy,
  FaCheckCircle,
  FaChevronDown,
} from "react-icons/fa";

import "../../styles/StudentDashboard.css";

const MOTIVATIONAL_QUOTES = [
  "Your future self is silently watching your choices today.",
  "One chapter today is less painful than ten chapters the night before the exam.",
  "Learning feels slow until one day everyone starts asking you for help.",
  "The difference between 'I wish I knew this' and 'I know this' is consistency.",
  "Every expert you admire once Googled the basics.",
  "The assignment won't disappear if you refresh the page.",
  "Progress is often disguised as repetition.",
  "The hardest part of studying is usually opening the book.",
  "You don't need more time. You need fewer distractions.",
  "Knowledge compounds faster than money when you're young.",
  "Your comfort zone is a beautiful place, but nothing graduates from there.",
  "The exam doesn't care how motivated you felt today.",
  "A year from now, you'll wish you started today.",
  "The brain is like a muscle. Confusion is often a sign of growth.",
  "The tutorial ends. The learning begins.",
  "Success is mostly showing up when you don't feel like it.",
  "Every bug teaches a lesson. Some just charge extra.",
  "Future interviews are being won by today's study sessions.",
  "You can scroll for hours or skill up for minutes. Both become habits.",
  "The goal isn't to study hard. The goal is to make hard things easy.",
  "Your GPA opens doors. Your skills keep them open.",
  "The problem isn't that learning is difficult. The problem is that distraction is easy.",
  "Nobody remembers the hours you studied. They remember what you can do.",
  "Today's effort becomes tomorrow's confidence.",
  "The student who keeps going eventually becomes the mentor.",
  "If learning feels difficult, you're probably doing it right.",
  "Somewhere, someone is practicing while someone else is making excuses.",
  "The best investment account is the one between your ears.",
  "A small improvement every day beats a huge effort once a month.",
  "The magic you're looking for is usually hidden inside discipline.",
  "Your assignment deadline is approaching faster than your motivation.",
  "Studying for 5 minutes and taking a 45-minute break is not a productivity hack.",
  "Your notes can't help if they're still blank.",
  "The WiFi is not responsible for your grades.",
  "Reading the same paragraph five times is a student tradition.",
  "If procrastination burned calories, you'd be an athlete.",
  "Tomorrow is the favorite working day of procrastinators.",
  "The textbook isn't getting easier while you avoid it.",
  "That one YouTube video somehow became a 3-hour journey.",
  "You don't need another productivity app. You need to start.",
  "The exam date was always on the calendar.",
  "Your brain deserves better than 'I'll start after one more reel.'",
  "Studying at 2 AM creates memories, not always good grades.",
  "The motivation fairy is not coming. Start anyway.",
  "The assignment you avoid today becomes tomorrow's emergency.",
  "Programming is turning coffee into solutions.",
  "Every developer has questioned their life choices because of one semicolon.",
  "The bug you spent six hours fixing will teach you more than six tutorials.",
  "Stack Overflow remembers what developers forget.",
  "Your code works. Don't touch it... unless you know why it works.",
  "The best programmers are professional problem solvers.",
  "Debugging: being the detective in a mystery you created.",
  "A failed project still teaches more than a perfect plan.",
  "The computer does exactly what you tell it, not what you mean.",
  "Every error message is a lesson wearing a scary costume.",
  "You are not competing with others. You're negotiating with your future.",
  "The person you'll become is hidden inside your daily habits.",
  "Your attention is your most valuable currency.",
  "What you repeatedly do becomes who you become.",
  "Most people underestimate what they can learn in a year.",
  "The quality of your questions shapes the quality of your future.",
  "Discipline is choosing between what you want now and what you want most.",
  "The days feel long, but the years move fast.",
  "A distracted mind rarely builds an extraordinary life.",
  "Knowledge gives opportunities. Action turns them into reality.",
  "Every skill you build becomes a tool your future self can use.",
  "Growth begins where excuses end.",
  "The life you want is often hidden behind the work you're avoiding.",
  "Confidence isn't built by thinking. It's built by doing.",
  "Your future career is being quietly shaped by today's decisions."
];

const StudentDashboard = () => {
  const {
    courses = [],
    user,
    lastQuiz,
    activitySummary = {},
    recentActivity = [],
    loading,
    selectedYear,
    setSelectedYear,
    fetchDashboardData,
  } = useOutletContext();

  const [heroQuote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  const navigate = useNavigate();

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value, 10);
    setSelectedYear(year);
    fetchDashboardData({ silent: false, year });
  };

  const openCourse = (course, targetTab) => {
    const courseIdentifier = course.slug || course._id;
    navigate(`/courses/${courseIdentifier}`, {
      state: {
        _id: course._id,
        resume: course.resume,
        activeTab: targetTab,
      },
    });
  };

  const avgProgress = useMemo(() => {
    if (!courses.length) return 0;
    return Math.round(courses.reduce((sum, course) => sum + (course.progress || 0), 0) / courses.length);
  }, [courses]);

  const completedCourses = useMemo(() => {
    return courses.filter((course) => course.progress === 100).length;
  }, [courses]);

  const continueCourse = useMemo(() => {
    return courses.find((course) => course.resume && course.resume.type !== "completed") || courses[0];
  }, [courses]);

  const heatmap = useMemo(() => {
    const days = activitySummary.heatmap || [];
    if (!days.length) return { months: [] };

    const months = Array.from({ length: 12 }, (_, index) => ({
      key: `${selectedYear}-${index}`,
      label: new Date(selectedYear, index, 1).toLocaleDateString("en-US", { month: "short" }),
      cells: [],
      columns: 5,
    }));

    days.forEach((day) => {
      const date = new Date(`${day.date}T00:00:00`);
      const month = months[date.getMonth()];
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
      const column = Math.floor((firstDay + date.getDate() - 1) / 7) + 1;

      month.columns = Math.max(month.columns, column);
      month.cells.push({
        ...day,
        key: day.date,
        row: date.getDay() + 1,
        column,
      });
    });

    return { months };
  }, [activitySummary.heatmap, selectedYear]);

  const getResumeTab = (resume) => {
    if (!resume) return "content";
    if (resume.type?.startsWith("final")) return "final";
    return "content";
  };

  const yearsOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const enrolled = activitySummary.enrolledYear || current;
    const opts = [];
    for (let y = current; y >= enrolled; y--) {
      opts.push(y);
    }
    return opts;
  }, [activitySummary.enrolledYear]);

  if (loading && !user) {
    return (
      <main className="dashboard-main">
        <section className="dashboard-hero-card skeleton-card" style={{ height: 160 }}></section>
        <div className="dashboard-stats">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dashboard-stat-card skeleton-card" style={{ height: 90 }}></div>
          ))}
        </div>
        <section className="dashboard-section skeleton-card" style={{ height: 220 }}></section>
      </main>
    );
  }

  return (
    <main className="dashboard-main">
      <section className="dashboard-hero-card">
        <div className="dashboard-hero-content">
          <span className="dashboard-hero-badge">AI Learning Workspace</span>
          <h1 className="dashboard-hero-title">Welcome back, {user?.name?.split(" ")[0] || "Learner"}</h1>
          <div className="dashboard-hero-quote">
            <span>{heroQuote}</span>
            <span className="ai-orb"></span>
            <span className="light-beam"></span>
            <span className="particle"></span>
            <span className="particle"></span>
            <span className="particle"></span>
          </div>
        </div>
        <button className="dashboard-cta-btn" onClick={() => navigate("/courses")}>
          <FaFire /> Generate Course
        </button>
      </section>

      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{courses.length}</span>
          <span className="dashboard-stat-label">Enrolled Courses</span>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{avgProgress}%</span>
          <span className="dashboard-stat-label">Average Progress</span>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{completedCourses}</span>
          <span className="dashboard-stat-label">Completed</span>
        </div>
        <div className="dashboard-stat-card dashboard-stat-card--accent">
          <span className="dashboard-stat-value">{activitySummary.currentStreak || 0}</span>
          <span className="dashboard-stat-label">Day Streak</span>
        </div>
      </div>

      {continueCourse && (
        <section className="continue-card">
          <div className="continue-card-copy">
            <span className="continue-card-tag">
              <FaPlay /> Continue where you left off
            </span>
            <h2 className="continue-card-title">{continueCourse.title}</h2>
            <p className="continue-card-desc">{continueCourse.resume?.label || "Open your course workspace."}</p>
            {continueCourse.resume?.moduleTitle && (
              <small className="continue-card-meta">
                Module {Number(continueCourse.resume.moduleIndex) + 1}: {continueCourse.resume.moduleTitle}
                {continueCourse.resume.chapterTitle ? ` / ${continueCourse.resume.chapterTitle}` : ""}
              </small>
            )}
          </div>
          <button
            className="dashboard-continue-btn"
            onClick={() => openCourse(continueCourse, getResumeTab(continueCourse.resume))}
          >
            Resume <FaArrowRight />
          </button>
        </section>
      )}

      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <h2 className="dashboard-section-title">Learning Heatmap</h2>
          <div className="heatmap-controls">
            <span className="dashboard-course-count">{activitySummary.activeDays || 0} active days</span>
            <div className="heatmap-year-select-wrap">
              <select className="heatmap-year-select" value={selectedYear} onChange={handleYearChange}>
                {yearsOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <FaChevronDown className="heatmap-select-icon" />
            </div>
          </div>
        </div>
        <div className="activity-heatmap-card">
          <div className="heatmap-summary">
            <div>
              <strong>{activitySummary.currentStreak || 0}</strong>
              <span>Current Streak</span>
            </div>
            <div>
              <strong>{activitySummary.longestStreak || 0}</strong>
              <span>Longest Streak</span>
            </div>
            <div>
              <strong>{activitySummary.totalActivities || 0}</strong>
              <span>Total Actions</span>
            </div>
          </div>
          <div className="heatmap-container">
            <div className="heatmap-month-strip" aria-label={`Daily learning activity heatmap for ${selectedYear}`}>
              {heatmap.months.map((month) => (
                <div className="heatmap-month-group" key={month.key}>
                  <span className="heatmap-month-label">{month.label}</span>
                  <div
                    className="activity-heatmap"
                    style={{ gridTemplateColumns: `repeat(${month.columns}, 12px)` }}
                  >
                    {month.cells.map((day) => (
                      <span
                        key={day.key}
                        className={`heatmap-cell heatmap-cell--${day.level}`}
                        style={{ gridColumn: day.column, gridRow: day.row }}
                        title={`${day.date}: ${day.count} task${day.count === 1 ? "" : "s"}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="heatmap-legend" aria-hidden="true">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <i key={level} className={`heatmap-cell heatmap-cell--${level}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </section>

      <div className="dashboard-two-column dashboard-two-column--balanced">
        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <h2 className="dashboard-section-title">
              <FaTrophy /> Last Quiz Score
            </h2>
          </div>
          {lastQuiz?.courseId ? (
            <div className="quiz-score-card">
              <div className="score-circle">
                <span>{lastQuiz.score}%</span>
              </div>
              <div style={{ flex: 1 }}>
                <p>
                  <strong>{lastQuiz.chapter}</strong>
                </p>
                <small>{lastQuiz.course}</small>
              </div>
              <button onClick={() => navigate(`/courses/${lastQuiz.courseId}`)}>Review Course</button>
            </div>
          ) : (
            <div className="empty-state">No quiz attempted yet.</div>
          )}
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <h2 className="dashboard-section-title">
              <FaChartLine /> Recent Activity
            </h2>
          </div>
          <div className="recent-activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <Link
                  key={`${activity.path || "activity"}-${activity.time}-${idx}`}
                  className="activity-item"
                  to={activity.path || "/dashboard"}
                >
                  <div className="activity-icon">
                    {activity.type?.includes("quiz") ? (
                      <FaTrophy />
                    ) : activity.type?.includes("enrolled") ? (
                      <FaBookOpen />
                    ) : (
                      <FaCheckCircle />
                    )}
                  </div>
                  <div className="activity-content">
                    <p>{activity.description}</p>
                    <small>
                      {activity.course ? `${activity.course} / ` : ""}
                      {activity.time}
                    </small>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-state">No recent activity found.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default StudentDashboard;
