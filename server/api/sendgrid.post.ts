// server/api/sendgrid.post.ts
interface SendGridRequestBody {
  personalizations: Array<{
    to: Array<{ email: string }>;
  }>;
  from: { email: string };
  subject: string;
  content: Array<{
    type: string;
    value: string;
  }>;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<SendGridRequestBody>(event);

  // Validate request body
  if (
    !body.personalizations?.[0]?.to?.length ||
    !body.from?.email ||
    !body.subject ||
    !body.content?.[0]?.value
  ) {
    throw createError({
      statusCode: 400,
      message: "Invalid request body: missing required fields",
    });
  }

  try {
    const response = await $fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("Error sending email via SendGrid:", error);

    throw createError({
      statusCode: error.response?.status || 500,
      message: error.response?.data?.errors?.[0]?.message || error.message,
      data: error.response?.data,
    });
  }
});
