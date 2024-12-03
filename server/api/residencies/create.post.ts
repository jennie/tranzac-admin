import { getDatoClient } from "~/server/utils/datoCmsClient";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const client = getDatoClient();

  try {
    const newResidency = await client.items.create({
      item_type: { id: "QjDbKyD5S0awBx6jliPMOA" },
      ...body,
    });

    return {
      success: true,
      message: "Residency created successfully",
      data: newResidency,
    };
  } catch (error) {
    console.error("Error in createResidency:", error);

    throw createError({
      statusCode: 500,
      message: error.message || "Failed to create residency",
    });
  }
});
