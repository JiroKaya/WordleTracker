import dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

interface WordleData {
  id: number;
  solution: string;
  print_date: string;
  days_since_launch: number;
  editor: string;
}

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function generateTodayWord() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  console.log(`📅 Checking Wordle for ${today}...`);

  const url = `https://www.nytimes.com/svc/wordle/v2/${today}.json`;

  let data: WordleData;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
    data = (await res.json()) as WordleData;
  } catch (err) {
    console.error("❌ Failed to fetch NYT Wordle:", err);
    return;
  }

  const { id, solution, print_date, days_since_launch, editor } = data;

  try {
    const { rowCount } = await db.query(
      `SELECT 1 FROM daily_words WHERE wordle_id = $1 LIMIT 1`,
      [id],
    );

    if ((rowCount ?? 0) > 0) {
      console.log(
        `✅ Wordle #${id} already exists (${print_date}) — skipping.`,
      );
      return;
    }

    await db.query(
      `INSERT INTO daily_words (wordle_id, solution, date, editor, days_since_launch)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, solution, print_date, editor, days_since_launch ?? null],
    );

    console.log(`🎉 Inserted Wordle #${id} (${solution}) for ${print_date}`);
  } catch (err) {
    console.error("❌ Failed to insert Wordle into DB:", err);
  } finally {
    await db.end(); // Clean shutdown
  }
}

generateTodayWord()
  .then(() => console.log("🏁 Done."))
  .catch(async (err) => {
    console.error("Unexpected error:", err);
    await db.end(); // Ensure db closes even on unexpected error
  });
