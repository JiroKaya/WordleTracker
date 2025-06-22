import { useQuery } from "@tanstack/react-query";
import ScoreCard from "./ScoreCard";
import StreakCalendar from "./StreakCalendar";

type HeatmapDay = {
  played_on: string;
  won: boolean;
};

type UserStats = {
  games_played: number;
  wins: number;
  win_pct: number;
  avg_guesses: number;
  current_streak: number;
  max_streak: number;
  guess_distribution: Record<"1" | "2" | "3" | "4" | "5" | "6" | "X", number>;
  recent_outcomes: HeatmapDay[];
};

async function fetchStats(userId: string): Promise<UserStats> {
  return fetch(`/api/stats?userId=${encodeURIComponent(userId)}`).then(
    (r) => r.json() as Promise<UserStats>,
  );
}

export default function Stats({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stats", userId],
    queryFn: () => fetchStats(userId),
  });

  if (isLoading)
    return <div className="text-center py-8">Loading stats...</div>;
  if (error || !data)
    return (
      <div className="text-center py-8 text-red-500">Failed to load stats.</div>
    );

  return (
    <section className="max-w-3xl mx-auto p-6 space-y-6">
      <ScoreCard
        gamesPlayed={data.games_played}
        wins={data.wins}
        winPct={data.win_pct}
        avgGuesses={data.avg_guesses}
        currentStreak={data.current_streak}
        maxStreak={data.max_streak}
      />

      <StreakCalendar plays={data.recent_outcomes} />
    </section>
  );
}
