import { useEffect, useState } from "react";

interface FriendRequest {
  user_id: string; // sender ID
  username: string; // sender username
}

interface Props {
  userId: string;
}

export default function FriendRequests({ userId }: Props) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await fetch(`/api/friends/requests/${userId}`);
    const data = (await res.json()) as FriendRequest[];
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    void fetchRequests();
  }, [userId]);

  const respondToRequest = async (
    senderId: string,
    action: "accept" | "decline",
  ) => {
    await fetch(`/api/friends/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, senderId, action }),
    });
    void fetchRequests();
  };

  if (loading) return <p className="text-center">Loading friend requests...</p>;
  if (requests.length === 0) return <p>No pending friend requests.</p>;

  return (
    <div className="mt-8 bg-white dark:bg-neutral-800 p-6 rounded shadow max-w-xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">Friend Requests</h3>
      <ul className="space-y-4">
        {requests.map((req) => (
          <li key={req.user_id} className="flex justify-between items-center">
            <span className="text-gray-800 dark:text-gray-200">
              {req.username}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => void respondToRequest(req.user_id, "accept")}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                Accept
              </button>
              <button
                onClick={() => void respondToRequest(req.user_id, "decline")}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
