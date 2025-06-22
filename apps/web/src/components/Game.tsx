import {
  useEffect,
  useState,
  useRef,
  type FormEvent,
  type RefObject,
} from "react";

type LetterStatus = "correct" | "present" | "absent";

interface Guess {
  guessNumber: number;
  guess: string;
  pattern: LetterStatus[];
  emoji: string;
}

interface GuessesResponse {
  guesses: Guess[];
}

/** runtime guard so we can safely access json.guesses */
function isGuessesResponse(data: unknown): data is GuessesResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as { guesses?: unknown }).guesses)
  );
}

export default function WordleGame() {
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string>();
  const [gameError, setGameError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = localStorage.getItem("userId") ?? "";

  const isComplete =
    guesses.some((g) => g.pattern.every((s) => s === "correct")) ||
    guesses.length >= 6;

  /* focus the input once the component mounts (avoids eslint no-autofocus) */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* load previous guesses */
  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!userId) {
        setFatalError("Please log in to play.");
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/guesses?userId=${encodeURIComponent(userId)}`,
        );
        const json: unknown = await res.json();
        if (isGuessesResponse(json)) setGuesses(json.guesses);
        else throw new Error("Malformed response");
      } catch {
        setFatalError("Failed to load your guesses.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [userId]);

  /* form submit */
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setGameError(undefined);

    const guess = currentGuess.trim().toLowerCase();

    if (guess.length !== 5 || !/^[a-z]{5}$/.test(guess)) {
      setGameError("Guess must be exactly 5 letters.");
      return;
    }

    /* dictionary validation */
    try {
      const dictRes = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${guess}`,
      );
      if (dictRes.status === 404) {
        setGameError("That's not a valid English word.");
        return;
      }
      if (!dictRes.ok) throw new Error("Dictionary API error");
    } catch {
      setGameError("Word check failed. Try again.");
      return;
    }

    if (isComplete) return;

    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, guess }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as Guess;
      setGuesses((g) => [...g, json]);
      setCurrentGuess("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown server error.";
      setGameError(msg);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
        Wordle Game
      </h2>

      {isLoading ? (
        <p className="text-center text-gray-500">Loading…</p>
      ) : fatalError ? (
        <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded text-sm text-center">
          {fatalError}
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid gap-1 mb-2">
            {Array.from({ length: 6 }).map((_, row) => {
              const guess = guesses[row];
              const isActive = row === guesses.length && !isComplete;
              return (
                <div
                  key={row}
                  className="grid grid-cols-5 gap-1 justify-center"
                >
                  {guess
                    ? guess.pattern.map((status, i) => {
                        const bg =
                          status === "correct"
                            ? "bg-green-500 text-white"
                            : status === "present"
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-300 text-gray-700 dark:bg-neutral-700 dark:text-neutral-300";
                        return (
                          <div
                            key={i}
                            className={`${bg} w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-xl uppercase rounded transition-all duration-300`}
                          >
                            {guess.guess[i]}
                          </div>
                        );
                      })
                    : isActive
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-12 h-12 sm:w-10 sm:h-10 border-2 border-gray-400 dark:border-neutral-600 flex items-center justify-center text-xl uppercase font-semibold"
                          >
                            {currentGuess[i]?.toUpperCase() ?? ""}
                          </div>
                        ))
                      : Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-12 h-12 sm:w-10 sm:h-10 border border-gray-300 dark:border-neutral-700 rounded"
                          />
                        ))}
                </div>
              );
            })}
          </div>

          {/* Input */}
          {!isComplete && (
            <form
              onSubmit={(e): void => {
                void handleSubmit(e);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef as RefObject<HTMLInputElement>}
                type="text"
                aria-label="Enter your guess"
                value={currentGuess}
                onChange={(e) => {
                  const v = e.target.value.toLowerCase().replace(/[^a-z]/g, "");
                  if (v.length <= 5) setCurrentGuess(v);
                  setGameError(undefined);
                }}
                maxLength={5}
                className="flex-1 border border-gray-300 dark:border-neutral-700 px-3 py-2 rounded-md uppercase tracking-widest text-lg bg-white dark:bg-neutral-900 dark:text-white placeholder:opacity-50"
                placeholder="abcde"
              />
              <button
                type="submit"
                disabled={currentGuess.length !== 5}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guess
              </button>
            </form>
          )}

          {/* Game Error */}
          {gameError && (
            <div className="mt-2 text-sm text-red-600 text-center">
              {gameError}
            </div>
          )}

          {/* Completion Message */}
          {isComplete && (
            <p className="mt-4 text-center text-lg font-semibold">
              {guesses.some((g) => g.pattern.every((s) => s === "correct")) ? (
                <span className="text-green-600">
                  🎉 You solved it in {guesses.length}!
                </span>
              ) : (
                <span className="text-gray-500 dark:text-neutral-400">
                  ☹️ Out of guesses. Try again tomorrow!
                </span>
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}
