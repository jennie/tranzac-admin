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
import { format, isValid, parseISO } from "date-fns";

export const formatDate = (dateInput) => {
  if (!dateInput) return;

  let date;

  // If it's already a Date object, use it directly
  if (dateInput instanceof Date) {
    date = dateInput;
  }
  // If it's a string, try to parse it as ISO format
  else if (typeof dateInput === "string") {
    date = parseISO(dateInput);
  }
  // Handle any other types of date inputs (e.g., timestamps)
  else {
    date = new Date(dateInput);
  }

  // Check if the parsed date is valid
  if (!isValid(date)) return;

  try {
    // Format the date as "MMMM d, yyyy" (e.g., "October 10, 2023")
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", dateInput, error);
    return;
  }
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
      // ISO string format
      parsedTime = new Date(timeString);
    } else {
      // HH:mm format
      parsedTime = parse(timeString, "HH:mm", new Date());
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
