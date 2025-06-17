import { useEffect, useState } from "react";

interface LeaderRow {
  username: string;
  games: number;
  wins: number;
  avg_guesses: number;
}

export default function Game() {
  const [data, setData] = useState<LeaderRow[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((json) => setData(json as LeaderRow[]))
      .catch((err) => {
        console.error("Failed to fetch leaderboard data:", err);
      });
  }, []);

  return (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm">
      <h2 className="text-xl font-medium mb-6">Leaderboard</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-neutral-700">
              <th className="py-2 pr-4">Username</th>
              <th className="py-2 pr-4">Games</th>
              <th className="py-2 pr-4">Wins</th>
              <th className="py-2">Avg Guesses</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.username}
                className="border-b border-gray-100 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700"
              >
                <td className="py-2 pr-4 font-medium">{row.username}</td>
                <td className="py-2 pr-4">{row.games}</td>
                <td className="py-2 pr-4">{row.wins}</td>
                <td className="py-2">{row.avg_guesses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
