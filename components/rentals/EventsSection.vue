<template>
  <UDashboardSection title="Events" description="Manage event details for this rental">
    <div v-if="isLoading" class="text-center py-4">
      <p>Loading event data...</p>
    </div>
    <div v-else-if="!rentalData || !rentalData.dates || rentalData.dates.length === 0" class="text-center py-4">
      <p>No events found for this rental.</p>
    </div>
    <div v-else>
      <div v-for="date in rentalData.dates" :key="date.id" class="mb-6">
        <h3 class="text-lg font-semibold mb-2">
          {{ formatDate(date.date) }}
          <span v-if="date.slots && date.slots.length > 0" class="text-sm font-normal">
            ({{ formatTimeRangeReadable(date.slots[0]?.startTime?.time, date.slots[date.slots.length -
              1]?.endTime?.time) }})
          </span>
        </h3>
        <div v-for="slot in date.slots" :key="slot.id" class="mb-4  py-6 divide-y divide-stone-600">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-4">
              <UFormGroup label="Title">
                <UInput v-model="slot.title" placeholder="Enter title" size="xl" />
              </UFormGroup>
              <div class="grid grid-cols-2 gap-4 mb-4">

                <UFormGroup label="Event Type">
                  <EventTypeSelect v-model="slot.eventType" />
                </UFormGroup>
                <UFormGroup label="Expected Attendance">
                  <UInput v-model="slot.expectedAttendance" type="number" placeholder="Enter expected attendance" />
                </UFormGroup>
              </div>
              <UFormGroup label="Description">
                <UTextarea v-model="slot.description" placeholder="Enter description" rows="8" size="xl" />
              </UFormGroup>
              <UFormGroup label="Featured Image">
                <div v-if="slot.featuredImage">
                  <img :src="slot.featuredImage?.url" alt="Featured Image" class="rounded-lg" />
                </div>
                <div v-else>
                  <UFileUpload v-model="slot.featuredImage" />
                </div>
              </UFormGroup>
            </div>
            <div class="bg-stone-100 dark:bg-stone-950 p-3 rounded-md my-6 prose prose-cream dark:prose-invert">
              <div class="flex flex-row justify-between items-center mb-4">
                <h4 class="m-0 p-0">Important Times</h4>
              </div>
              <UDivider class="my-4" label="For the Staff Calendar" />
              <div class="grid grid-cols-2 gap-4 mb-4">

                <UFormGroup label="Slot Start Time">
                  <TimeSelect :model-value="slot.startTime?.time"
                    @update:model-value="updateTime(slot, 'startTime', $event)" :options="generateTimeOptions(slot)"
                    placeholder="Select start time" />
                </UFormGroup>
                <UFormGroup label="Slot End Time">
                  <TimeSelect :model-value="slot.endTime?.time"
                    @update:model-value="updateTime(slot, 'endTime', $event)" :options="generateTimeOptions(slot)"
                    placeholder="Select end time" />
                </UFormGroup>
              </div>



              <div class="grid grid-cols-2 gap-4 mb-4">
                <UFormGroup label="Load In">
                  <TimeSelect :model-value="slot.loadInTime?.time"
                    @update:model-value="updateTime(slot, 'loadInTime', $event)" :options="generateTimeOptions(slot)"
                    placeholder="Select load-in time" />
                </UFormGroup>

                <UFormGroup label="Doors">
                  <TimeSelect :model-value="slot.doorsTime?.time"
                    @update:model-value="updateTime(slot, 'doorsTime', $event)" :options="generateTimeOptions(slot)"
                    placeholder="Select doors time" />
                </UFormGroup>
              </div>
              <div class="grid grid-cols-2 gap-4">

                <UFormGroup label="Sound Check">
                  <TimeSelect :model-value="slot.soundCheckTime?.time"
                    @update:model-value="updateTime(slot, 'soundCheckTime', $event)"
                    :options="generateTimeOptions(slot)" placeholder="Select sound check time" />
                </UFormGroup>
                <UFormGroup label="Load Out">
                  <TimeSelect :model-value="slot.loadOutTime?.time"
                    @update:model-value="updateTime(slot, 'loadOutTime', $event)" :options="generateTimeOptions(slot)"
                    placeholder="Select load-out time" />
                </UFormGroup>
              </div>
              <UDivider class="my-4" label="For the Public Website" />
              <div class="grid grid-cols-2 gap-4">

                <UFormGroup label="Event Start Time">
                  <TimeSelect :model-value="slot.eventStartTime?.time"
                    @update:model-value="updateTime(slot, 'eventStartTime', $event)"
                    :options="generateTimeOptions(slot)" placeholder="Select event start time" />
                </UFormGroup>
                <UFormGroup label="Event End Time">
                  <TimeSelect :model-value="slot.eventEndTime?.time"
                    @update:model-value="updateTime(slot, 'eventEndTime', $event)" :options="generateTimeOptions(slot)"
                    placeholder="Select event end time" />
                </UFormGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UDashboardSection>
  <UButton @click="saveChanges" color="primary" size="xl">Save Changes</UButton>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAdminBookingStore } from '@/stores/adminBookingStore';
import { formatDate, formatTimeRange, formatTimeRangeReadable } from '@/utils/formatters';
import { useResources } from '@/composables/useResources';
import { parseISO, format, addMinutes, isBefore, isValid, set } from 'date-fns';

const props = defineProps({
  rental: {
    type: Object,
    required: true
  },

});
import { storeToRefs } from 'pinia';

const store = useAdminBookingStore();
const {
  groupedCostEstimatesData,
  totalCost,
  taxAmount,
  totalWithTax,
  rentalData,
  eventSlots,
  costEstimateVersions,
  currentVersionNumber,
  hasChanges,
  sendButtonLabel
} = storeToRefs(store);

const { resourceOptions } = useResources();

const isLoading = ref(true);

const startTime = ref('12:00'); // default to 12 PM if not set in rentalData
const endTime = ref('02:00'); // default to 2 AM next day if not set in rentalData

// If you have dynamic values based on rentalData, set them here
// watch(rentalData, (newData) => {
//   if (newData && newData.dates && newData.dates.length > 0) {
//     const firstSlot = newData.dates[0].slots[0];
//     if (firstSlot && firstSlot.startTime?.time) {
//       startTime.value = format(parse(firstSlot.startTime.time, 'HH:mm', new Date()), 'HH:mm');
//     }
//     if (firstSlot && firstSlot.endTime?.time) {
//       endTime.value = format(parse(firstSlot.endTime.time, 'HH:mm', new Date()), 'HH:mm');
//     }
//   }
// });
const parseTime = (timeString) => {
  let parsedTime;
  if (timeString.includes('T')) {
    parsedTime = parseISO(timeString);
  } else {
    parsedTime = parse(timeString, 'HH:mm', new Date());
  }
  return isValid(parsedTime) ? parsedTime : null;
};


const generateTimeOptions = (slot) => {
  // console.log('slot:', slot);
  const options = [];

  // Get start and end times for the slot, default to your fallback times if missing
  let start = parseTime(slot.startTime?.time || "12:00");
  let end = parseTime(slot.endTime?.time || "02:00");
  // console.log('start:', parseTime(slot.startTime?.time));
  // Validate start and end times
  if (!start || !end) return options;

  // Calculate the last available time, 30 minutes before `end`
  const lastAvailableTime = addMinutes(end, -30);

  // Generate time options at 30-minute intervals
  let current = start;
  while (isBefore(current, lastAvailableTime) || current.getTime() === lastAvailableTime.getTime()) {
    const formattedTime = format(current, 'HH:mm');
    const displayTime = format(current, 'h:mm a');

    options.push({
      label: displayTime,
      value: formattedTime
    });

    current = addMinutes(current, 30);
  }
  // console.log('options:', options);
  return options;
};


const updateTime = (slot, timeType, newValue) => {
  slot[timeType] = { time: newValue };
};

const saveChanges = async () => {
  try {
    const formatTime = (time) => {
      if (!time) return null;
      // Assuming time is in 'HH:mm' format
      return time;
    };

    const slotsToSave = {
      id: rentalData.value.id,
      dates: rentalData.value.dates.map((date) => ({
        id: date.id,
        item_type: { type: 'item_type', id: 'cwRsY1rZSIOSbW3OskrujQ' },
        date: date.date,
        slots: date.slots.map((slot) => ({
          id: slot.id,
          item_type: { type: 'item_type', id: 'bjqdSfOJTgO3CtUSEVUrMw' },
          title: slot.title,
          description: slot.description,
          event_type: slot.eventType || '',
          expected_attendance: slot.expectedAttendance,
          all_ages: slot.allAges,
          private: slot.private,
          resources: slot.resources,
          start_time: formatTime(slot.startTime?.time),
          end_time: formatTime(slot.endTime?.time),
          load_in_time: formatTime(slot.loadInTime?.time),
          sound_check_time: formatTime(slot.soundCheckTime?.time),
          doors_time: formatTime(slot.doorsTime?.time),
          load_out_time: formatTime(slot.loadOutTime?.time),
          event_start_time: formatTime(slot.eventStartTime?.time),
          event_end_time: formatTime(slot.eventEndTime?.time),
          rooms: slot.rooms,
        })),
      })),
    };

    console.log('Saving event slots:', JSON.stringify(slotsToSave, null, 2));
    await store.saveEventSlots(slotsToSave);
    console.log('Changes saved successfully');
  } catch (error) {
    console.error('Error saving changes:', error);
  }
};



onMounted(async () => {
  isLoading.value = true;
  store.setCurrentRentalRequest(props.rental.id);
  await store.fetchRentalData();
  isLoading.value = false;
});

watch(() => props.rental.id, async (newId) => {
  if (newId) {
    isLoading.value = true;
    store.setCurrentRentalRequest(newId);
    await store.fetchRentalData();
    isLoading.value = false;
  }
});
watch(rentalData, (newData) => {
  console.log('rentalData updated:', newData);
}, { deep: true });
</script>