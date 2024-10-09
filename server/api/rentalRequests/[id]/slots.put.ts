import { defineEventHandler, readBody, createError } from "h3";
import { buildClient, buildBlockRecord } from "@datocms/cma-client-node";

const client = buildClient({ apiToken: process.env.DATO_API_TOKEN });

export default defineEventHandler(async (event) => {
  const rentalId = event.context.params.id;
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
    const dateItemType = "cwRsY1rZSIOSbW3OskrujQ"; // Replace with your actual date block API key
    const slotItemType = "bjqdSfOJTgO3CtUSEVUrMw"; // Replace with your actual slot block API key
    const timeItemType = "MEHFH3_URbGFbkE-sRyJsA"; // Replace with your time block API key

    const transformBoolean = (value) => value === "true" || value === true;
    const parseTime = (time) => {
      if (!time) return null;
      return buildBlockRecord({
        item_type: { type: "item_type", id: timeItemType }, // Your time block ID
        time,
      });
    };

    const createSlotBlock = (slot) => {
      return buildBlockRecord({
        item_type: { type: "item_type", id: slotItemType }, // Slot block ID
        id: slot.id,
        title: slot.title,
        description: slot.description,
        event_type: slot.eventType || "", // Ensure it's a string
        expected_attendance: slot.expectedAttendance
          ? Number(slot.expectedAttendance)
          : null,
        all_ages: transformBoolean(slot.allAges),
        private: transformBoolean(slot.private),
        resources: slot.resources ? JSON.stringify(slot.resources) : "[]",
        start_time: parseTime(slot.startTime?.time),
        end_time: parseTime(slot.endTime?.time),
        load_in_time: parseTime(slot.loadInTime?.time),
        sound_check_time: parseTime(slot.soundCheckTime?.time),
        doors_time: parseTime(slot.doorsTime?.time),
        load_out_time: parseTime(slot.loadOutTime?.time),
        event_start_time: parseTime(slot.eventStartTime?.time),
        event_end_time: parseTime(slot.eventEndTime?.time),
        spans_midnight: false, // Update as needed
        approval_status: slot.approval_status || "pending",
        rooms: slot.rooms || [],
      });
    };

    const createDateBlock = (date) => {
      return buildBlockRecord({
        item_type: { type: "item_type", id: dateItemType },
        id: date.id, // Include date ID
        date: date.date,
        slots: date.slots.map(createSlotBlock),
      });
    };

    const updatedDates = body.dates.map(createDateBlock);

    // Prepare the update payload
    const updatePayload = {
      dates: updatedDates,
    };

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
