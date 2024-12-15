// /server/api/residencies/create.post.ts
import { buildClient, buildBlockRecord } from "@datocms/cma-client-node";
import { getDatoClient } from "~/server/utils/datoCmsClient";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("Received body:", JSON.stringify(body, null, 2));
  const client = getDatoClient();

  const { rooms, custom_dates, recurrence, ...filteredBody } = body;

  // Validate rooms
  const transformedRooms = Array.isArray(rooms) ? rooms.filter(Boolean) : [];
  if (!transformedRooms.length) {
    throw createError({
      statusCode: 400,
      message: "At least one valid room must be selected",
    });
  }

  // Transform custom dates - now using start_datetime and end_datetime directly
  const transformedCustomDates = (custom_dates || []).map((date) => {
    if (
      !date.start_datetime ||
      !date.end_datetime ||
      isNaN(new Date(date.start_datetime).getTime()) ||
      isNaN(new Date(date.end_datetime).getTime())
    ) {
      throw new Error(`Invalid date value: ${JSON.stringify(date)}`);
    }
    return buildBlockRecord({
      item_type: { type: "item_type", id: "TiqBomdjSXabcXlo6MFsOg" },
      start_datetime: date.start_datetime,
      end_datetime: date.end_datetime,
    });
  });

  // Transform recurrence rules
  const transformedRecurrence = (recurrence || [])
    .filter(
      (rule) => rule && rule.attributes && rule.attributes.recurrence_frequency
    )
    .map((rule) => {
      return buildBlockRecord({
        item_type: { type: "item_type", id: "ItuPaIW2SU2WmTCIJ2i0lA" },
        ...rule.attributes,
        start_time: buildBlockRecord({
          item_type: { type: "item_type", id: "MEHFH3_URbGFbkE-sRyJsA" },
          time: rule.attributes.start_time || "12:00",
        }),
        end_time: buildBlockRecord({
          item_type: { type: "item_type", id: "MEHFH3_URbGFbkE-sRyJsA" },
          time: rule.attributes.end_time || "23:59",
        }),
      });
    });
  console.log(
    "Transformed recurrence:",
    JSON.stringify(transformedRecurrence, null, 2)
  );

  try {
    const newResidency = await client.items.create({
      item_type: { type: "item_type", id: "QjDbKyD5S0awBx6jliPMOA" },
      ...filteredBody,
      rooms: transformedRooms,
      custom_dates: transformedCustomDates,
      recurrence: transformedRecurrence,
      generate_events: false,
    });

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
