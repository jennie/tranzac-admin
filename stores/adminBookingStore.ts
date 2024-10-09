import { defineStore } from "pinia";

export const useAdminBookingStore = defineStore("adminBookingStore", () => {
  const currentRentalRequestId = ref(null);
  const costEstimates = ref([]);
  const rentalData = ref(null);
  const error = ref(null);

  const publicationChecklist = ref([]);
  const currentVersion = ref(1);
  const eventSlots = computed(() => {
    if (rentalData.value && rentalData.value.dates) {
      return rentalData.value.dates.flatMap((date) => date.slots);
    }
    return [];
  });
  const isPublishReady = computed(() => {
    return publicationChecklist.value.every((item) => item.completed);
  });

  function setCurrentRentalRequest(id) {
    console.log("Setting currentRentalRequestId:", id);

    currentRentalRequestId.value = id;
  }
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

  function updateCostEstimates(newEstimates) {
    costEstimates.value = newEstimates;
  }

  async function fetchEventSlots() {
    console.log(
      "Fetching event slots, currentRentalRequestId:",
      currentRentalRequestId.value
    );
    if (!currentRentalRequestId.value) {
      console.error("No rental request ID set. Unable to fetch event slots.");
      return;
    }
    try {
      const response = await fetch(
        `/api/rentalRequests/${currentRentalRequestId.value}/slots`
      );
      console.log("Response:", response);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch event slots: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched event slots!!!:", data);
      eventSlots.value = data;
    } catch (error) {
      console.error("Error fetching event slots:", error);
      throw error;
    }
  }
  async function fetchRentalData() {
    console.log(
      "Fetching rental data, currentRentalRequestId:",
      currentRentalRequestId.value
    );
    if (!currentRentalRequestId.value) {
      console.error("No rental request ID set. Unable to fetch rental data.");
      error.value = "No rental request ID set";
      return;
    }
    try {
      const response = await fetch(
        `/api/rentalRequests/${currentRentalRequestId.value}/slots`
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch rental data: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched rental data:", data);
      rentalData.value = data;
      error.value = null;
    } catch (err) {
      console.error("Error fetching rental data:", err);
      error.value = err.message;
      throw err;
    }
  }

  async function fetchRentalRequestData(id) {
    console.log("Fetching rental request data for id:", id);
    setCurrentRentalRequest(id);
    await fetchEventSlots();
    // todo: Implement fetching of cost estimates and publication checklist
  }
  async function updateEventSlot(date, updatedSlot) {
    const dateIndex = eventSlots.value.findIndex((d) => d.date === date.date);
    if (dateIndex !== -1) {
      const slotIndex = eventSlots.value[dateIndex].slots.findIndex(
        (s) => s.id === updatedSlot.id
      );
      if (slotIndex !== -1) {
        eventSlots.value[dateIndex].slots[slotIndex] = updatedSlot;
        await saveEventSlots(eventSlots.value);
      }
    }
  }
  function updateEventSlots(slots) {
    console.log("Updating event slots:", slots);
    eventSlots.value = slots;
  }
  async function addEventSlot(date, newSlot) {
    const dateIndex = eventSlots.value.findIndex((d) => d.date === date.date);
    if (dateIndex !== -1) {
      eventSlots.value[dateIndex].slots.push(newSlot);
      await saveEventSlots(eventSlots.value);
    }
  }

  async function addEventDate(newDate) {
    eventSlots.value.push(newDate);
    await saveEventSlots(eventSlots.value);
  }

  function updatePublicationChecklist(newChecklist) {
    publicationChecklist.value = newChecklist;
  }

  function setCurrentVersion(version) {
    currentVersion.value = version;
  }

  async function saveCostEstimate(estimate) {
    // Implement API call to save cost estimate
  }

  async function publishRentalRequest() {
    if (!isPublishReady.value) {
      throw new Error("Cannot publish: Not all checklist items are completed");
    }
    // Implement API call to publish rental request
  }

  return {
    currentRentalRequestId,
    costEstimates,
    eventSlots,
    saveEventSlots,
    publicationChecklist,
    currentVersion,
    isPublishReady,
    setCurrentRentalRequest,
    updateCostEstimates,
    fetchEventSlots,
    updateEventSlot,
    addEventSlot,
    addEventDate,
    updatePublicationChecklist,
    setCurrentVersion,
    fetchRentalRequestData,
    saveCostEstimate,
    publishRentalRequest,
    rentalData,
    error,
    fetchRentalData,
  };
});
