<template>
  <UModal :modelValue="true" @close="$emit('close')" :ui="{ container: 'modal-container', card: 'modal-card' }">
    <UForm :state="localSlot" @submit="save" :validate="validateSlot">
      <UCard :ui="{ base: 'modal-card-content', ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <h3 class="text-xl font-semibold dark:text-stone-200">Full Cost Breakdown</h3>
        </template>
        <div class="space-y-6">
          <div v-for="(estimate, index) in costEstimates" :key="index"
            class="dark:bg-stone-950 border dark:border-stone-700 rounded-md overflow-hidden">
            <div class="dark:bg-stone-800 px-4 py-2 dark:text-stone-100 font-semibold">
              Slot {{ index + 1 }}: {{ formatDate(estimate.slot.start) }} - {{ formatDate(estimate.slot.end) }}
            </div>
            <div class="p-4 space-y-4">
              <div v-for="(roomCost, roomIndex) in estimate.roomCosts" :key="roomIndex" class="flex flex-col space-y-2">
                <div class="flex justify-between items-center bg-stone-200 dark:bg-stone-900 px-4 py-2 rounded-md">
                  <span class="dark:text-stone-200 font-medium">{{ roomCost.roomName }}</span>
                  <span class="dark:text-stone-200 font-medium">{{ formatCurrency(roomCost.totalCost) }}</span>
                </div>
                <div class="flex flex-col space-y-1 px-4">
                  <div class="flex justify-between text-sm">
                    <span class="text-stone-400">Base Price</span>
                    <span class="dark:text-stone-200">{{ formatCurrency(roomCost.basePrice) }}</span>
                  </div>
                  <div v-for="(cost, costIndex) in roomCost.additionalCosts" :key="costIndex"
                    class="flex justify-between text-sm">
                    <span class="text-stone-400">{{ cost.description }}</span>
                    <span class="dark:text-stone-200">{{ formatCurrency(cost.cost) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-stone-200 dark:bg-stone-800 px-4 py-2 flex justify-between items-center">
              <span class="dark:text-stone-200 font-semibold">Slot Total</span>
              <span class="dark:text-stone-200 font-semibold">{{ formatCurrency(calculateSlotTotal(estimate))
                }}</span>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex flex-row justify-between">
            <span class="dark:text-stone-100 font-semibold">Grand Total</span>
            <span class="dark:text-stone-100 font-semibold">{{ formatCurrency(calculateGrandTotal()) }}</span>
          </div>
        </template>
      </UCard>
    </UForm>
  </UModal>
</template>

<script setup>

const props = defineProps({
  costEstimates: {
    type: Array,
    required: true
  }
});

const calculateSlotTotal = (estimate) => {
  return estimate.roomCosts.reduce((total, roomCost) => total + roomCost.totalCost, 0);
};

const calculateGrandTotal = () => {
  return props.costEstimates.reduce((total, estimate) => total + calculateSlotTotal(estimate), 0);
};
</script>
