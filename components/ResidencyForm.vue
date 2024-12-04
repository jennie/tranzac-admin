<template>
  <div>
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Create a New Residency
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
            @click="isOpen = false" />
        </div>
      </template>

      <UForm :state="formData" class="space-y-4" @submit.prevent="handleSubmit">
        <UFormGroup name="dateRange" label="Residency Date Range" required class="grid grid-cols-2 gap-2 items-start"
          :ui="{ container: '' }">
          <UPopover :popper="{ placement: 'top-start' }">
            <UButton icon="i-heroicons-calendar-days-20-solid">
              {{ formatDate(formData.start_date) }} -
              {{ formatDate(formData.end_date) }}
            </UButton>

            <template #panel="{ close }">
              <div class="flex items-center sm:divide-x divide-gray-200 dark:divide-gray-800">
                <div class="hidden sm:flex flex-col py-4">
                  <UButton v-for="(range, index) in ranges" :key="index" :label="range.label" color="gray"
                    variant="ghost" class="rounded-none px-6" :class="[
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

        <UFormGroup name="title" label="Title" required class="grid grid-cols-2 gap-2 items-start">
          <UInput v-model="formData.title" label="Title" required />
        </UFormGroup>
        <!-- <UFormGroup name="description" label="Description" class="grid grid-cols-2 gap-2 items-start">
          <UTextarea v-model="formData.description" label="Description" />
        </UFormGroup> -->
        <div v-for="(recurrence, index) in formData.recurrences" :key="index" class="relative">
          <FrequencyFields v-if="formData.start_date && formData.end_date" :startDate="formData.start_date"
            :endDate="formData.end_date" @state-changed="updateRecurrence(index)" :hide-label="index > 0" :index="index"
            @remove="removeRecurrence(index)" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="col-start-2">
            <UButton icon="i-heroicons-plus-20-solid" variant="soft" @click="addRecurrence" class="">Add Recurrence
            </UButton>
          </div>
        </div>
        <UFormGroup name="custom_dates" label="Custom Event Dates" class="grid grid-cols-2 gap-2 items-start">
          <div v-for="(date, index) in formData.custom_dates" :key="index" class="flex items-center gap-2">
            <div class="flex flex-row justify-between w-full items-center">
              <UPopover :popper="{ placement: 'bottom-start' }">
                <UButton icon="i-heroicons-calendar-days-20-solid" :label="formatDate(date)" />
                <template #panel="{ close }">
                  <DatePicker v-model="formData.custom_dates[index]" is-required @close="close" />
                </template>
              </UPopover>
              <UButton size="xs" icon="i-heroicons-x-mark-solid" variant="soft" @click="removeCustomDate(index)" />
            </div>
          </div>
          <div :class="formData.custom_dates.length > 0 ? 'mt-4' : 'mt-0'">
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton icon="i-heroicons-plus-20-solid" variant="soft" @click="addCustomDate">
                {{ formData.custom_dates.length > 0 ? 'Add Another' : 'Add Date' }}
              </UButton>
              <template #panel="{ close }">
                <DatePicker v-model="newDate" is-required @close="close" @update:modelValue="handleNewDate" />
              </template>
            </UPopover>
          </div>
        </UFormGroup>
        <UFormGroup name="rooms" label="Rooms" class="grid grid-cols-2 gap-2 items-start"
          description="This field does not check availability.">
          <USelectMenu v-model="formData.rooms" :options="roomsOptions" label="Room(s)" multiple>
            <template #option="{ option }">
              <span class="flex items-center">
                <span>{{ option.label }}</span>
              </span>
            </template>
          </USelectMenu>
        </UFormGroup>

        <div class="modal-footer flex justify-end">
          <UButton type="submit" variant="soft" size="lg">Save</UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { format, add, isSameDay, sub, type Duration } from 'date-fns';
import FrequencyFields from '~/components/residencies/FrequencyFields.vue';
import { useRooms } from '~/composables/useRooms';

// Add this line to define emit for the 'submit' event
const emit = defineEmits(['submit']);

const isOpen = ref(false);

const formData = ref({
  title: '',
  description: '',
  start_date: new Date(),
  end_date: add(new Date(), { months: 12 }),
  custom_dates: [], // No initial value
  rooms: [],
  workflow_status: 'new',
  recurrences: [null], // Initial value with one recurrence
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

const newDate = ref(null);

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
  },
  { deep: true }
);

const formatDate = (date) => {
  return date ? format(new Date(date), "d MMM, yyyy") : '';
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

const handleSubmit = async () => {
  console.log('Form data before submission:', JSON.stringify(formData.value, null, 2));
  try {
    // Ensure the rooms field is correctly formatted as an array of strings containing only the value properties
    formData.value.rooms = formData.value.rooms.map(room => room.value);

    // Ensure the custom_dates field is correctly formatted as block records objects
    formData.value.custom_dates = formData.value.custom_dates.map(date => ({
      item_type: { type: "item_type", id: "custom_date_item_type_id" }, // Replace with actual item type ID
      date: new Date(date).toISOString(),
    }));

    // Ensure the recurrences field is correctly formatted
    const transformedRecurrences = formData.value.recurrences.filter(r => r !== null).map(recurrence => ({
      item_type: { type: "item_type", id: "ItuPaIW2SU2WmTCIJ2i0lA" },
      ...recurrence,
    }));

    const filteredFormData = {
      ...formData.value,
      recurrences: transformedRecurrences,
    };

    const response = await fetch('/api/residencies/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filteredFormData),
    });
    const result = await response.json();
    console.log('Response from server:', result);
    if (result.success) {
      console.log('Residency created successfully:', result.data);
    } else {
      console.error('Failed to create residency:', result.message);
    }
  } catch (error) {
    console.error('Error during form submission:', error);
  }
};

const updateRecurrence = (index) => (recurrence) => {
  console.log(`Updating recurrence at index ${index}:`, recurrence);
  formData.value.recurrences[index] = recurrence;
};

const addRecurrence = () => {
  console.log("Adding new recurrence");
  formData.value.recurrences.push(null);
};

const removeRecurrence = (index) => {
  console.log(`Removing recurrence at index ${index}`);
  formData.value.recurrences.splice(index, 1);
};

const updateState = (state) => {
  console.log("Updating state:", state);
  formData.value.recurrences = state;
};

const updateDates = () => {
  if (formData.value.start_date && formData.value.end_date) {
    console.log("Updating dates:", formData.value.start_date, formData.value.end_date);
    fetchRoomsOptions(); // Re-fetch room availability when dates change
  }
};

const addCustomDate = () => {
  console.log("Adding new custom date");
  newDate.value = new Date();
};

const handleNewDate = (date) => {
  if (date) {
    console.log("Handling new date:", date);
    formData.value.custom_dates.push(date);
    newDate.value = null;
  }
};

const removeCustomDate = (index) => {
  console.log(`Removing custom date at index ${index}`);
  formData.value.custom_dates.splice(index, 1);
};

const totalEvents = computed(() => {
  let count = formData.value.custom_dates.length;
  formData.value.recurrences.forEach(recurrence => {
    if (recurrence && recurrence.dates) {
      count += recurrence.dates.length;
    }
  });
  return count;
});
</script>