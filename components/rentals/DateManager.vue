<template>
  <div>
    <!-- Add Date Section -->
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-2">Add Date</h3>
      <div class="flex items-center space-x-4">
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton icon="i-heroicons-calendar-days-20-solid" :label="newDate ? formatDate(newDate) : 'Select a date'" />
          <template #panel="{ close }">
            <ClientOnly>
              <DatePicker v-model="newDate" is-required @close="close" />
            </ClientOnly>
          </template>
        </UPopover>
        <UButton @click="triggerAddDate" :disabled="!newDate">Add Date</UButton>
      </div>
    </div>



    <!-- Slot Manager Modal -->
    <RentalsSlotManager :initialSlots="[]" :isModalOpen="isDateModalOpen" @update:slots="handleSlotsUpdate" />

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { format } from 'date-fns';

const emit = defineEmits(['update:dates', 'save-cost-estimate']);
const props = defineProps({
  initialDates: {
    type: Array,
    default: () => [],
  },
});

const newDate = ref(null);
const dates = ref([]);
const slotsForModal = ref([]);
const isDateModalOpen = ref(false);


// Initialize dates with initialDates
dates.value = [...props.initialDates];

// Watch for changes in initialDates
watch(() => props.initialDates, (newVal) => {
  dates.value = [...newVal];
});
// Trigger to add date
const triggerAddDate = () => {
  if (newDate.value) {
    console.log('Date selected: ', newDate.value); // Log to verify the button click
    isDateModalOpen.value = true; // Pass this to RentalsSlotManager to open modal
  }
};

// Close the modal
const closeModal = () => {
  isDateModalOpen.value = false;
};

const handleSlotsUpdate = (updatedSlots) => {
  const dateIndex = dates.value.findIndex(
    (dateObj) => format(dateObj.date, 'yyyy-MM-dd') === format(newDate.value, 'yyyy-MM-dd')
  );

  if (dateIndex !== -1) {
    // Merge slots with existing slots for this date
    dates.value[dateIndex].slots = [
      ...dates.value[dateIndex].slots,
      ...updatedSlots.map((slot) => ({
        ...slot,
        isNew: !slot.id, // If slot has no id, mark as new
      })),
    ];
  } else {
    dates.value.push({
      date: newDate.value,
      id: null, // No id for new date
      slots: updatedSlots.map((slot) => ({ ...slot, isNew: true })), // Mark slots as new
      showSlots: true,
      isNew: true, // Mark date as new
    });
  }

  console.log("Updated dates (with slots):", dates.value);

  emit('update:dates', dates.value);
  closeModal();
};

// Toggle display of slots for a date
const toggleDateSlots = (index) => {
  dates.value[index].showSlots = !dates.value[index].showSlots;
};

// Format date for display
const formatDate = (date) => {
  return format(date, 'MMMM d, yyyy');
};
</script>
