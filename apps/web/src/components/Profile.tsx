/* eslint-env browser */
import { useEffect, useState } from "react";

interface UserProfile {
  id: string;
  username: string;
  profile_picture: string | null;
}

interface FriendRequest {
  user_id: string;
  username: string;
}

interface Suggestion {
  id: string;
  username: string;
}

interface Props {
  userId: string;
}

export default function Profile({ userId }: Props) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPicture, setNewPicture] = useState<File | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchProfile = async () => {
    const res = await fetch(`/api/user/${userId}`);
    const data = (await res.json()) as UserProfile;
    setUser(data);
    setNewUsername(data.username);
  };

  const fetchFriendRequests = async () => {
    const res = await fetch(`/api/friends/requests/${userId}`);
    const data = (await res.json()) as FriendRequest[];
    setFriendRequests(data);
  };

  useEffect(() => {
    void fetchProfile();
    void fetchFriendRequests();
  }, [userId]);

  useEffect(() => {
    if (!input) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(input)}`)
        .then((res) => res.json())
        .then((data) => {
          if (
            Array.isArray(data) &&
            data.every((item: unknown) => {
              return (
                typeof (item as { id?: unknown; username?: unknown }).id ===
                  "string" &&
                typeof (item as { id?: unknown; username?: unknown })
                  .username === "string"
              );
            })
          ) {
            setSuggestions(data as Suggestion[]);
          } else {
            setSuggestions([]);
          }
        })
        .catch(() => setSuggestions([]));
    }, 300);

    return () => clearTimeout(timeout);
  }, [input]);

  const handleSave = async () => {
    await fetch(`/api/user/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: newUsername,
        password: newPassword || undefined,
      }),
    });

    if (newPicture) {
      const formData = new FormData();
      formData.append("image", newPicture);
      formData.append("userId", userId);
      await fetch("/api/upload-profile-picture", {
        method: "POST",
        body: formData,
      });
    }

    setEditMode(false);
    void fetchProfile();
  };

  const respondToRequest = async (
    senderId: string,
    action: "accept" | "decline",
  ) => {
    await fetch(`/api/friends/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, senderId, action }),
    });
    void fetchFriendRequests();
  };

  const sendFriendRequest = async (friendId: string) => {
    const friend = suggestions.find((s) => s.id === friendId);
    if (!friend) return;

    await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, targetUsername: friend.username }),
    });

    setInput("");
    setSuggestions([]);
    setStatusMsg("Friend request sent!");
    setTimeout(() => setStatusMsg(""), 2000);
  };

  if (!user) return <p className="text-center mt-8">Loading profile...</p>;

  return (
    <div className="mt-10 space-y-8">
      {/* Profile Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <img
            src={
              previewUrl || user.profile_picture || "https://placehold.co/600"
            }
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border"
          />
          {editMode && (
            <div>
              <input
                type="file"
                id="profile-upload"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    const file = e.target.files[0];
                    setNewPicture(file);
                    setPreviewUrl(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="profile-upload"
                className="inline-block bg-gray-200 dark:bg-neutral-700 text-sm text-gray-800 dark:text-gray-100 px-3 py-1 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-neutral-600 transition"
              >
                Choose Profile Picture
              </label>
            </div>
          )}
        </div>

        {/* Username */}
        <div>
          <label
            htmlFor="username-input"
            className="block text-sm font-medium mb-1"
          >
            Username
          </label>
          {editMode ? (
            <input
              id="username-input"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder={!newUsername ? "Enter username" : ""}
              className="w-full border rounded px-3 py-2"
            />
          ) : (
            <p className="text-gray-700 dark:text-gray-300">{user.username}</p>
          )}
        </div>

        {/* Password */}
        {editMode && (
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Type new password"
              className="w-full border rounded px-3 py-2 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-600 dark:text-gray-300"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          {editMode ? (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="text-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={void handleSave}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Friend Requests */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Friend Requests</h3>
        {friendRequests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <ul className="space-y-4">
            {friendRequests.map((req) => (
              <li
                key={req.user_id}
                className="flex justify-between items-center"
              >
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
                    onClick={() =>
                      void respondToRequest(req.user_id, "decline")
                    }
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Friend */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded shadow">
        <label
          htmlFor="friend-search-input"
          className="block text-sm font-medium mb-1"
        >
          Add a Friend
        </label>
        <input
          id="friend-search-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by username"
          className="w-full px-3 py-2 border rounded mb-2"
        />

        {suggestions.length > 0 && (
          <ul className="border rounded bg-white dark:bg-neutral-700 max-h-40 overflow-y-auto">
            {suggestions.map((s) => (
              <li key={s.id} className="p-0 m-0 border-none bg-transparent">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer"
                  onClick={() => void sendFriendRequest(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void sendFriendRequest(s.id);
                    }
                  }}
                >
                  {s.username}
                </button>
              </li>
            ))}
          </ul>
        )}

        {statusMsg && (
          <p className="mt-2 text-green-600 dark:text-green-400">{statusMsg}</p>
        )}
      </div>
    </div>
  );
}
