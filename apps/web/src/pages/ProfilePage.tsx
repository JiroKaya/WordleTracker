interface ProfilePageProps {
  username: string;
}

export default function ProfilePage({ username }: ProfilePageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <p>
        Logged in as <strong>{username}</strong>
      </p>
    </div>
  );
}
