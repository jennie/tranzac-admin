// server/api/residencies/[id]/status.put.ts
import { updateDatoRecord } from "~/utils/datoCmsClient";
import { sendNotificationEmail } from "~/server/utils/emailService";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
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
    } else if (status === "changes_requested" && note) {
      await sendNotificationEmail({
        type: "changes_requested",
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
