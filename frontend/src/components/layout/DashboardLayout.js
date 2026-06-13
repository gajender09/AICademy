import { useCallback, useEffect, useMemo, useState } from "react";

import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  FaBookOpen,
  FaChartLine,
  FaHome,
  FaLightbulb,
  FaUserCircle,
  FaLock,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import "../../styles/DashboardLayout.css";

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <FaHome />,
  },

  {
    to: "/my-courses",
    label: "My Courses",
    icon: <FaBookOpen />,
  },

  {
    to: "/progress",
    label: "Progress",
    icon: <FaChartLine />,
  },

  {
    to: "/ai-lab",
    label: "AI Lab",
    icon: <FaLightbulb />,
    premium: true,
  },

  {
    to: "/profile",
    label: "Profile",
    icon: <FaUserCircle />,
  },
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
    width="18"
    height="18"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />

    <line x1="9" y1="3" x2="9" y2="21" />

    {collapsed ? <path d="M13 9l3 3-3 3" /> : <path d="M16 15l-3-3 3-3" />}
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

  const API_URL = (
    process.env.REACT_APP_API_URL || "http://localhost:3001"
  ).replace(/\/$/, "");

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }

    return location.pathname.startsWith(path);
  };

  const fetchDashboardData = useCallback(
    async ({ silent = false, year } = {}) => {
      const token = localStorage.getItem("token");

      if (!token || token === "undefined") {
        localStorage.removeItem("token");

        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (!silent) {
        setLoading(true);
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const currentYear = year || selectedYear;

      let sessionExpired = false;

      const handleSessionExpired = () => {
        if (sessionExpired) {
          return;
        }

        sessionExpired = true;

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });
      };

      const safeFetch = async (url, setter) => {
        try {
          const response = await fetch(url, {
            headers,
          });

          if (response.status === 401) {
            handleSessionExpired();

            return;
          }

          if (response.ok) {
            const data = await response.json();

            setter(data);
          }
        } catch (error) {
          console.error("Dashboard fetch error:", error);
        }
      };

      await Promise.allSettled([
        safeFetch(
          `${API_URL}/api/users/me`,

          (data) => setUser(data.user || data)
        ),

        safeFetch(
          `${API_URL}/api/courses/dashboard`,

          (data) => setCourses(data.courses || [])
        ),

        safeFetch(
          `${API_URL}/api/courses/usage`,

          (data) => setUsage(data)
        ),

        safeFetch(
          `${API_URL}/api/courses/activity/summary?year=${currentYear}`,

          (data) => {
            setActivitySummary({
              ...emptySummary,

              ...data,
            });

            if (!year) {
              setSelectedYear(data.year || currentYear);
            }
          }
        ),

        safeFetch(
          `${API_URL}/api/courses/quiz/last`,

          (data) => setLastQuiz(data)
        ),

        safeFetch(
          `${API_URL}/api/courses/activity/recent`,

          (data) => setRecentActivity(data.activities || [])
        ),
      ]);

      if (!silent && !sessionExpired) {
        setLoading(false);
      }
    },

    [API_URL, navigate, selectedYear]
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData({
        silent: true,
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  useEffect(() => {
    const refreshDashboard = () => {
      fetchDashboardData({
        silent: true,
      });
    };

    window.addEventListener("aicademy:courseGenerated", refreshDashboard);

    return () => {
      window.removeEventListener("aicademy:courseGenerated", refreshDashboard);
    };
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

    [
      courses,
      user,
      usage,
      lastQuiz,
      activitySummary,
      recentActivity,
      loading,
      selectedYear,
      fetchDashboardData,
    ]
  );

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="dashboard-layout">
      {/* ================= SIDEBAR ================= */}

      <aside
        className={`course-sidebar dashboard-sidebar ${
          sidebarCollapsed ? "collapsed" : ""
        }`}
      >
        {/* Sidebar Header */}

        <div className="sidebar-header-branding">
          <span className="branding-title">Navigation</span>

          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed((previous) => !previous)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <SidebarIcon collapsed={sidebarCollapsed} />
          </button>
        </div>

        {/* Navigation Items */}

        <nav className="sidebar-list">
          {NAV_ITEMS.map((item) => {
            const locked = item.premium && !isProUser;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                    sidebar-item
                    ${isActive(item.to) ? "active" : ""}
                    ${locked ? "locked-feature" : ""}
                  `}
                title={sidebarCollapsed ? item.label : ""}
              >
                <span className="sidebar-icon">{item.icon}</span>

                <span className="sidebar-label">
                  {item.label}

                  {locked && <FaLock className="lock-icon" />}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Bottom Card */}

        <div className="sidebar-user-card">
          <div className="sidebar-avatar">{userInitials}</div>

          <div className="sidebar-user-info">
            <strong>{user?.name || "Loading..."}</strong>

            <span>{isProUser ? "Pro Plan" : "Free Plan"}</span>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <div
        className={`dashboard-main-view ${
          sidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <Outlet context={contextValue} />
      </div>

      {/* ================= MOBILE NAV ================= */}

      <nav className="mobile-bottom-navbar">
        {NAV_ITEMS.map((item) => {
          const locked = item.premium && !isProUser;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                  mobile-bottom-nav-item
                  ${isActive(item.to) ? "active" : ""}
                  ${locked ? "locked-feature" : ""}
                `}
            >
              <span className="mobile-bottom-nav-icon">{item.icon}</span>

              <span className="mobile-bottom-nav-label">
                {item.label}

                {locked && <FaLock className="lock-icon" />}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default DashboardLayout;
