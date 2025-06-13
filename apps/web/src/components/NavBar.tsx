import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import logo from "../assets/wordle_tracker.webp"; // Adjust the path as necessary

interface NavBarProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onLogout: () => void;
  username: string | null;
}

export default function NavBar({
  darkMode,
  setDarkMode,
  onLogout,
  username,
}: NavBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const links = [
    { to: "/submit", label: "Submit" },
    { to: "/leaderboard", label: "Leaderboard" },
    { to: "/stats", label: "Stats" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <nav className="bg-white dark:bg-neutral-800 shadow">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Logo and Title */}
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Logo" className="w-10 h-auto" />
          <h1 className="text-2xl font-semibold">Wordle Tracker</h1>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="md:hidden focus:outline-none"
          aria-label="Toggle Menu"
        >
          <svg
            className="w-6 h-6 text-gray-700 dark:text-gray-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Right: Nav + Actions (desktop) */}
        <div className="hidden md:flex items-center space-x-6">
          <ul className="flex space-x-6">
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `px-3 py-2 text-gray-600 dark:text-gray-300 transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? "font-bold"
                        : "hover:underline hover:decoration-current hover:decoration-2"
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Theme toggle */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label="Toggle Dark Mode"
            className="flex items-center space-x-2 focus:outline-none"
          >
            <span className="relative w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full p-1 transition-colors duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <span
                className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ${
                  darkMode ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300 select-none">
              {darkMode ? "🌙" : "☀"}
            </span>
          </button>

          {/* User dropdown */}
          {username && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center space-x-1 focus:outline-none"
              >
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {username}
                </span>
                <ChevronDown
                  className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200"
                  style={{
                    transform: menuOpen ? "rotate(180deg)" : "rotate(0)",
                  }}
                />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-neutral-700 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-4 space-y-4">
          <ul className="space-y-2">
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 text-gray-600 dark:text-gray-300 transition-colors duration-200 ${
                      isActive
                        ? "font-bold"
                        : "hover:underline hover:decoration-current hover:decoration-2"
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Theme toggle */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="flex items-center space-x-2 px-3 focus:outline-none"
          >
            <span className="relative w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full p-1">
              <span
                className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 ${
                  darkMode ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {darkMode ? "🌙" : "☀"}
            </span>
          </button>

          {/* Logout (mobile view) */}
          {username && (
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
