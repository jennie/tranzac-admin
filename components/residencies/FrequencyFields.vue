<script lang="ts" setup>
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

const formatDate = (date: Date) =>
  useDateFormat(ref(date), "D MMM, YYYY").value;
const occurrences = ref([]);
const emit = defineEmits(["state-changed", "remove"]);

const schedule = new Schedule({
  rrules: [],
});

const TIMEZONE = "America/Toronto";

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
  { key: "day", label: "Day", disabled: false }, // Ensure this option is included
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

const currentMonthDayOptions = ref([...monthDayOptions.value]);
const selectedDay = computed({
  get: () => state.value.frequencies.monthly.day,
  set: (value) => {
    state.value.frequencies.monthly.day = value;
  },
});

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

const state = ref({
  frequency: null, // No initial value
  frequencies: {
    daily: { interval: null },
    weekly: {
      interval: null,
      weekdays: null,
    },
    monthly: {
      interval: null,
      day: null,
      weekdays: null,
    },
    yearly: {
      interval: null,
      day: null,
      weekdays: null,
      month: null,
    },
  },
});

const isRecurrenceComplete = computed(() => {
  switch (state.value.frequency) {
    case 'DAILY':
      return state.value.frequencies.daily.interval !== null;
    case 'WEEKLY':
      return state.value.frequencies.weekly.interval !== null && state.value.frequencies.weekly.weekdays !== null;
    case 'MONTHLY':
      return state.value.frequencies.monthly.interval !== null && state.value.frequencies.monthly.day !== null && state.value.frequencies.monthly.weekdays !== null;
    case 'YEARLY':
      return state.value.frequencies.yearly.interval !== null && state.value.frequencies.yearly.day !== null && state.value.frequencies.yearly.weekdays !== null && state.value.frequencies.yearly.month !== null;
    default:
      return false;
  }
});

function emitState() {
  emit("state-changed", state.value);
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

const formattedStartDate = computed(() => startDate.value ? formatDate(startDate.value.date) : '');
const formattedEndDate = computed(() => endDate.value ? formatDate(endDate.value.date) : '');

onMounted(async () => {
  console.log("Start Date:", startDate.value);
  console.log("End Date:", endDate.value);
  await updateOccurrences();
});

watch(
  [() => state, state.frequency, startDate, endDate],
  () => {
    updateOccurrences();
  },
  { deep: true },
);
function generateRecurrenceRule(state) {
  if (!state.frequency) return null;

  let rule;
  let byDayOfWeek;
  switch (state.frequency) {
    case "DAILY":
      rule = new Rule({
        frequency: "DAILY",
        interval: state.frequencies?.daily.interval,
        start: startDate.value,
        end: endDate.value,
      });
      break;
    case "WEEKLY":
      rule = new Rule({
        frequency: "WEEKLY",
        interval: state.frequencies?.weekly.interval,
        byDayOfWeek: [state.frequencies?.weekly.weekdays?.key],
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
              state.frequencies.monthly.day?.key,
            ],
          ]
          : undefined;
      rule = new Rule({
        frequency: "MONTHLY",
        interval: state.frequencies?.monthly.interval,
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
            parseInt(state.frequencies.yearly.day?.key),
          ],
        ];
      }
      const byDayOfMonth =
        state.frequencies.yearly.weekdays?.key === "day"
          ? [parseInt(state.frequencies.yearly.day?.key)]
          : undefined;
      rule = new Rule({
        frequency: "YEARLY",
        byMonthOfYear: [state.frequencies.yearly.month?.key],
        ...(byDayOfWeek && { byDayOfWeek }),
        ...(byDayOfMonth && { byDayOfMonth }),
        start: startDate.value,
        end: endDate.value,
      });
      break;
  }
  return rule;
}

function createFrequencyWatcher(frequency) {
  return watch(
    () => state.value.frequencies[frequency].day,
    (newDay) => {
      let isweekdayDisabled = false;

      weekdayOptions.value.forEach((option) => {
        option.disabled = newDay?.key > 4;
        if (option.key === state.value.frequencies[frequency].weekdays?.key) {
          isweekdayDisabled = option.disabled;
        }
      });

      if (isweekdayDisabled) {
        state.value.frequencies[frequency].weekdays = {
          key: "day",
          label: "Day",
        };
      }
    },
  );
}

createFrequencyWatcher("monthly");
createFrequencyWatcher("yearly");
</script>

<template>
  <UFormGroup name="frequency" :label="!props.hideLabel ? 'Recurrence' : ''"
    :description="!props.hideLabel ? 'How often will the residency occur?' : ''" class="grid grid-cols-2 gap-2"
    :ui="{ container: '' }">
    <div class="col-span-2 flex items-center justify-between mb-2">
      <span class="text-xs uppercase text-primary font-bold">Rule {{ props.index + 1 }}</span>
      <UButton v-if="props.index > 0" size="xs" variant="soft" @click="$emit('remove')">x clear</UButton>
    </div>
    <USelectMenu v-model="state.frequency" :options="[{ key: null, label: 'No recurrence' }, ...frequencyOptions]"
      label="Frequency" class="w-full" placeholder="Select frequency" value-attribute="key" option-attribute="label" />
    <!-- Daily -->
    <div v-if="state.frequency === 'DAILY'" class="flex flex-wrap space-y-4">
      <div class="flex flex-col mt-4 w-full">
        <span class="text-gray-500 dark:text-gray-400 text-xs mb-1">Every</span>
        <UInput type="number" v-model="state.frequencies.daily.interval" class="w-full" name="daily-interval"
          placeholder="Enter interval">
          <template #trailing>
            <span class="text-gray-500 dark:text-gray-400 text-xs">days</span>
          </template>
        </UInput>
      </div>
    </div>
    <!-- Weekly -->
    <div v-if="state.frequency === 'WEEKLY'">
      <div class="flex flex-col my-4 w-full">
        <span class="text-gray-500 dark:text-gray-400 text-xs mb-1">Every</span>
        <UInput type="number" v-model="state.frequencies.weekly.interval" class="w-full" name="weekly-interval"
          placeholder="Enter interval">
          <template #trailing>
            <span class="text-gray-500 dark:text-gray-400 text-xs">weeks</span>
          </template>
        </UInput>
      </div>
      <div class="flex flex-col w-full">
        <span class="text-gray-500 dark:text-gray-400 text-xs mb-1">On</span>
        <USelectMenu v-model="state.frequencies.weekly.weekdays" :options="weekdayOptions" label="On" class="w-full"
          placeholder="Select day" option-attribute="label" />
      </div>
    </div>

    <!-- Monthly -->
    <div v-if="state.frequency === 'MONTHLY'">
      <div class="flex flex-col my-4 w-full">
        <span class="text-gray-500 dark:text-gray-400 text-xs mb-1">Every</span>
        <UInput type="number" v-model="state.frequencies.monthly.interval" class="w-full" name="monthly-interval"
          placeholder="Enter interval">
          <template #trailing>
            <span class="text-gray-500 dark:text-gray-400 text-xs">months</span>
          </template>
        </UInput>
      </div>
      <div class="flex flex-col w-full">
        <span class="text-gray-500 dark:text-gray-400 text-xs mb-1">On the</span>
        <USelectMenu type="number" v-model="state.frequencies.monthly.day" class="w-full mb-2"
          :options="currentMonthDayOptions" placeholder="Select day">
        </USelectMenu>

        <USelectMenu v-model="state.frequencies.monthly.weekdays"
          :options="[{ key: 'day', label: 'Day' }, ...weekdayOptions]" label="On" class="w-full"
          placeholder="Select day" option-attribute="label" />
      </div>
    </div>

    <!-- Yearly -->
    <div v-if="state.frequency === 'YEARLY'">
      <div class="flex flex-col my-4 w-full">
        <span class="text-gray-500 dark:text-gray-400 text-xs mb-1">Every</span>
        <UInput type="number" v-model="state.frequencies.yearly.interval" class="w-full" name="yearly-interval"
          placeholder="Enter interval">
          <template #trailing>
            <span class="text-gray-500 dark:text-gray-400 text-xs">years</span>
          </template>
        </UInput>
      </div>
      <div class="flex flex-col my-4 w-full">
        <span class="text-gray-500 dark:text-gray-400 text-xs mb-1">On the</span>
        <USelectMenu type="number" v-model="state.frequencies.yearly.day" class="w-full mb-2"
          :options="currentMonthDayOptions" option-attribute="label" placeholder="Select day">
        </USelectMenu>

        <USelectMenu v-model="state.frequencies.yearly.weekdays"
          :options="[{ key: 'day', label: 'Day' }, ...weekdayOptions]" label="On" class="w-full"
          placeholder="Select day" option-attribute="label" />
      </div>

      <div class="flex flex-col mt-4 w-full">
        <span class="text-gray-500 dark:text-gray-400 text-xs mb-1">Of</span>
        <USelectMenu type="number" v-model="state.frequencies.yearly.month" class="w-full" option-value="key"
          :options="yearMonthOptions" placeholder="Select month">
        </USelectMenu>
      </div>
    </div>

    <div v-if="isRecurrenceComplete" class="items-center">
      <div class="flex items-center my-4">
        <span class="text-gray-500 dark:text-gray-400 text-xs mr-2 italic">
          <span v-if="occurrences.length === 0 && state.frequency !== null">No upcoming dates found</span>
          <span v-else>Next:
            {{ occurrences.map((date) => formatDate(date)).join("; ") }}</span>
        </span>
      </div>
    </div>
  </UFormGroup>
</template>
<style scoped>
.frequencySection {
  @apply space-y-4;
}
</style>
