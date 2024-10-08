// utils/formatters.js

import { format, parse, isValid, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export const formatCurrency = (value: number | undefined | null): string => {
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
      parsedTime = parseISO(time);
    } else {
      parsedTime = parse(time, "HH:mm", new Date());
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
export const formatDate = (dateString) => {
  if (!dateString) return "Invalid Date";
  const date = parseISO(dateString);
  if (!isValid(date)) return "Invalid Date";
  try {
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid Date";
  }
};

export const formatTime = (time) => {
  if (!time) return "";
  try {
    let parsedTime;
    if (time.includes("T")) {
      parsedTime = parseISO(time);
    } else {
      parsedTime = parse(time, "HH:mm", new Date());
    }
    if (!isValid(parsedTime)) {
      console.warn(`Invalid time value: ${time}`);
      return "";
    }
    return format(parsedTime, "h:mm a");
  } catch (error) {
    console.error(`Error formatting time: ${time}`, error);
    return "";
  }
};

export const formatTimeRange = (start, end) => {
  const timeZone = "America/Toronto"; // Replace with your desired timezone
  try {
    const startDate = toZonedTime(new Date(start), timeZone);
    const endDate = toZonedTime(new Date(end), timeZone);

    const startTime = format(startDate, "h:mm a", { timeZone });
    const endTime = format(endDate, "h:mm a", { timeZone });

    return `${startTime} - ${endTime}`;
  } catch (error) {
    console.error("Error formatting time range:", start, end, error);
    return "";
  }
};

export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return "";
  try {
    const dateTime = parseISO(dateTimeString);
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
