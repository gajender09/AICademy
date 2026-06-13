import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaBookOpen,
  FaChartLine,
  FaHome,
  FaLightbulb,
  FaUserCircle,
  FaLock,
} from "react-icons/fa";

import "../../styles/DashboardLayout.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: <FaHome /> },
  { to: "/my-courses", label: "My Courses", icon: <FaBookOpen /> },
  { to: "/progress", label: "Progress", icon: <FaChartLine /> },
  { to: "/ai-lab", label: "AI Lab", icon: <FaLightbulb />, premium: true },
  { to: "/profile", label: "Profile", icon: <FaUserCircle /> },
];

const emptySummary = {
  heatmap: [],
  currentStreak: 0,
  longestStreak: 0,
  activeDays: 0,
  totalActivities: 0,
  year: new Date().getFullYear(),
  enrolledYear: new Date().getFullYear(),
};

const SidebarIcon = ({ collapsed }) => (
  <svg
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="18"
    width="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="9" y1="3" x2="9" y2="21"></line>
    {collapsed ? (
      <path d="M13 9l3 3-3 3" />
    ) : (
      <path d="M16 15l-3-3 3-3" />
    )}
  </svg>
);

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [lastQuiz, setLastQuiz] = useState(null);
  const [activitySummary, setActivitySummary] = useState(emptySummary);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const navigate = useNavigate();
  const location = useLocation();
  const isProUser = user?.plan === "pro";

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(/\/$/, "");

  const fetchDashboardData = useCallback(
    async ({ silent = false, year } = {}) => {
      const token = localStorage.getItem("token");
      if (!token || token === "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      if (!silent) setLoading(true);

      const headers = { Authorization: `Bearer ${token}` };
      const currentYear = year || selectedYear;
      let sessionExpired = false;

      const handleSessionExpired = () => {
        if (sessionExpired) return;
        sessionExpired = true;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      };

      const safeFetch = async (url, setter) => {
        try {
          const res = await fetch(url, { headers });
          if (res.status === 401) {
            handleSessionExpired();
            return;
          }
          if (res.ok) {
            const data = await res.json();
            setter(data);
          } else {
            console.error(`Dashboard request failed: ${url} (${res.status})`);
          }
        } catch (err) {
          console.error(`Error fetching ${url}:`, err);
        }
      };

      await Promise.allSettled([
        safeFetch(`${API_URL}/api/users/me`, (data) => setUser(data.user || data)),

        safeFetch(`${API_URL}/api/courses/dashboard`, (data) =>
          setCourses(data.courses || [])
        ),

        safeFetch(
          `${API_URL}/api/courses/usage`,
          (data) => setUsage(data)
        ),

        safeFetch(
          `${API_URL}/api/courses/activity/summary?year=${currentYear}`,
          (data) => {
            setActivitySummary({ ...emptySummary, ...data });
            if (!year) setSelectedYear(data.year || currentYear);
          }
        ),

        safeFetch(`${API_URL}/api/courses/quiz/last`, (data) =>
          setLastQuiz(data)
        ),

        safeFetch(`${API_URL}/api/courses/activity/recent`, (data) =>
          setRecentActivity(data.activities || [])
        ),
      ]);

      if (!silent && !sessionExpired) setLoading(false);
    },
    [API_URL, navigate, selectedYear]
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData({ silent: true });
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  useEffect(() => {
    const handleCourseGenerated = () => {
      fetchDashboardData({ silent: true });
    };
    window.addEventListener("aicademy:courseGenerated", handleCourseGenerated);
    return () => window.removeEventListener("aicademy:courseGenerated", handleCourseGenerated);
  }, [fetchDashboardData]);

  const contextValue = useMemo(
    () => ({
      courses,
      user,
      usage,
      lastQuiz,
      activitySummary,
      recentActivity,
      loading,
      selectedYear,
      setSelectedYear,
      fetchDashboardData,
    }),
    [courses, user, usage, lastQuiz, activitySummary, recentActivity, loading, selectedYear, fetchDashboardData]
  );

  return (
    <div className="dashboard-layout">
      {/* Sticky Card Sidebar Navigation */}
      <aside className={`course-sidebar dashboard-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header-branding">
          <span className="branding-title">Navigation</span>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(true)}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <SidebarIcon collapsed={false} />
          </button>
        </div>

        <nav className="sidebar-list">
          {NAV_ITEMS.map((item) => {

            const locked = item.premium && !isProUser;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-item ${isActive(item.to) ? "active" : ""
                  } ${locked ? "locked-feature" : ""}`}
              >

                <span className="sidebar-icon">
                  {item.icon}
                </span>

                <span className="sidebar-label">
                  {item.label}

                  {locked && (
                    <FaLock className="lock-icon" />
                  )}
                </span>

              </Link>
            );

          })}
        </nav>
      </aside>

      {/* Main view content wrap */}
      <div className={`dashboard-main-view ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* Floating Expand Button (ChatGPT style) when collapsed */}
        {sidebarCollapsed && (
          <button
            className="sidebar-floating-toggle-btn"
            onClick={() => setSidebarCollapsed(false)}
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <SidebarIcon collapsed={true} />
          </button>
        )}
        <Outlet context={contextValue} />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-navbar">
        {NAV_ITEMS.map((item) => {

          const locked = item.premium && !isProUser;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`mobile-bottom-nav-item ${isActive(item.to) ? "active" : ""
                } ${locked ? "locked-feature" : ""}`}
            >

              <span className="mobile-bottom-nav-icon">
                {item.icon}
              </span>

              <span className="mobile-bottom-nav-label">

                {item.label}

                {locked && <FaLock className="lock-icon" />}

              </span>

            </Link>
          )

        })}
      </nav>
    </div>
  );
};

export default DashboardLayout;
