import { defineEventHandler, readBody } from "h3";
import { ensureConnection } from "@/server/utils/mongoose";
import { getCostEstimateModel } from "@tranzac/pricing-lib";

export default defineEventHandler(async (event) => {
  try {
    const { id, versionNumber } = event.context.params;
    const body = await readBody(event);

    const { slotId, itemType, itemDescription, newAmount, roomSlug } = body;

    if (!id || !versionNumber) {
      return {
        statusCode: 400,
        body: { error: "id and versionNumber are required" },
      };
    }

    const connection = await ensureConnection();
    const CostEstimate = getCostEstimateModel(connection);

    // Find the cost estimate document
    const costEstimate = await CostEstimate.findOne({ rentalRequestId: id });

    if (!costEstimate) {
      return { statusCode: 404, error: "Cost estimate not found" };
    }

    // Find the specific version of the cost estimate
    const versionData = costEstimate.versions.find(
      (v) => v.version === Number(versionNumber)
    );

    if (!versionData) {
      return { statusCode: 404, error: "Version not found" };
    }

    // Find the slot within the version
    const slot = versionData.costEstimates.find((slot) => slot.id === slotId);

    if (!slot) {
      return { statusCode: 404, error: "Slot not found" };
    }

    let itemUpdated = false;

    // Update item based on type
    if (itemType === "perSlot") {
      const perSlotCost = slot.perSlotCosts?.find(
        (cost) => cost.description === itemDescription
      );
      if (perSlotCost) {
        perSlotCost.cost = newAmount;
        itemUpdated = true;
      }
    } else if (["fullDay", "daytime", "evening"].includes(itemType)) {
      const room = slot.rooms?.find((room) => room.roomSlug === roomSlug);
      if (room) {
        if (itemType === "fullDay") {
          room.fullDayPrice = newAmount;
        } else if (itemType === "daytime") {
          room.daytimePrice = newAmount;
        } else if (itemType === "evening") {
          room.eveningPrice = newAmount;
        }
        itemUpdated = true;
      }
    } else if (itemType === "additional") {
      const room = slot.rooms?.find((room) => room.roomSlug === roomSlug);
      if (room) {
        const additionalCost = room.additionalCosts?.find(
          (cost) => cost.description === itemDescription
        );
        if (additionalCost) {
          additionalCost.cost = newAmount;
          itemUpdated = true;
        }
      }
    }

    if (!itemUpdated) {
      return { statusCode: 404, error: "Item not found to update" };
    }

    await costEstimate.save();

    // Return a plain object with the updated slot
    return {
      statusCode: 200,
      id: slot.id,
      date: slot.date,
      start: slot.start,
      end: slot.end,
      estimates: slot.estimates,
      perSlotCosts: slot.perSlotCosts,
      rooms: slot.rooms,
      totalCost: slot.totalCost,
    };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      error: "Failed to process request",
      details: error.message,
    };
  }
});
