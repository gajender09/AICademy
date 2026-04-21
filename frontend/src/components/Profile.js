import React, { useEffect, useState } from "react";
import "../styles/Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setForm({ name: parsed.name, email: parsed.email });
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(
        "https://aicademy-cjr2.onrender.com/api/users/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email, // identify user
            name: form.name,
            newEmail: form.email,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      const updatedUser = {
        ...user,
        name: form.name,
        email: form.email,
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
    window.location.href = "/login";
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Not Logged In</h2>
          <a href="/login" className="btn">
            Go Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">

        <div className="avatar">
          {user.name?.charAt(0).toUpperCase()}
        </div>

        <h2>Profile</h2>

        {message && <p className="message">{message}</p>}

        {/* VIEW MODE */}
        {!editing ? (
          <>
            <div className="info">
              <p><span>Name:</span> {user.name}</p>
              <p><span>Email:</span> {user.email}</p>
            </div>

            <button
              className="btn-primary"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          </>
        ) : (
          <>
            {/* EDIT MODE */}
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
              className="input"
            />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="input"
            />

            <button
              className="btn-primary"
              onClick={handleUpdate}
              disabled={loading}
            >
              {loading ? "Updating..." : "Save"}
            </button>

            <button
              className="btn-secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </>
        )}

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;