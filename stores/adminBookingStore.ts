import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { v4 as uuidv4 } from "uuid";
import { format, parseISO, isValid } from "date-fns";
import _ from "lodash";
import type {
  ICostEstimate,
  ICostEstimateVersion,
  IStatusHistory,
} from "@tranzac/pricing-lib/dist/models/costEstimate.schema";

export const useAdminBookingStore = defineStore("adminBookingStore", () => {
  const groupedCostEstimatesData = ref({});
  const costEstimateVersions = ref([]);
  const currentRentalRequestId = ref(null);
  const rentalData = ref(null);
  const currentVersionNumber = ref(1);
  const totalCost = ref(0);
  const taxAmount = ref(0);
  const totalWithTax = ref(0);
  const roomMapping = ref([]);
  const originalGroupedCostEstimatesData = ref(null);

  const groupCostEstimates = (costEstimates) => {
    if (!costEstimates || costEstimates.length === 0) return {};

    console.log("Grouping cost estimates:", costEstimates);

    return costEstimates.reduce((acc, estimate) => {
      console.log("Processing estimate:", estimate);

      let dateKey;
      if (estimate.date) {
        const parsedDate = parseISO(estimate.date);
        dateKey = isValid(parsedDate)
          ? format(parsedDate, "yyyy-MM-dd")
          : estimate.date;
      } else if (estimate.startTime && estimate.startTime.time) {
        const parsedDate = parseISO(estimate.startTime.time);
        dateKey = isValid(parsedDate)
          ? format(parsedDate, "yyyy-MM-dd")
          : "unknown-date";
      } else {
        console.warn("Estimate without valid date:", estimate);
        dateKey = "unknown-date";
      }

      console.log(`Using dateKey: ${dateKey} for estimate:`, estimate);

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push({
        id: estimate.id,
        ...estimate,
        resources: estimate.resources || [],
        newLineItem: {
          type: "custom",
          description: "",
          resourceId: null,
          cost: 0,
        },
        perSlotCosts: (estimate.perSlotCosts || []).map((cost) => ({
          ...cost,
          slotId: estimate.id,
        })),
        customLineItems: (estimate.customLineItems || []).map((item) => ({
          ...item,
          slotId: estimate.id,
        })),
        rooms: (estimate.rooms || []).map((room) => ({
          ...room,
          daytimeCostItem: room.daytimeCostItem
            ? { ...room.daytimeCostItem, slotId: estimate.id }
            : null,
          eveningCostItem: room.eveningCostItem
            ? { ...room.eveningCostItem, slotId: estimate.id }
            : null,
          fullDayCostItem: room.fullDayPrice
            ? {
                id: uuidv4(),
                description: `Full Day Rate`,
                cost: room.fullDayPrice,
                slotId: estimate.id,
              }
            : null,
          additionalCosts: (room.additionalCosts || []).map((cost) => ({
            ...cost,
            slotId: estimate.id,
          })),
        })),
      });
      return acc;
    }, {});
  };

  const fetchRentalData = async () => {
    if (!currentRentalRequestId.value) {
      console.error("No rental request ID set. Unable to fetch rental data.");
      return;
    }

    try {
      const response = await fetch(
        `/api/rentalRequests/${currentRentalRequestId.value}/slots`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch rental data: ${response.statusText}`);
      }
      const data = await response.json();
      rentalData.value = data;
      console.log("Fetched rental data:", data);

      const estimates = data.dates.flatMap((date) =>
        date.slots.map((slot) => ({
          ...slot,
          date: date.date, // Ensure each slot has the correct date
        }))
      );
      console.log("Prepared estimates for grouping:", estimates);

      groupedCostEstimatesData.value = groupCostEstimates(estimates);
      console.log("Grouped cost estimates:", groupedCostEstimatesData.value);
    } catch (err) {
      console.error("Error fetching rental data:", err);
      groupedCostEstimatesData.value = {}; // Ensure it's always an object
      throw err;
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await fetch(
        `/api/costEstimates/${currentRentalRequestId.value}`
      );
      const data = await response.json();
      costEstimateVersions.value = data.versions.map((v) => ({
        value: v.version,
        label: v.label,
        totalCost: v.totalCost,
        statusHistory: v.statusHistory || [],
      }));
      return data;
    } catch (err) {
      console.error("Error fetching versions:", err);
      throw err;
    }
  };

  const handleVersionChange = async (newVersion) => {
    currentVersionNumber.value = newVersion;
    await fetchVersionDetails(newVersion);
    originalGroupedCostEstimatesData.value = _.cloneDeep(
      groupedCostEstimatesData.value
    );
    await recalculateCosts();
  };

  const fetchVersionDetails = async (versionNumber) => {
    const version = costEstimateVersions.value.find(
      (v) => v.version === versionNumber
    );
    if (version) {
      groupedCostEstimatesData.value = groupCostEstimates(
        version.costEstimates
      );
      originalGroupedCostEstimatesData.value = _.cloneDeep(
        groupedCostEstimatesData.value
      );
      updateAllSlotTotals();
    } else {
      throw new Error("Version not found");
    }
  };
  async function saveEventSlots(slots) {
    console.log("Saving event slots:", JSON.stringify(slots, null, 2));
    if (!currentRentalRequestId.value) {
      console.error("No rental request ID set. Unable to save event slots.");
      return;
    }

    const formatTimeValue = (timeField) => {
      if (typeof timeField === "string") {
        return timeField;
      }
      if (timeField && typeof timeField === "object" && "time" in timeField) {
        return timeField.time;
      }
      if (timeField && typeof timeField === "object" && "value" in timeField) {
        return timeField.value;
      }
      return null; // or a default value
    };

    // Adjust the payload to match expected DatoCMS structure
    const formattedPayload = {
      dates: slots.dates.map((date) => ({
        date: date.date,
        slots: date.slots.map((slot) => ({
          title: slot.title,
          start_time: formatTimeValue(slot.startTime),
          end_time: formatTimeValue(slot.endTime),
          all_ages: slot.allAges,
          description: slot.description,
          doors_time: formatTimeValue(slot.doorsTime),
          event_type: slot.eventType,
          expected_attendance: slot.expectedAttendance,
          load_in_time: formatTimeValue(slot.loadInTime),
          load_out_time: formatTimeValue(slot.loadOutTime),
          private: slot.private,
          resources: slot.resources,
          sound_check_time: formatTimeValue(slot.soundCheckTime),
          rooms: slot.rooms.map((room) => room.id),
        })),
      })),
    };

    try {
      const response = await fetch(
        `/api/rentalRequests/${currentRentalRequestId.value}/slots`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formattedPayload),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(`Failed to save event slots: ${response.statusText}`);
      }
      const updatedRental = await response.json();
      rentalData.value = updatedRental.body;
      console.log("Event slots saved successfully", updatedRental.body);
    } catch (error) {
      console.error("Error saving event slots:", error);
      throw error;
    }
  }
  const eventSlots = computed(() => {
    if (rentalData.value && rentalData.value.dates) {
      return rentalData.value.dates.flatMap((date) => date.slots);
    }
    return [];
  });

  const isPublishReady = computed(() => {
    return publicationChecklist.value.every((item) => item.completed);
  });

  const hasChanges = computed(() => {
    return !_.isEqual(
      groupedCostEstimatesData.value,
      originalGroupedCostEstimatesData.value
    );
  });

  const isLoading = computed(() => {
    return Object.keys(groupedCostEstimatesData.value).length === 0;
  });

  const sendButtonLabel = computed(() => {
    return hasChanges.value
      ? "Save Changes and Send Estimate"
      : "Send Estimate";
  });

  const groupedCostEstimates = computed(() => {
    console.log(
      "Computing groupedCostEstimates:",
      groupedCostEstimatesData.value
    );
    return groupedCostEstimatesData.value || {};
  });

  const calculatedGrandTotal = computed(() => {
    return Object.values(groupedCostEstimatesData.value).reduce(
      (total, slot) => {
        return total + (slot.totalCost || 0);
      },
      0
    );
  });

  const currentVersionLabel = computed(() => {
    const version = costEstimateVersions.value.find(
      (v) => v.value === currentVersionNumber.value
    );
    return version ? version.label : "Original Request";
  });

  async function fetchRoomMapping() {
    try {
      const response = await fetch("/api/getRoomMapping");
      const data = await response.json();
      if (data.success) {
        roomMapping.value = data.data;
      } else {
        console.error("Failed to fetch room mapping:", data.error);
      }
    } catch (err) {
      console.error("Error fetching room mapping:", err);
    }
  }

  function getRoomName(roomSlug) {
    const room = roomMapping.value.find((r) => r.slug === roomSlug);
    return room ? room.name : roomSlug;
  }

  function setCurrentRentalRequest(id) {
    console.log("Setting currentRentalRequestId:", id);
    currentRentalRequestId.value = id;
  }

  function updateAllSlotTotals() {
    console.log("Updating all slot totals...");
    Object.values(groupedCostEstimatesData.value).forEach((slots) => {
      slots.forEach(recalculateSlotTotal);
    });
    updateTotals();
  }

  function recalculateSlotTotal(slot) {
    console.log("Recalculating slot total for slot:", slot);

    let total = 0;

    total += (slot.perSlotCosts || []).reduce(
      (sum, cost) => sum + (Number(cost.cost) || 0),
      0
    );

    (slot.rooms || []).forEach((room) => {
      if (room.fullDayCostItem) {
        total += Number(room.fullDayCostItem.cost || 0);
      } else {
        total += Number(room.daytimeCostItem?.cost || 0);
        total += Number(room.eveningCostItem?.cost || 0);
      }
      total += (room.additionalCosts || []).reduce(
        (sum, cost) => sum + (Number(cost.cost) || 0),
        0
      );
    });

    total += (slot.customLineItems || []).reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0
    );

    slot.slotTotal = total;
    console.log("Final slot total:", total); // Log the final total

    // Ensure the data is reactive and updates the UI
    groupedCostEstimatesData.value = { ...groupedCostEstimatesData.value };
  }

  function updateTotals() {
    let newTotalCost = 0;

    const rawGroupedCostEstimates = toRaw(groupedCostEstimatesData.value);
    console.log("Raw grouped cost estimates data:", rawGroupedCostEstimates);

    for (const [dateKey, slots] of Object.entries(rawGroupedCostEstimates)) {
      console.log(`Processing date: ${dateKey} with slots:`, slots);

      slots.forEach((slot) => {
        console.log("Slot total:", slot.slotTotal);
        newTotalCost += slot.slotTotal || 0;
      });
    }

    totalCost.value = newTotalCost;
    taxAmount.value = newTotalCost * 0.13;
    totalWithTax.value = newTotalCost + taxAmount.value;

    console.log("Total Cost:", totalCost.value);
    console.log("Tax Amount:", taxAmount.value);
    console.log("Total with Tax:", totalWithTax.value);
  }

  const recalculateCosts = async () => {
    try {
      const rentalDates = {};

      for (const [dateKey, slots] of Object.entries(
        groupedCostEstimatesData.value
      )) {
        console.log("Processing date:", dateKey, "with slots:", slots); // Log each date and its slots

        rentalDates[dateKey] = slots.map((slot) => {
          const roomSlugs = slot.rooms
            .map((room) => {
              const mappedRoom = roomMapping.value.find(
                (r) => r.id === room.id
              );
              return mappedRoom ? mappedRoom.slug : undefined;
            })
            .filter(Boolean);

          return {
            id: slot.id,
            title: slot.title,
            startTime: slot.startTime,
            endTime: slot.endTime,
            allAges: slot.allAges,
            description: slot.description,
            doorsTime: slot.doorsTime.time,
            eventType: slot.eventType,
            expectedAttendance: slot.expectedAttendance,
            loadInTime: slot.loadInTime.time,
            loadOutTime: slot.loadOutTime.time,
            private: slot.private,
            resources: slot.resources || [],
            rooms: slot.rooms,
            roomSlugs,
            isPrivate: slot.private,
            soundCheckTime: slot.soundCheckTime.time,
          };
        });
      }

      console.log("Rental dates for recalculation:", rentalDates); // Log rental dates before sending to API

      const { data } = await useFetch("/api/costEstimates/recalculate", {
        method: "POST",
        body: {
          rentalDates,
          roomMapping: roomMapping.value,
        },
      });

      console.log("Recalculated data:", data.value); // Log recalculated data

      if (data.value && data.value.costEstimates) {
        const newGroupedData = {};
        data.value.costEstimates.forEach((updatedEstimate) => {
          const dateKey = format(parseISO(updatedEstimate.date), "yyyy-MM-dd");
          if (!newGroupedData[dateKey]) {
            newGroupedData[dateKey] = [];
          }
          newGroupedData[dateKey].push({
            ...updatedEstimate,
            rooms: updatedEstimate.estimates.map((estimate) => ({
              ...estimate,
              fullDayCostItem: estimate.fullDayPrice
                ? {
                    id: uuidv4(),
                    description: `Full Day Rate`,
                    cost: estimate.fullDayPrice,
                    slotId: updatedEstimate.id,
                  }
                : null,
              daytimeCostItem: estimate.daytimeCostItem
                ? {
                    ...estimate.daytimeCostItem,
                    id: estimate.daytimeCostItem.id || uuidv4(),
                    slotId: updatedEstimate.id,
                  }
                : null,
              eveningCostItem: estimate.eveningCostItem
                ? {
                    ...estimate.eveningCostItem,
                    id: estimate.eveningCostItem.id || uuidv4(),
                    slotId: updatedEstimate.id,
                  }
                : null,
              additionalCosts: (estimate.additionalCosts || []).map((cost) => ({
                ...cost,
                id: cost.id || uuidv4(),
                slotId: updatedEstimate.id,
              })),
            })),
            newLineItem: {
              type: "custom",
              description: "",
              resourceId: null,
              cost: 0,
            },
          });
        });

        groupedCostEstimatesData.value = newGroupedData;
      } else {
        console.error(
          "Recalculation failed or returned unexpected data structure"
        );
      }

      console.log(
        "Updated grouped cost estimates:",
        groupedCostEstimatesData.value
      ); // Log grouped estimates after recalculation

      // After recalculating costs, update the totals
      updateAllSlotTotals();
      updateTotals();
    } catch (error) {
      console.error("Error recalculating costs:", error);
    }
  };

  function updateInvoiceItem(updatedItem) {
    const slot = groupedCostEstimatesData.value[updatedItem.slotId];
    if (!slot) {
      console.error("Slot not found for", updatedItem.slotId);
      return;
    }

    let itemFound = false;

    slot.perSlotCosts = slot.perSlotCosts.map((cost) => {
      if (cost.id === updatedItem.id) {
        itemFound = true;
        return { ...cost, ...updatedItem };
      }
      return cost;
    });

    if (!itemFound) {
      slot.rooms = slot.rooms.map((room) => {
        if (
          room.fullDayCostItem &&
          room.fullDayCostItem.id === updatedItem.id
        ) {
          itemFound = true;
          room.fullDayCostItem = { ...room.fullDayCostItem, ...updatedItem };
        } else if (
          room.daytimeCostItem &&
          room.daytimeCostItem.id === updatedItem.id
        ) {
          itemFound = true;
          room.daytimeCostItem = { ...room.daytimeCostItem, ...updatedItem };
        } else if (
          room.eveningCostItem &&
          room.eveningCostItem.id === updatedItem.id
        ) {
          itemFound = true;
          room.eveningCostItem = { ...room.eveningCostItem, ...updatedItem };
        }

        room.additionalCosts = room.additionalCosts.map((cost) => {
          if (cost.id === updatedItem.id) {
            itemFound = true;
            return { ...cost, ...updatedItem };
          }
          return cost;
        });

        return room;
      });
    }

    if (!itemFound) {
      slot.customLineItems = slot.customLineItems.map((item) => {
        if (item.id === updatedItem.id) {
          itemFound = true;
          return { ...item, ...updatedItem };
        }
        return item;
      });
    }

    if (!itemFound) {
      console.error(
        "Item not found in any category for update:",
        updatedItem.id
      );
    }

    groupedCostEstimatesData.value = { ...groupedCostEstimatesData.value };
    recalculateSlotTotal(slot);
    updateTotals();
  }

  function updateCustomLineItem(slot, updatedItem) {
    const index = slot.customLineItems.findIndex(
      (item) => item.id === updatedItem.id
    );
    if (index !== -1) {
      slot.customLineItems[index] = updatedItem;
      recalculateSlotTotal(slot);
    }
  }

  function removeCustomLineItem(slot, item) {
    slot.customLineItems = slot.customLineItems.filter((i) => i.id !== item.id);
    recalculateSlotTotal(slot);
    groupedCostEstimatesData.value = { ...groupedCostEstimatesData.value };
  }

  function addLineItem(slot, newItem) {
    slot.customLineItems.push(newItem);
    recalculateSlotTotal(slot);
    groupedCostEstimatesData.value = { ...groupedCostEstimatesData.value };
  }

  async function saveCostEstimate() {
    try {
      await useFetch(
        `/api/costEstimates/${currentRentalRequestId.value}/versions/${currentVersionNumber.value}`,
        {
          method: "PUT",
          body: {
            costEstimates: Object.values(groupedCostEstimatesData.value),
            totalCost: totalCost.value,
            tax: taxAmount.value,
            totalWithTax: totalWithTax.value,
          },
        }
      );
    } catch (err) {
      console.error("Error saving cost estimate:", err);
      throw err;
    }
  }

  async function createNewVersion() {
    try {
      const preparedCostEstimates = prepareCostEstimatesForSave();

      const { data, error: fetchError } = await useFetch(
        `/api/costEstimates/${currentRentalRequestId.value}/versions`,
        {
          method: "POST",
          body: {
            costEstimates: preparedCostEstimates,
            totalCost: totalCost.value,
            tax: taxAmount.value,
            totalWithTax: totalWithTax.value,
          },
        }
      );

      if (fetchError?.value || !data?.value) {
        throw new Error("Failed to create a new version");
      }

      originalGroupedCostEstimatesData.value = _.cloneDeep(
        groupedCostEstimatesData.value
      );
      resetChangesFlag();

      const newVersion = data.value.version;
      costEstimateVersions.value.push({
        value: newVersion.version,
        label: newVersion.label,
        totalCost: newVersion.totalCost,
        statusHistory: newVersion.statusHistory || [],
      });

      currentVersionNumber.value = newVersion.version;
      await fetchVersionDetails(newVersion.version);

      return newVersion;
    } catch (err) {
      console.error("Error while creating new version:", err);
      throw err;
    }
  }

  function resetChanges() {
    groupedCostEstimatesData.value = _.cloneDeep(
      originalGroupedCostEstimatesData.value
    );
  }

  function prepareCostEstimatesForSave() {
    if (!groupedCostEstimatesData.value) {
      console.error("groupedCostEstimatesData is undefined or null.");
      return [];
    }

    return Object.values(groupedCostEstimatesData.value).map((slot) => ({
      resources: slot.resources || [],
      id: slot.id,
      date: slot.date,
      start: slot.start,
      end: slot.end,
      perSlotCosts: (slot.perSlotCosts || []).map((cost) => ({
        id: cost.id || uuidv4(),
        slotId: cost.slotId,
        description: cost.description || "No description",
        subDescription: cost.subDescription || "",
        cost: cost.cost,
      })),
      estimates: (slot.rooms || []).map((room) => ({
        roomSlug: room.roomSlug || "N/A",
        basePrice: room.basePrice || 0,
        daytimePrice: room.daytimePrice || 0,
        eveningPrice: room.eveningPrice || 0,
        fullDayPrice: room.fullDayPrice || 0,
        daytimeHours: room.daytimeHours || 0,
        eveningHours: room.eveningHours || 0,
        daytimeRate: room.daytimeRate || 0,
        eveningRate: room.eveningRate || 0,
        daytimeRateType: room.daytimeRateType || "",
        eveningRateType: room.eveningRateType || "",
        totalCost: room.totalCost || 0,
        additionalCosts: (room.additionalCosts || []).map((cost) => ({
          id: cost.id || uuidv4(),
          slotId: cost.slotId,
          description: cost.description || "No description",
          subDescription: cost.subDescription || "",
          cost: cost.cost,
        })),
        daytimeCostItem: room.daytimeCostItem
          ? { ...room.daytimeCostItem, slotId: room.daytimeCostItem.slotId }
          : null,
        eveningCostItem: room.eveningCostItem
          ? { ...room.eveningCostItem, slotId: room.eveningCostItem.slotId }
          : null,
        fullDayCostItem: room.fullDayCostItem
          ? { ...room.fullDayCostItem, slotId: room.fullDayCostItem.slotId }
          : null,
      })),
      customLineItems: (slot.customLineItems || [])
        .map((item) => ({
          id: item.id || uuidv4(),
          slotId: item.slotId,
          description: item.description || "No description",
          cost: item.cost,
        }))
        .filter((item) => item.cost > 0 && item.description.trim() !== ""),
      slotTotal: slot.totalCost || 0,
    }));
  }

  async function sendEstimate(pdfPayload) {
    try {
      const response = await fetch("/api/costEstimates/sendEstimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pdfPayload),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to send estimate");
      }
      return result;
    } catch (err) {
      console.error("Error sending estimate:", err);
      throw err;
    }
  }
  // todo: implement this function
  // const sendEstimate = async () => {
  //   const estimateId = estimateIdRef.value;

  //   if (!estimateId) {
  //     console.error("Estimate ID is undefined");
  //     return;
  //   }

  //   const selectedVersion = costEstimateVersions.value.find(
  //     (v) => v.value === currentVersionNumber.value
  //   );

  //   if (!selectedVersion) {
  //     console.error("Selected version not found");
  //     return;
  //   }

  //   try {
  //     // Set isSubmitting to true to show the loading modal
  //     isSubmitting.value = true;

  //     const pdfPayload = {
  //       userId: userId.value,
  //       estimateId: estimateId,
  //       currentVersion: currentVersionNumber.value,
  //       costEstimates: Object.values(groupedCostEstimatesData.value).map(
  //         (slot) => ({
  //           date: formatDate(slot.date),
  //           startTime: formatTimeRange(slot.start, slot.start),
  //           endTime: formatTimeRange(slot.start, slot.end),
  //           perSlotCosts: slot.perSlotCosts.map((cost) => ({
  //             description: cost.description,
  //             total: cost.cost.toFixed(2),
  //           })),
  //           rooms: slot.rooms.map((room) => ({
  //             roomName: room.roomName,
  //             costItems: room.costItems,
  //             additionalCosts: room.additionalCosts.map((cost) => ({
  //               description: cost.description,
  //               total: cost.cost.toFixed(2),
  //             })),
  //           })),
  //           customLineItems: slot.customLineItems.map((item) => ({
  //             description: item.description,
  //             total: item.cost.toFixed(2),
  //           })),
  //         })
  //       ),
  //       recipientEmail: props.rentalRequest.primaryContactEmail,
  //       recipientName: props.rentalRequest.primaryContactName,
  //       recipientOrganization: props.rentalRequest.organization,
  //       roomMapping: roomMapping.value,
  //     };

  //     const response = await fetch("/api/costEstimates/sendEstimate", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(pdfPayload),
  //     });

  //     const result = await response.json();
  //     if (result.success) {
  //       toast.add({
  //         icon: "i-heroicons-check-badge",
  //         title: "Success!",
  //         color: "green",
  //         description: "This estimate has been emailed to the renter.",
  //       });
  //     } else {
  //       console.error("Failed to send estimate:", result.message);
  //     }
  //   } catch (err) {
  //     console.error("Error sending estimate:", err);
  //   } finally {
  //     // Hide the loading modal by setting isSubmitting to false
  //     isSubmitting.value = false;
  //   }
  // };
  async function generateStripeEstimate() {
    try {
      const { data } = await useFetch(
        `/api/costEstimates/${currentRentalRequestId.value}/stripe-estimate`,
        {
          method: "POST",
          body: {
            version: currentVersionNumber.value,
          },
        }
      );
      if (!data.value || !data.value.success) {
        throw new Error(
          data.value?.error || "Failed to generate Stripe estimate"
        );
      }
      return data.value;
    } catch (err) {
      console.error("Error generating Stripe estimate:", err);
      throw err;
    }
  }

  async function updateResourceSelection(slot, resourceId) {
    slot.resources = slot.resources || [];
    const index = slot.resources.indexOf(resourceId);
    if (index === -1) {
      slot.resources.push(resourceId);
    } else {
      slot.resources.splice(index, 1);
    }
    await recalculateCosts();
  }

  async function updateRoomSelection(slot, roomId) {
    const availability = await checkRoomAvailability(
      roomId,
      new Date(slot.start),
      new Date(slot.end)
    );
    if (availability) {
      slot.selectedRooms = slot.selectedRooms || [];
      const index = slot.selectedRooms.indexOf(roomId);
      if (index === -1) {
        slot.selectedRooms.push(roomId);
      } else {
        slot.selectedRooms.splice(index, 1);
      }
      await recalculateCosts();
    } else {
      throw new Error("Room is not available for the selected time slot");
    }
  }

  async function checkRoomAvailability(roomId, startDate, endDate) {
    // Implement room availability check logic here
    // This is a placeholder implementation
    return true;
  }

  return {
    costEstimateVersions,
    currentRentalRequestId,
    rentalData,
    totalCost,
    taxAmount,
    totalWithTax,
    roomMapping,
    currentVersionNumber,
    originalGroupedCostEstimatesData,

    eventSlots,
    isPublishReady,
    hasChanges,
    groupedCostEstimates,
    isLoading,
    calculatedGrandTotal,
    currentVersionLabel,
    sendButtonLabel,

    fetchRoomMapping,
    getRoomName,
    setCurrentRentalRequest,
    fetchVersions,
    handleVersionChange,
    fetchVersionDetails,
    updateAllSlotTotals,
    recalculateSlotTotal,
    updateTotals,
    recalculateCosts,
    updateInvoiceItem,
    updateCustomLineItem,
    removeCustomLineItem,
    addLineItem,
    saveCostEstimate,
    createNewVersion,
    resetChanges,
    prepareCostEstimatesForSave,
    sendEstimate,
    generateStripeEstimate,
    updateResourceSelection,
    updateRoomSelection,
    checkRoomAvailability,
    fetchRentalData,
    saveEventSlots,
    groupCostEstimates,
    groupedCostEstimatesData,
  };
});
