import Stats from "../components/Stats";
interface StatsPageProps {
  userId: string;
}

export default function StatsPage({ userId }: StatsPageProps) {
  return <Stats userId={userId} />;
}
