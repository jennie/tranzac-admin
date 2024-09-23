import { defineEventHandler, readBody } from "h3";
import { ensureConnection } from "@/server/utils/mongoose";
import { getCostEstimateModel } from "@tranzac/pricing-lib";
import PricingRules from "@tranzac/pricing-lib";

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
    const CostEstimate = await getCostEstimateModel(connection);

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

    // After updating the item, use PricingRules to recalculate the cost estimates
    // First, fetch the associated rental request
    const RentalRequest = RentalRequestModel(connection);
    const rentalRequest = await RentalRequest.findById(id).lean();

    if (!rentalRequest) {
      return { statusCode: 404, error: "Rental request not found" };
    }

    // Initialize PricingRules
    const pricingRules = new PricingRules();
    await pricingRules.initialize();

    // Prepare data for PricingRules
    const rentalRequestData = {
      rentalDates: {},
      resources: rentalRequest.resources || [],
      private: rentalRequest.isPrivate || false,
      expectedAttendance: rentalRequest.expectedAttendance || 0,
    };

    // Reconstruct rentalDates from the updated cost estimates
    versionData.costEstimates.forEach((estimate) => {
      const date = estimate.date;
      if (!rentalRequestData.rentalDates[date]) {
        rentalRequestData.rentalDates[date] = [];
      }
      rentalRequestData.rentalDates[date].push({
        id: estimate.id,
        start: estimate.start,
        end: estimate.end,
        roomSlugs: estimate.rooms.map((room) => room.roomSlug),
        // Include any other necessary data from estimate
      });
    });

    // Use PricingRules to recalculate the cost estimates
    const {
      costEstimates: recalculatedEstimates,
      grandTotal,
      tax,
      totalWithTax,
    } = await pricingRules.getPrice(rentalRequestData);

    // Merge custom modifications made by the admin into the recalculated estimates
    const mergedEstimates = versionData.costEstimates.map(
      (originalEstimate) => {
        const recalculatedEstimate = recalculatedEstimates.find(
          (recalc) => recalc.id === originalEstimate.id
        );

        if (recalculatedEstimate) {
          // Preserve admin modifications
          // Update recalculatedEstimate with any custom changes from originalEstimate
          // For example, if the admin modified perSlotCosts or room prices

          // Merge perSlotCosts
          recalculatedEstimate.perSlotCosts = originalEstimate.perSlotCosts;

          // Merge rooms
          recalculatedEstimate.rooms = recalculatedEstimate.rooms.map(
            (room) => {
              const originalRoom = originalEstimate.rooms.find(
                (origRoom) => origRoom.roomSlug === room.roomSlug
              );
              if (originalRoom) {
                // Override prices if they were modified by the admin
                room.fullDayPrice =
                  originalRoom.fullDayPrice || room.fullDayPrice;
                room.daytimePrice =
                  originalRoom.daytimePrice || room.daytimePrice;
                room.eveningPrice =
                  originalRoom.eveningPrice || room.eveningPrice;
                room.additionalCosts =
                  originalRoom.additionalCosts || room.additionalCosts;
              }
              return room;
            }
          );

          // Merge customLineItems
          recalculatedEstimate.customLineItems =
            originalEstimate.customLineItems || [];

          // Recalculate slotTotal
          let slotTotal = 0;

          // Sum per-slot costs
          slotTotal += (recalculatedEstimate.perSlotCosts || []).reduce(
            (sum, cost) => sum + (Number(cost.cost) || 0),
            0
          );

          // Sum room costs
          (recalculatedEstimate.rooms || []).forEach((room) => {
            slotTotal += Number(room.fullDayPrice || 0);
            slotTotal += Number(room.daytimePrice || 0);
            slotTotal += Number(room.eveningPrice || 0);
            slotTotal += (room.additionalCosts || []).reduce(
              (sum, cost) => sum + (Number(cost.cost) || 0),
              0
            );
          });

          // Sum custom line items
          slotTotal += (recalculatedEstimate.customLineItems || []).reduce(
            (sum, item) => sum + (Number(item.cost) || 0),
            0
          );

          recalculatedEstimate.slotTotal = slotTotal;

          return recalculatedEstimate;
        } else {
          // If not found, return the original estimate
          return originalEstimate;
        }
      }
    );

    // Update the version data with the merged estimates
    versionData.costEstimates = mergedEstimates;

    // Recalculate grandTotal based on merged estimates
    const updatedGrandTotal = mergedEstimates.reduce(
      (sum, estimate) => sum + (Number(estimate.slotTotal) || 0),
      0
    );

    // Recalculate tax and total with tax using PricingRules
    const updatedTax = pricingRules.calculateTax(updatedGrandTotal).toFixed(2);
    const updatedTotalWithTax = pricingRules
      .calculateTotalWithTax(updatedGrandTotal)
      .toFixed(2);

    // Update version data totals
    versionData.totalCost = updatedGrandTotal;
    versionData.tax = Number(updatedTax);
    versionData.totalWithTax = Number(updatedTotalWithTax);

    // Save the updated cost estimate
    await costEstimate.save();

    // Return the updated version data
    return {
      statusCode: 200,
      version: versionData.version,
      costEstimates: versionData.costEstimates,
      totalCost: versionData.totalCost,
      tax: versionData.tax,
      totalWithTax: versionData.totalWithTax,
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
