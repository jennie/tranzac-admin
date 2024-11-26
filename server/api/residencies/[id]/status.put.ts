// server/api/residencies/[id]/status.put.ts
import { updateDatoRecord } from "~/server/utils/datoCmsClient";
import { sendNotificationEmail } from "~/server/utils/emailService";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Residency ID is required",
    });
  }
  const { status, note, recipientEmails, commsManagerName } = await readBody(
    event
  );

  try {
    // Update status in DatoCMS
    await updateDatoRecord("residency", id, {
      activeStatus: status,
    });

    // Send appropriate notifications based on status
    if (status === "approved") {
      await sendNotificationEmail({
        type: "residency_approved",
        residencyId: id,
        recipientEmails,
      });
    } else if (status === "resident_action_required" && note) {
      await sendNotificationEmail({
        type: "resident_action_required",
        residencyId: id,
        recipientEmails,
        note,
        commsManagerName,
      });
    } else {
      await sendNotificationEmail({
        type: "status_update",
        residencyId: id,
        recipientEmails,
      });
    }

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
