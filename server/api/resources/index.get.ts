import { getAdditionalCostModel } from "pricing-lib";
import mongoose from "mongoose";

export default defineEventHandler(async (event) => {
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(
    event,
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  setHeader(
    event,
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (event.req.method === "OPTIONS") {
    event.res.statusCode = 204;
    event.res.end();
    return;
  }
  await ensureConnection();

  const AdditionalCosts = getAdditionalCostModel(mongoose);

  try {
    const result = await AdditionalCosts.findOne({}).lean();
    if (!result || !result.resources) {
      throw createError({
        statusCode: 404,
        statusMessage: "Resources not found",
      });
    }

    return {
      resources: result.resources, // No need to transform the data
    };
  } catch (error) {
    console.error("Error fetching resources:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error fetching resources",
    });
  }
});
