<template>
  <div class="invoice-item flex items-center justify-between space-x-4 py-2">
    <span class="flex-grow">{{ item.description }}</span>
    <div class="flex items-center space-x-2">
      <UInput v-model="localAmount" @input="updateAmount" type="number" step="1" class="w-28" :ui="{
        wrapper: 'flex-shrink-0',
        input: 'text-right'
      }" />
      <UButton @click="removeItem" color="red" variant="ghost" icon="i-heroicons-trash" size="sm" />
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
});

const emit = defineEmits(['update', 'remove']);

const localAmount = ref(props.item.amount);

watch(() => props.item.amount, (newAmount) => {
  localAmount.value = newAmount;
});

const removeItem = () => {
  emit('remove', props.item);
};

const updateAmount = () => {
  const newAmount = localAmount.value ? parseFloat(localAmount.value) : 0;
  emit('update', { ...props.item, amount: newAmount });
};
</script>