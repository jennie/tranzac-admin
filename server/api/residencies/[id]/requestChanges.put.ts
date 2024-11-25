import { defineEventHandler, readBody } from "h3";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params;
    const { recipientEmails, note, residencyTitle, commsManagerName } =
      await readBody(event);

    if (
      !id ||
      !recipientEmails?.length ||
      !note ||
      !residencyTitle ||
      !commsManagerName
    ) {
      return {
        statusCode: 400,
        body: { error: "Missing required parameters" },
      };
    }

    const emailContent = `
      <p>Dear Resident,</p>
      <p>We have reviewed your residency request titled "<strong>${residencyTitle}</strong>" and have some feedback for you to address before we can proceed:</p>
      <blockquote>${note}</blockquote>
      <p>If you have any questions or require clarification, feel free to reach out.</p>
      <p>Thank you!<br>${commsManagerName}<br>Communications Manager, Tranzac</p>
    `;

    // Send email to each recipient
    try {
      const emailPromises = recipientEmails.map((recipientEmail) => {
        const msg = {
          to: recipientEmail,
          from: "comms@tranzac.org",
          subject: `Changes Requested: ${residencyTitle}`,
          html: emailContent,
        };
        return sgMail.send(msg);
      });

      await Promise.all(emailPromises);

      return {
        success: true,
        message: "Change request emails sent successfully",
      };
    } catch (error) {
      console.error("Failed to send email:", error);
      return {
        success: false,
        message: "Failed to send change request email",
      };
    }
  } catch (error) {
    console.error("Error in request-changes endpoint:", error);
    return {
      success: false,
      message: "An error occurred while sending the change request email",
    };
  }
});
