import { getAdditionalCostModel } from "@tranzac/pricing-lib";
import { ensureConnection } from "../../utils/mongoose";
import { defineEventHandler, createError } from "h3";

export default defineEventHandler(async (event) => {
  // Ensure the database connection
  const connection = await ensureConnection();
  const AdditionalCosts = await getAdditionalCostModel(connection);
  console.log("ARE WE HERE");
  try {
    // Fetch the additional costs/resources
    const result = await AdditionalCosts.findOne({}).lean();
    console.log("result", result);
    if (!result || !result.resources) {
      throw createError({
        statusCode: 404,
        statusMessage: "Resources not found",
      });
    }

    // Return the resources found
    return {
      resources: result.resources,
    };
  } catch (error) {
    // Log the error with its stack trace for easier debugging
    console.error("Error fetching resources:", error);
    console.error(error.stack);

    // Throw a 500 error if something goes wrong
    throw createError({
      statusCode: 500,
      statusMessage: "Error fetching resources",
    });
  }
});
