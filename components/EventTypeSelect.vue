<template>
  <USelectMenu v-model="selectedEventType" :options="eventTypeOptions" placeholder="Select event type"
    @update:model-value="updateEventType" :value="selectedEventType" />
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const eventTypeOptions = [
  { label: 'Performance, festival', value: 'Performance, festival' },
  { label: 'Rehearsal', value: 'Rehearsal' },
  { label: 'Meeting', value: 'Meeting' },
  { label: 'Filming', value: 'Filming' },
  { label: 'Launch Event', value: 'Launch Event' },
  { label: 'Conference, panel, workshop', value: 'Conference, panel, workshop' },
  { label: 'Party, ceremony, memorial, or similar gathering', value: 'Party, ceremony, memorial, or similar gathering' },
];

const selectedEventType = ref(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  selectedEventType.value = newValue;
});

const updateEventType = (value) => {
  selectedEventType.value = value;
  emit('update:modelValue', value);
};
</script>