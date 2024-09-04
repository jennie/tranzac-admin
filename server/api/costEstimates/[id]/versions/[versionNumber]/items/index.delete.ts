import { defineEventHandler, readBody } from "h3";
import { ensureConnection } from "@/server/utils/mongoose";
import { getCostEstimateModel } from "@tranzac/pricing-lib";

export default defineEventHandler(async (event) => {
  try {
    const { id, versionNumber } = event.context.params;
    const body = await readBody(event);

    const { itemId } = body;
    //     console.log("Received delete request for item:", itemId);
    //     console.log("Current versionData:", JSON.stringify(versionData, null, 2));
    if (!id || !versionNumber || !itemId) {
      return {
        statusCode: 400,
        body: { error: "id, versionNumber, and itemId are required" },
      };
    }

    const connection = await ensureConnection();
    const CostEstimate = getCostEstimateModel(connection);

    const costEstimate = await CostEstimate.findOne({ rentalRequestId: id });

    if (!costEstimate) {
      return { statusCode: 404, error: "Cost estimate not found" };
    }

    const versionData = costEstimate.versions.find(
      (v) => v.version === Number(versionNumber)
    );

    if (!versionData) {
      return { statusCode: 404, error: "Version not found" };
    }

    let itemRemoved = false;

    // Search and remove the item from all possible locations
    versionData.costEstimates.forEach((slot) => {
      //       console.log(`Checking slot ${slotIndex}:`, JSON.stringify(slot, null, 2));

      // Check perSlotCosts
      const perSlotIndex = slot.perSlotCosts.findIndex(
        (cost) => cost.id === itemId
      );
      if (perSlotIndex !== -1) {
        slot.perSlotCosts.splice(perSlotIndex, 1);
        itemRemoved = true;
      }

      // Check rooms
      slot.rooms.forEach((room) => {
        // Check fullDay, daytime, evening prices
        ["fullDayPrice", "daytimePrice", "eveningPrice"].forEach(
          (priceType) => {
            if (room[priceType] && room[priceType].id === itemId) {
              delete room[priceType];
              itemRemoved = true;
            }
          }
        );

        // Check additionalCosts
        const additionalIndex = room.additionalCosts.findIndex(
          (cost) => cost.id === itemId
        );
        if (additionalIndex !== -1) {
          room.additionalCosts.splice(additionalIndex, 1);
          itemRemoved = true;
        }
      });

      // Check customLineItems
      const customIndex = slot.customLineItems.findIndex(
        (item) => item.id === itemId
      );
      if (customIndex !== -1) {
        slot.customLineItems.splice(customIndex, 1);
        itemRemoved = true;
      }

      // Recalculate the total cost for the slot if an item was removed
      if (itemRemoved) {
        slot.totalCost = calculateSlotTotal(slot);
      }
    });

    if (!itemRemoved) {
      //       console.log("Item not found in any slot");
    } else {
      //       console.log("Item successfully removed");
    }

    await costEstimate.save();

    return {
      statusCode: 200,
      success: true,
      message: "Item successfully removed",
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

// Helper function to calculate the total cost for a slot
function calculateSlotTotal(slot) {
  let total = 0;

  // Sum up room costs
  slot.rooms.forEach((room) => {
    if (room.fullDayPrice) total += room.fullDayPrice.amount;
    if (room.daytimePrice) total += room.daytimePrice.amount;
    if (room.eveningPrice) total += room.eveningPrice.amount;
    room.additionalCosts?.forEach((cost) => (total += cost.amount));
  });

  // Add per-slot costs
  slot.perSlotCosts?.forEach((cost) => (total += cost.amount));

  // Add custom line items
  slot.customLineItems?.forEach((item) => (total += item.amount));

  return total;
}
