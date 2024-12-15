<!-- // /components/ResidencyForm.vue -->

<template>
  <UForm :state="formData" class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Date Range -->
    <UFormGroup name="dateRange" label="Residency Date Range" required class="grid grid-cols-2 gap-2 items-start"
      :ui="{ container: '' }">
      <UPopover :popper="{ placement: 'bottom-start' }">
        <UButton block icon="i-heroicons-calendar-days-20-solid">
          {{ formatDate(formData.start_date) }} -
          {{ formatDate(formData.end_date) }}
        </UButton>

        <template #panel="{ close }">
          <div class="flex items-center sm:divide-x divide-gray-200 dark:divide-gray-800">
            <div class="hidden sm:flex flex-col py-4">
              <UButton v-for="(range, index) in ranges" :key="index" :label="range.label" color="gray" variant="ghost"
                class="rounded-none px-6" :class="[
                  isRangeSelected(range.duration)
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                ]" truncate @click="selectRange(range.duration)" />
            </div>
            <DatePicker v-model="selected" @close="close" />
          </div>
        </template>
      </UPopover>
    </UFormGroup>

    <!-- Title -->
    <UFormGroup name="title" label="Title" required class="grid grid-cols-2 gap-2 items-start">
      <UInput v-model="formData.title" placeholder="Enter residency title" required size="xl" />
    </UFormGroup>

    <!-- Recurrence Rules -->
    <UFormGroup name="recurrence" label="Recurrence" description="How often will the residency occur?"
      class="grid grid-cols-2 gap-2 items-start">
      <template #description>
        <span class="text-sm text-gray-500">How often will the residency occur?</span>
      </template>

      <div class="space-y-4">
        <div v-for="(recurrence, index) in formData.recurrence" :key="index">
          <FrequencyFields v-if="formData.start_date && formData.end_date" :startDate="formData.start_date"
            :endDate="formData.end_date" @state-changed="(recurrence) => updateRecurrence(index, recurrence)"
            :hide-label="index > 0" :index="index" @remove="removeRecurrence(index)" />
        </div>

        <UButton icon="i-heroicons-plus-20-solid" variant="soft" size="sm" class="mt-4" @click="addRecurrence">
          Add Recurrence Rule
        </UButton>
      </div>
    </UFormGroup>

    <!-- Custom Dates -->
    <UFormGroup name="custom_dates" label="Custom Event Dates" class="grid grid-cols-2 gap-2 items-start">
      <div class="space-y-3">
        <div v-for="(date, index) in formData.custom_dates" :key="index"
          class="flex flex-col gap-2 p-3 border rounded-lg border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton block icon="i-heroicons-calendar-days-20-solid" :label="formatDate(date.date)" />
              <template #panel="{ close }">
                <!-- <DatePicker v-model="formData.custom_dates[index].date" @close="close" /> -->
                <DatePicker v-model="formData.custom_dates[index].date" @dayclick="(_, event) => {
                  event.target.blur();
                }" @close="close" />

              </template>
            </UPopover>
            <UButton size="xs" icon="i-heroicons-x-mark-solid" variant="soft" @click="removeCustomDate(index)"
              class="ml-2" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <USelectMenu v-model="date.start_time" :options="timeOptions" placeholder="Start time"
              option-attribute="label" value-attribute="value" />
            <USelectMenu v-model="date.end_time" :options="timeOptions" placeholder="End time" option-attribute="label"
              value-attribute="value" />
          </div>
        </div>
        <UButton icon="i-heroicons-plus-20-solid" variant="soft" size="sm" @click="addCustomDate">
          {{ formData.custom_dates.length > 0 ? 'Add Another Date' : 'Add Custom Date' }}
        </UButton>
      </div>
    </UFormGroup>

    <!-- Rooms -->
    <UFormGroup name="rooms" label="Rooms" class="grid grid-cols-2 gap-2 items-start"
      description="This field does not check availability.">
      <USelectMenu v-model="formData.rooms" :options="roomsOptions" placeholder="Select room(s)" multiple>
        <template #option="{ option }">
          <span class="flex items-center">
            <span>{{ option.label }}</span>
          </span>
        </template>
      </USelectMenu>
    </UFormGroup>

    <!-- Submit Button -->
    <div class="flex justify-end mt-8">
      <UButton type="submit" size="lg">Save Residency</UButton>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { format, add, isSameDay, sub, type Duration } from 'date-fns';
import FrequencyFields from '~/components/residencies/FrequencyFields.vue';
import { useRooms } from '~/composables/useRooms';
import { generateTimeOptions } from '~/utils/timeUtils';

// Remove isOpen ref and modal-specific code
const emit = defineEmits(['submit']);

const timeOptions = ref(generateTimeOptions());

const formData = ref({
  title: '',
  description: '',
  start_date: new Date(),
  end_date: add(new Date(), { months: 12 }),
  custom_dates: [], // Each item will now have {date, start_time, end_time}
  rooms: [],
  workflow_status: 'new',
  recurrence: [], // Initialize as empty array
});

const ranges = [
  { label: "Next month", duration: { months: 1 }, isFuture: true },
  { label: "Next 3 months", duration: { months: 3 }, isFuture: true },
  { label: "Next 6 months", duration: { months: 6 }, isFuture: true },
  { label: "Next year", duration: { years: 1 }, isFuture: true },
];

const selected = ref({
  start: new Date(),
  end: add(new Date(), { months: 12 }),
});

function selectRange(duration: Duration, isFuture = true) {
  const compareFn = isFuture ? add : sub;
  selected.value = { start: new Date(), end: compareFn(new Date(), duration) };
}

function isRangeSelected(duration: Duration, isFuture = false) {
  const compareFn = isFuture ? add : sub;
  return (
    isSameDay(selected.value.start, new Date()) &&
    isSameDay(selected.value.end, compareFn(new Date(), duration))
  );
}

watch(
  selected,
  (newVal) => {
    formData.value.start_date = newVal.start;
    formData.value.end_date = newVal.end;
    updateDates(); // Call updateDates when date range changes
  },
  { deep: true }
);

// Modify the formatDate function to handle both Date objects and date range objects
const formatDate = (date) => {
  try {
    if (!date) return '';
    // Handle date range object
    if (date.start) {
      return format(new Date(date.start), "d MMM, yyyy");
    }
    // Handle regular Date object
    return format(new Date(date), "d MMM, yyyy");
  } catch (error) {
    console.error("Invalid date value:", date, error);
    return '';
  }
};

const { rooms, isLoading, error, fetchRooms } = useRooms();

const roomsOptions = ref([]);

const fetchRoomsOptions = async () => {
  await fetchRooms();
  roomsOptions.value = rooms.value.map((room) => ({
    label: room.name,
    value: room.id,
  }));
};

onMounted(fetchRoomsOptions);

const workflowStatusOptions = [
  { label: 'New', value: 'new' },
  { label: 'Resident Action Required', value: 'resident_action_required' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Approved', value: 'approved' },
];

const updateRecurrence = (index, recurrence) => {
  console.log(`Updating recurrence at index ${index}:`, recurrence);

  if (recurrence && recurrence.type === 'recurrence' && recurrence.attributes) {
    formData.value.recurrence.splice(index, 1, recurrence);
    console.log('Updated form recurrence data:', JSON.stringify(formData.value.recurrence, null, 2));
  } else {
    console.warn(`Invalid recurrence data received for index ${index}:`, recurrence);
  }
};

const addRecurrence = () => {
  console.log("Adding new recurrence");
  const emptyRecurrence = {
    type: 'recurrence',
    attributes: {
      recurrence_frequency: null,
      recurrence_interval: null,
      days_of_week: null,
      day_of_month: null,
      month_of_year: null
    }
  };
  formData.value.recurrence.push(emptyRecurrence);
  console.log('Added new recurrence entry:', JSON.stringify(emptyRecurrence, null, 2));
};

const handleSubmit = async () => {
  try {
    console.log("Form Data before processing:", JSON.stringify(formData.value, null, 2));

    const filteredFormData = {
      ...formData.value,
      rooms: formData.value.rooms.map(room => room.value).filter(Boolean),
      custom_dates: formData.value.custom_dates.map(date => {
        const startDate = new Date(date.date);
        const endDate = new Date(date.date);

        // Parse times and adjust dates
        if (date.start_time) {
          const [hours, minutes] = date.start_time.split(':');
          startDate.setHours(parseInt(hours), parseInt(minutes), 0);
        }
        if (date.end_time) {
          const [hours, minutes] = date.end_time.split(':');
          endDate.setHours(parseInt(hours), parseInt(minutes), 0);
          // If end time is earlier than start time, it's the next day
          if (date.end_time < date.start_time) {
            endDate.setDate(endDate.getDate() + 1);
          }
        }

        return {
          start_datetime: startDate.toISOString(),
          end_datetime: endDate.toISOString()
        };
      }),
      recurrence: formData.value.recurrence.filter(r =>
        r?.attributes?.recurrence_frequency &&
        r?.attributes?.recurrence_interval
      )
    };

    console.log("Request Data to be sent:", JSON.stringify(filteredFormData, null, 2));

    const response = await fetch('/api/residencies/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filteredFormData),
    });

    const result = await response.json();
    if (result.success) {
      emit('submit', result);
      console.log('Residency created successfully:', result.data);
    } else {
      console.error('Failed to create residency:', result.message);
    }
  } catch (error) {
    console.error('Error during form submission:', error);
  }
};

const removeRecurrence = (index) => {
  console.log(`Removing recurrence at index ${index}`);
  formData.value.recurrence.splice(index, 1);
  console.log(`Form Data after removing recurrence:`, JSON.stringify(formData.value.recurrence, null, 2));
};

const updateState = (state) => {
  console.log("Updating state:", state);
  formData.value.recurrence = state;  // Changed from recurrences to recurrence
};

const updateDates = () => {
  if (formData.value.start_date && formData.value.end_date) {
    console.log("Updating dates:", formData.value.start_date, formData.value.end_date);
    fetchRoomsOptions(); // Re-fetch room availability when dates change
    // Update recurrences appropriately
    formData.value.recurrence.forEach((recurrence, index) => {
      updateRecurrence(index, recurrence);
    });
  }
};

const addCustomDate = () => {
  console.log("Adding new custom date");
  formData.value.custom_dates.push({
    date: new Date(),
    start_time: null,
    end_time: null
  });

  const lastIndex = formData.value.custom_dates.length - 1;
};



watch(() => formData.value.custom_dates, (newVal) => {
  console.log('Custom dates:', JSON.stringify(newVal, null, 2))
})

const removeCustomDate = (index) => {
  console.log(`Removing custom date at index ${index}`);
  formData.value.custom_dates.splice(index, 1);
};

const totalEvents = computed(() => {
  let count = formData.value.custom_dates.length;
  formData.value.recurrence.forEach(recurrence => {
    if (recurrence && recurrence.dates) {
      count += recurrence.dates.length;
    }
  });
  return count;
});


</script>