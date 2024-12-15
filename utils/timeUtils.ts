// /utils/timeUtils.ts
import { format, addMinutes, startOfDay } from "date-fns";

export const parseTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":");
  const now = new Date();
  now.setHours(parseInt(hours, 10));
  now.setMinutes(parseInt(minutes, 10));
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now;
};

// export const generateTimeOptions = (slot) => {
//   const options = [];

//   // Parse the start and end times
//   const start = parse(slot.startTime?.time || "12:00", "HH:mm", new Date());
//   const end = parse(slot.endTime?.time || "14:00", "HH:mm", new Date());

//   console.log("Start:", start, "End:", end); // Log for debugging

//   // Validate start and end times
//   if (!isValid(start) || !isValid(end)) {
//     console.warn("Invalid times detected:", start, end); // Log for debugging
//     return options;
//   }

//   // Calculate the last available time, 30 minutes before `end`
//   const lastAvailableTime = addMinutes(end, -30);

//   // Generate time options at 30-minute intervals
//   let current = start;
//   while (
//     isBefore(current, lastAvailableTime) ||
//     current.getTime() === lastAvailableTime.getTime()
//   ) {
//     const formattedTime = format(current, "HH:mm");
//     const displayTime = format(current, "h:mm a");

//     options.push({
//       label: displayTime,
//       value: formattedTime,
//     });

//     current = addMinutes(current, 30);
//   }

//   console.log("Generated Time Options:", options); // Log the final options
//   return options;
// };

export const generateTimeOptions = () => {
  const options = [];
  const start = new Date();
  start.setHours(12, 0, 0, 0); // Start at 12:00 PM

  // Generate time options from 12:00 PM to 2:00 AM the next day at 30-minute intervals
  let current = start;
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setHours(2, 0, 0, 0); // End at 2:00 AM the next day

  while (current <= end) {
    const formattedTime = format(current, "HH:mm");
    const displayTime = format(current, "h:mm a");
    const isNextDay = current.getDate() !== start.getDate();

    options.push({
      label: displayTime + (isNextDay ? " (next day)" : ""),
      value: formattedTime,
    });

    current = addMinutes(current, 30);
  }

  return options;
};
