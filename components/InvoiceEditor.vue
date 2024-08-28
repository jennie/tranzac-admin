<template>
  <div class="invoice-editor">
    <UCard>
      <template #header>
        <h3 class="text-xl font-semibold dark:text-stone-200">Invoice Editor</h3>
      </template>
      <div class="space-y-6">

        <div v-for="(date, dateIndex) in localInvoice.dates" :key="date.id"
          class="dark:bg-stone-950 border dark:border-stone-700 rounded-md overflow-hidden">
          <div class="dark:bg-stone-800 px-4 py-2 dark:text-stone-100 font-semibold flex justify-between items-center">
            <span>{{ formatDate(date.date) }}</span>
          </div>
          <div v-for="(slot, slotIndex) in date.slots" :key="slot.id" class="p-4 space-y-4">
            {{ slot.resources }}
            <div class="flex justify-between items-center bg-stone-200 dark:bg-stone-900 px-4 py-2 rounded-md">
              <span class="font-medium">{{ slot.title }}</span>
              <span class="text-sm">{{ formatTimeRange(slot.startTime?.time, slot.endTime?.time) }}</span>
            </div>

            <!-- Room charges -->
            <div v-for="room in slot.rooms" :key="room.id" class="ml-4 space-y-2">
              <InvoiceItem :item="getRoomInvoiceItem(date.id, slot.id, room)" @update="updateInvoiceItem"
                @remove="removeInvoiceItem" />
            </div>

            <!-- Resource charges -->
            <div v-for="resource in slot.resources" :key="getResourceKey(resource)" class="ml-4 space-y-2">
              <InvoiceItem :item="getResourceInvoiceItem(date.id, slot.id, resource)" @update="updateInvoiceItem"
                @remove="removeInvoiceItem" />
            </div>


            <!-- Add new item button -->
            <UButton @click="addNewItem(date.id, slot.id)" icon="i-heroicons-plus" color="gray" variant="soft">
              Add Item
            </UButton>
          </div>
        </div>

        <!-- Additional items section -->
        <div class="mt-6">
          <h4 class="text-lg font-semibold mb-2">Additional Items</h4>
          <div v-for="item in additionalItems" :key="item.id" class="mb-2">
            <InvoiceItem :item="item" @update="updateAdditionalItem" @remove="removeAdditionalItem" />
          </div>
          <UButton @click="addAdditionalItem" icon="i-heroicons-plus" color="gray" variant="soft">
            Add Additional Item
          </UButton>
        </div>
      </div>
      <template #footer>
        <div class="flex flex-row justify-between items-center">
          <span class="dark:text-stone-100 font-semibold">Grand Total</span>
          <span class="dark:text-stone-100 font-semibold">{{ totalCost }}</span>
        </div>
        <UButton @click="recalculateCosts" color="secondary" class="mt-2">Recalculate Costs</UButton>
        <UButton @click="saveInvoice" color="primary" class="mt-2">Save Invoice</UButton>
        <UButton @click="openModal" color="info" class="mt-2">View Cost Breakdown</UButton>
      </template>
    </UCard>

    <CostBreakdownModal v-if="isModalOpen" :costEstimates="costEstimates" @close="closeModal" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoomMapping } from '@/composables/useRoomMapping';
import { useResources } from '@/composables/useResources';
import { formatISO, parse, addDays } from 'date-fns';
import { formatCurrency, formatDate, formatTimeRange } from '@/utils/formatters';
const resources = ref([]);
const props = defineProps({
  rental: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['save', 'close']);

const { roomMapping } = useRoomMapping();
const { resourceOptions } = useResources();

const localInvoice = ref(JSON.parse(JSON.stringify(props.rental)));
const additionalItems = ref([]);
const costEstimates = ref([]);
const isLoading = ref(false);
const error = ref(null);
const isModalOpen = ref(false);

onMounted(() => {
  resources.value = resourceOptions.value;

  fetchCostEstimates();
});



const fetchCostEstimates = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const rentalDatesWithRoomSlugs = {};

    localInvoice.value.dates.forEach((dateObj) => {
      const { date, slots } = dateObj;

      rentalDatesWithRoomSlugs[date] = slots.map(slot => {
        const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
        const startTime = parse(slot.startTime.time, 'HH:mm', parsedDate);
        let endTime = parse(slot.endTime.time, 'HH:mm', parsedDate);

        if (endTime <= startTime) {
          endTime = addDays(endTime, 1); // Move end time to the next day
        }

        const fullStart = formatISO(startTime);
        const fullEnd = formatISO(endTime);

        const roomId = slot.rooms[0]; // Assuming there's at least one room per slot
        const roomSlug = roomMapping.value.find(room => room.id === roomId)?.slug;

        if (!roomSlug) {
          throw new Error(`No roomSlug found for room ID: ${roomId}`);
        }

        return {
          id: slot.id,
          title: slot.title,
          start: fullStart,
          end: fullEnd,
          roomSlug, // Include the roomSlug
          resources: slot.resources,
          private: slot.private,
        };
      });
    });

    console.log('Rental Dates with Room Slugs:', rentalDatesWithRoomSlugs);

    const { data } = await useFetch("http://localhost:3000/api/calculateCostEstimates", {
      method: 'POST',
      body: {
        rentalDates: rentalDatesWithRoomSlugs,
        roomMapping: roomMapping.value,
        resourceOptions: resourceOptions.value,
      },
    });

    costEstimates.value = data.value?.costEstimates || [];
    console.log('Cost Estimates:', costEstimates.value);

    updateLocalInvoiceWithCostEstimates();
  } catch (err) {
    console.error('Error fetching cost estimates:', err);
    error.value = err.message;
    costEstimates.value = [];
  } finally {
    isLoading.value = false;
  }
};




watch(resourceOptions, (newVal) => {
  if (newVal.length > 0) {
    fetchCostEstimates();
  }
}, { immediate: true });


const updateLocalInvoiceWithCostEstimates = () => {
  costEstimates.value.forEach(estimate => {
    const date = localInvoice.value.dates.find(d => d.id === estimate.dateId);
    if (date) {
      const slot = date.slots.find(s => s.id === estimate.slotId);
      if (slot) {
        slot.rooms.forEach(room => {
          const roomCost = estimate.roomCosts.find(rc => rc.roomId === room.id);
          if (roomCost) {
            room.price = roomCost.totalCost;
          }
        });
        slot.resources = slot.resources.map(resource => {
          const resourceId = typeof resource === 'object' ? resource.id : resource;
          const resourceCost = estimate.resourceCosts.find(rc => rc.resourceId === resourceId);
          return resourceCost ? { id: resourceId, price: resourceCost.cost } : resource;
        });
      }
    }
  });
};




const recalculateCosts = () => {
  fetchCostEstimates();
};

const totalCost = computed(() => {
  return formatCurrency(
    costEstimates.value.reduce((total, estimate) => total + (estimate.totalCost || 0), 0)
  );
});

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};


const getResourceKey = (resource) => {
  return typeof resource === 'object' ? resource.id : resource;
};


const getResourceInvoiceItem = (dateId, slotId, resource) => {
  const resourceId = typeof resource === 'object' ? resource.id : resource;
  const resourceOption = resourceOptions.value?.find(r => r.id === resourceId);

  if (!resourceOption) {
    console.warn(`Resource not found for id: ${resourceId}`);
  }

  return {
    id: `${dateId}-${slotId}-${resourceId}`,
    description: resourceOption?.description || `Resource (${resourceId})`,
    amount: resource.cost || 0, // Use resource price if available
    type: 'resource'
  };
};



const getRoomInvoiceItem = (dateId, slotId, room) => {
  return {
    id: `${dateId}-${slotId}-${room.id}`,
    description: room.name || 'Unknown Room',
    amount: room.cost || 0, // Use room price if available
    type: 'room'
  };
};



const updateInvoiceItem = (item) => {
  const [dateId, slotId, itemId] = item.id.split('-');
  const dateIndex = localInvoice.value.dates.findIndex(d => d.id === dateId);
  const slotIndex = localInvoice.value.dates[dateIndex].slots.findIndex(s => s.id === slotId);

  if (item.type === 'room') {
    const roomIndex = localInvoice.value.dates[dateIndex].slots[slotIndex].rooms.findIndex(r => r.id === itemId);
    if (roomIndex !== -1) {
      localInvoice.value.dates[dateIndex].slots[slotIndex].rooms[roomIndex].price = item.amount;
    }
  } else if (item.type === 'resource') {
    const resourceIndex = localInvoice.value.dates[dateIndex].slots[slotIndex].resources.findIndex(r =>
      (typeof r === 'object' && r.id === itemId) || r === itemId
    );
    if (resourceIndex !== -1) {
      localInvoice.value.dates[dateIndex].slots[slotIndex].resources[resourceIndex] = {
        id: itemId,
        price: item.amount
      };
    }
  }
};

const removeInvoiceItem = (item) => {
  const [dateId, slotId, itemId] = item.id.split('-');
  const dateIndex = localInvoice.value.dates.findIndex(d => d.id === dateId);
  const slotIndex = localInvoice.value.dates[dateIndex].slots.findIndex(s => s.id === slotId);

  if (item.type === 'room') {
    localInvoice.value.dates[dateIndex].slots[slotIndex].rooms =
      localInvoice.value.dates[dateIndex].slots[slotIndex].rooms.filter(r => r.id !== itemId);
  } else if (item.type === 'resource') {
    localInvoice.value.dates[dateIndex].slots[slotIndex].resources =
      localInvoice.value.dates[dateIndex].slots[slotIndex].resources.filter(r =>
        (typeof r === 'object' && r.id !== itemId) || r !== itemId
      );
  }
};

const addNewItem = (dateId, slotId) => {
  // This function should open a modal or dropdown to select a new resource
  // For now, we'll just add a placeholder item
  const newItem = {
    id: `${dateId}-${slotId}-new-${Date.now()}`,
    description: 'New Item',
    amount: 0,
    type: 'additional'
  };
  const dateIndex = localInvoice.value.dates.findIndex(d => d.id === dateId);
  const slotIndex = localInvoice.value.dates[dateIndex].slots.findIndex(s => s.id === slotId);
  if (!localInvoice.value.dates[dateIndex].slots[slotIndex].additionalItems) {
    localInvoice.value.dates[dateIndex].slots[slotIndex].additionalItems = [];
  }
  localInvoice.value.dates[dateIndex].slots[slotIndex].additionalItems.push(newItem);
};

const updateAdditionalItem = (item) => {
  const index = additionalItems.value.findIndex(i => i.id === item.id);
  if (index !== -1) {
    additionalItems.value[index] = item;
  }
};

const removeAdditionalItem = (item) => {
  additionalItems.value = additionalItems.value.filter(i => i.id !== item.id);
};

const addAdditionalItem = () => {
  additionalItems.value.push({
    id: `additional-${Date.now()}`,
    description: 'New Additional Item',
    amount: 0,
    type: 'additional'
  });
};

const saveInvoice = () => {
  const completeInvoice = {
    ...localInvoice.value,
    additionalItems: additionalItems.value,
    costEstimates: costEstimates.value
  };
  emit('save', completeInvoice);
};

watch(() => localInvoice.value, fetchCostEstimates, { deep: true });
</script>