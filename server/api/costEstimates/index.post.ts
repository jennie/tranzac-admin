// api/costEstimates.js
import { PricingRules, getCostEstimateModel } from "pricing-lib";
import { ensureConnection } from "@/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  await ensureConnection();

  if (event.req.method === "POST") {
    const body = await readBody(event);
    console.log("Body costEstimates:", body.costEstimates);

    try {
      let costEstimate = await CostEstimate.findOne({
        rentalRequestId: body.rentalRequestId,
      });

      if (!costEstimate) {
        costEstimate = new CostEstimate({
          rentalRequestId: body.rentalRequestId,
        });
      }

      costEstimate.versions.push({
        version: body.version,
        costEstimates: body.costEstimates,
        totalCost: body.totalCost,
      });

      costEstimate.currentVersion = body.version;
      costEstimate.updatedAt = new Date();

      await costEstimate.save();

      return { success: true, message: "Cost estimate saved successfully" };
    } catch (error) {
      console.error("Error saving cost estimate:", error);
      return { success: false, error: error.message };
    }
  } else if (event.req.method === "GET") {
    const rentalRequestId = event.context.params.rentalRequestId;

    try {
      const costEstimate = await CostEstimate.findOne({ rentalRequestId });

      if (!costEstimate) {
        return createError({
          statusCode: 404,
          statusMessage: "Cost estimate not found",
        });
      }

      return {
        versions: costEstimate.versions,
        currentVersion: costEstimate.currentVersion,
      };
    } catch (error) {
      console.error("Error fetching cost estimate:", error);
      return createError({
        statusCode: 500,
        statusMessage: "Error fetching cost estimate",
      });
    }
  }
});
