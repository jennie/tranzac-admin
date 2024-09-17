// routes/api/costEstimates/[rentalRequestId]/versions/[versionNumber]/accept.js

import getCostEstimateModel from "@tranzac/pricing-lib";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const mongooseInstance = await ensureConnection();
  const CostEstimate = getCostEstimateModel(mongooseInstance);

  const rentalRequestId = event.context.params.rentalRequestId;
  const versionNumber = parseInt(event.context.params.versionNumber, 10);
  const { acceptedBy, acceptedAt } = await readBody(event);

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

    // Add a new entry to the statusHistory array
    version.statusHistory.push({
      status: "accepted",
      changedBy: acceptedBy,
      timestamp: acceptedAt || new Date(),
    });

    await costEstimate.save();
    return { success: true };
  } catch (error) {
    console.error("Failed to accept version:", error);
    return createError({
      statusCode: 500,
      statusMessage: "Failed to accept version",
    });
  }
});
