<template>
  <!-- Add Slot Button to trigger modal -->
  <UModal v-model="isModalOpen" :fullscreen="false">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Time Slots for {{ date }}</h3>
      </template>

      <!-- Form to manage the current slot -->
      <div v-for="(slot, index) in tempSlots" :key="index" class="mb-6">
        <!-- Slot title takes full width -->
        <UFormGroup label="Slot Title" class="w-full mb-4">
          <UInput v-model="slot.title" placeholder="Enter slot title" />
        </UFormGroup>

        <!-- Start Time and End Time fields, each take half width -->
        <div class="flex flex-wrap -mx-2">
          <div class="w-full md:w-1/2 px-2 mb-4">
            <UFormGroup label="Start Time">
              <TimeSelect v-model="slot.startTime" :options="availableTimeOptions" placeholder="Select Start Time" />
            </UFormGroup>
          </div>
          <div class="w-full md:w-1/2 px-2 mb-4">
            <UFormGroup label="End Time">
              <TimeSelect v-model="slot.endTime" :options="availableTimeOptions" placeholder="Select End Time" />
            </UFormGroup>
          </div>
        </div>

        <!-- Rooms and Resources -->
        <div class="flex flex-wrap -mx-2">
          <div class="w-full md:w-1/2 px-2 mb-4">
            <UFormGroup label="Rooms">
              <RentalsRoomSelectMenu v-model="slot.rooms" />
            </UFormGroup>
          </div>
          <div class="w-full md:w-1/2 px-2 mb-4">
            <UFormGroup label="Resources">
              <RentalsResourceSelectMenu v-model="slot.resources" />
            </UFormGroup>
          </div>
        </div>

        <!-- Remove Slot button -->
        <div v-if="index > 0" class="mt-2">
          <UButton @click="removeSlot(index)" icon="i-heroicons-trash" color="danger" variant="ghost" />
        </div>
      </div>

      <!-- Button to add more slots -->
      <div class="mt-4">
        <UButton @click="addSlot" label="Add Another Slot" color="primary" />
      </div>

      <!-- Footer -->
      <template #footer>
        <div class="flex justify-end mt-4">
          <UButton @click="closeModal" label="Cancel" color="gray" />
          <UButton @click="saveSlots" label="Save" color="primary" class="ml-2" />
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { generateTimeOptions } from '@/utils/timeUtils';
import { v4 as uuidv4 } from 'uuid';

const props = defineProps({
  initialSlots: {
    type: Array,
    default: () => [],
  },
  isModalOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:slots']); // Emits updated slots to the parent

// State to manage slots
const tempSlots = ref([...props.initialSlots]);

// Ensure at least one slot is present when modal opens
if (tempSlots.value.length === 0) {
  tempSlots.value.push({
    title: '',
    startTime: '12:00',
    endTime: '17:00',
    rooms: [],
    resources: [],
  });
}

const availableTimeOptions = ref(generateTimeOptions());

// State to manage modal visibility
const isModalOpen = ref(props.isModalOpen);

// Watch for changes in modal state
watch(() => props.isModalOpen, (newVal) => {
  isModalOpen.value = newVal;
});

// Method to close modal
const closeModal = () => {
  emit('update:slots', tempSlots.value); // Emit the updated slots before closing
  isModalOpen.value = false;
};

// Method to add a new slot
const addSlot = () => {
  tempSlots.value.push({
    title: '',
    startTime: '12:00',
    endTime: '17:00',
    rooms: [],
    resources: [],
  });
};

// Method to remove a slot
const removeSlot = (index) => {
  tempSlots.value.splice(index, 1);
};

const saveSlots = () => {
  tempSlots.value.forEach(slot => {
    slot.rooms = slot.rooms.map(room => ({
      id: room.id,
    }));
    if (!slot.id) {
      slot.isNew = true;
    }

    // slot.startTime = { time: slot.startTime || null };
    // slot.endTime = { time: slot.endTime || null };

    slot.resources = slot.resources.map(resource => resource);
  });

  console.log("Processing slots:", JSON.stringify(tempSlots.value, null, 2));

  // Emit updated slots to parent
  emit('update:slots', tempSlots.value);
  closeModal();
};


</script>
