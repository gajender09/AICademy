import React, { useEffect, useState } from "react";
import "../../styles/Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [joinedDate, setJoinedDate] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser && storedUser !== "undefined") {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setForm({ name: parsed.name || "", email: parsed.email || "" });
        setJoinedDate(parsed.joinedDate || new Date().toLocaleDateString());
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const validateForm = () => {
    if (!form.name.trim()) return "Name is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return "Valid email is required";
    return null;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError + " ❌");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://aicademy-cjr2.onrender.com/api/users/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            email: user.email,
            name: form.name,
            newEmail: form.email,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Update failed");

      const updatedUser = {
        ...user,
        name: form.name,
        email: form.email,
        joinedDate: joinedDate,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setEditing(false);
      setMessage("Profile updated successfully ✅");
    } catch (err) {
      setMessage(err.message || "Update failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(user.email);
    setMessage("Email copied to clipboard 📋");
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Not Logged In</h2>
          <a href="/login" className="btn">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const avatarInitial = user.name.charAt(0).toUpperCase();

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar">{avatarInitial}</div>
          <h1>{user.name}</h1>
        </div>

        {message && <p className={`message ${message.includes('✅') || message.includes('📋') ? 'success' : 'error'}`}>{message}</p>}

        {!editing ? (
          <>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">Name</span>
                <span className="value">{user.name}</span>
              </div>
              <div className="detail-item">
                <span className="label">Email</span>
                <span className="value">{user.email}</span>
                <button className="copy-btn" onClick={copyEmail}>Copy</button>
              </div>
              <div className="detail-item">
                <span className="label">Joined</span>
                <span className="value">{joinedDate}</span>
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn-primary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            </div>
          </>
        ) : (
          <div className="edit-form">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="input"
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="input"
            />
            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? "Updating..." : "Save Changes"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;

