// src/pages/Profile/Profile.js

import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiCheck,
  FiCopy,
  FiEdit2,
  FiLogOut,
  FiMail,
} from "react-icons/fi";

import "../../styles/Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const [joinedDate, setJoinedDate] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser && storedUser !== "undefined") {
      try {
        const parsed = JSON.parse(storedUser);

        setUser(parsed);

        setForm({
          name: parsed.name || "",
          email: parsed.email || "",
        });

        setJoinedDate(
          parsed.joinedDate ||
            new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
        );
      } catch (error) {
        console.error("Error parsing user:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const validateForm = () => {
    if (!form.name.trim()) return "Name is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email))
      return "Valid email is required";

    return null;
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async () => {
    const validationError = validateForm();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(/\/$/, "");
      const res = await fetch(
        `${API_URL}/api/users/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Update failed");

      const updatedUser = data.user
        ? {
            id: data.user._id || data.user.id || user.id,
            name: data.user.name || form.name,
            email: data.user.email || form.email,
          }
        : {
            ...user,
            name: form.name,
            email: form.email,
          };

      setUser(updatedUser);
      setForm({
        name: updatedUser.name,
        email: updatedUser.email,
      });

      localStorage.setItem("user", JSON.stringify(updatedUser));

      setEditing(false);

      setMessage("Profile updated successfully");
    } catch (err) {
      setMessage(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    window.location.href = "/login";
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText(user.email);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-empty">
          <h2>Not Logged In</h2>

          <a href="/login">Go to Login</a>
        </div>
      </div>
    );
  }

  const avatarInitial = user.name?.charAt(0).toUpperCase();

  return (
    <div className="profile-page">

      {/* BACKGROUND GLOW */}

      <div className="profile-glow glow-1"></div>
      <div className="profile-glow glow-2"></div>

      <div className="profile-wrapper">

        {/* TOP */}

        <div className="profile-top">

          <div className="profile-avatar">
            {avatarInitial}
          </div>

          <div className="profile-user-info">
            <h1>{user.name}</h1>

            <p>
              AI-powered learner building future-ready skills.
            </p>
          </div>

          {!editing && (
            <button
              className="edit-profile-btn"
              onClick={() => setEditing(true)}
            >
              <FiEdit2 />
              Edit
            </button>
          )}

        </div>

        {/* MESSAGE */}

        {message && (
          <div className="profile-message">
            {message}
          </div>
        )}

        {/* CONTENT */}

        <div className="profile-content">

          {!editing ? (
            <>
              <div className="profile-row">

                <div className="profile-label">
                  <FiMail />
                  Email
                </div>

                <div className="profile-value email-row">
                  {user.email}

                  <button
                    className="copy-btn"
                    onClick={copyEmail}
                  >
                    {copied ? <FiCheck /> : <FiCopy />}
                  </button>
                </div>

              </div>

              <div className="profile-row">

                <div className="profile-label">
                  <FiCalendar />
                  Joined
                </div>

                <div className="profile-value">
                  {joinedDate}
                </div>

              </div>
            </>
          ) : (
            <div className="edit-section">

              <div className="input-group">
                <label>Name</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="edit-actions">

                <button
                  className="save-btn"
                  onClick={handleUpdate}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>

                <button
                  className="cancel-btn"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>

              </div>

            </div>
          )}

        </div>

        {/* FOOT */}

        <div className="profile-bottom">

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            <FiLogOut />
            Logout
          </button>

        </div>

      </div>

    </div>
  );
};

export default Profile;