export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  try {
    const sgRequest = await $fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    return sgRequest;
  } catch (error) {
    console.error("Error sending email via SendGrid:", error);
    // Include detailed error information in the response
    return {
      statusCode: error.response?.status || 500,
      message: error.response?.data?.errors || error.message,
    };
  }
});
