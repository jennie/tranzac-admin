<template>
  <USelectMenu searchable searchable-placeholder="Start typing..." :model-value="displayValue"
    @update:model-value="updateValue" :options="formattedOptions" :placeholder="placeholder" />
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { format, parse, isValid } from 'date-fns';

const props = defineProps({
  modelValue: {
    type: String,
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

const displayValue = computed(() => {
  return format12Hour(props.modelValue);
});

const formattedOptions = computed(() => {
  return props.options.map(option => ({
    label: format12Hour(option.value),
    value: option.value
  }));
});

const format12Hour = (time) => {
  if (!time) return '';
  try {
    const parsedTime = parse(time, 'HH:mm', new Date());
    if (isValid(parsedTime)) {
      return format(parsedTime, 'h:mm a');
    }
  } catch (error) {
    console.error(`Error formatting time: ${time}`, error);
  }
  return '';
};

const format24Hour = (time) => {
  if (!time) return '';
  try {
    const parsedTime = parse(time, 'h:mm a', new Date());
    if (isValid(parsedTime)) {
      return format(parsedTime, 'HH:mm');
    }
  } catch (error) {
    console.error(`Error formatting time: ${time}`, error);
  }
  return '';
};

const updateValue = (newValue) => {
  // Convert the 12-hour format back to 24-hour format
  const time24 = format24Hour(newValue);
  emit('update:modelValue', time24);
};

// Watch for changes in modelValue and update displayValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    const formatted = format12Hour(newValue);
    if (formatted !== displayValue.value) {
      displayValue.value = formatted;
    }
  }
});
</script>