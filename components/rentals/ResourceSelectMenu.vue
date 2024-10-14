<template>
  <USelectMenu v-model="selectedResources" :options="formattedResourceOptions" multiple placeholder="Select resources"
    option-attribute="label" value-attribute="value">
    <template #summary>
      <span v-if="selectedResources.length === 0">Select resources</span>
      <span v-else>{{ selectedResources.length }} resource(s) selected</span>
    </template>
  </USelectMenu>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useResources } from '@/composables/useResources';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const selectedResources = ref(props.modelValue);
const { resourceOptions } = useResources();

// Format resource options for USelectMenu
const formattedResourceOptions = computed(() =>
  resourceOptions.value.map(resource => ({
    label: resource.description, // Display description in the dropdown
    value: resource.id,          // Use the ID as the value
  }))
);

watch(() => props.modelValue, (newValue) => {
  selectedResources.value = newValue;
});

watch(selectedResources, (newValue) => {
  emit('update:modelValue', newValue);
});
</script>
