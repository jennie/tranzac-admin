import { getCostEstimateModel } from "pricing-lib";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const mongooseInstance = await ensureConnection();
  const CostEstimate = getCostEstimateModel(mongooseInstance);

  const id = event.context.params.id;
  //   console.log("Fetching cost estimate for id:", id);

  try {
    const costEstimate = await CostEstimate.findOne({ rentalRequestId: id });

    if (!costEstimate) {
      //       console.log("Cost estimate not found for id:", id);
      return createError({
        statusCode: 404,
        statusMessage: "Cost estimate not found",
      });
    }
    //     // console.log("Cost Estimate Object:", JSON.stringify(costEstimate, null, 2)); // Log the full costEstimate object

    const result = {
      _id: costEstimate._id, // Add the _id to the result
      versions: costEstimate.versions.map((version) => ({
        version: version.version,
        label: `Version ${version.version}`,
        totalCost: version.totalCost,
        createdAt: version.createdAt,
        costEstimates: version.costEstimates.map((estimate) => ({
          id: estimate.id,
          date: estimate.date,
          start: estimate.start,
          end: estimate.end,
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
            rateDescription: room.rateDescription,
            rateSubDescription: room.rateSubDescription,
            minimumHours: room.minimumHours,
            totalBookingHours: room.totalBookingHours,
            isFullDay: room.isFullDay,
          })),
          slotTotal: estimate.slotTotal,
        })),
      })),
      currentVersion: costEstimate.currentVersion,
    };

    // console.log(
    //   "Returning cost estimate data:",
    //   JSON.stringify(result, null, 2)
    // );
    return result;
  } catch (error) {
    console.error("Error fetching cost estimate versions:", error);
    return createError({
      statusCode: 500,
      statusMessage: "Error fetching cost estimate versions",
    });
  }
});
