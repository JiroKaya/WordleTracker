import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";

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
      <div className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        {/* Logo / Title */}
        <h1 className="text-2xl font-semibold">Wordle Tracker</h1>

        {/* Navigation Links */}
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

        {/* Actions: Theme switch + User menu */}
        <div className="flex items-center space-x-6">
          {/* Theme Toggle Switch */}
          {/* Theme Toggle Switch with icon and label for clarity */}
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

          {/* User Dropdown: click to open */}
          {username && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center space-x-1 focus:outline-none"
                aria-haspopup="true"
                aria-expanded={menuOpen}
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
    </nav>
  );
}
