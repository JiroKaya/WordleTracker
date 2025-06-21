import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
  "#ffbb28",
  "#ff6666",
  "#b8860b",
];

export default function GuessHistogram({
  data,
}: {
  data: Record<string, number>;
}) {
  const entries = Object.entries(data).map(([k, v]) => ({
    guess: k,
    games: v,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={entries}>
        <XAxis dataKey="guess" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="games" radius={[4, 4, 0, 0]}>
          {entries.map((_, idx) => (
            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
