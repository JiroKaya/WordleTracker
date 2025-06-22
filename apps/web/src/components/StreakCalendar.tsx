import React, { useMemo, useState } from "react";
import {
  addMonths,
  format,
  getDay,
  getDaysInMonth,
  startOfMonth,
  subMonths,
  isToday,
  parseISO,
  addDays,
} from "date-fns";
import clsx from "clsx";

export interface Play {
  /** ISO date e.g. "2025-06-22" */
  played_on: string;
  won: boolean;
}

interface Props {
  plays: Play[];
  /** Tailwind size utility – e.g. "w-8" => 2 rem square */
  squareSize?: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const StreakCalendar: React.FC<Props> = ({
  plays,
  squareSize = "w-12", // default 2 rem
}) => {
  const [viewDate, setViewDate] = useState(() => new Date());

  /** ----- FAST LOOKUP MAP WITHOUT PARSING DATES ----- **/
  const playMap = useMemo(() => {
    const m = new Map<string, boolean>();
    plays.forEach(({ played_on, won }) => {
      const parsed = addDays(parseISO(played_on), 1); // safely parses full datetime
      const key = format(parsed, "yyyy-MM-dd"); // formats to local date string
      m.set(key, won);
    });
    return m;
  }, [plays]);

  /** ----- BUILD CALENDAR GRID FOR THE MONTH ----- **/
  const cells = useMemo(() => {
    const start = startOfMonth(viewDate);
    const daysInMonth = getDaysInMonth(viewDate);
    // Adjust so Monday is 0, Sunday is 6
    const jsDay = getDay(start); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const padStart = jsDay === 0 ? 6 : jsDay - 1; // 0 = Mon, 6 = Sun
    const total = Math.ceil((padStart + daysInMonth) / 7) * 7;

    return Array.from({ length: total }, (_, i) => {
      const offset = i - padStart + 1;
      return offset > 0 && offset <= daysInMonth
        ? new Date(start.getFullYear(), start.getMonth(), offset)
        : null;
    });
  }, [viewDate]);

  /** ----- STYLES FOR EACH CELL ----- **/
  const dayClasses = (d: Date | null) => {
    if (!d) return "opacity-0";

    const key = format(d, "yyyy-MM-dd");
    const won = playMap.get(key);

    return clsx(
      "aspect-square rounded flex items-center justify-center text-xs font-semibold transition",
      squareSize,
      isToday(d) && "ring-2 ring-blue-400",
      won === true && "bg-emerald-500 text-white",
      won === false && "bg-rose-500 text-white",
      won === undefined && "bg-gray-800 text-muted-foreground",
      "hover:ring hover:ring-blue-300/40 focus-visible:ring",
    );
  };

  return (
    <div className="max-w-lg sm:max-w-xl mx-auto text-gray-800 dark:text-gray-100">
      {/* MONTH SWITCHER */}
      <header className="flex items-center justify-between mb-3">
        <button
          aria-label="Previous month"
          onClick={() => setViewDate((d) => subMonths(d, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus-visible:ring"
        >
          &lt;
        </button>

        <h2 className="font-medium tracking-wide">
          {format(viewDate, "MMMM yyyy")}
        </h2>

        <button
          aria-label="Next month"
          onClick={() => setViewDate((d) => addMonths(d, 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus-visible:ring"
        >
          &gt;
        </button>
      </header>

      {/* WEEKDAYS HEADER */}
      <div className="grid grid-cols-7 text-[0.65rem] font-medium text-center gap-1 pb-1 border-b border-gray-200 dark:border-gray-700">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 gap-1 pt-2 pb-3">
        {cells.map((d, i) => (
          <div
            key={i}
            className={dayClasses(d)}
            title={d ? format(d, "yyyy-MM-dd") : ""}
          >
            {d && d.getDate()}
          </div>
        ))}
      </div>

      {/* LEGEND */}
      <footer className="flex items-center justify-between gap-4 text-xs pt-3 border-t border-gray-200 dark:border-gray-700">
        <Legend color="bg-emerald-500" label="win" />
        <Legend color="bg-rose-500" label="loss" />
        <Legend color="bg-gray-700" label="no game" />
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded ring-2 ring-blue-400" />
          today
        </div>
      </footer>
    </div>
  );
};

const Legend: React.FC<{ color: string; label: string }> = ({
  color,
  label,
}) => (
  <div className="flex items-center gap-1 capitalize">
    <span className={`inline-block w-3 h-3 rounded ${color}`} />
    {label}
  </div>
);

export default StreakCalendar;
