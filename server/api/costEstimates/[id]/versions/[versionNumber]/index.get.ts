import getCostEstimateModel from "@tranzac/pricing-lib";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const mongooseInstance = await ensureConnection();
  const CostEstimate = getCostEstimateModel(mongooseInstance);

  const id = event.context.params.id;
  const versionNumber = parseInt(event.context.params.versionNumber as string);

  //   console.log(`Fetching version ${versionNumber} for cost estimate id: ${id}`);

  try {
    const costEstimate = await CostEstimate.findOne({ rentalRequestId: id });

    if (!costEstimate) {
      //       console.log("Cost estimate not found for id:", id);
      throw createError({
        statusCode: 404,
        statusMessage: "Cost estimate not found",
      });
    }

    const version = costEstimate.versions.find(
      (v) => v.version === versionNumber
    );

    if (!version) {
      console.log(
        `Version ${versionNumber} not found for cost estimate id: ${id}`
      );
      throw createError({
        statusCode: 404,
        statusMessage: "Version not found",
      });
    }

    //     console.log("Returning version data:", version);
    return version;
  } catch (error) {
    console.error("Error fetching cost estimate version:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error fetching cost estimate version",
    });
  }
});
