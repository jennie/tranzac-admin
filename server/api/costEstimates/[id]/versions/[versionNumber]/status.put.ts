// routes/api/costEstimates/[rentalRequestId]/versions/[versionNumber]/status.js

import { getCostEstimateModel } from "pricing-lib";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const connection = await ensureConnection();
  const CostEstimate = getCostEstimateModel(connection);
  const rentalRequestId = event.context.params.rentalRequestId;
  const versionNumber = parseInt(event.context.params.versionNumber, 10);
  const { status, changedBy, timestamp } = await readBody(event);

  try {
    const costEstimate = await CostEstimate.findOne({ rentalRequestId });

    if (!costEstimate) {
      throw new Error("Cost estimate not found");
    }

    const version = costEstimate.versions.find(
      (v) => v.version === versionNumber
    );
    if (!version) {
      throw new Error("Version not found");
    }

    // Add the new status entry to the statusHistory array
    version.statusHistory.push({
      status,
      changedBy,
      timestamp: timestamp || new Date(),
    });

    await costEstimate.save();
    return { success: true };
  } catch (error) {
    console.error("Failed to update version status:", error);
    return createError({
      statusCode: 500,
      statusMessage: "Failed to update version status",
    });
  }
});
