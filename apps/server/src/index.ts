import express, { type Request, type Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { Pool } from "pg";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

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

app.use("/api", api);

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../web/dist/index.html"));
});

app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`),
);
