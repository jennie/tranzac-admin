import { defineEventHandler, readBody, createError } from "h3";
import { buildClient, buildBlockRecord } from "@datocms/cma-client-node";

const client = buildClient({ apiToken: process.env.DATO_API_TOKEN || "" });
import { parse, isValid, format } from "date-fns";

export default defineEventHandler(async (event) => {
  const rentalId = event.context.params?.id;
  if (!rentalId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid request: rental ID is missing",
    });
  }

  const body = await readBody(event);

  if (!body || !body.dates || !Array.isArray(body.dates)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Invalid request body: expected an object with a 'dates' array",
    });
  }

  try {
    // Fetch the current rental with nested items
    const rental = await client.items.find(rentalId, { nested: true });

    // Define the item types for dates and slots
    const dateItemType = "cwRsY1rZSIOSbW3OskrujQ";
    const slotItemType = "bjqdSfOJTgO3CtUSEVUrMw";
    const timeItemType = "MEHFH3_URbGFbkE-sRyJsA";

    const transformBoolean = (value) => value === "true" || value === true;
    const formatTime = (time) => {
      if (!time) return "";
      try {
        let parsedTime;
        if (typeof time === "string") {
          if (time.includes("T")) {
            // ISO string format
            parsedTime = new Date(time);
          } else {
            // HH:mm format
            parsedTime = parse(time, "HH:mm", new Date());
          }
        } else if (time instanceof Date) {
          parsedTime = time;
        } else if (typeof time === "object" && time.time) {
          // Handle case where time is an object with a 'time' property
          parsedTime = new Date(time.time);
        } else {
          console.warn(`Unexpected time format:`, time);
          return "";
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

    const parseTime = (time) => {
      if (!time) return null;
      const formattedTime = formatTime(time);
      if (!formattedTime) return null;
      return buildBlockRecord({
        item_type: { type: "item_type", id: timeItemType },
        time: formattedTime,
      });
    };

    const createSlotBlock = (slot) => {
      const blockData = {
        type: "item",
        attributes: {
          title: slot.title || "",
          description: slot.description || "",
          event_type: slot.eventType || "",
          expected_attendance: slot.expectedAttendance
            ? Number(slot.expectedAttendance)
            : null,
          all_ages: transformBoolean(slot.allAges),
          private: transformBoolean(slot.private),
          resources: slot.resources ? JSON.stringify(slot.resources) : "[]",
          start_time: parseTime(slot.startTime) || parseTime("00:00"), // Default to midnight if not set
          end_time: parseTime(slot.endTime) || parseTime("23:59"), // Default to end of day if not set
          load_in_time: parseTime(slot.loadInTime),
          sound_check_time: parseTime(slot.soundCheckTime),
          doors_time: parseTime(slot.doorsTime),
          load_out_time: parseTime(slot.loadOutTime),
          event_start_time: parseTime(slot.eventStartTime),
          event_end_time: parseTime(slot.eventEndTime),
          approval_status: slot.approval_status || "pending",
          rooms: slot.rooms || [],
        },
        relationships: {
          item_type: {
            data: {
              id: slotItemType,
              type: "item_type",
            },
          },
        },
      };

      return blockData;
    };

    const createDateBlock = (date) => {
      console.log("Creating date block for:", date);
      const blockData = {
        type: "item",
        attributes: {
          date: date.date, // Corrected to access date.date
          slots: Array.isArray(date.slots)
            ? date.slots.map(createSlotBlock)
            : [],
        },
        relationships: {
          item_type: {
            data: {
              id: dateItemType,
              type: "item_type",
            },
          },
        },
      };

      if (date.id && !date.isNew) {
        blockData.id = date.id;
      }

      return blockData;
    };

    // Corrected code: Only map createDateBlock once
    const updatedDates = body.dates.map(createDateBlock);

    const updatePayload = {
      dates: updatedDates,
    };

    console.log(
      "Payload being sent to DatoCMS:",
      JSON.stringify(updatePayload, null, 2)
    );

    // Update the rental item
    const updatedRental = await client.items.update(rentalId, updatePayload);

    console.log(
      "Rental updated successfully:",
      JSON.stringify(updatedRental, null, 2)
    );

    return {
      statusCode: 200,
      body: updatedRental,
    };
  } catch (error) {
    console.error("Error updating event slots:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to update event slots: " + error.message,
    });
  }
});
