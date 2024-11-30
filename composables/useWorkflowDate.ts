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

  return {
    formatDateHeader,
    formatDate,
  };
};
