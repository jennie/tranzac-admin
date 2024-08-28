<template>
  <div class="invoice-item flex justify-between items-center">
    <span>{{ item.description }}</span>
    <div class="flex items-center">
      <input type="number" v-model.number="item.amount" class="amount-input" @input="updateAmount" />
      <button @click="removeItem">Remove</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update', 'remove']);

const removeItem = () => {
  emit('remove', item);
};

const updateAmount = (newValue) => {
  emit('update', { ...item, amount: newValue });
};
</script>

<style scoped>
.amount-input {
  width: 100px;
  margin-right: 10px;
}
</style>
