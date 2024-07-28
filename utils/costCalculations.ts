// src/utils/costCalculations.js

import pricingRules from "@/utils/pricingRules";

export const formatCurrency = (amount) => {
  return `$${amount.toFixed(0)}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

const getDayName = (date) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[new Date(date).getDay()];
};

const getTimePeriod = (date) => {
  const hour = new Date(date).getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
};

export const calculateCostEstimates = (
  rentalDates,
  roomMapping,
  resourceOptions = []
) => {
  console.log("calculateCostEstimates called with:", {
    rentalDates,
    roomMapping,
    resourceOptions,
  });

  if (
    !rentalDates ||
    (Array.isArray(rentalDates) && rentalDates.length === 0) ||
    Object.keys(rentalDates).length === 0
  ) {
    console.log("No rental dates provided, returning empty array");
    return [];
  }

  // Create maps for faster room lookups
  const roomMapById = new Map(roomMapping.map((room) => [room.id, room]));
  const roomMapByName = new Map(
    roomMapping.map((room) => [room.name.toLowerCase(), room])
  );
  console.log("Room maps created:", { roomMapById, roomMapByName });

  const processSlots = (slots, date) => {
    console.log("Processing slots for date:", date, "Slots:", slots);
    return slots.map((slot) => {
      console.log("Processing slot:", slot);
      const day = getDayName(slot.start || date);
      const timePeriod = getTimePeriod(slot.start || date);
      const isPrivate = slot.private;
      const resources = slot.resources || [];

      const resourceCosts = resources.map((resource) => ({
        description:
          resourceOptions.find((option) => option.value === resource)?.label ||
          resource,
        cost: pricingRules.additionalCosts?.resources?.[resource] || 0,
      }));

      const totalResourceCost = resourceCosts.reduce(
        (total, cost) => total + cost.cost,
        0
      );

      console.log("Slot rooms:", slot.rooms);
      const roomCosts = (slot.rooms || [])
        .map((roomInfo) => {
          console.log("Processing room info:", roomInfo);

          let room;
          if (typeof roomInfo === "object") {
            if (roomInfo.id) {
              room = roomMapById.get(roomInfo.id);
            } else if (roomInfo.name) {
              room = roomMapByName.get(roomInfo.name.toLowerCase());
            }
          } else if (typeof roomInfo === "string") {
            room =
              roomMapById.get(roomInfo) ||
              roomMapByName.get(roomInfo.toLowerCase());
          }

          if (!room) {
            console.error(`Room not found for:`, roomInfo);
            return null;
          }

          console.log("Found room:", room);

          const basePrice = pricingRules.getPrice?.(
            room.slug,
            day,
            timePeriod,
            isPrivate,
            []
          );

          if (basePrice === undefined || basePrice === null) {
            console.error(
              `Unable to calculate base price for room: ${room.name}`
            );
            return null;
          }

          console.log("Base price calculated:", basePrice);

          const additionalCosts = [
            ...(pricingRules.additionalCosts?.getAdditionalCosts?.(
              day,
              timePeriod
            ) || []),
          ];

          const totalCost =
            basePrice +
            additionalCosts.reduce((total, cost) => total + cost.cost, 0);

          console.log("Total cost calculated:", totalCost);

          return {
            roomSlug: room.slug,
            roomName: room.name,
            basePrice,
            additionalCosts,
            totalCost,
          };
        })
        .filter((cost) => cost !== null);

      console.log("Room costs calculated:", roomCosts);

      if (roomCosts.length > 0) {
        roomCosts[0].additionalCosts.push(...resourceCosts);
        roomCosts[0].totalCost += totalResourceCost;
      } else if (totalResourceCost > 0) {
        roomCosts.push({
          roomName: "Additional Resources",
          basePrice: 0,
          additionalCosts: resourceCosts,
          totalCost: totalResourceCost,
        });
      }

      return {
        slot,
        roomCosts,
      };
    });
  };

  let result;
  if (Array.isArray(rentalDates)) {
    result = rentalDates.flatMap((date) =>
      processSlots(date.slots || [], date.date)
    );
  } else {
    result = Object.entries(rentalDates).flatMap(([date, slots]) =>
      processSlots(slots, date)
    );
  }

  console.log("Final result:", result);
  return result;
};

export const calculateSlotTotal = (estimate) => {
  return estimate.roomCosts.reduce(
    (total, roomCost) => total + roomCost.totalCost,
    0
  );
};

export const calculateGrandTotal = (costEstimates) => {
  return costEstimates.reduce(
    (total, estimate) => total + calculateSlotTotal(estimate),
    0
  );
};
