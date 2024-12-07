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

  // Transform custom dates
  const transformedCustomDates = (custom_dates || []).map((date) => {
    if (!date.date || isNaN(new Date(date.date).getTime())) {
      throw new Error(`Invalid date value: ${date.date}`);
    }
    return buildBlockRecord({
      item_type: { type: "item_type", id: "TiqBomdjSXabcXlo6MFsOg" },
      start_datetime: new Date(date.date).toISOString(),
      end_datetime: new Date(date.date).toISOString(),
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
          time: "00:00",
        }),
        end_time: buildBlockRecord({
          item_type: { type: "item_type", id: "MEHFH3_URbGFbkE-sRyJsA" },
          time: "23:59",
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
      generate_events: true, // Enable event generation
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
