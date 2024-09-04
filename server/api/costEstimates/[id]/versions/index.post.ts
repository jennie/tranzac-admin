import { getCostEstimateModel } from "@tranzac/pricing-lib";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const mongooseInstance = await ensureConnection();
  const CostEstimate = getCostEstimateModel(mongooseInstance);

  const id = event.context.params.id;
  const body = await readBody(event);

  //   console.log(`Creating new version for cost estimate id: ${id}`);

  try {
    const costEstimate = await CostEstimate.findOne({ rentalRequestId: id });

    if (!costEstimate) {
      //       console.log("Cost estimate not found for id:", id);
      throw createError({
        statusCode: 404,
        statusMessage: "Cost estimate not found",
      });
    }

    const newVersion = {
      version: costEstimate.versions.length,
      costEstimates: body.costEstimates,
      totalCost: body.totalCost,
      createdAt: new Date(),
    };

    costEstimate.versions.push(newVersion);
    costEstimate.currentVersion = newVersion.version;
    await costEstimate.save();

    //     console.log("New version created:", newVersion);
    return newVersion;
  } catch (error) {
    console.error("Error creating new cost estimate version:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error creating new cost estimate version",
    });
  }
});
