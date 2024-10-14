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
  const start = startOfDay(new Date()); // Start at 00:00

  // Generate time options for the whole day at 30-minute intervals
  let current = start;
  const end = addMinutes(start, 24 * 60); // End of the day (24 hours)

  while (current < end) {
    const formattedTime = format(current, "HH:mm");
    const displayTime = format(current, "h:mm a");

    options.push({
      label: displayTime,
      value: formattedTime,
    });

    current = addMinutes(current, 30);
  }

  return options;
};
