// server/api/costEstimates/[id].js

import { CostEstimate } from "~/server/models/costEstimate.schema";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  await ensureConnection();

  const id = event.context.params.id;

  try {
    const costEstimate = await CostEstimate.findOne({ rentalRequestId: id });

    if (!costEstimate) {
      return createError({
        statusCode: 404,
        statusMessage: "Cost estimate not found",
      });
    }

    return {
      versions: costEstimate.versions.map((version) => ({
        version: version.version,
        totalCost: version.totalCost,
        createdAt: version.createdAt,
      })),
      currentVersion: costEstimate.currentVersion,
    };
  } catch (error) {
    console.error("Error fetching cost estimate versions:", error);
    return createError({
      statusCode: 500,
      statusMessage: "Error fetching cost estimate versions",
    });
  }
});
