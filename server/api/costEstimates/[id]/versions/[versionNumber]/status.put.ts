import { getCostEstimateModel } from "@tranzac/pricing-lib";

export default defineEventHandler(async (event) => {
  const connection = await ensureConnection();
  const CostEstimate = getCostEstimateModel(connection);
  const rentalRequestId = event.context.params.id;
  const versionNumber = parseInt(event.context.params.versionNumber, 10);
  const { status, changedBy, timestamp } = await readBody(event);

  console.log("rentalRequestId:", rentalRequestId);
  console.log("versionNumber:", versionNumber);

  try {
    const costEstimate = await CostEstimate.findOne({ rentalRequestId });

    if (!costEstimate) {
      console.error(
        "Cost estimate not found for rentalRequestId:",
        rentalRequestId
      );
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
