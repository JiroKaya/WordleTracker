import Profile from "../components/Profile";

interface ProfilePageProps {
  userId: string;
}

export default function ProfilePage({ userId }: ProfilePageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <Profile userId={userId} />
    </div>
  );
}
