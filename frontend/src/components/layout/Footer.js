import React, { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
  FaGithub,
  FaLinkedinIn,
  FaInstagram,
} from "react-icons/fa";

import "../../styles/Footer.css";

const Footer = () => {

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {

    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (
      user &&
      user !== "undefined" &&
      token
    ) {
      setIsAuthenticated(true);
    }

  }, []);

  return (

    <footer className="footer">

      {/* HUGE BACKGROUND TEXT */}

      <div className="footer-bg-text">
        AICADEMY
      </div>

      <div className="footer-container">

        {/* TOP */}

        <div className="footer-top">

          <div className="footer-brand">

            <h2>
              AICademy
            </h2>

            <p>
              AI-powered learning ecosystem focused on
              personalized roadmaps, practical learning,
              intelligent quizzes, and project-driven growth.
            </p>

          </div>

          <div className="footer-links">

            <div className="footer-column">

              <span>
                Navigation
              </span>

              <Link to="/">
                Home
              </Link>

              <Link to="/courses">
                Courses
              </Link>

              {isAuthenticated && (
                <Link to="/dashboard">
                  Dashboard
                </Link>
              )}

            </div>

            <div className="footer-column">

              <span>
                Resources
              </span>

              <Link to="/profile">
                Profile
              </Link>

              {!isAuthenticated && (
                <>
                  <Link to="/login">
                    Login
                  </Link>

                  <Link to="/register">
                    Register
                  </Link>
                </>
              )}

            </div>

          </div>

        </div>

        {/* BOTTOM */}

        <div className="footer-bottom">

          <p>
            © 2026 AICademy. Built for the future of learning.
          </p>

          <div className="footer-socials">

            <a
              href="https://github.com/gajender09"
              target="_blank"
              rel="noreferrer"
            >
              <FaGithub />
            </a>

            <a
              href="https://linkedin.com/in/gajender-mandiwal"
              target="_blank"
              rel="noreferrer"
            >
              <FaLinkedinIn />
            </a>

            <a
              href="https://instagram.com/codeamy_"
              target="_blank"
              rel="noreferrer"
            >
              <FaInstagram />
            </a>

          </div>

        </div>

      </div>

    </footer>
  );
};

export default Footer;