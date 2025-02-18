import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa'; // Profile icon
import '../styles/global.css';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Check if user is registered
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserName(parsedUser.name);
      } catch (error) {
        console.error('Error parsing user data', error);
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
    localStorage.removeItem('user');
    setUserName(null);
    setShowDropdown(false);
    window.location.href = '/';
  };

  return (
    <header>
      <div className="logo">
        <Link to="/" className="logo-link">
          <img src={require('../assests/images/logo.png')} alt="AICADEMY Logo" className="logo-image" />
          <span className="logo-text">AICADEMY</span>
        </Link>
      </div>

      <nav className={menuOpen ? 'open' : ''}>
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>

        {/* Show Dashboard only if user is logged in */}
        {userName && <Link to="/dashboard">Dashboard</Link>}

        {/* Show Profile Icon instead of Welcome, Username */}
        {userName ? (
          <div className="profile-section" onClick={toggleDropdown}>
            <FaUserCircle className="profile-icon" />
            {showDropdown && (
              <div className="profile-dropdown">
                <Link to="/profile">Profile</Link>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>

      <div className="hamburger-menu" onClick={toggleMenu}>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </header>
  );
};

export default Header;
