<template>
  <USelect v-model="selectedTime" :options="timeOptions" :placeholder="placeholder"
    @update:model-value="$emit('update:modelValue', $event)" />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { parse, format, addMinutes, isBefore, subMinutes } from 'date-fns';

const props = defineProps({
  modelValue: String,
  startTime: String,
  endTime: String,
  placeholder: String
});

const emit = defineEmits(['update:modelValue']);

const selectedTime = ref(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  selectedTime.value = newValue;
});

const timeOptions = computed(() => {
  const options = [];
  const start = parse(props.startTime, 'HH:mm', new Date());
  const end = parse(props.endTime, 'HH:mm', new Date());

  // Ensure the last available time is at least 30 minutes before the end time
  const lastAvailableTime = subMinutes(end, 30);

  let current = start;

  while (isBefore(current, lastAvailableTime) || current.getTime() === lastAvailableTime.getTime()) {
    options.push({
      label: format(current, 'h:mm a'),
      value: format(current, 'HH:mm')
    });
    current = addMinutes(current, 30); // 30-minute intervals
  }

  return options;
});
</script>