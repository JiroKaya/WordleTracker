import { useEffect, useState } from "react";
import SubmitForm from "./components/SubmitForm";
import Leaderboard from "./components/Leaderboard";
import Login from "./components/Login";

export default function App() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [userId, setUserId] = useState<string | null>(() =>
    localStorage.getItem("userId")
  );
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem("username")
  );
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setUserId(null);
    setUsername(null);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-white px-4 py-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-center w-full">
            Wordle Tracker
          </h1>
          <div className="absolute top-6 right-6 flex gap-3 items-center">
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
            >
              {darkMode ? "☀" : "🌙"}
            </button>
            {userId && (
              <button
                onClick={handleLogout}
                className="text-xs px-2 py-1 border border-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {!userId ? (
          <Login
            onLogin={(id, name) => {
              setUserId(id);
              setUsername(name);
            }}
          />
        ) : (
          <div className="space-y-8">
            <p className="text-sm text-center mb-4">
              Logged in as <strong>{username}</strong>
            </p>
            <SubmitForm
              userId={userId}
              onSubmitted={() => setRefreshKey((prev) => prev + 1)}
            />
            <Leaderboard key={refreshKey} />
          </div>
        )}
      </div>
    </div>
  );
}
