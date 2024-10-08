<!-- /pages/rental-requests/[id].vue -->
<template>
  <UDashboardPanel grow>
    <UDashboardPanelContent class="pb-24">
      <UPageHeader v-if="rental._status === 'published'" headline="Rental" :title="rental.organization"
        icon="i-heroicons-clipboard" :description="formattedDate" />
      <UPageHeader v-else headline="Rental Request" :title="rental.organization" :description="formattedDate"
        :links="rental._status !== 'published' ? [editButtonConfig, cancelButtonConfig, approveRentalConfig].filter(link => link !== null) : []"
        icon="i-heroicons-clipboard" />

      <UDivider class="mb-4" />
      <UTabs :items="tabs" class="w-full mt-8" @change="tabChange">
        <template #renter="{ item }">
          <UDashboardSection title="Submission" description="">
            <div v-for="property in rentalProperties" :key="property.key" class="grid grid-cols-2 gap-4 items-center">
              <p class="flex self-start font-bold">{{ property.label }}</p>
              <div>
                <template v-if="editMode && !property.readOnly">
                  <UInput v-if="property.type === 'text'" v-model="rental[property.key]" />
                  <UTextarea v-else-if="property.type === 'textarea'" v-model="rental[property.key]" />
                  <UToggle v-else-if="property.type === 'boolean'" v-model="rental[property.key]" />
                  <UInput v-else-if="property.type === 'number'" v-model.number="rental[property.key]" type="number" />
                </template>
                <template v-else>
                  {{ getFormattedValue(rental[property.key], property) }}
                </template>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 items-center">
              <p class="self-start font-bold">Notes & History</p>
              <UTextarea v-model="rental.internalNotes" class="w-full text-sm font-display" />
            </div>

          </UDashboardSection>
        </template>

        <template #costEstimates="{ item }">
          <UDashboardSection>
            <div class="flex justify-between items-center mb-4">
              <div class="text-right">
                <p class="text-lg font-semibold text-stone-500 dark:text-stone-300">
                  Original Estimate: {{ formatCurrency(rental.originalCostEstimate) }} <span
                    class="text-stone-400 text-sm">excluding
                    tax</span>
                </p>
              </div>
            </div>
            <CostEstimateEditor v-if="costEstimateData" :rental-request="costEstimateData"
              :rental-request-id="id.toString()" @close="closeModal" @save="handleSave" />

          </UDashboardSection>
        </template>
        <template #events="{ item }">
          <RentalsEventsSection :rental="rental" />
        </template>

      </UTabs>
    </UDashboardPanelContent>
  </UDashboardPanel>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { format, formatDistance, isValid, parse, parseISO, addMinutes, setHours, setMinutes } from "date-fns";
import { formatCurrency, formatDate, formatTimeRange } from '@/utils/formatters';
import { useResources } from '@/composables/useResources';

onMounted(async () => {
  await fetchRoomMapping();

});

const router = useRouter();
const route = useRoute();
const bookingID = ref(router.currentRoute.value.params.id);
const id = ref(route.params.id);
const rental = ref(null);
const error = ref(null);
const isLoading = ref(true);
const isModalOpen = ref(false);
const componentKey = ref(0);
const { resourceOptions } = useResources();

const tabs = [
  { slot: 'renter', label: 'Renter Info' },
  { slot: 'costEstimates', label: 'Estimate' },
  { slot: 'events', label: 'Events' }
];

const QUERY = `
  query Rental($id: ItemId!) {
    rental(filter: {id: {eq: $id}}) {
      id
      _status
      _createdAt
      _editingUrl
      _updatedAt
      inquiryStatus
      internalNotes
      organization
      originalCostEstimate
      primaryContactEmail
      primaryContactName
      primaryContactPhone
      primaryContactPronouns
      dates {
        id
        date
        slots {
          id
          title
          startTime {
            time
          }
          endTime {
            time
          }
          allAges
          description
          doorsTime {
            time
          }
          eventType
          expectedAttendance
          loadInTime {
            time
          }
          loadOutTime {
            time
          }
          private
          resources
          rooms {
            name
            id
          }
          soundCheckTime {
            time
          }
        }
      }
    }
  }
`;


const roomMapping = ref([]);

async function fetchRoomMapping() {
  try {
    const response = await fetch('/api/getRoomMapping');
    const data = await response.json();
    if (data.success) {
      roomMapping.value = data.data;
    } else {
      console.error('Failed to fetch room mapping:', data.error);
    }
  } catch (err) {
    console.error('Error fetching room mapping:', err);
  }
}



const timeOptions = computed(() => {
  const options = [];
  for (let i = 0; i < 48; i++) {
    const date = setMinutes(setHours(new Date(), Math.floor(i / 2)), (i % 2) * 30);
    options.push({
      label: format(date, 'h:mm a'),
      value: format(date, 'HH:mm')
    });
  }
  return options;
});
const getFormattedValue = (value, property) => {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  if (property.format) {
    return property.format(value);
  }
  return value;
};
const updateTime = (slot, timeType, newValue) => {
  if (!slot[timeType]) {
    slot[timeType] = {};
  }
  slot[timeType].time = newValue;
};
const format12Hour = (time) => {
  if (!time) return '';
  try {
    let parsedTime;
    if (time.includes('T')) {
      parsedTime = parseISO(time);
    } else {
      parsedTime = parse(time, 'HH:mm', new Date());
    }
    if (isValid(parsedTime)) {
      return format(parsedTime, 'h:mm a');
    }
  } catch (error) {
    console.error(`Error formatting time: ${time}`, error);
  }
  return '';
};

const formatTimeForDisplay = (time) => {
  if (!time) return '';
  try {
    let parsedTime;
    if (time.includes('T')) {
      parsedTime = parseISO(time);
    } else {
      parsedTime = parse(time, 'HH:mm', new Date());
    }
    if (isValid(parsedTime)) {
      return format(parsedTime, 'HH:mm'); // Keep 24-hour format for data storage
    }
    console.warn(`Invalid time format: ${time}`);
    return '';
  } catch (error) {
    console.error(`Error formatting time: ${time}`, error);
    return '';
  }
};

const formatSlotTime = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startFormatted = startDate.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  let endFormatted = endDate.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
  });

  if (startDate.toDateString() !== endDate.toDateString()) {
    endFormatted = endDate.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }

  return `${startFormatted} - ${endFormatted}`;
};




const formatSlotTimes = (slot) => {
  const formatTimeIfExists = (timeObj) => {
    if (timeObj && timeObj.time) {
      timeObj.time = formatTimeForDisplay(timeObj.time);
    }
  };

  formatTimeIfExists(slot.startTime);
  formatTimeIfExists(slot.endTime);
  formatTimeIfExists(slot.loadInTime);
  formatTimeIfExists(slot.soundCheckTime);
  formatTimeIfExists(slot.doorsTime);
  formatTimeIfExists(slot.loadOutTime);
};

const fetchRental = async () => {
  try {
    const { data, error: fetchError } = await useGraphqlQuery({
      query: QUERY,
      variables: { id: id.value },
      includeDrafts: true,
    });

    if (fetchError.value) {
      console.error('Failed to fetch rental', fetchError.value);
      throw fetchError.value;
    } else if (data.value && data.value.rental) {
      rental.value = data.value.rental;
      //       // console.log('Fetched rental data:', rental.value);

      // Format times for all slots
      if (rental.value.dates && Array.isArray(rental.value.dates)) {
        rental.value.dates.forEach(date => {
          if (date.slots && Array.isArray(date.slots)) {
            date.slots.forEach(formatSlotTimes);
          }
        });
      }
    } else {
      console.error('No rental data received');
      rental.value = null;
    }
  } catch (err) {
    console.error('An error occurred while fetching rental', err);
    error.value = err;
    rental.value = null;
  }
};

await fetchRental();

watch(() => route.params.id, async (newId) => {
  if (newId !== id.value) {
    id.value = newId;
    await fetchRental();
  }
});


const getNestedProperty = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || '';
};


const rentalProperties = [
  // { key: '_status', label: 'Status', type: 'text', readOnly: true },
  // { key: '_updatedAt', label: 'Last Updated', type: 'text', readOnly: true, format: (date) => isValid(new Date(date)) ? format(new Date(date), 'MMM d, y') : 'Invalid date' },
  { key: 'primaryContactName', label: 'Primary Contact Name', type: 'text' },
  { key: 'primaryContactEmail', label: 'Primary Contact Email', type: 'text' },
  { key: 'primaryContactPhone', label: 'Primary Contact Phone', type: 'text' },
  { key: 'primaryContactPronouns', label: 'Primary Contact Pronouns', type: 'text' },
  { key: 'organization', label: 'Organization', type: 'text' },
  { key: 'internalNotes', label: 'Internal Notes', type: 'textarea' },
  { key: 'inquiryStatus', label: 'Inquiry Status', type: 'text' },
  { key: 'originalCostEstimate', label: 'Original Cost Estimate', type: 'number', format: (value) => formatCurrency(value) },
];


const slotProperties = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'startTime.time', label: 'Start Time', type: 'time' },
  { key: 'endTime.time', label: 'End Time', type: 'time' },
  { key: 'allAges', label: 'All Ages', type: 'checkbox' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'doorsTime.time', label: 'Doors Time', type: 'time' },
  { key: 'eventType', label: 'Event Type', type: 'text' },
  { key: 'expectedAttendance', label: 'Expected Attendance', type: 'number' },
  { key: 'loadInTime.time', label: 'Load In Time', type: 'time' },
  { key: 'loadOutTime.time', label: 'Load Out Time', type: 'time' },
  { key: 'private', label: 'Private Event', type: 'checkbox' },
  { key: 'resources', label: 'Resources', type: 'select' },
  { key: 'rooms', label: 'Rooms', type: 'select' },
  { key: 'soundCheckTime.time', label: 'Sound Check Time', type: 'time' },
];


const formatTime = (time) => {
  if (!time) return '';
  try {
    let parsedTime;
    if (time.includes('T')) {
      // For ISO 8601 format (e.g., "2024-07-31T18:00:00.000Z")
      parsedTime = parseISO(time);
    } else {
      // For "HH:mm" format (e.g., "17:00")
      parsedTime = parse(time, 'HH:mm', new Date());
    }

    if (!isValid(parsedTime)) {
      console.warn(`Invalid time value: ${time}`);
      return '';
    }
    return format(parsedTime, 'HH:mm');
  } catch (error) {
    console.error(`Error formatting time: ${time}`, error);
    return '';
  }
};

const formattedDate = computed(() => {
  if (rental.value._createdAt && isValid(new Date(rental.value._createdAt))) {
    return `Submitted on ${format(new Date(rental.value._createdAt), 'MMM d, y')} (${formatDistance(new Date(rental.value._createdAt), new Date(), { addSuffix: true })})`;
  } else {
    return 'Loading…';
  }
});


const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};




const availableRooms = computed(() => {
  return roomMapping.value.map(room => ({ label: room.name, value: room.id }));
});

const updateNestedProperty = (obj, path, value) => {
  const parts = path.split('.');
  const last = parts.pop();
  const parent = parts.reduce((acc, part) => acc && acc[part], obj);
  if (parent && last) {
    parent[last] = value;
  }
};
function tabChange(index) {
  const selectedTab = tabs[index];

}
const approveRental = async () => {
  try {
    isLoading.value = true;
    const response = await fetch(`/api/rentals/${id.value}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to approve rental');
    }

    // Refresh the rental data after approval
    await fetchRental();

    // Show a success message (you can replace this with your preferred notification method)
    alert('Rental approved successfully');
  } catch (err) {
    console.error('Error approving rental:', err);
    // Show an error message
    alert('Failed to approve rental. Please try again.');
  } finally {
    isLoading.value = false;
  }
};

const editableFields = [
  'organization',
  'primaryContactName',
  'primaryContactEmail',
  'primaryContactPhone',
  'primaryContactPronouns',
  'internalNotes',
  'inquiryStatus',
];
watch(rental, (newValue) => {
  //   console.log('Rental data changed:', newValue);
}, { deep: true });

const saveRentalChanges = async () => {
  if (!rental.value) {
    console.error('No rental data to save');
    return;
  }
  try {
    isSaving.value = true;

    const editableData = {};
    editableFields.forEach(field => {
      if (rental.value[field] !== undefined) {
        // Convert camelCase to snake_case
        const snakeCaseField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        editableData[snakeCaseField] = rental.value[field];
      }
    });

    //     // console.log("Current rental data:", rental.value);
    //     // console.log("Editable fields:", editableFields);
    //     // console.log("Sending update data:", editableData);

    const { data: result } = await useFetch(`/api/rentalRequests/${id.value}/update`, {
      method: 'PUT',
      body: editableData,
    });

    //     // console.log("Received result:", result.value);

    if (result.value && result.value.body) {
      Object.assign(rental.value, result.value.body);
      editMode.value = false;
      alert(result.value.message || 'Rental updated successfully');
    }
    editMode.value = false;

  } catch (error) {
    console.error('Error saving rental changes:', error);
    alert('Error updating rental. Please try again.');
  } finally {
    isSaving.value = false;
  }
};


const formatTimeRangeReadable = (startTime, endTime) => {
  const formattedStart = format12Hour(startTime);
  const formattedEnd = format12Hour(endTime);
  return `${formattedStart} - ${formattedEnd}`;
};

const handleSave = ({ rental: updatedRental, roomCosts }) => {
  // Update your rental object with the new data
  // You might need to merge this data carefully depending on your needs
  rental.dates = updatedRental.dates;

  // Process roomCosts as needed
  //   // console.log('Room costs:', roomCosts);

  // Close the modal
  closeModal();
};
const editMode = ref(false);
const isSaving = ref(false);
const originalRental = ref(null);

// Ensure editMode is handled properly
const editButtonConfig = computed(() => {
  return {
    label: isSaving.value ? 'Saving...' : editMode.value ? 'Save Changes' : 'Edit',
    color: isSaving.value ? 'primary' : editMode.value ? 'primary' : 'black',
    click: handleEditOrSave,
    loading: isSaving.value,
    disabled: isSaving.value
  };
});

const cancelButtonConfig = computed(() => {
  return editMode.value
    ? {
      label: 'Cancel',
      color: 'red',
      click: cancelEditMode,
    }
    : null;
});

const handleEditOrSave = async () => {
  if (editMode.value) {
    // Handle save logic
    await saveRentalChanges();
  } else {
    // Enter edit mode
    enterEditMode();
  }
};

const enterEditMode = () => {
  // Store a deep copy of the current rental data
  originalRental.value = JSON.parse(JSON.stringify(rental.value));
  editMode.value = true;
};

const cancelEditMode = () => {
  // Revert to the original rental data
  if (originalRental.value) {
    rental.value = JSON.parse(JSON.stringify(originalRental.value));
  }
  editMode.value = false;
};


const costEstimateData = computed(() => {
  if (!rental.value || !rental.value.dates) return null;
  return {
    rentalRequestId: id.value,
    inquiryStatus: rental.value.inquiryStatus,
    internalNotes: rental.value.internalNotes,
    organization: rental.value.organization,
    originalCostEstimate: rental.value.originalCostEstimate,
    primaryContactEmail: rental.value.primaryContactEmail,
    primaryContactName: rental.value.primaryContactName,
    primaryContactPhone: rental.value.primaryContactPhone,
    primaryContactPronouns: rental.value.primaryContactPronouns,

    dates: rental.value.dates.map(date => ({
      id: date.id,
      date: date.date,
      slots: date.slots.map(slot => ({
        id: slot.id,
        title: slot.title,
        start: slot.startTime.time,
        end: slot.endTime.time,
        rooms: slot.rooms.map(room => room.id),
        resources: slot.resources,
        private: slot.private,
        expectedAttendance: slot.expectedAttendance,
        rateDescription: slot.rateDescription || ''
      }))
    }))
  };
});


const approveRentalConfig = {
  label: 'Approve',
  color: 'green',
  click: approveRental,
};


</script>
