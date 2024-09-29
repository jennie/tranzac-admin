// server/api/costEstimates/[id]/versions/[versionNumber]/index.get.ts

import { getCostEstimateModel } from "@tranzac/pricing-lib";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const mongooseInstance = await ensureConnection();
  const CostEstimate = await getCostEstimateModel(mongooseInstance);

  const id = event.context.params.id;
  const versionNumber = parseInt(
    event.context.params.versionNumber as string,
    10
  );

  console.log(`Fetching version ${versionNumber} for cost estimate id: ${id}`);

  try {
    const costEstimate = await CostEstimate.findOne({ rentalRequestId: id });

    if (!costEstimate) {
      console.log("Cost estimate not found for id:", id);
      throw createError({
        statusCode: 404,
        statusMessage: "Cost estimate not found",
      });
    }

    console.log("Cost estimate found:", JSON.stringify(costEstimate, null, 2));

    const version = costEstimate.versions.find(
      (v) => v.version === versionNumber
    );

    if (!version) {
      console.log(
        `Version ${versionNumber} not found for cost estimate id: ${id}`
      );
      console.log(
        "Available versions:",
        costEstimate.versions.map((v) => v.version)
      );
      throw createError({
        statusCode: 404,
        statusMessage: "Version not found",
      });
    }

    console.log("Found version:", JSON.stringify(version, null, 2));

    // Ensure the costEstimates property exists and is an array
    if (!version.costEstimates || !Array.isArray(version.costEstimates)) {
      console.error(
        "Invalid version structure: costEstimates is missing or not an array"
      );
      throw createError({
        statusCode: 500,
        statusMessage: "Invalid version data structure",
      });
    }

    // Ensure each cost estimate has the expected structure
    const formattedVersion = {
      ...version,
      costEstimates: version.costEstimates.map((estimate) => ({
        ...estimate,
        rooms: Array.isArray(estimate.rooms)
          ? estimate.rooms.map((room) => ({
              ...room,
              additionalCosts: Array.isArray(room.additionalCosts)
                ? room.additionalCosts
                : [],
              fullDayCostItem: room.fullDayCostItem || null,
              daytimeCostItem: room.daytimeCostItem || null,
              eveningCostItem: room.eveningCostItem || null,
            }))
          : [],
        perSlotCosts: Array.isArray(estimate.perSlotCosts)
          ? estimate.perSlotCosts
          : [],
        customLineItems: Array.isArray(estimate.customLineItems)
          ? estimate.customLineItems
          : [],
      })),
    };

    console.log(
      "Returning formatted version:",
      JSON.stringify(formattedVersion, null, 2)
    );
    return formattedVersion;
  } catch (error) {
    console.error("Detailed error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || "Error fetching cost estimate version",
    });
  }
});
