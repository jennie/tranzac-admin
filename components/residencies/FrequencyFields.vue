<!-- // components/residencies/FrequencyFields.vue -->

<script setup lang="ts">
import moment from "moment-timezone";
import { Schedule, Rule } from "@rschedule/core/generators";
import { MomentTZDateAdapter } from "@rschedule/moment-tz-date-adapter";
import "@rschedule/moment-tz-date-adapter/setup";
import { useDateFormat } from "@vueuse/core";

const props = defineProps({
  startDate: {
    type: Date,
    default: () => new Date(),
  },
  endDate: {
    type: Date,
    default: () => new Date(),
  },
  hideLabel: {
    type: Boolean,
    default: false,
  },
  index: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['state-changed', 'remove']);
const occurrences = ref([]);

const TIMEZONE = "America/Toronto";

// Options definitions
const frequencyOptions = ref([
  { key: "DAILY", label: "Daily" },
  { key: "WEEKLY", label: "Weekly" },
  { key: "MONTHLY", label: "Monthly" },
  { key: "YEARLY", label: "Yearly" },
]);

const weekdayOptions = ref([
  { key: "SU", label: "Sunday", disabled: false },
  { key: "MO", label: "Monday", disabled: false },
  { key: "TU", label: "Tuesday", disabled: false },
  { key: "WE", label: "Wednesday", disabled: false },
  { key: "TH", label: "Thursday", disabled: false },
  { key: "FR", label: "Friday", disabled: false },
  { key: "SA", label: "Saturday", disabled: false },
  { key: "day", label: "Day", disabled: false },
]);

const monthDayOptions = ref([
  { key: 1, label: "1st" },
  { key: 2, label: "2nd" },
  { key: 3, label: "3rd" },
  { key: 4, label: "4th" },
  { key: 5, label: "5th" },
  { key: 6, label: "6th" },
  { key: 7, label: "7th" },
  { key: 8, label: "8th" },
  { key: 9, label: "9th" },
  { key: 10, label: "10th" },
  { key: 11, label: "11th" },
  { key: 12, label: "12th" },
  { key: 13, label: "13th" },
  { key: 14, label: "14th" },
  { key: 15, label: "15th" },
  { key: 16, label: "16th" },
  { key: 17, label: "17th" },
  { key: 18, label: "18th" },
  { key: 19, label: "19th" },
  { key: 20, label: "20th" },
  { key: 21, label: "21st" },
  { key: 22, label: "22nd" },
  { key: 23, label: "23rd" },
  { key: 24, label: "24th" },
  { key: 25, label: "25th" },
  { key: 26, label: "26th" },
  { key: 27, label: "27th" },
  { key: 28, label: "28th" },
  { key: 29, label: "29th" },
  { key: 30, label: "30th" },
  { key: 31, label: "31st" },
]);

const yearMonthOptions = ref([
  { key: 1, label: "January" },
  { key: 2, label: "February" },
  { key: 3, label: "March" },
  { key: 4, label: "April" },
  { key: 5, label: "May" },
  { key: 6, label: "June" },
  { key: 7, label: "July" },
  { key: 8, label: "August" },
  { key: 9, label: "September" },
  { key: 10, label: "October" },
  { key: 11, label: "November" },
  { key: 12, label: "December" },
]);

// Add time options
const timeOptions = ref([
  { value: "12:00", label: "12:00pm (noon)" },
  { value: "12:30", label: "12:30pm" },
  { value: "13:00", label: "1:00pm" },
  { value: "13:30", label: "1:30pm" },
  { value: "14:00", label: "2:00pm" },
  { value: "14:30", label: "2:30pm" },
  { value: "15:00", label: "3:00pm" },
  { value: "15:30", label: "3:30pm" },
  { value: "16:00", label: "4:00pm" },
  { value: "16:30", label: "4:30pm" },
  { value: "17:00", label: "5:00pm" },
  { value: "17:30", label: "5:30pm" },
  { value: "18:00", label: "6:00pm" },
  { value: "18:30", label: "6:30pm" },
  { value: "19:00", label: "7:00pm" },
  { value: "19:30", label: "7:30pm" },
  { value: "20:00", label: "8:00pm" },
  { value: "20:30", label: "8:30pm" },
  { value: "21:00", label: "9:00pm" },
  { value: "21:30", label: "9:30pm" },
  { value: "22:00", label: "10:00pm" },
  { value: "22:30", label: "10:30pm" },
  { value: "23:00", label: "11:00pm" },
  { value: "23:30", label: "11:30pm" },
  { value: "00:00", label: "12:00am" },
  { value: "01:00", label: "1:00am (next day)" },
  { value: "02:00", label: "2:00am (next day)" },
]);

// Initial state setup
const state = ref({
  frequency: null,
  start_time: null,
  end_time: null,
  frequencies: {
    daily: {
      interval: null
    },
    weekly: {
      interval: null,
      weekdays: null
    },
    monthly: {
      interval: null,
      day: null,
      weekdays: null
    },
    yearly: {
      interval: null,
      day: null,
      weekdays: null,
      month: null
    }
  }
});

const currentMonthDayOptions = ref([...monthDayOptions.value]);

const startDate = computed(() => {
  const date = moment(props.startDate ?? new Date());
  if (!date.isValid()) {
    throw new Error("Invalid start date");
  }
  return new MomentTZDateAdapter(date.tz(TIMEZONE));
});

const endDate = computed(() => {
  const date = moment(props.endDate ?? new Date());
  if (!date.isValid()) {
    throw new Error("Invalid end date");
  }
  return new MomentTZDateAdapter(date.tz(TIMEZONE));
});

const formatDate = (date: Date) => useDateFormat(ref(date), "D MMM, YYYY").value;

// Add this computed property
const isRecurrenceComplete = computed(() => {
  if (!state.value.frequency) return false;
  const freq = state.value.frequency.toLowerCase();
  const freqSettings = state.value.frequencies[freq];

  if (!freqSettings?.interval) return false;

  switch (freq) {
    case 'daily':
      return true;
    case 'weekly':
      return !!freqSettings.weekdays;
    case 'monthly':
      return !!freqSettings.day;
    case 'yearly':
      return !!freqSettings.day && !!freqSettings.month;
    default:
      return false;
  }
});

// Watch for frequency and interval changes
watch(
  [
    () => state.value.frequency,
    () => state.value.frequencies.daily?.interval,
    () => state.value.frequencies.weekly?.interval,
    () => state.value.frequencies.monthly?.interval,
    () => state.value.frequencies.yearly?.interval
  ],
  async ([frequency, dailyInterval, weeklyInterval, monthlyInterval, yearlyInterval]) => {
    if (!frequency) return;

    const freq = frequency.toLowerCase();
    let interval = null;

    switch (freq) {
      case 'daily':
        interval = dailyInterval;
        break;
      case 'weekly':
        interval = weeklyInterval;
        break;
      case 'monthly':
        interval = monthlyInterval;
        break;
      case 'yearly':
        interval = yearlyInterval;
        break;
    }

    if (interval) {
      const stateToEmit = {
        type: 'recurrence',
        attributes: {
          recurrence_frequency: freq,
          recurrence_interval: parseInt(interval),
          days_of_week: null,
          day_of_month: null,
          month_of_year: null
        }
      };

      console.log('FrequencyFields emitting state:', stateToEmit);
      emit('state-changed', stateToEmit);
    }
  },
  { immediate: true }
);

// Watch for frequency-specific field changes
watch(
  [
    () => state.value.frequencies.weekly?.weekdays,
    () => state.value.frequencies.monthly?.day,
    () => state.value.frequencies.monthly?.weekdays,
    () => state.value.frequencies.yearly?.day,
    () => state.value.frequencies.yearly?.month,
  ],
  async ([weeklyDays, monthlyDay, monthlyWeekdays, yearlyDay, yearlyMonth]) => {
    if (!state.value.frequency) return;

    const freq = state.value.frequency.toLowerCase();
    const interval = state.value.frequencies[freq]?.interval;

    if (!interval) return;

    const stateToEmit = {
      type: 'recurrence',
      attributes: {
        recurrence_frequency: freq,
        recurrence_interval: parseInt(interval),
        days_of_week: null,
        day_of_month: null,
        month_of_year: null
      }
    };

    switch (freq) {
      case 'weekly':
        if (weeklyDays?.key) {
          stateToEmit.attributes.days_of_week = [weeklyDays.key];
        }
        break;
      case 'monthly':
        if (monthlyDay?.key) {
          stateToEmit.attributes.day_of_month = parseInt(monthlyDay.key);
        }
        if (monthlyWeekdays?.key !== 'day') {
          stateToEmit.attributes.days_of_week = [monthlyWeekdays.key];
        }
        break;
      case 'yearly':
        if (yearlyDay?.key) {
          stateToEmit.attributes.day_of_month = parseInt(yearlyDay.key);
        }
        if (yearlyMonth?.key) {
          stateToEmit.attributes.month_of_year = yearlyMonth.key.toString();
        }
        break;
    }

    console.log('FrequencyFields emitting state update:', stateToEmit);
    emit('state-changed', stateToEmit);
  },
  { deep: true }
);

// Add watch for time changes
watch(
  [() => state.value.start_time, () => state.value.end_time],
  ([startTime, endTime]) => {
    if (!state.value.frequency) return;

    const freq = state.value.frequency.toLowerCase();
    const interval = state.value.frequencies[freq]?.interval;

    if (!interval) return;

    // Get the existing state first
    const stateToEmit = {
      type: 'recurrence',
      attributes: {
        recurrence_frequency: freq,
        recurrence_interval: parseInt(interval),
        days_of_week: null,
        day_of_month: null,
        month_of_year: null,
        start_time: startTime,
        end_time: endTime
      }
    };

    // Add any existing frequency-specific attributes
    switch (freq) {
      case 'weekly':
        if (state.value.frequencies.weekly.weekdays?.key) {
          stateToEmit.attributes.days_of_week = [state.value.frequencies.weekly.weekdays.key];
        }
        break;
      case 'monthly':
        if (state.value.frequencies.monthly.day?.key) {
          stateToEmit.attributes.day_of_month = parseInt(state.value.frequencies.monthly.day.key);
        }
        if (state.value.frequencies.monthly.weekdays?.key !== 'day') {
          stateToEmit.attributes.days_of_week = [state.value.frequencies.monthly.weekdays.key];
        }
        break;
      case 'yearly':
        if (state.value.frequencies.yearly.day?.key) {
          stateToEmit.attributes.day_of_month = parseInt(state.value.frequencies.yearly.day.key);
        }
        if (state.value.frequencies.yearly.month?.key) {
          stateToEmit.attributes.month_of_year = state.value.frequencies.yearly.month.key.toString();
        }
        break;
    }

    console.log('FrequencyFields emitting state with times:', stateToEmit);
    emit('state-changed', stateToEmit);
  }
);

// Update the watch handlers to call updateOccurrences when any relevant field changes
watch(
  [
    () => state.value.frequency,
    () => state.value.frequencies.daily?.interval,
    () => state.value.frequencies.weekly?.interval,
    () => state.value.frequencies.weekly?.weekdays,
    () => state.value.frequencies.monthly?.interval,
    () => state.value.frequencies.monthly?.day,
    () => state.value.frequencies.yearly?.interval,
    () => state.value.frequencies.yearly?.day,
    () => state.value.frequencies.yearly?.month,
    () => props.startDate, // Watch for changes in startDate
    () => props.endDate // Watch for changes in endDate
  ],
  async () => {
    await updateOccurrences();
  },
  { deep: true }
);

// Schedule and rule generation
const schedule = new Schedule({
  rrules: [],
});

function generateRecurrenceRule(state) {
  if (!state.frequency) return null;

  let rule;
  let byDayOfWeek;
  let interval;

  if (state.frequency === 'MONTHLY') {
    const intervalObj = state.frequencies.monthly.interval;
    interval = intervalObj ? parseInt(intervalObj.key, 10) : NaN;
  } else {
    const intervalStr = state.frequencies[state.frequency.toLowerCase()].interval;
    interval = intervalStr ? parseInt(intervalStr, 10) : NaN;
  }

  console.log(`Generating rule for frequency: ${state.frequency}`);
  console.log(`Interval: ${interval}`);
  console.log(`State:`, state);

  if (isNaN(interval)) {
    console.warn("Interval is not a number or not provided yet");
    return null;
  }

  switch (state.frequency) {
    case "DAILY":
      rule = new Rule({
        frequency: "DAILY",
        interval,
        start: startDate.value,
        end: endDate.value,
      });
      break;
    case "WEEKLY":
      rule = new Rule({
        frequency: "WEEKLY",
        interval,
        byDayOfWeek: state.frequencies.weekly.weekdays ? [state.frequencies.weekly.weekdays.key] : undefined,
        start: startDate.value,
        end: endDate.value,
      });
      break;
    case "MONTHLY":
      byDayOfWeek =
        state.frequencies.monthly.weekdays?.key !== "day"
          ? [
            [
              state.frequencies.monthly.weekdays?.key,
              parseInt(state.frequencies.monthly.day?.key, 10),
            ],
          ]
          : undefined;
      if (byDayOfWeek && byDayOfWeek[0][0] === undefined) {
        byDayOfWeek = undefined;
      }
      rule = new Rule({
        frequency: "MONTHLY",
        interval,
        byDayOfWeek,
        start: startDate.value,
        end: endDate.value,
      });
      break;
    case "YEARLY":
      if (state.frequencies.yearly.weekdays?.key !== "day") {
        byDayOfWeek = [
          [
            state.frequencies.yearly.weekdays?.key,
            parseInt(state.frequencies.yearly.day?.key, 10),
          ],
        ];
      }
      const byDayOfMonth =
        state.frequencies.yearly.weekdays?.key === "day"
          ? [parseInt(state.frequencies.yearly.day?.key, 10)]
          : undefined;
      rule = new Rule({
        frequency: "YEARLY",
        interval,
        byMonthOfYear: [parseInt(state.frequencies.yearly.month?.key, 10)],
        ...(byDayOfWeek && { byDayOfWeek }),
        ...(byDayOfMonth && { byDayOfMonth }),
        start: startDate.value,
        end: endDate.value,
      });
      break;
  }

  console.log(`Generated rule:`, rule);
  return rule;
}

async function updateOccurrences() {
  emit("state-changed", state.value);
  occurrences.value = [];

  try {
    const rule = generateRecurrenceRule(state.value);
    if (rule) {
      schedule.rrules = [rule];

      for (const occurrence of rule.occurrences({
        start: startDate.value,
        take: 5,
      })) {
        occurrences.value.push(occurrence.date);
      }
    }
  } catch (error) {
    console.error("Failed to update occurrences:", error);
  }
}

onMounted(async () => {
  console.log("Start Date:", startDate.value);
  console.log("End Date:", endDate.value);
  await updateOccurrences();
});


</script>

<template>
  <!-- Remove the label and description here since it will come from the parent -->
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-4">
      <span class="text-xs uppercase text-primary font-bold">Rule {{ props.index + 1 }}</span>
      <UButton v-if="props.index > 0" size="xs" icon="i-heroicons-x-mark-solid" variant="soft"
        @click="$emit('remove')" />
    </div>

    <!-- Frequency Selection -->
    <div class="space-y-4">
      <USelectMenu v-model="state.frequency" :options="frequencyOptions" class="w-full" placeholder="Select frequency"
        value-attribute="key" option-attribute="label" />

      <div v-if="state.frequency === 'DAILY'" class="flex flex-wrap space-y-4">
        <div class="flex flex-col mt-4 w-full">
          <span class="text-stone-500 dark:text-stone-400 text-xs mb-1">Every</span>
          <UInput type="number" v-model="state.frequencies.daily.interval" class="w-full" name="daily-interval"
            placeholder="Enter interval">
            <template #trailing>
              <span class="text-stone-500 dark:text-stone-400 text-xs">days</span>
            </template>
          </UInput>
        </div>
      </div>
      <!-- Weekly -->
      <div v-if="state.frequency === 'WEEKLY'">
        <div class="flex flex-col my-4 w-full">
          <span class="text-stone-500 dark:text-stone-400 text-xs mb-1">Every</span>
          <UInput type="number" v-model="state.frequencies.weekly.interval" class="w-full" name="weekly-interval"
            placeholder="Enter interval">
            <template #trailing>
              <span class="text-stone-500 dark:text-stone-400 text-xs">weeks</span>
            </template>
          </UInput>
        </div>
        <div class="flex flex-col w-full">
          <span class="text-stone-500 dark:text-stone-400 text-xs mb-1">On</span>
          <USelectMenu v-model="state.frequencies.weekly.weekdays" :options="weekdayOptions" label="On" class="w-full"
            placeholder="Select day" option-attribute="label" />
        </div>
      </div>

      <!-- Monthly -->
      <div v-if="state.frequency === 'MONTHLY'" class="">
        <div class="w-full mt-4  text-stone-500 dark:text-stone-400 text-xs mb-1">Every</div>
        <div class="flex flex-row mb-4 items-center">

          <USelectMenu v-model="state.frequencies.monthly.interval"
            :options="[...Array(11).keys()].map(i => ({ key: i + 1, label: (i + 1).toString() }))" class="w-full mr-2"
            placeholder="Select interval">
          </USelectMenu>

          <span class="text-stone-500 dark:text-stone-400 text-xs">months</span>
        </div>
        <div class="flex flex-col w-full">
          <span class="text-stone-500 dark:text-stone-400 text-xs mb-1">On the</span>
          <div class="flex space-x-2 w-full">
            <USelectMenu type="number" v-model="state.frequencies.monthly.day" class="w-1/2 mb-2"
              :options="currentMonthDayOptions" placeholder="Select day">
            </USelectMenu>
            <USelectMenu v-model="state.frequencies.monthly.weekdays"
              :options="[{ key: 'day', label: 'Day' }, ...weekdayOptions]" label="On" class="w-1/2"
              placeholder="Select day" option-attribute="label" />
          </div>
        </div>
      </div>

      <!-- Yearly -->
      <div v-if="state.frequency === 'YEARLY'">
        <div class="flex flex-col my-4 w-full">
          <span class="text-stone-500 dark:text-stone-400 text-xs mb-1">Every</span>
          <UInput type="number" v-model="state.frequencies.yearly.interval" class="w-full" name="yearly-interval"
            placeholder="Enter interval">
            <template #trailing>
              <span class="text-stone-500 dark:text-stone-400 text-xs">years</span>
            </template>
          </UInput>
        </div>
        <div class="flex flex-col my-4 w-full">
          <span class="text-stone-500 dark:text-stone-400 text-xs mb-1">On the</span>
          <USelectMenu type="number" v-model="state.frequencies.yearly.day" class="w-full mb-2"
            :options="currentMonthDayOptions" option-attribute="label" placeholder="Select day">
          </USelectMenu>

          <USelectMenu v-model="state.frequencies.yearly.weekdays"
            :options="[{ key: 'day', label: 'Day' }, ...weekdayOptions]" label="On" class="w-full"
            placeholder="Select day" option-attribute="label" />
        </div>

        <div class="flex flex-col mt-4 w-full">
          <span class="text-stone-500 dark:text-stone-400 text-xs mb-1">Of</span>
          <USelectMenu type="number" v-model="state.frequencies.yearly.month" class="w-full" option-value="key"
            :options="yearMonthOptions" placeholder="Select month">
          </USelectMenu>
        </div>
      </div>

      <!-- Time Selection -->
      <div v-if="state.frequency" class="space-y-4">
        <div class="grid grid-cols-2 gap-2">
          <USelectMenu v-model="state.start_time" :options="timeOptions" placeholder="Start time"
            option-attribute="label" value-attribute="value" />
          <USelectMenu v-model="state.end_time" :options="timeOptions" placeholder="End time" option-attribute="label"
            value-attribute="value" />
        </div>
      </div>

      <!-- Occurrence Preview -->
      <div v-if="state.frequency" class="text-sm text-stone-500 dark:text-stone-400 italic">
        <span v-if="occurrences.length === 0">No upcoming dates found</span>
        <span v-else>Next: {{ occurrences.map((date) => formatDate(date)).join("; ") }}</span>
      </div>

      <UDivider v-if="state.frequency" />
    </div>
  </div>
</template>
<style scoped>
.frequencySection {
  @apply space-y-4;
}

.no-shrink {
  flex-shrink: 0;
}
</style>
