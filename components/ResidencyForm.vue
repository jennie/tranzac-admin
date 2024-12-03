<template>
  <form @submit.prevent="handleSubmit">
    <UFormGroup name="dateRange" label="Data Collection Date Range" description="When will you collect data?" required
      class="grid grid-cols-2 gap-2 items-center" :ui="{ container: '' }">
      <UPopover :popper="{ placement: 'top-start' }">
        <UButton icon="i-heroicons-calendar-days-20-solid">
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

    <IndicatorsFrequencyFields v-if="formData.start_date && formData.end_date" :startDate="formData.start_date"
      :endDate="formData.end_date" @state-changed="updateState" />
    <UInput v-model="formData.title" label="Title" required />
    <UInput v-model="formData.description" label="Description" type="textarea" />
    <FrequencyFields v-if="formData.start_date && formData.end_date" :startDate="formData.start_date"
      :endDate="formData.end_date" @state-changed="updateRecurrence" />
    <UInput v-model="formData.external_url" label="External URL" />
    <UInput v-model="formData.recurrence" label="Recurring Event Dates" type="textarea" />
    <UInput v-model="formData.custom_dates" label="Custom Event Dates" type="textarea" />
    <UCheckbox v-model="formData.generate_events" label="Generate Events" />
    <USelect v-model="formData.rooms" :options="roomsOptions" label="Rooms" multiple />
    <UFileUpload v-model="formData.photo" label="Photo" />
    <UGallery v-model="formData.social_media_assets" label="Social Media Assets" />
    <UInput v-model="formData.slug" label="Slug" />
    <USelect v-model="formData.workflow_status" :options="workflowStatusOptions" label="Workflow Status" />
    <USelect v-model="formData.artists" :options="artistsOptions" label="Artists" multiple />
    <UButton type="submit">Create</UButton>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { format, add, isSameDay, sub, type Duration } from 'date-fns';
import FrequencyFields from '~/components/residencies/FrequencyFields.vue';

const formData = ref({
  title: '',
  description: '',
  start_date: new Date(),
  end_date: add(new Date(), { months: 12 }),
  external_url: '',
  recurrence: '',
  custom_dates: '',
  generate_events: false,
  rooms: [],
  photo: null,
  social_media_assets: [],
  slug: '',
  workflow_status: 'new',
  artists: [],
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
  },
  { deep: true }
);

const formatDate = (date) => {
  return date ? format(date, "d MMM, yyyy") : '';
};

const roomsOptions = [
  // Populate with room options
];

const workflowStatusOptions = [
  { label: 'New', value: 'new' },
  { label: 'Resident Action Required', value: 'resident_action_required' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Approved', value: 'approved' },
];

const artistsOptions = [
  // Populate with artist options
];

const handleSubmit = () => {
  emit('submit', formData.value);
};

const updateRecurrence = (recurrence) => {
  formData.value.recurrence = recurrence;
};

const updateState = (state) => {
  formData.value.recurrence = state;
};

const updateDates = () => {
  if (formData.value.start_date && formData.value.end_date) {
    // Trigger any necessary updates when dates change
  }
};
</script>