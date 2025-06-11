import React from "react";

interface StatsPageProps {
  userId: string;
}

export default function StatsPage({ userId }: StatsPageProps) {
  console.log("StatsPage userId:", userId);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Stats</h1>
      <p>Coming soon: guess distribution, streaks, heatmap, etc.</p>
    </div>
  );
}
