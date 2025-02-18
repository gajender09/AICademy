import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { FaBars, FaTachometerAlt, FaUser, FaBook, FaSignOutAlt } from "react-icons/fa";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(
    localStorage.getItem("sidebarOpen") === "true"
  );

  // Save state to localStorage when changed
  useEffect(() => {
    localStorage.setItem("sidebarOpen", isOpen);
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button */}
      <button
        className="fixed top-4 left-4 z-50 text-white bg-gray-800 p-2 rounded-md md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaBars size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gray-800 text-white p-4 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:w-64`}
      >
        {/* User Info */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="https://i.pravatar.cc/100" // Placeholder user avatar
            alt="User Avatar"
            className="w-16 h-16 rounded-full border-2 border-blue-500"
          />
          <p className="mt-2 text-lg font-semibold">John Doe</p>
          <p className="text-gray-400 text-sm">Frontend Developer</p>
        </div>

        {/* Navigation Links with Animation */}
        <nav>
          <ul className="space-y-4">
            {[
              { to: "/dashboard", icon: FaTachometerAlt, label: "Dashboard" },
              { to: "/profile", icon: FaUser, label: "Profile" },
              { to: "/courses", icon: FaBook, label: "Courses" },
              { to: "/logout", icon: FaSignOutAlt, label: "Logout", color: "text-red-400" },
            ].map((item, index) => (
              <motion.li
                key={item.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 p-2 rounded-lg ${
                      isActive ? "bg-blue-500" : "hover:bg-gray-700"
                    } ${item.color || ""}`
                  }
                >
                  <item.icon /> {item.label}
                </NavLink>
              </motion.li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Overlay when sidebar is open (for mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
