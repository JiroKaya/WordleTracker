type Props = {
  gamesPlayed: number;
  wins: number;
  winPct: number;
  avgGuesses: number;
  currentStreak: number;
  maxStreak: number;
};

export default function ScoreCard(props: Props) {
  console.log("Rendering ScoreCard with props:", props);
  return (
    <div className="grid grid-cols-3 gap-4 text-center bg-gray-900 text-white p-4 rounded-lg shadow">
      <Stat label="Played" value={props.gamesPlayed} />
      <Stat label="Wins" value={props.wins} />
      <Stat label="Win %" value={props.winPct.toFixed(1)} />
      <Stat label="Avg Guesses" value={props.avgGuesses.toFixed(2)} />
      <Stat label="Current Streak" value={props.currentStreak} />
      <Stat label="Max Streak" value={props.maxStreak} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs uppercase text-gray-400">{label}</p>
    </div>
  );
}
