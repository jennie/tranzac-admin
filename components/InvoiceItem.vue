<template>
  <div class="invoice-item flex items-center justify-between space-x-4 py-2">
    <div class="flex flex-col flex-start">
      <div class="flex-grow">{{ item.description }}</div>
      <div v-if="item.subDescription" class="text-sm dark:text-stone-300">
        {{ item.subDescription }}
      </div>
    </div>
    <div v-if="item.regularRate && item.regularRate !== item.appliedRate" class="text-sm text-stone-300">
      Regular rate: {{ formatCurrency(item.regularRate) }}/hour
    </div>
    <div v-if="item.isFullDay == true" class="flex flex-col text-sm">
      <div class="flex justify-between text-base">
        <span class="text-stone-200 font-bold">Full Day Flat Rate</span>
        <span class="text-sm">{{ formatCurrency(item.fullDayPrice) }}</span>
      </div>
    </div>
    <div class="flex items-center space-x-2">
      {{ formatCurrency(localAmount) }}
      <UButton v-if="removable && !item.isRequired" @click="removeItem" color="red" variant="ghost"
        icon="i-heroicons-trash" size="sm" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  removable: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update', 'remove']);

const localAmount = ref(props.item.cost);

watch(() => props.item.cost, (newAmount) => {
  localAmount.value = newAmount;
});


const removeItem = () => {
  emit('remove', props.item.id);
};

const updateAmount = () => {
  const newAmount = localAmount.value ? parseFloat(localAmount.value) : 0;
  emit('update', { ...props.item, cost: newAmount });
};
</script>