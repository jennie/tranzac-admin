import { PricingRules, getCostEstimateModel } from "@tranzac/pricing-lib";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const mongooseInstance = await ensureConnection();
  const CostEstimate = await getCostEstimateModel(mongooseInstance);

  const id = event.context.params.id;

  try {
    const costEstimate = await CostEstimate.findOne({
      rentalRequestId: id,
    }).lean(); // Use .lean() to get plain JavaScript objects

    if (!costEstimate) {
      return createError({
        statusCode: 404,
        statusMessage: "Cost estimate not found",
      });
    }
    console.log("&&&&&&&&&&costEstimate", costEstimate);

    const result = {
      _id: costEstimate._id,
      versions: Array.isArray(costEstimate.versions)
        ? costEstimate.versions.map((version) => ({
            version: version.version,
            label: `Version ${version.version}`,
            totalCost: version.totalCost,
            statusHistory: version.statusHistory || [],
            createdAt: version.createdAt,
            costEstimates: version.costEstimates.map((estimate) => ({
              id: estimate.id,
              date: estimate.date
                ? estimate.date.toISOString().split("T")[0]
                : null,
              start: estimate.start ? estimate.start.toISOString() : null,
              end: estimate.end ? estimate.end.toISOString() : null,
              perSlotCosts: estimate.perSlotCosts,
              rooms: estimate.estimates.map((room) => ({
                roomSlug: room.roomSlug,
                basePrice: room.basePrice,
                daytimeHours: room.daytimeHours,
                eveningHours: room.eveningHours,
                daytimePrice: room.daytimePrice,
                eveningPrice: room.eveningPrice,
                fullDayPrice: room.fullDayPrice,
                daytimeRate: room.daytimeRate,
                daytimeRateType: room.daytimeRateType,
                eveningRate: room.eveningRate,
                eveningRateType: room.eveningRateType,
                additionalCosts: room.additionalCosts,
                totalCost: room.totalCost,
              })),
              slotTotal: estimate.slotTotal,
            })),
          }))
        : [],
      currentVersion: costEstimate.currentVersion,
    };

    return result;
  } catch (error) {
    console.error("Error fetching cost estimate versions:", error);
    return createError({
      statusCode: 500,
      statusMessage: "Error fetching cost estimate versions",
    });
  }
});
