import { getDatoClient } from "~/server/utils/datoCmsClient";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("Received body:", JSON.stringify(body, null, 2));
  const client = getDatoClient();

  // Remove the recurrences attribute from the body
  const { recurrences, rooms, custom_dates, ...filteredBody } = body;

  // Transform rooms to be an array of strings containing only the value properties
  const transformedRooms = rooms.map((room) => room.value);

  // Ensure custom_dates are correctly formatted as block records objects
  const transformedCustomDates = custom_dates.map((date) => {
    if (
      !date.start_datetime ||
      isNaN(new Date(date.start_datetime).getTime())
    ) {
      throw new Error(`Invalid start date value: ${date.start_datetime}`);
    }
    if (!date.end_datetime || isNaN(new Date(date.end_datetime).getTime())) {
      throw new Error(`Invalid end date value: ${date.end_datetime}`);
    }
    return {
      type: "item",
      attributes: {
        start_datetime: new Date(date.start_datetime).toISOString(),
        end_datetime: new Date(date.end_datetime).toISOString(),
      },
      relationships: {
        item_type: {
          data: {
            type: "item_type",
            id: "TiqBomdjSXabcXlo6MFsOg",
          },
        },
      },
    };
  });

  // Ensure recurrences are correctly formatted
  const transformedRecurrences = recurrences
    .filter((r) => r !== null)
    .map((recurrence) => ({
      item_type: { type: "item_type", id: "ItuPaIW2SU2WmTCIJ2i0lA" },
      ...recurrence,
    }));

  console.log(
    "Filtered body (without recurrences):",
    JSON.stringify(filteredBody, null, 2)
  );
  console.log("Transformed rooms:", JSON.stringify(transformedRooms, null, 2));
  console.log(
    "Transformed custom dates:",
    JSON.stringify(transformedCustomDates, null, 2)
  );
  console.log(
    "Transformed recurrences:",
    JSON.stringify(transformedRecurrences, null, 2)
  );

  try {
    const newResidency = await client.items.create({
      item_type: { type: "item_type", id: "QjDbKyD5S0awBx6jliPMOA" },
      ...filteredBody,
      rooms: transformedRooms,
      custom_dates: transformedCustomDates,
      recurrence: transformedRecurrences,
    });
    console.log(
      "New residency created:",
      JSON.stringify(newResidency, null, 2)
    );

    return {
      success: true,
      message: "Residency created successfully",
      data: newResidency,
    };
  } catch (error) {
    console.error("Error in createResidency:", error);

    throw createError({
      statusCode: 500,
      message: error.message || "Failed to create residency",
    });
  }
});
