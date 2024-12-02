import { toZonedTime, format } from "date-fns-tz";
import { isToday, isTomorrow, parseISO } from "date-fns";

export const useWorkflowDate = () => {
  const formatDateHeader = (date: string | Date) => {
    if (!date) return "—";
    try {
      const parsedDate = typeof date === "string" ? parseISO(date) : date;
      const zonedDate = toZonedTime(parsedDate, "America/Toronto");

      if (isToday(zonedDate)) {
        return "Today";
      } else if (isTomorrow(zonedDate)) {
        return "Tomorrow";
      } else {
        return format(zonedDate, "EEEE, MMMM d", {
          timeZone: "America/Toronto",
        });
      }
    } catch (e) {
      console.error("Error formatting date:", e);
      return "—";
    }
  };

  const formatDate = (date: string | Date) => {
    if (!date) return "—";
    try {
      const parsedDate = typeof date === "string" ? parseISO(date) : date;
      const zonedDate = toZonedTime(parsedDate, "America/Toronto");
      return format(zonedDate, "MMM d, yyyy", { timeZone: "America/Toronto" });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "—";
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const zonedStart = toZonedTime(start, "America/Toronto");
      const zonedEnd = toZonedTime(end, "America/Toronto");

      // If same day, only show one date
      if (format(zonedStart, "yyyy-MM-dd") === format(zonedEnd, "yyyy-MM-dd")) {
        return format(zonedStart, "MMM d, yyyy");
      }

      // If same year, don't repeat year
      if (format(zonedStart, "yyyy") === format(zonedEnd, "yyyy")) {
        return `${format(zonedStart, "MMM d")} - ${format(
          zonedEnd,
          "MMM d, yyyy"
        )}`;
      }

      // Different years, show full dates
      return `${format(zonedStart, "MMM d, yyyy")} - ${format(
        zonedEnd,
        "MMM d, yyyy"
      )}`;
    } catch (e) {
      console.error("Error formatting date range:", e);
      return "Invalid Date Range";
    }
  };
  const formatTime = (dateString) => {
    try {
      return format(parseISO(dateString), "h:mm a");
    } catch (error) {
      return "Invalid Time";
    }
  };
  return {
    formatDateHeader,
    formatDate,
    formatDateRange,
    formatTime,
  };
};
