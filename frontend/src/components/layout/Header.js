// src/components/layout/Header.js

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  FaUserCircle,
  FaBars,
  FaTimes,
  FaChevronDown,
} from "react-icons/fa";

import ThemeToggle from "./ThemeToggle";
import "../../styles/Header.css";

const Header = () => {

  const [menuOpen, setMenuOpen] = useState(false);

  const [userName, setUserName] = useState(null);

  const [showDropdown, setShowDropdown] = useState(false);

  const location = useLocation();

  useEffect(() => {

    const storedUser = localStorage.getItem("user");

    if (storedUser && storedUser !== "undefined") {

      try {

        const parsedUser = JSON.parse(storedUser);

        if (parsedUser && parsedUser.name) {

          setUserName(parsedUser.name);

        }

      } catch (error) {

        console.error("Error parsing user data", error);

        localStorage.removeItem("user");

      }

    }

  }, []);

  const toggleMenu = () => {

    setMenuOpen(!menuOpen);

  };

  const toggleDropdown = () => {

    setShowDropdown(!showDropdown);

  };

  const handleLogout = () => {

    localStorage.removeItem("user");

    localStorage.removeItem("token");

    setUserName(null);

    setShowDropdown(false);

    window.location.href = "/";

  };

  return (

    <header className="header">

      <div className="header-container">

        {/* LOGO */}

        <div className="logo">

          <Link
            to="/"
            className="logo-link"
          >

            <img
              src={require("../../assests/images/tab-logo.png")}
              alt="AICADEMY Logo"
              className="logo-image"
            />

            <div className="logo-content">

              <span className="logo-text">
                AICademy
              </span>

              <p>
                AI Learning Platform
              </p>

            </div>

          </Link>

        </div>

        {/* NAVIGATION */}

        <nav className={menuOpen ? "nav-menu active" : "nav-menu"}>

          <Link
            to="/"
            className={
              location.pathname === "/" ? "active-link" : ""
            }
          >
            Home
          </Link>

          <Link
            to="/courses"
            className={
              location.pathname === "/courses"
                ? "active-link"
                : ""
            }
          >
            Courses
          </Link>

          {userName && (

            <Link
              to="/dashboard"
              className={
                location.pathname === "/dashboard"
                  ? "active-link"
                  : ""
              }
            >
              Dashboard
            </Link>

          )}

          {!userName && (

            <div className="mobile-auth">

              <Link to="/login">
                Login
              </Link>

              <Link
                to="/register"
                className="mobile-register"
              >
                Get Started
              </Link>

            </div>

          )}

        </nav>

        {/* RIGHT SIDE */}

        <div className="header-right">

          <ThemeToggle />

          {!userName ? (

            <div className="desktop-auth">

              <Link
                to="/login"
                className="login-btn"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="register-btn"
              >
                Get Started
              </Link>

            </div>

          ) : (

            <div
              className="profile-section"
              onClick={toggleDropdown}
            >

              <div className="profile-avatar">

                <FaUserCircle className="profile-icon" />

              </div>

              <div className="profile-info">

                <h4>
                  {userName}
                </h4>

                <span>
                  Student
                </span>

              </div>

              <FaChevronDown className="dropdown-icon" />

              {showDropdown && (

                <div className="profile-dropdown">

                  <Link to="/profile">
                    My Profile
                  </Link>

                  <Link to="/dashboard">
                    Dashboard
                  </Link>

                  <button onClick={handleLogout}>
                    Logout
                  </button>

                </div>

              )}

            </div>

          )}

          {/* MOBILE MENU */}

          <button
            className="menu-toggle"
            onClick={toggleMenu}
          >

            {menuOpen ? <FaTimes /> : <FaBars />}

          </button>

        </div>

      </div>

    </header>

  );

};

export default Header;