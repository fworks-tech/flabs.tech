import { logger } from "@/lib/logger";

export function formatDate(date: string, includeRelative = false) {
  if (typeof date !== "string" || !date) {
    logger.warn({ date }, "invalid date argument in formatDate");
    return "Invalid date";
  }

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
