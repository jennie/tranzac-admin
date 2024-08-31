<template>
  <div class="container mx-auto px-6 mt-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-2xl">Cost Estimate</h3>

      <div class="text-right">
        <p class="text-lg font-semibold text-stone-500 dark:text-stone-300">
          Total: {{ originalCostEstimate }}
        </p>
        <button @click.stop.prevent="openModal" type="button" class=" text-red-400 hover:text-red-300 underline">
          View Full Breakdown
        </button>

      </div>
    </div>
    <p class="text-stone-500 dark:text-stone-300 text-sm"><em>This is an estimate. Your final cost may be different
        based on final options.
        Our
        staff will be in touch to
        confirm.</em></p>
    <CostBreakdownModal v-if="isModalOpen" :costEstimates="costEstimates" @close="closeModal" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useBookingStore } from '@/stores/bookingStore';
import { useRoomMapping } from 'pricing-lib/src/composables/useRoomMapping';
import { useResources } from '@/composables/useResources';

const bookingStore = useBookingStore();
const { roomMapping } = useRoomMapping();
const { resourceOptions } = useResources();

const isModalOpen = ref(false);

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const costEstimates = computed(() => {
  return calculateCostEstimates(bookingStore.bookingFormData.rentalDates, roomMapping.value, resourceOptions.value);
});

const calculateGrandTotal = () => {
  return costEstimates.value.reduce((total, estimate) =>
    total + estimate.roomCosts.reduce((slotTotal, roomCost) => slotTotal + roomCost.totalCost, 0), 0);
};
</script>