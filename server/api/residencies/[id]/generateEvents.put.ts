// server/api/residencies/[id]/generateEvents.put.ts
import { updateDatoRecord } from "~/server/utils/datoCmsClient";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Residency ID is required",
    });
  }

  const { generateEvents } = await readBody(event);

  try {
    // Use snake_case for the CMA API
    await updateDatoRecord("residency", id, {
      generate_events: generateEvents,
    });

    return {
      success: true,
      message: "Generate events setting updated successfully",
    };
  } catch (error) {
    console.error("Error updating generate_events:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to update generate events setting",
    });
  }
});
