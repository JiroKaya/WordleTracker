import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import NavBar from "./components/NavBar";
import LoginPage from "./pages/LoginPage";
import SubmitPage from "./pages/SubmitPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [userId, setUserId] = useState<string | null>(() =>
    localStorage.getItem("userId"),
  );
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem("username"),
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

  const handleLogin = (id: string, name: string) => {
    localStorage.setItem("userId", id);
    localStorage.setItem("username", name);
    setUserId(id);
    setUsername(name);
  };

  const onSubmitted = () => setRefreshKey((prev) => prev + 1);

  const isLoggedIn = Boolean(userId);

  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-white">
        <NavBar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          username={username}
          onLogout={handleLogout}
        />

        <main className="px-4 py-8 max-w-4xl mx-auto">
          <Routes>
            <Route
              path="/login"
              element={
                isLoggedIn ? (
                  <Navigate to="/submit" replace />
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />

            {isLoggedIn ? (
              <>
                <Route
                  path="/submit"
                  element={
                    <SubmitPage userId={userId!} onSubmitted={onSubmitted} />
                  }
                />
                <Route
                  path="/leaderboard"
                  element={<LeaderboardPage key={refreshKey} />}
                />
                <Route path="/stats" element={<StatsPage userId={userId!} />} />
                <Route
                  path="/profile"
                  element={<ProfilePage username={username!} />}
                />
                <Route path="/" element={<Navigate to="/submit" replace />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}
