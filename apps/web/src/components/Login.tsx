import React, { useState } from "react";

interface LoginProps {
  onLogin: (userId: string, username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const endpoint = isRegistering ? "register" : "login";
    const response = await fetch(`http://localhost:3001/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.username);
      onLogin(data.userId, data.username);
    } else {
      setError(data.message || "Authentication failed");
    }
  };

  return (
    <form
      onSubmit={handleAuth}
      className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm max-w-md mx-auto"
    >
      <h2 className="text-xl font-medium mb-4">
        {isRegistering ? "Register" : "Login"}
      </h2>
      <input
        className="w-full px-4 py-2 mb-3 rounded-lg border border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 placeholder:text-sm"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        className="w-full px-4 py-2 mb-4 rounded-lg border border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 placeholder:text-sm"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        type="submit"
        className="w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded-lg hover:opacity-90 transition"
      >
        {isRegistering ? "Register" : "Login"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-500 text-center">{error}</p>
      )}
      <p className="mt-4 text-sm text-center text-gray-500">
        {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          className="underline"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? "Login here" : "Register here"}
        </button>
      </p>
    </form>
  );
}
