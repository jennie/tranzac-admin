// server/api/residencies/[id]/approveAndPublish.put.ts
import { getDatoClient } from "~/server/utils/datoCmsClient";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Residency ID is required",
    });
  }

  const client = getDatoClient();

  try {
    await client.items.update(id, {
      workflow_status: "approved",
    });

    await client.items.publish(id);

    return {
      success: true,
      message: "Residency approved and published successfully",
    };
  } catch (error) {
    console.error("Error in approveAndPublish:", error);

    if (error.message?.includes("publish")) {
      try {
        await client.items.update(id, {
          workflow_status: "pending_review",
        });
      } catch (revertError) {
        console.error("Failed to revert status:", revertError);
      }
    }

    throw createError({
      statusCode: 500,
      message: error.message || "Failed to approve and publish residency",
    });
  }
});
