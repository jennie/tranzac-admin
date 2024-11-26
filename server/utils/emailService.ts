// server/utils/emailService.ts
import type { Residency } from "~/types/residency";

interface EmailNotificationOptions {
  type: "residency_approved" | "resident_action_required" | "status_update";
  residencyId: string;
  recipientEmails?: string[];
  note?: string;
  commsManagerName?: string;
}

interface SendGridMessage {
  to: string[];
  from: string;
  subject: string;
  html: string;
}

export const sendEmail = async (message: SendGridMessage) => {
  try {
    const response = await $fetch("/api/sendgrid", {
      method: "POST",
      body: {
        personalizations: [
          {
            to: message.to.map((email) => ({ email })),
          },
        ],
        from: { email: message.from },
        subject: message.subject,
        content: [
          {
            type: "text/html",
            value: message.html,
          },
        ],
      },
    });

    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export const sendNotificationEmail = async (
  options: EmailNotificationOptions
) => {
  // Fetch residency details
  const client = getDatoClient();
  const residency = (await client.items.find(options.residencyId)) as Residency;

  let emailContent: string;
  let subject: string;

  switch (options.type) {
    case "residency_approved":
      subject = `Residency Approved: ${residency.title}`;
      emailContent = `
        <p>Congratulations! Your residency "${residency.title}" has been approved.</p>
        <p>You can now proceed with publishing your events.</p>
        <p>Please log in to your dashboard to continue.</p>
      `;
      break;

    case "resident_action_required":
      subject = `Changes Requested: ${residency.title}`;
      emailContent = `
        <p>Your residency "${residency.title}" requires some changes:</p>
        <blockquote>${options.note}</blockquote>
        <p>Please log in to your dashboard to review and address the requested changes.</p>
        <p>Best regards,<br>${options.commsManagerName}<br>Communications Manager</p>
      `;
      break;

    case "status_update":
      subject = `Status Update: ${residency.title}`;
      emailContent = `
        <p>The status of your residency "${residency.title}" has been updated to: ${residency.activeStatus}</p>
        <p>Please log in to your dashboard for more details.</p>
      `;
      break;

    default:
      throw new Error("Invalid notification type");
  }

  if (!options.recipientEmails?.length) {
    throw new Error("No recipient emails provided");
  }

  return sendEmail({
    to: options.recipientEmails,
    from: "comms@tranzac.org",
    subject,
    html: emailContent,
  });
};
