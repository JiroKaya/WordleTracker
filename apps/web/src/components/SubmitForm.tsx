import React, { useState } from "react";

interface SubmitFormProps {
  userId: string;
  onSubmitted: () => void;
}

const emojiMap: Record<string, string> = {
  ":green_square:": "🟩",
  ":yellow_square:": "🟨",
  ":white_large_square:": "⬜",
  ":black_large_square:": "⬛",
};

function convertDiscordEmojis(input: string): string {
  return input.replace(/:(\w+):/g, (match) => emojiMap[match] || match);
}

export default function SubmitForm({ userId, onSubmitted }: SubmitFormProps) {
  const [raw, setRaw] = useState("");
  const [message, setMessage] = useState("");
  const [previewGrid, setPreviewGrid] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, raw }),
      });

      if (response.ok) {
        setMessage("✅ Submitted!");
        setRaw("");
        setPreviewGrid("");
        onSubmitted();
      } else {
        const errorText = await response.text();
        console.error("Submission error:", errorText);
        setMessage("❌ Error submitting result.");
      }
    } catch (err) {
      console.error("Request failed:", err);
      setMessage("❌ Could not reach the server.");
    }
  };

  const extractGridFromRaw = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    const gridLines = lines.slice(1).filter((line) => line);
    const converted = gridLines
      .map((line) => convertDiscordEmojis(line))
      .join("\n");
    setPreviewGrid(converted);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm"
    >
      <h2 className="text-xl font-medium mb-4">Paste Wordle Share</h2>
      <textarea
        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 placeholder:text-sm"
        placeholder={`Paste your full Wordle result (e.g.\nWordle 1450 4/6\n🟩⬛⬛⬛⬛...)`}
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          extractGridFromRaw(e.target.value);
        }}
        rows={8}
        required
      />
      <button
        type="submit"
        className="mt-4 w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded-lg hover:opacity-90 transition"
      >
        Submit
      </button>
      {message && (
        <p className="mt-3 text-sm text-center text-gray-600 dark:text-gray-400">
          {message}
        </p>
      )}
      {previewGrid && (
        <pre className="mt-4 whitespace-pre-wrap text-center text-lg leading-tight">
          {previewGrid}
        </pre>
      )}
    </form>
  );
}
