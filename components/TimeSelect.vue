<template>
  <USelectMenu :model-value="displayValue" @update:model-value="onSelectChange" :options="formattedOptions"
    option-attribute="label" :placeholder="placeholder" />
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { format, parse, parseISO, isValid } from 'date-fns';

const props = defineProps({
  modelValue: {
    type: [String, Object],
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Select time'
  }
});

const emit = defineEmits(['update:modelValue']);

const displayValue = ref('');

const onSelectChange = (selectedOption: string) => {
  emit('update:modelValue', selectedOption);
};

const formattedOptions = computed(() => {
  return props.options.map(option => ({
    label: format12Hour(option.value),
    value: option.value // This should be in 'HH:mm' format
  }));
});

const format12Hour = (time: string): string => {
  if (!time) return "";
  try {
    const parsedTime = parse(time, "HH:mm", new Date());
    if (isValid(parsedTime)) {
      return format(parsedTime, "h:mm a");
    }
  } catch (error) {
    console.error(`Error formatting time: ${time}`, error);
  }
  return "";
};

const extractTimeAndFormat12Hour = (value: string | object): string => {
  if (!value) return '';
  try {
    let timeString: string;
    if (typeof value === 'object' && value !== null && 'value' in value) {
      timeString = (value as { value: string }).value;
    } else if (typeof value === 'string') {
      timeString = value;
    } else {
      return '';
    }

    // Check if the timeString is in 'HH:mm' format
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      const parsedTime = parse(timeString, "HH:mm", new Date());
      if (isValid(parsedTime)) {
        return format(parsedTime, 'h:mm a');
      }
    }

    // If not in 'HH:mm' format, try parsing as ISO
    const parsedTime = parseISO(timeString);
    if (isValid(parsedTime)) {
      return format(parsedTime, 'h:mm a');
    }
  } catch (error) {
    console.error(`Error extracting and formatting time:`, error);
  }
  return '';
};

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    displayValue.value = extractTimeAndFormat12Hour(newValue);
  } else {
    displayValue.value = '';
  }
}, { immediate: true });
</script>