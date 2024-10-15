import {
  format,
  parse,
  isValid,
  parseISO,
  setMilliseconds,
  setSeconds,
  setMinutes,
  setHours,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";

const timeZone = "America/Toronto";

export const formatCurrency = (value) => {
  if (typeof value !== "number") {
    return "N/A";
  }
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value);
};

export function formatDescription(
  hours,
  price,
  rateType,
  period,
  roomName = ""
) {
  const formattedPrice = formatCurrency(price);
  if (rateType === "flat") {
    return `${period} (flat rate: ${formattedPrice})`;
  }
  return `${hours}h ${period} @ ${formattedPrice}${
    rateType === "hourly" ? "/hour" : ""
  }`;
}

const format12Hour = (time) => {
  if (!time) return "";
  try {
    let parsedTime;
    if (time.includes("T")) {
      parsedTime = toZonedTime(parseISO(time), timeZone);
    } else {
      parsedTime = toZonedTime(parse(time, "HH:mm", new Date()), timeZone);
    }
    if (isValid(parsedTime)) {
      return format(parsedTime, "h:mm a");
    }
  } catch (error) {
    console.error(`Error formatting time: ${time}`, error);
  }
  return "";
};

export const formatTimeRangeReadable = (startTime, endTime) => {
  const formattedStart = format12Hour(startTime);
  const formattedEnd = format12Hour(endTime);
  return `${formattedStart} - ${formattedEnd}`;
};

export const formatDate = (date, formatString = "MMMM dd, yyyy", timeZone) => {
  const zonedDate = toZonedTime(new Date(date), timeZone); // Convert to Toronto time zone
  return format(zonedDate, formatString);
};

export const formatTime = (time) => {
  if (!time) return "";
  try {
    let timeString = typeof time === "object" && time.time ? time.time : time;
    if (typeof timeString !== "string") {
      console.warn(`Unexpected time format:`, time);
      return "";
    }

    let parsedTime;
    if (timeString.includes("T")) {
      parsedTime = toZonedTime(new Date(timeString), timeZone);
    } else {
      parsedTime = toZonedTime(
        parse(timeString, "HH:mm", new Date()),
        timeZone
      );
    }

    if (!isValid(parsedTime)) {
      console.warn(`Invalid time value:`, time);
      return "";
    }

    return format(parsedTime, "HH:mm");
  } catch (error) {
    console.error(`Error formatting time:`, time, error);
    return "";
  }
};

export const formatTimeRange = (start, end) => {
  try {
    const startDate = toZonedTime(new Date(start), timeZone);
    const endDate = toZonedTime(new Date(end), timeZone);

    const startTime = format(startDate, "h:mm a");
    const endTime = format(endDate, "h:mm a");

    return `${startTime} - ${endTime}`;
  } catch (error) {
    console.error("Error formatting time range:", start, end, error);
    return "";
  }
};

export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  try {
    const dateTime = toZonedTime(parseISO(dateTimeString), timeZone);
    if (!isValid(dateTime)) {
      console.warn(`Invalid date-time string: ${dateTimeString}`);
      return "Invalid date-time";
    }
    return format(dateTime, "MMMM d, yyyy h:mm a");
  } catch (error) {
    console.error(`Error formatting date-time: ${dateTimeString}`, error);
    return "Invalid date-time";
  }
};
