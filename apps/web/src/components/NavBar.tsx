import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import logo from "../assets/wordle_tracker.webp";

interface NavBarProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onLogout: () => void;
  username: string | null;
}

const NavBar: React.FC<NavBarProps> = ({
  darkMode,
  setDarkMode,
  onLogout,
  username,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: "/submit", label: "Submit" },
    { to: "/leaderboard", label: "Leaderboard" },
    { to: "/stats", label: "Stats" },
    { to: "/profile", label: "Profile" },
    { to: "/game", label: "Game" },
  ];

  const handleNavClick = (to: string) => {
    void navigate(to);
    setMobileOpen(false);
  };

  return (
    <header className="bg-white dark:bg-neutral-900 shadow">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="w-10 h-auto" />
          <span className="text-lg font-semibold text-gray-800 dark:text-white">
            Wordle Tracker
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6 items-center">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm font-medium ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-500"
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="ml-4 text-xl"
            aria-label="Toggle Theme"
          >
            {darkMode ? "🌙" : "☀️"}
          </button>

          {/* User Menu */}
          {username && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 text-sm text-gray-800 dark:text-gray-200"
              >
                {username}
                <ChevronDown className="w-4 h-4" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 bg-white dark:bg-neutral-800 border dark:border-neutral-600 rounded shadow-lg py-1">
                  <button
                    onClick={onLogout}
                    className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden text-gray-800 dark:text-gray-200"
          aria-label="Toggle Mobile Menu"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          {links.map(({ to, label }) => (
            <button
              key={to}
              onClick={() => handleNavClick(to)}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded"
            >
              {label}
            </button>
          ))}

          {/* Dark Mode */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded"
          >
            {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>

          {/* Logout */}
          {username && (
            <button
              onClick={() => {
                setMobileOpen(false);
                onLogout();
              }}
              className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default NavBar;
