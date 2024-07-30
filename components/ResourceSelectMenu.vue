<template>
  <USelectMenu v-model="selectedResources" :options="resourceOptions" multiple placeholder="Select resources"
    option-attribute="label" value-attribute="value">
    <template #summary>
      <span v-if="selectedResources.length === 0">Select resources</span>
      <span v-else>{{ selectedResources.length }} resource(s) selected</span>
    </template>
  </USelectMenu>
</template>

<script setup>
import { ref, watch } from 'vue';
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

watch(() => props.modelValue, (newValue) => {
  selectedResources.value = newValue;
});

watch(selectedResources, (newValue) => {
  emit('update:modelValue', newValue);
});
</script>