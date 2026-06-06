import React, { useState } from "react";

import {
  AiFillEye,
  AiFillEyeInvisible,
} from "react-icons/ai";

import {
  FaBrain,
  FaArrowRight,
  FaShieldAlt,
} from "react-icons/fa";

import { motion } from "framer-motion";

import "../../styles/Auth.css";

const Register = () => {

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordVisible, setPasswordVisible] =
    useState(false);

  const [
    confirmPasswordVisible,
    setConfirmPasswordVisible,
  ] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const togglePasswordVisibility = () =>
    setPasswordVisible(!passwordVisible);

  const toggleConfirmPasswordVisibility = () =>
    setConfirmPasswordVisible(
      !confirmPasswordVisible
    );

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setErrorMessage("");

    setSuccessMessage("");

    const {
      fullName,
      email,
      password,
      confirmPassword,
    } = formData;

    if (
      !fullName ||
      !email ||
      !password ||
      !confirmPassword
    ) {

      setErrorMessage(
        "All fields are required."
      );

      return;

    }

    if (password !== confirmPassword) {

      setErrorMessage(
        "Passwords do not match."
      );

      return;

    }

    const firstName =
      fullName.split(" ")[0];

    try {

      const API_URL = process.env.REACT_APP_API_URL ||
        "http://localhost:3001";

      const response = await fetch(
        `${API_URL}/api/users/register`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: firstName,
            email: email,
            password: password,
          }),
        }
      );

      const data =
        await response.json();

      if (response.ok) {

        setSuccessMessage(
          `Registration successful! Welcome, ${firstName}.`
        );

        localStorage.setItem(
          "token",
          data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        setTimeout(() => {

          window.location.href =
            "/dashboard";

        }, 1500);

      } else {

        setErrorMessage(
          data.message ||
            "Registration failed."
        );

      }

    } catch (error) {

      setErrorMessage(
        "Something went wrong. Please try again."
      );

    }

  };

  return (

    <div className="auth-page">

      {/* BACKGROUND GLOW */}

      <div className="auth-blur auth-blur-1"></div>

      <div className="auth-blur auth-blur-2"></div>

      <div className="auth-grid"></div>

      <div className="auth-layout">

        {/* LEFT SIDE */}

        <motion.div
          className="auth-left"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >

          <div className="auth-badge">

            <FaBrain />

            AI Learning Platform

          </div>

          <h1>
            Start Building
            <br />
            Your Future with AI
          </h1>

          <p>
            Generate AI-powered learning
            roadmaps, practical projects,
            quizzes, smart notes, and
            personalized learning journeys
            designed for ambitious learners.
          </p>

          <div className="auth-features">

            <div className="auth-feature">

              <FaShieldAlt />

              <span>
                Secure authentication
              </span>

            </div>

            <div className="auth-feature">

              <FaArrowRight />

              <span>
                Personalized AI learning
              </span>

            </div>

          </div>

        </motion.div>

        {/* RIGHT SIDE */}

        <motion.div
          className="auth-card"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >

          <div className="auth-card-header">

            <h2>Create Account</h2>

            <p>
              Join AICademy and start your
              AI learning journey.
            </p>

          </div>

          {errorMessage && (
            <div className="auth-alert error-alert">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="auth-alert success-alert">
              {successMessage}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            {/* FULL NAME */}

            <div className="input-group">

              <label>
                Full Name
              </label>

              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />

            </div>

            {/* EMAIL */}

            <div className="input-group">

              <label>
                Email Address
              </label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />

            </div>

            {/* PASSWORD */}

            <div className="input-group">

              <label>
                Password
              </label>

              <div className="password-wrapper">

                <input
                  type={
                    passwordVisible
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={
                    togglePasswordVisibility
                  }
                >

                  {passwordVisible ? (
                    <AiFillEyeInvisible />
                  ) : (
                    <AiFillEye />
                  )}

                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="input-group">

              <label>
                Confirm Password
              </label>

              <div className="password-wrapper">

                <input
                  type={
                    confirmPasswordVisible
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={
                    formData.confirmPassword
                  }
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={
                    toggleConfirmPasswordVisibility
                  }
                >

                  {confirmPasswordVisible ? (
                    <AiFillEyeInvisible />
                  ) : (
                    <AiFillEye />
                  )}

                </button>

              </div>

            </div>

            {/* BUTTON */}

            <button
              type="submit"
              className="auth-submit-btn"
            >

              Create Account

              <FaArrowRight />

            </button>

          </form>

          <p className="auth-footer">

            Already have an account?

            <a href="/login">
              Login
            </a>

          </p>

        </motion.div>

      </div>

    </div>

  );

};

export default Register;