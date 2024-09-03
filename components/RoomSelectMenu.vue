<template>
  <div>
    <USelectMenu v-model="selectedRoomIds" :options="roomOptions" multiple placeholder="Select rooms"
      option-attribute="label" value-attribute="value">
      <template #summary>
        <span v-if="selectedRoomIds.length === 0">Select rooms</span>
        <span v-else>{{ selectedRoomIds.length }} room(s) selected</span>
      </template>
    </USelectMenu>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoomMapping } from 'pricing-lib/src/composables/useRoomMapping';

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

const { roomMapping } = useRoomMapping();

const roomOptions = computed(() =>
  (roomMapping.value || []).map(room => ({ label: room.name, value: room.id }))
);

const selectedRoomIds = ref(props.modelValue.map(room => room.id));

watch(() => props.modelValue, (newValue) => {
  selectedRoomIds.value = newValue.map(room => room.id);
}, { deep: true });

watch(selectedRoomIds, (newIds) => {
  const newRooms = newIds.map(id => {
    const existingRoom = props.modelValue.find(room => room.id === id);
    if (existingRoom) {
      return existingRoom;
    }
    const roomFromMapping = roomMapping.value.find(room => room.id === id);
    return roomFromMapping ? { name: roomFromMapping.name, id: roomFromMapping.id } : null;
  }).filter(room => room !== null);

  emit('update:modelValue', newRooms);
}, { deep: true });

// // Log initial values
// // console.log('Initial Current Rooms:', props.modelValue);
// // console.log('Initial Room Options:', roomOptions.value);
// // console.log('Initial Selected Room IDs:', selectedRoomIds.value);
</script>