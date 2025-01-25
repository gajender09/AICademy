import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/courses">Courses</Link></li>
          <li><Link to="/logout">Logout</Link></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
