// server/api/residencies/[id]/notify-members.post.ts
import { defineEventHandler, readBody } from "h3";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.params;
    const { type, residencyTitle } = await readBody(event);

    // Fetch member emails for this residency
    const { data: memberData } = await $fetch(
      `/api/members/byResidencyId/${id}`
    );

    if (!memberData?.members?.length) {
      throw createError({
        statusCode: 400,
        message: "No members found for this residency",
      });
    }

    const recipientEmails = memberData.members.map((m) => m.email);

    // Configure email content based on notification type
    let emailContent = "";
    let emailSubject = "";

    if (type === "ready_for_input") {
      emailSubject = `Action Required: Complete Your Residency Details - ${residencyTitle}`;
      emailContent = `
        <p>Dear Resident,</p>
        <p>Your residency application "<strong>${residencyTitle}</strong>" has been set up in our system. You can now log in to provide additional details and complete your application.</p>
        <p>Please visit <a href="${process.env.PUBLIC_URL}/residencies/${id}">your residency page</a> to:</p>
        <ul>
          <li>Add a description of your residency</li>
          <li>Upload photos and media</li>
          <li>Set your schedule preferences</li>
          <li>Provide any additional information</li>
        </ul>
        <p>Once you've completed these details, you can submit your application for review.</p>
        <p>Thank you for being part of our community!</p>
        <p>Best regards,<br>The Tranzac Team</p>
      `;
    } else {
      throw createError({
        statusCode: 400,
        message: "Invalid notification type",
      });
    }

    // Send emails to all members
    const emailPromises = recipientEmails.map((email) => {
      const msg = {
        to: email,
        from: "comms@tranzac.org",
        subject: emailSubject,
        html: emailContent,
      };
      return sgMail.send(msg);
    });

    await Promise.all(emailPromises);

    return {
      success: true,
      message: "Notifications sent successfully",
    };
  } catch (error) {
    console.error("Error in notify-members endpoint:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to send notifications",
    });
  }
});
