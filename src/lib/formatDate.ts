import { logger } from "@/lib/logger";

/**
 * Formats an ISO date string into a human-readable format.
 *
 * When `includeRelative` is `true`, appends a relative time label (e.g.
 * `"3d ago"`, `"2mo ago"`, `"just now"`). When `false`, returns only the
 * full date (e.g. `"June 26, 2026"`).
 *
 * @param date - ISO date string (e.g. `"2026-06-26"` or `"2026-06-26T12:00:00"`)
 * @param includeRelative - Whether to append a relative time suffix
 * @returns Formatted date string, or `"Invalid date"` if parsing fails
 */
export function formatDate(date: string, includeRelative = false) {
  const currentDate = new Date();

  const normalizedDate = !date.includes("T") ? `${date}T00:00:00` : date;
  const targetDate = new Date(normalizedDate);

  if (isNaN(targetDate.getTime())) {
    logger.warn({ date, normalizedDate }, "invalid date in formatDate");
    return "Invalid date";
  }

  const timeDifference = currentDate.getTime() - targetDate.getTime();
  const daysAgo = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hoursAgo = Math.floor(timeDifference / (1000 * 60 * 60));
  const minutesAgo = Math.floor(timeDifference / (1000 * 60));
  const secondsAgo = Math.floor(timeDifference / 1000);

  let formattedDate = "";

  if (daysAgo >= 365) {
    formattedDate = `${Math.floor(daysAgo / 365)}y ago`;
  } else if (daysAgo >= 30) {
    formattedDate = `${Math.floor(daysAgo / 30)}mo ago`;
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`;
  } else if (hoursAgo > 0) {
    formattedDate = `${hoursAgo}h ago`;
  } else if (minutesAgo > 0) {
    formattedDate = `${minutesAgo}m ago`;
  } else {
    formattedDate = "just now";
  }

  const fullDate = targetDate.toLocaleString("en-us", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (!includeRelative) {
    return fullDate;
  }

  return `${fullDate} (${formattedDate})`;
}
