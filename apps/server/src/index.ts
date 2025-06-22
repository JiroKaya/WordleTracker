import express, { type Request, type Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { Pool } from "pg";
import path from "path";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://www.wordletracker.vertalune.com",
  "https://wordletracker.vertalune.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../../web/dist")));

const db = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://user:password@localhost:5432/wordle",
});

const discordEmojiMap: Record<string, string> = {
  ":green_square:": "🟩",
  ":yellow_square:": "🟨",
  ":white_large_square:": "⬜",
  ":black_large_square:": "⬛",
};

function convertEmojiCodes(input: string): string {
  return input.replace(/:(\w+):/g, (match) => discordEmojiMap[match] || match);
}

function parseWordleShareText(
  raw: string,
): { game: number; score: string; grid: string } | null {
  try {
    const lines = raw
      .trim()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const header = lines.shift();
    if (!header || !header.startsWith("Wordle")) return null;

    const [, gameStr, scoreStr] = header.split(/\s+/);
    const game = parseInt(gameStr, 10);
    const score = scoreStr.trim();
    const rawGrid = lines.join("\n");
    const emojiGrid = convertEmojiCodes(rawGrid);
    return { game, score, grid: emojiGrid };
  } catch {
    return null;
  }
}

const api = express.Router();

type DbUser = { id: string; username: string; password: string };

// 🔒 Register
api.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    res.status(400).json({ message: "Missing fields" });
    return;
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();

    await db.query(
      `INSERT INTO users (id, username, password) VALUES ($1, $2, $3)`,
      [id, username, hashedPassword],
    );

    res.json({ userId: id, username });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    ) {
      res.status(400).json({ message: "Username already taken" });
    } else {
      const message =
        err instanceof Error ? err.message : "Unknown database error";
      res.status(500).json({ message: `Database error: ${message}` });
    }
  }
});

// 🔑 Login
api.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    res.status(400).json({ message: "Missing fields" });
    return;
  }

  try {
    const result = await db.query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);

    const user = result.rows[0] as DbUser;

    if (!user || !bcrypt.compareSync(password, user.password)) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    res.json({ userId: user.id, username: user.username });
  } catch (err: unknown) {
    console.error("Login error:", err);
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "ECONNREFUSED"
    ) {
      res.status(500).json({
        message: "Could not connect to the database. Please try again later.",
      });
    } else {
      const message =
        err instanceof Error ? err.message : "Unknown database error";
      res.status(500).json({ message: `Database error: ${message}` });
    }
  }
});

// 📝 Submit Result
api.post("/submit", async (req: Request, res: Response) => {
  const { userId, raw } = req.body as { userId?: string; raw?: string };
  if (!userId || !raw) {
    res.status(400).send("Missing fields");
    return;
  }

  let parsed = null;

  if (raw && typeof raw === "string") {
    parsed = parseWordleShareText(raw);
    if (!parsed) {
      res.status(400).send("Invalid Wordle share text");
      return;
    }
  } else {
    res.status(400).send("Missing raw Wordle result");
    return;
  }

  const { game, score, grid } = parsed;

  try {
    await db.query(
      `INSERT INTO results (userId, game, score, grid) VALUES ($1, $2, $3, $4)`,
      [userId, game, score, grid || null],
    );
    res.send("Submitted");
  } catch (err: unknown) {
    const message =
      typeof err === "object" && err !== null && "message" in err
        ? String((err as { message?: string }).message)
        : "DB error";
    res.status(500).send(message);
  }
});

// 🏆 Leaderboard
api.get("/leaderboard", async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT users.username,
              COUNT(*) AS games,
              SUM(CASE WHEN score NOT LIKE 'X%' THEN 1 ELSE 0 END) AS wins,
              ROUND(AVG(CASE WHEN score NOT LIKE 'X%' THEN CAST(SUBSTRING(score FROM 1 FOR 1) AS INTEGER) ELSE NULL END), 2) AS avg_guesses
       FROM results
       JOIN users ON results.userId = users.id
       GROUP BY users.username
       ORDER BY wins DESC, avg_guesses ASC`,
    );
    res.json(result.rows);
  } catch (err: unknown) {
    const message =
      typeof err === "object" && err !== null && "message" in err
        ? String((err as { message?: string }).message)
        : "DB error";
    res.status(500).send(message);
  }
});

// 🎯 Guess evaluation + persistence
api.post("/guess", async (req: Request, res: Response) => {
  const { userId, guess } = req.body as {
    userId?: string;
    guess?: string;
  };

  // 1) Validate
  if (
    !userId ||
    !guess ||
    typeof guess !== "string" ||
    guess.length !== 5 ||
    !/^[a-zA-Z]+$/.test(guess)
  ) {
    res
      .status(400)
      .json({ message: "Must include userId and a 5-letter guess." });
    return;
  }
  const guessArr = guess.toLowerCase().split("");

  try {
    // 2) Load today's word + date
    const { rows } = await db.query<{
      solution: string;
      date: string;
    }>(`
      SELECT solution, date
        FROM daily_words
       ORDER BY date DESC
       LIMIT 1
    `);

    if (!rows[0]) {
      res.status(500).json({ message: "Could not find today's word." });
      return;
    }

    const { solution: answer, date: gameDate } = rows[0];
    const answerArr = answer.toLowerCase().split("");

    // 3) First pass: mark greens
    const result = Array(5).fill("absent") as (
      | "correct"
      | "present"
      | "absent"
    )[];
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === answerArr[i]) {
        result[i] = "correct";
        answerArr[i] = ""; // remove
      }
    }

    // 4) Count remaining letters for yellows
    const letterCounts: Record<string, number> = {};
    answerArr.forEach((ch) => {
      if (ch) letterCounts[ch] = (letterCounts[ch] || 0) + 1;
    });

    // 5) Second pass: mark presents
    for (let i = 0; i < 5; i++) {
      if (result[i] !== "correct") {
        const ch = guessArr[i];
        if (letterCounts[ch]) {
          result[i] = "present";
          letterCounts[ch]--;
        }
      }
    }

    // 6) Build emoji string
    const emojiMap = {
      correct: "🟩",
      present: "🟨",
      absent: "⬜",
    } as const;
    const emoji = result.map((s) => emojiMap[s]).join("");

    // 7) Figure out this guess's number for the user
    const countRes = await db.query<{ count: string }>(
      `
      SELECT COUNT(*) AS count
        FROM guesses
       WHERE user_id = $1
         AND game_date = $2
    `,
      [userId, gameDate],
    );
    const guessNumber = parseInt(countRes.rows[0].count, 10) + 1;

    // 8) Persist it
    await db.query(
      `
      INSERT INTO guesses
        (user_id, game_date, guess_number, guess, pattern, emoji)
      VALUES
        ($1,        $2,        $3,           $4,    $5,      $6)
    `,
      [
        userId,
        gameDate,
        guessNumber,
        guess.toLowerCase(),
        JSON.stringify(result),
        emoji,
      ],
    );

    // 9) Respond
    res.json({
      guessNumber,
      guess,
      pattern: result,
      emoji,
      isCorrect: result.every((s) => s === "correct"),
    });
    return;
  } catch (err: unknown) {
    console.error("Guess error:", err);
    res.status(500).json({ message: "Server error—please try again later." });
    return;
  }
});

// 📥 Load saved guesses for today
api.get("/guesses", async (req: Request, res: Response) => {
  let userId = req.query.userId;
  if (Array.isArray(userId)) {
    userId = userId[0];
  }
  userId = typeof userId === "string" ? userId : "";

  if (!userId) {
    res.status(400).json({ message: "Missing userId" });
    return;
  }

  try {
    // 1) Find today’s game_date
    const dayRes = await db.query<{ date: string }>(
      `
      SELECT date
        FROM daily_words
       ORDER BY date DESC
       LIMIT 1
    `,
    );
    if (!dayRes.rows[0]) {
      res.status(500).json({ message: "Could not find today's word date." });
      return;
    }
    const gameDate = dayRes.rows[0].date;

    // 2) Fetch all guesses
    const guessRows = await db.query<{
      guess_number: number;
      guess: string;
      pattern: string;
      emoji: string;
      created_at: string;
    }>(
      `
      SELECT guess_number, guess, pattern, emoji, created_at
        FROM guesses
       WHERE user_id    = $1
         AND game_date  = $2
       ORDER BY guess_number
    `,
      [userId, gameDate],
    );

    // 3) Parse JSON patterns
    const guesses = guessRows.rows.map((r) => ({
      guessNumber: r.guess_number,
      guess: r.guess,
      pattern: JSON.parse(r.pattern) as ("correct" | "present" | "absent")[],
      emoji: r.emoji,
      timestamp: r.created_at,
    }));

    res.json({ gameDate, guesses });
    return;
  } catch (err: unknown) {
    console.error("Load guesses error:", err);
    res.status(500).json({ message: "Server error—please try again later." });
    return;
  }
});

api.get("/stats", async (req: Request, res: Response) => {
  let userId = req.query.userId;
  if (Array.isArray(userId)) {
    userId = userId[0];
  }
  userId = typeof userId === "string" ? userId : "";

  if (!userId) {
    res.status(400).json({ message: "Missing userId" });
    return;
  }

  try {
    const [[summary], streakSummary, guessRows, recentOutcomes] =
      await Promise.all([
        db
          .query<{
            games_played: number;
            wins: number;
            avg_guesses: number;
          }>(
            `
        SELECT
          COUNT(*) AS games_played,
          SUM(won::int) AS wins,
          ROUND(AVG(guesses_used)::numeric, 2) AS avg_guesses
        FROM v_game_outcomes
        WHERE userid = $1
        `,
            [userId],
          )
          .then((r) => r.rows),

        db
          .query<{
            current_streak: number | null;
            max_streak: number | null;
          }>("SELECT * FROM v_streak_summary WHERE userid = $1", [userId])
          .then((r) => r.rows),

        db
          .query<{
            guesses_used: number;
            games: number;
          }>("SELECT * FROM v_guess_distribution WHERE userid = $1", [userId])
          .then((r) => r.rows),

        db
          .query<{
            date: string;
            status: string;
          }>(
            `SELECT played_on, won FROM v_streaks WHERE userid = $1 ORDER BY played_on ASC`,
            [userId],
          )
          .then((r) => r.rows),
      ]);

    // Explicitly convert summary fields to numbers
    const games_played = Number(summary?.games_played ?? 0);
    const wins = Number(summary?.wins ?? 0);
    const avg_guesses = Number(summary?.avg_guesses ?? 0);

    // Explicitly convert streaks to numbers
    const current_streak = Number(streakSummary?.[0]?.current_streak ?? 0);
    const max_streak = Number(streakSummary?.[0]?.max_streak ?? 0);

    // Convert guess distribution values to numbers
    const guessDistribution: Record<string, number> = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0,
      "6": 0,
      X: 0,
    };
    guessRows.forEach((g) => {
      guessDistribution[g.guesses_used > 6 ? "X" : String(g.guesses_used)] =
        Number(g.games);
    });

    res.json({
      games_played,
      wins,
      avg_guesses,
      win_pct: games_played
        ? Number(((wins / games_played) * 100).toFixed(1))
        : 0,
      current_streak,
      max_streak,
      guess_distribution: guessDistribution,
      recent_outcomes: recentOutcomes,
    });
  } catch (err: unknown) {
    console.error("Load guesses error:", err);
    res.status(500).json({ message: "Server error—please try again later." });
    return;
  }
});

api.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    `SELECT id, username, profile_picture FROM users WHERE id = $1`,
    [id],
  );
  res.json(result.rows[0]);
});

api.put("/user/:id", async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  const updates = [];
  const values: string[] = [];
  let i = 1;

  if (username) {
    updates.push(`username = $${i++}`);
    values.push(username);
  }
  if (password) {
    updates.push(`password = $${i++}`);
    values.push(bcrypt.hashSync(password, 10));
  }
  values.push(id);

  if (updates.length === 0) {
    res.status(400).json({ message: "Nothing to update" });
    return;
  }

  await db.query(
    `UPDATE users SET ${updates.join(", ")} WHERE id = $${i}`,
    values,
  );

  res.sendStatus(204);
});

api.post("/friends/request", async (req, res) => {
  const { userId, targetUsername } = req.body as {
    userId?: string;
    targetUsername?: string;
  };
  const friend = await db.query<{ id: string }>(
    "SELECT id FROM users WHERE username = $1",
    [targetUsername],
  );

  if (friend.rows.length === 0) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const friendId = friend.rows[0].id;

  await db.query(
    `INSERT INTO friendships (user_id, friend_id, status)
     VALUES ($1, $2, 'pending')
     ON CONFLICT DO NOTHING`,
    [userId, friendId],
  );

  res.sendStatus(204);
});

api.get("/friends/requests/:userId", async (req, res) => {
  const { userId } = req.params;
  const result = await db.query(
    `SELECT f.user_id, u.username
     FROM friendships f
     JOIN users u ON f.user_id = u.id
     WHERE f.friend_id = $1 AND f.status = 'pending'`,
    [userId],
  );
  res.json(result.rows);
});

api.post("/friends/respond", async (req, res) => {
  const { userId, senderId, action } = req.body as {
    userId?: string;
    senderId?: string;
    action?: "accept" | "decline";
  };

  if (action === "accept") {
    await db.query(
      `UPDATE friendships SET status = 'accepted'
       WHERE user_id = $1 AND friend_id = $2`,
      [senderId, userId],
    );
  } else if (action === "decline") {
    await db.query(
      `DELETE FROM friendships
       WHERE user_id = $1 AND friend_id = $2`,
      [senderId, userId],
    );
  }

  res.sendStatus(204);
});

api.get("/users/search", async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== "string") {
    res.status(400).json({ message: "Missing query" });
    return;
  }

  const result = await db.query(
    `SELECT id, username FROM users WHERE username ILIKE $1 LIMIT 5`,
    [`${query}%`],
  );

  res.json(result.rows);
});

// Set up Multer (in-memory)
const upload = multer({ storage: multer.memoryStorage() });

// Upload endpoint
api.post(
  "/upload-profile-picture",
  upload.single("image"),
  async (req, res) => {
    const { userId } = req.body as { userId?: string };

    if (!req.file || !userId) {
      res.status(400).json({ message: "Missing file or userId" });
      return;
    }

    try {
      const streamUpload = () =>
        new Promise<{ url: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "wordle-profile-pics" },
            (error, result) => {
              if (result?.secure_url) resolve({ url: result.secure_url });
              else
                reject(
                  error instanceof Error
                    ? error
                    : new Error(
                        typeof error === "string"
                          ? error
                          : JSON.stringify(error),
                      ),
                );
            },
          );
          streamifier.createReadStream(req.file!.buffer).pipe(stream);
        });

      const { url } = await streamUpload();

      // Save to DB
      await db.query(`UPDATE users SET profile_picture = $1 WHERE id = $2`, [
        url,
        userId,
      ]);

      res.json({ imageUrl: url });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  },
);

app.use("/api", api);

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../web/dist/index.html"));
});

app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`),
);
