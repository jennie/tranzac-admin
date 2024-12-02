// server/api/residencies/[id]/status.put.ts
import { updateDatoRecord } from "~/server/utils/datoCmsClient";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Residency ID is required",
    });
  }
  const { status } = await readBody(event);

  try {
    // Update status in DatoCMS
    await updateDatoRecord("residency", id, {
      workflow_status: status,
    });

    return {
      success: true,
      message: "Status updated successfully",
    };
  } catch (error) {
    console.error("Error updating status:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to update status",
    });
  }
});
