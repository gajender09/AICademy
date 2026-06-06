// src/features/auth/Login.js

import { useState } from "react";

import {
  AiFillEye,
  AiFillEyeInvisible,
} from "react-icons/ai";

import {
  FaArrowRight,
  FaBrain,
} from "react-icons/fa";

import { motion } from "framer-motion";

import "../../styles/Auth.css";

const Login = () => {

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [passwordVisible, setPasswordVisible] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const togglePasswordVisibility = () =>
    setPasswordVisible(!passwordVisible);

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

    const { email, password } = formData;

    if (!email || !password) {

      setErrorMessage(
        "All fields are required."
      );

      return;

    }

    try {

      const API_URL = process.env.REACT_APP_API_URL ||
        "http://localhost:3001";

      const response = await fetch(
        `${API_URL}/api/users/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data =
        await response.json();

      if (response.ok) {

        setSuccessMessage(
          "Login successful!"
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
          "Invalid email or password."
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

      <div className="auth-blur auth-blur-1"></div>
      <div className="auth-blur auth-blur-2"></div>
      <div className="auth-grid"></div>

      <div className="auth-layout">

        <motion.div
          className="auth-left"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >

          <div className="auth-badge">
            <FaBrain />
            AI Learning Ecosystem
          </div>

          <h1>
            Welcome Back
            <br />
            to AICademy
          </h1>

          <p>
            Continue your AI learning journey with personalized
            roadmaps, smart notes, quizzes, and practical projects.
          </p>

        </motion.div>

        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >

          <div className="auth-card-header">
            <h2>Login</h2>
            <p>Access your learning dashboard</p>
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

          <form className="auth-form" onSubmit={handleSubmit}>

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  {passwordVisible ? (
                    <AiFillEyeInvisible />
                  ) : (
                    <AiFillEye />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              Login
              <FaArrowRight />
            </button>

          </form>

          <p className="auth-footer">
            Don’t have an account?
            <a href="/register">Register</a>
          </p>

        </motion.div>

      </div>

    </div>

  );

};

export default Login;