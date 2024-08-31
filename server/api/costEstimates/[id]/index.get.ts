import { getCostEstimateModel } from "pricing-lib";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const mongooseInstance = await ensureConnection(); // Ensure connection returns the mongoose instance

  const CostEstimate = getCostEstimateModel(mongooseInstance); // Pass the mongoose instance here

  const id = event.context.params.id;
  console.log("Fetching cost estimate for id:", id);

  try {
    const costEstimate = await CostEstimate.findOne({
      rentalRequestId: id,
    });

    if (!costEstimate) {
      console.log("Cost estimate not found for id:", id);
      return createError({
        statusCode: 404,
        statusMessage: "Cost estimate not found",
      });
    }

    const result = {
      versions: costEstimate.versions.map((version) => ({
        version: version.version,
        totalCost: version.totalCost,
        createdAt: version.createdAt,
        costEstimates: version.costEstimates,
      })),
      currentVersion: costEstimate.currentVersion,
    };

    console.log("Returning cost estimate data:", result);
    return result;
  } catch (error) {
    console.error("Error fetching cost estimate versions:", error);
    return createError({
      statusCode: 500,
      statusMessage: "Error fetching cost estimate versions",
    });
  }
});
