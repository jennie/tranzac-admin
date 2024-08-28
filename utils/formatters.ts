// utils/formatters.js

import { format, parse, isValid, parseISO } from "date-fns";

export const formatCurrency = (amount) => {
  return `$${amount.toFixed(0)}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = parse(dateString, "yyyy-MM-dd", new Date());
    return format(date, "EEEE, MMMM d, yyyy");
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return "Invalid date";
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

export const formatTimeRange = (startTime, endTime) => {
  const formattedStart = formatTime(startTime);
  const formattedEnd = formatTime(endTime);
  return `${formattedStart} - ${formattedEnd}`;
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
