import { getCostEstimateModel } from "@tranzac/pricing-lib";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const mongooseInstance = await ensureConnection();
  const CostEstimate = await getCostEstimateModel(mongooseInstance);

  const id = event.context.params.id;
  const body = await readBody(event);

  console.log("Request body:", body); // Debugging the incoming request body

  // Validate incoming data
  if (!body.costEstimates || !Array.isArray(body.costEstimates)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid cost estimates format",
    });
  }

  if (typeof body.totalCost !== "number") {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid total cost format",
    });
  }

  try {
    console.log(`Fetching cost estimate for rentalRequestId: ${id}`);
    const costEstimate = await CostEstimate.findOne({ rentalRequestId: id });

    if (!costEstimate) {
      console.error(`Cost estimate not found for rentalRequestId: ${id}`);
      throw createError({
        statusCode: 404,
        statusMessage: "Cost estimate not found",
      });
    }

    // Create a new version and ensure cost estimates are copied properly
    const newVersion = {
      version: costEstimate.versions.length,
      costEstimates:
        body.costEstimates ||
        costEstimate.versions[costEstimate.currentVersion].costEstimates,
      totalCost: body.totalCost,
      createdAt: new Date(),
    };

    costEstimate.versions.push(newVersion);
    costEstimate.currentVersion = newVersion.version;
    await costEstimate.save();

    return newVersion;
  } catch (error) {
    console.error("Error creating new cost estimate version:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error creating new cost estimate version",
    });
  }
});
