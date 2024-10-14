<template>
  <div>
    <USelectMenu v-model="selectedRoomIds" :options="roomOptions" multiple placeholder="Select rooms"
      option-attribute="label" value-attribute="value">
      <template #summary>
        <span v-if="selectedRoomIds.length === 0">Select rooms</span>
        <span v-else>{{ selectedRoomIds.length }} room(s) selected</span>
      </template>
    </USelectMenu>
    <p v-if="isLoading">Loading rooms...</p>
    <p v-if="error">Error: {{ error }}</p>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRooms } from '@/composables/useRooms';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  debugMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);
const selectedRoomIds = ref(props.modelValue.map(room => room.id));

const { rooms, isLoading, error } = useRooms();

// Ensure rooms have both name and id (and optionally slug if needed)
const roomOptions = computed(() => {
  return rooms.value.map(room => ({
    label: room.name,
    value: room.id
  }));
});

// Watch modelValue only for meaningful changes
watch(() => props.modelValue, (newValue) => {
  const newRoomIds = newValue.map(room => room.id);
  if (JSON.stringify(selectedRoomIds.value) !== JSON.stringify(newRoomIds)) {
    selectedRoomIds.value = newRoomIds;
  }
}, { deep: true });

// Watch for changes in selected rooms and emit if necessary
watch(selectedRoomIds, (newIds) => {
  const newRooms = newIds.map(id => {
    const existingRoom = props.modelValue.find(room => room.id === id);
    if (existingRoom) return existingRoom;

    const roomFromMapping = rooms.value.find(room => room.id === id);
    return roomFromMapping ? { name: roomFromMapping.name, id: roomFromMapping.id } : null;
  }).filter(room => room !== null);

  if (JSON.stringify(props.modelValue) !== JSON.stringify(newRooms)) {
    emit('update:modelValue', newRooms);
  }
}, { deep: true });
</script>
