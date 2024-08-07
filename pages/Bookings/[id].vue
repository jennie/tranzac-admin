<template>
  <UDashboardPanel grow>
    <UDashboardPanelContent class="pb-24">
      <UPageHeader v-if="rental._status === 'published'" headline="Rental" :title="rental.organization"
        icon="i-heroicons-clipboard" :description="formattedDate">
      </UPageHeader>
      <UPageHeader v-else headline="Rental Request" :title="rental.organization" :description="formattedDate"
        :links="rental._status !== 'published' ? [{ label: 'Edit', color: 'black', to: rental._editingUrl }, { label: 'Approve', color: 'green', click: approveRental }] : []"
        icon="i-heroicons-clipboard" />

      <UDivider class="mb-4" />
      <UTabs :items="tabs" class="w-full mt-8" @change="tabChange">
        <template #renter="{ item }">
          <UDashboardSection title="Submission" description="">
            <div v-for="property in rentalProperties" :key="property.key" class="grid grid-cols-2 gap-4 items-center">
              <p class="flex self-start font-bold">{{ property.label }}</p>
              <div>
                <template v-if="property.isHTML">
                  <UTextarea v-model="rental[property.key]" />
                </template>
                <template v-else>
                  <UInput v-model="rental[property.key]" />
                </template>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 items-center">
              <p class="self-start font-bold">Notes & History</p>
              <UTextarea v-model="rental.internalNotes" class="w-full text-sm font-display" />
            </div>
          </UDashboardSection>
        </template>
        <template #dates="{ item }">


          <UDashboardSection title="Rental Dates and Slots" description="">
            <div v-for="date in rental.dates || []" :key="date.id" class="mb-6">
              <h3 class="text-lg font-semibold mb-2">
                {{ formatDate(date.date) }}
                <span v-if="date.slots && date.slots.length > 0" class="text-sm font-normal">
                  ({{ formatTimeRangeReadable(date.slots[0]?.startTime?.time, date.slots[date.slots.length -
                    1]?.endTime?.time) }})
                </span>
              </h3>
              <div v-for="slot in date.slots || []" :key="slot.id"
                class="ml-4 mb-4 border border-gray-200 rounded-lg p-4">
                <!-- <pre>{{ slot }}</pre> -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="">

                    <div class="space-y-4">
                      <UFormGroup label="Title">
                        <UInput v-model="slot.title" placeholder="Enter title" />
                      </UFormGroup>
                      <UFormGroup label="Event Type">
                        <EventTypeSelect v-model="slot.eventType" />
                      </UFormGroup>
                      <UFormGroup label="Expected Attendance">
                        <UInput v-model="slot.expectedAttendance" type="number"
                          placeholder="Enter expected attendance" />
                      </UFormGroup>
                      <UFormGroup label="Description">
                        <UTextarea v-model="slot.description" placeholder="Enter description" />
                      </UFormGroup>
                    </div>
                  </div>
                  <div class="bg-stone-100 dark:bg-stone-950 p-3 rounded-md my-6 prose prose-cream dark:prose-invert">
                    <div class="flex flex-row justify-between items-center">
                      <h4 class="m-0 p-0">Important Times</h4>
                      <!-- {{ slot.endTime }} -->
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <UFormGroup label="Start Time">
                        <TimeSelect v-model="slot.startTime.time" :options="timeOptions"
                          placeholder="Select start time" />
                      </UFormGroup>
                      <UFormGroup label="End Time">
                        <TimeSelect v-model="slot.endTime.time" :options="timeOptions" placeholder="Select end time" />
                      </UFormGroup>
                      <UFormGroup label="Load In">
                        <TimeSelect v-model="slot.loadInTime.time" :options="timeOptions"
                          placeholder="Select load-in time" />
                      </UFormGroup>
                      <UFormGroup label="Sound Check">
                        <TimeSelect v-model="slot.soundCheckTime.time" :options="timeOptions"
                          placeholder="Select sound check time" />
                      </UFormGroup>
                      <UFormGroup label="Doors">
                        <TimeSelect v-model="slot.doorsTime.time" :options="timeOptions"
                          placeholder="Select doors time" />
                      </UFormGroup>
                      <UFormGroup label="Load Out">
                        <TimeSelect v-model="slot.loadOutTime.time" :options="timeOptions"
                          placeholder="Select load-out time" />
                      </UFormGroup>
                    </div>
                  </div>

                  <UFormGroup label="Rooms">
                    <RoomSelectMenu v-model="slot.rooms" :debug-mode="false" />
                  </UFormGroup>
                  <UFormGroup label="Resources">
                    <ResourceSelectMenu v-model="slot.resources" :resource-options="resourceOptions" />
                  </UFormGroup>
                </div>

                <div class="flex flex-row w-full items-center space-x-8 mt-4">
                  <UFormGroup label="Private">
                    <UToggle on-icon="i-heroicons-check-20-solid" name="private" off-icon="i-heroicons-x-mark-20-solid"
                      v-model="slot.private" size="2xl" />
                  </UFormGroup>
                  <UFormGroup label="All Ages">
                    <UToggle on-icon="i-heroicons-check-20-solid" name="allAges" off-icon="i-heroicons-x-mark-20-solid"
                      v-model="slot.allAges" size="2xl" />
                  </UFormGroup>
                </div>
              </div>
            </div>
          </UDashboardSection>
        </template>
        <template #invoice="{ item }">
          <UDashboardSection title="Cost Estimate" description="">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-2xl">Cost Estimate</h3>
              <div class="text-right">
                <p class="text-lg font-semibold text-stone-500 dark:text-stone-300">
                  Total: {{ formatCurrency(calculateGrandTotal()) }}
                </p>
                <button @click="openModal" type="button" class="text-red-400 hover:text-red-300 underline">
                  View Full Breakdown
                </button>
              </div>
            </div>
            <p class="text-stone-500 dark:text-stone-300 text-sm">
              <em>This is an estimate. Your final cost may be different based on final options. Our staff will be in
                touch
                to confirm.</em>
            </p>
            <CostBreakdownModal v-if="isModalOpen" :costEstimates="costEstimates" @close="closeModal" />
          </UDashboardSection>
        </template>
      </UTabs>
    </UDashboardPanelContent>
  </UDashboardPanel>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { format, formatDistance, isValid, parse, parseISO, addMinutes, setHours, setMinutes } from "date-fns";

import { calculateCostEstimates, formatCurrency } from '@/utils/costCalculations';

const router = useRouter();
const route = useRoute();
const bookingID = ref(router.currentRoute.value.params.id);
const id = ref(route.params.id);
const rental = reactive({});
const error = ref(null);
const isLoading = ref(true);
const isModalOpen = ref(false);
const componentKey = ref(0);

const tabs = [
  { slot: 'renter', label: 'Renter Info' },
  { slot: 'dates', label: 'Dates & Times' },
  { slot: 'invoice', label: 'Invoice' }
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

const formatSlotTimes = (slot) => {
  ['startTime', 'endTime', 'loadInTime', 'soundCheckTime', 'doorsTime', 'loadOutTime'].forEach(timeField => {
    if (slot[timeField] && slot[timeField].time) {
      slot[timeField].time = formatTimeForDisplay(slot[timeField].time);
    }
  });
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
    } else if (data.value) {
      Object.assign(rental, data.value.rental);

      // Format times for all slots
      rental.dates.forEach(date => {
        date.slots.forEach(formatSlotTimes);
      });
    }
  } catch (err) {
    console.error('An error occurred while fetching rental', err);
    error.value = err;
    throw err;
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
  { key: '_status', label: 'Status' },
  { key: '_updatedAt', label: 'Last Updated', format: (date) => isValid(new Date(date)) ? format(new Date(date), 'MMM d, y') : 'Invalid date' },
  { key: 'primaryContactName', label: 'Primary Contact Name' },
  { key: 'primaryContactEmail', label: 'Primary Contact Email' },
  { key: 'primaryContactPhone', label: 'Primary Contact Phone' },
  { key: 'primaryContactPronouns', label: 'Primary Contact Pronouns' },
  { key: 'organization', label: 'Organization' },
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
  if (rental._createdAt && isValid(new Date(rental._createdAt))) {
    return `Submitted on ${format(new Date(rental._createdAt), 'MMM d, y')} (${formatDistance(new Date(rental._createdAt), new Date(), { addSuffix: true })})`;
  } else {
    return 'Loading…';
  }
});

const { roomMapping } = useRoomMapping();
const { resourceOptions } = useResources();

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const costEstimates = computed(() => {
  if (!rental.dates) {
    return [];
  }

  return calculateCostEstimates(rental.dates, roomMapping.value, resourceOptions.value);
});

const calculateGrandTotal = () => {
  return costEstimates.value.reduce((total, estimate) =>
    total + estimate.roomCosts.reduce((slotTotal, roomCost) => slotTotal + roomCost.totalCost, 0), 0);
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

// const formatTimeForDisplay = (time) => {
//   if (!time) return '';
//   try {
//     let parsedTime;
//     if (time.includes('T')) {
//       // For ISO 8601 format (e.g., "2024-07-31T18:00:00.000Z")
//       parsedTime = parseISO(time);
//     } else {
//       // For "HH:mm" format (e.g., "17:00")
//       parsedTime = parse(time, 'HH:mm', new Date());
//     }

//     if (!isValid(parsedTime)) {
//       console.warn(`Invalid time value: ${time}`);
//       return 'Invalid time';
//     }
//     return format(parsedTime, 'h:mm a');
//   } catch (error) {
//     console.error(`Error formatting time: ${time}`, error);
//     return 'Error';
//   }
// };

const formatTimeRange = (startTime, endTime) => {
  const formattedStart = formatTimeForDisplay(startTime);
  const formattedEnd = formatTimeForDisplay(endTime);
  return `${formattedStart} - ${formattedEnd}`;
};

const formatTimeRangeReadable = (startTime, endTime) => {
  const formattedStart = format12Hour(startTime);
  const formattedEnd = format12Hour(endTime);
  return `${formattedStart} - ${formattedEnd}`;
};
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = parse(dateString, 'yyyy-MM-dd', new Date());
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return 'Invalid date';
  }
};
</script>
