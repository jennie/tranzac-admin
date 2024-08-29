<template>
  <div class="cost-estimate-editor space-y-8">
    <div class="mt-6 space-y-4">
      <h4 class="text-lg font-semibold">Cost Estimate Versions</h4>
      <div class="flex space-x-4">
        <USelect v-model="currentVersionNumber" :options="versionOptions" />
        <UButton @click="createNewVersion" color="primary">Create New Version</UButton>
      </div>
    </div>

    <UCard class="shadow-lg">
      <template #header>
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-row items-center">
            <h3 class=" text-2xl inline font-semibold dark:text-stone-200 mr-2">Cost Estimate</h3>
            <UBadge :label="`Version ${currentVersionNumber}`" variant="subtle" class="text-xs" color="blue" />
          </div>
          <div>
            <span class="text-lg font-semibold dark:text-stone-100">{{ totalCost }}</span>

          </div>
        </div>
      </template>

      <!-- Loop through grouped cost estimates -->
      <div v-for="(slot, slotIndex) in Object.values(groupedCostEstimates)" :key="`slot-${slot.id}`"
        class="space-y-6 mb-10">
        <div class="bg-white dark:bg-stone-950 border dark:border-stone-700 rounded-lg overflow-hidden shadow-sm">
          <div
            class="bg-stone-100 dark:bg-stone-800 px-6 py-4 dark:text-stone-100 font-semibold flex justify-between items-center">
            <span>{{ formatDate(slot.date) }} - {{ formatTimeRange(slot.start, slot.end) }}</span>
          </div>

          <!-- Per-Slot Costs -->
          <div v-if="slot.perSlotCosts && slot.perSlotCosts.length > 0" class="p-4 space-y-4">
            <h4 class="text-sm uppercase font-bold text-primary">Per-Slot Costs</h4>
            <div v-for="(cost, costIndex) in slot.perSlotCosts" :key="`perslot-${slot.id}-${costIndex}`"
              class="space-y-2">
              <InvoiceItem :item="getInvoiceItem(slot, cost.description, cost.cost, 'perSlot')"
                @update="updateInvoiceItem" @remove="removeInvoiceItem" />
            </div>
          </div>

          <!-- Room-Specific Costs -->
          <div v-for="(room, roomIndex) in slot.rooms" :key="roomIndex" class="p-4 space-y-4">
            <h4 class="text-xl font-bold">{{ getRoomName(room.roomSlug) }}</h4>

            <div v-if="room.daytimeHours > 0" class="space-y-2">
              <InvoiceItem :item="getInvoiceItem(room, 'Daytime Hours', room.daytimePrice, 'daytime')"
                @update="updateInvoiceItem" @remove="removeInvoiceItem" />
            </div>
            <div v-if="room.eveningHours > 0" class="space-y-2">
              <InvoiceItem :item="getInvoiceItem(room, 'Evening Hours', room.eveningPrice, 'evening')"
                @update="updateInvoiceItem" @remove="removeInvoiceItem" />
            </div>

            <!-- Additional Costs for each room -->
            <div v-if="room.additionalCosts && room.additionalCosts.length > 0" class="space-y-4">
              <h4 class="text-base font-bold">Additional Costs</h4>
              <div v-for="(cost, costIndex) in room.additionalCosts" :key="costIndex" class="space-y-2">
                <InvoiceItem :item="getInvoiceItem(room, cost.description, cost.cost, 'additional')"
                  @update="updateInvoiceItem" @remove="removeInvoiceItem" />
              </div>
            </div>
          </div>

          <!-- Custom Line Item Input -->
          <div class="p-4">
            <h4 class="text-lg font-semibold mb-2">Add Custom Line Item</h4>
            <div class="flex items-center space-x-4">
              <USelect v-model="slot.newLineItem.type" :options="[
                { label: 'Custom', value: 'custom' },
                { label: 'Resource', value: 'resource' }
              ]" class="w-1/4" @update:modelValue="() => onTypeChange(slot)" />
              <USelect v-if="slot.newLineItem.type === 'resource'" v-model="slot.newLineItem.resourceId"
                :options="getAvailableResourcesForSlot(slot)"
                :disabled="getAvailableResourcesForSlot(slot).length === 0" class="w-1/3"
                @update:modelValue="(value) => onResourceSelect(slot, value)" />
              <UInput v-else v-model="slot.newLineItem.description" placeholder="Description" class="w-1/3" />
              <UInput v-model="slot.newLineItem.cost" type="number" step="0.01" placeholder="Cost" class="w-1/4"
                @update:modelValue="(event) => updateCost(slot, event)" />
              <UButton @click="() => addLineItem(slot)" :disabled="!isValidNewLineItem(slot.newLineItem)" class="w-1/6">
                Add
              </UButton>
            </div>
          </div>

          <!-- Display Custom Line Items -->
          <div v-if="slot.customLineItems && slot.customLineItems.length > 0" class="p-4 space-y-2">
            <h4 class="text-sm uppercase font-bold text-primary">Custom Line Items</h4>
            <div v-for="(item, itemIndex) in slot.customLineItems" :key="itemIndex">
              <InvoiceItem :item="item" @update="(updatedItem) => updateCustomLineItem(slot, updatedItem)"
                @remove="() => removeCustomLineItem(slot, item)" />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between items-center mt-6 pt-4 border-t border-stone-300 dark:border-stone-700">
          <span class="text-lg font-semibold dark:text-stone-100">Grand Total</span>
          <span class="text-lg font-semibold dark:text-stone-100">{{ totalCost }}</span>
        </div>
        <div class="flex justify-end space-x-4 mt-4">
          <UButton @click="recalculateCosts" color="secondary">Recalculate Costs</UButton>
          <UButton @click="saveCostEstimate" color="primary">Save Cost Estimate</UButton>
          <UButton @click="generateStripeEstimate" color="info">Generate Stripe Estimate</UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { useRoomMapping } from '@/composables/useRoomMapping';
import { useResources } from '@/composables/useResources';
import { formatISO, parse, addDays, addHours } from 'date-fns';
import { formatCurrency, formatDate, formatTimeRange } from '@/utils/formatters';

const props = defineProps({
  rentalRequest: {
    type: Object,
    required: true
  },
  rentalRequestId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['save', 'close']);

const { roomMapping } = useRoomMapping();
const { resourceOptions } = useResources();

const localInvoice = ref(JSON.parse(JSON.stringify(props.rentalRequest)));
const costEstimates = ref([]);
const costEstimateVersions = ref([]);
const currentVersionNumber = ref(1);
const isLoading = ref(false);
const error = ref(null);

const versionOptions = computed(() => {
  console.log('Calculating version options:', costEstimateVersions.value);
  return costEstimateVersions.value.map((_, index) => ({
    label: `Version ${index + 1}`,
    value: index + 1
  }));
});
const groupedCostEstimates = ref({});



const groupedCostEstimatesArray = computed(() => Object.values(groupedCostEstimates.value));


const fetchCostEstimateVersions = async () => {
  try {
    const { data } = await useFetch(`/api/costEstimates/${props.rentalRequestId}`);
    if (data.value) {
      costEstimateVersions.value = data.value.versions || [];
      currentVersionNumber.value = data.value.currentVersion || 1;
      console.log('Fetched versions:', costEstimateVersions.value);
      console.log('Current version:', currentVersionNumber.value);
    }
  } catch (error) {
    console.error('Error fetching cost estimate versions:', error);
  }
};

const fetchCostEstimates = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const rentalDatesWithRoomSlugs = {};

    localInvoice.value.dates.forEach((dateObj) => {
      const { date, slots } = dateObj;

      rentalDatesWithRoomSlugs[date] = slots.flatMap(slot => {
        return slot.rooms.map(room => {
          const roomId = typeof room === 'object' ? room.id : room;
          const roomSlug = roomMapping.value.find(r => r.id === roomId)?.slug;

          if (!roomSlug) {
            console.error(`No roomSlug found for room ID: ${roomId}`);
            return null;
          }

          const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
          let startTime, endTime;

          if (slot.startTime?.time) {
            startTime = parse(slot.startTime.time, 'HH:mm', parsedDate);
          } else {
            console.warn(`Missing start time for slot on ${date}`);
            startTime = parsedDate; // Use the date as a fallback
          }

          if (slot.endTime?.time) {
            endTime = parse(slot.endTime.time, 'HH:mm', parsedDate);
            if (endTime <= startTime) {
              endTime = addDays(endTime, 1); // Move end time to the next day
            }
          } else {
            console.warn(`Missing end time for slot on ${date}`);
            endTime = addHours(startTime, 1); // Add 1 hour as a fallback
          }

          return {
            id: slot.id,
            title: slot.title,
            start: formatISO(startTime),
            end: formatISO(endTime),
            roomSlug,
            resources: slot.resources,
            private: slot.private,
          };
        });
      }).filter(Boolean); // Filter out any null values
    });

    if (Object.values(rentalDatesWithRoomSlugs).every(slots => slots.length === 0)) {
      throw new Error('No slots with valid room information were found.');
    }

    const { data } = await useFetch("http://localhost:3000/api/calculateCostEstimates", {
      method: 'POST',
      body: {
        rentalDates: rentalDatesWithRoomSlugs,
        roomMapping: roomMapping.value,
        resourceOptions: resourceOptions.value,
      },
    });

    costEstimates.value = Array.isArray(data.value?.costEstimates) ? data.value.costEstimates : [];
    console.log('costEstimates:', costEstimates.value);

    if (costEstimates.value.length > 0) {
      groupedCostEstimates.value = costEstimates.value.reduce((acc, estimate) => {
        if (!acc[estimate.id]) {
          acc[estimate.id] = reactive({
            ...estimate,
            rooms: [],
            perSlotCosts: estimate.perSlotCosts || [],
            newLineItem: reactive({
              type: 'custom',
              description: '',
              resourceId: null,
              cost: 0
            }),
            customLineItems: []
          });
        }
        acc[estimate.id].rooms.push(reactive({ ...estimate }));
        return acc;
      }, {});
    }
  } catch (err) {
    console.error('Error fetching cost estimates:', err);
    error.value = err.message;
    costEstimates.value = [];
  } finally {
    isLoading.value = false;
  }
};

const updateLocalInvoiceWithCostEstimates = () => {
  costEstimates.value.forEach(estimate => {
    const date = localInvoice.value.dates.find(d => d.id === estimate.dateId);
    if (date) {
      const slot = date.slots.find(s => s.id === estimate.id);
      if (slot) {
        // Apply base and additional costs to the slot
        slot.rooms.forEach(room => {
          if (room.id === estimate.roomSlug) {
            room.price = estimate.basePrice;
          }
        });

        slot.resources = estimate.perSlotCosts.map(cost => {
          return {
            description: cost.description,
            cost: cost.cost
          };
        });

        // Handle additional costs
        if (!slot.additionalCosts) {
          slot.additionalCosts = [];
        }

        estimate.additionalCosts.forEach(cost => {
          slot.additionalCosts.push({
            description: cost.description,
            subDescription: cost.subDescription || '',
            cost: cost.cost
          });
        });
      }
    }
  });
};

const saveCostEstimate = async () => {
  try {
    const costEstimateData = {
      rentalRequestId: props.rentalRequestId,
      costEstimates: Object.values(groupedCostEstimates.value).map(slot => ({
        ...slot,
        rooms: slot.rooms.map(room => ({
          ...room,
          additionalCosts: room.additionalCosts.map(cost => ({
            ...cost,
            cost: cost.cost === "Will be quoted separately" ? null : Number(cost.cost)
          }))
        })),
        perSlotCosts: slot.perSlotCosts.map(cost => ({
          ...cost,
          cost: cost.cost === "Will be quoted separately" ? null : Number(cost.cost)
        })),
        customLineItems: slot.customLineItems?.map(item => ({
          ...item,
          cost: item.cost === "Will be quoted separately" ? null : Number(item.cost)
        })) || []
      })),
      totalCost: totalCost.value,
      version: currentVersionNumber.value
    };

    const { data } = await useFetch('/api/costEstimates/', {
      method: 'POST',
      body: costEstimateData
    });

    if (data.value?.success) {
      console.log('Cost estimate saved successfully');
      await fetchCostEstimateVersions();
    } else {
      console.error('Error saving cost estimate:', data.value?.error);
      // Handle error (e.g., show an error message to the user)
    }
  } catch (error) {
    console.error('Error saving cost estimate:', error);
    // Handle error (e.g., show an error message to the user)
  }
};
const createNewVersion = async () => {
  try {
    currentVersionNumber.value = (costEstimateVersions.value.length || 0) + 1;
    await saveCostEstimate();
    console.log('New version created:', currentVersionNumber.value);
  } catch (error) {
    console.error('Error creating new version:', error);
  }
};

const generateStripeEstimate = async () => {
  // Implement the logic to generate a Stripe estimate
  console.log('Generating Stripe estimate...');
  // This would typically involve calling a backend API that interacts with Stripe
};

const getAvailableResourcesForSlot = (slot) => {
  const usedResources = new Set(
    slot.additionalCosts.map(cost => cost.description)
  )

  return resourceOptions.value
    .filter(resource => !usedResources.has(resource.description))
    .map(resource => ({
      label: resource.description,
      value: resource.id
    }))
}

const onResourceSelect = (slot, resourceId) => {
  const selectedResource = resourceOptions.value.find(r => r.id === resourceId);
  if (selectedResource) {
    slot.newLineItem.description = selectedResource.description;
    slot.newLineItem.cost = selectedResource.cost || 0;
  }
};

const getRoomName = (roomSlug) => {
  const room = roomMapping.value.find(r => r.slug === roomSlug);
  return room ? room.name : roomSlug;
};

const getInvoiceItem = (estimate, description, amount, type) => {
  return {
    id: `${estimate.date}_${estimate.id}_${type}`,  // Using underscore as delimiter
    description: description,
    amount: amount,
    type: type
  };
};

const updateCost = (slot, value) => {
  slot.newLineItem.cost = value !== '' ? Number(value) : null;
  console.log('Cost updated:', slot.newLineItem.cost);
};

const removeCustomLineItem = (slot, item) => {
  slot.customLineItems = slot.customLineItems.filter(i => i.id !== item.id);
  recalculateSlotTotal(slot);
};

const updateCustomLineItem = (slot, item) => {
  const index = slot.customLineItems.findIndex(i => i.id === item.id);
  if (index !== -1) {
    slot.customLineItems[index] = item;
    recalculateSlotTotal(slot);
  }
};

const addLineItem = (slot) => {
  if (!isValidNewLineItem(slot.newLineItem)) return;

  const newItem = {
    id: `custom-${Date.now()}`,
    description: slot.newLineItem.type === 'resource'
      ? resourceOptions.value.find(r => r.id === slot.newLineItem.resourceId)?.description || 'Unknown Resource'
      : slot.newLineItem.description,
    amount: Number(slot.newLineItem.cost),
    type: slot.newLineItem.type
  };

  if (!slot.customLineItems) {
    slot.customLineItems = [];
  }
  slot.customLineItems.push(newItem);

  recalculateSlotTotal(slot);
  resetNewLineItem(slot);

  console.log('Item added:', newItem);
  console.log('Updated slot:', slot);
};

const resetNewLineItem = (slot) => {
  Object.assign(slot.newLineItem, {
    type: 'custom',
    description: '',
    resourceId: null,
    cost: null
  });
};

const updateInvoiceItem = (item) => {
  const [date, slotId, itemType] = item.id.split('_');
  console.log('Parsed ID parts:', { date, slotId, itemType });

  const estimate = costEstimates.value.find(est => est.id === slotId && est.date === date);

  if (!estimate) {
    console.error('Estimate not found for', { date, slotId, itemType });
    return;
  }

  if (itemType === 'room') {
    estimate.basePrice = item.amount;
  } else if (itemType === 'daytime') {
    estimate.daytimePrice = item.amount;
  } else if (itemType === 'evening') {
    estimate.eveningPrice = item.amount;
  } else if (itemType === 'perSlot') {
    const costItem = estimate.perSlotCosts.find(cost => cost.description === item.description);
    if (costItem) costItem.cost = item.amount;
  } else if (itemType === 'additional') {
    const costItem = estimate.additionalCosts.find(cost => cost.description === item.description);
    if (costItem) {
      costItem.cost = item.amount;
    }
  }

  estimate.totalCost = calculateTotalCost(estimate);
  recalculateSlotTotal(estimate);
  console.log('Updated estimate:', estimate);
};

const calculateTotalCost = (estimate) => {
  let total = 0;

  total += estimate.basePrice || 0;
  total += (estimate.daytimePrice || 0) + (estimate.eveningPrice || 0);

  estimate.perSlotCosts.forEach(cost => {
    if (typeof cost.cost === 'number') {
      total += cost.cost;
    }
  });

  estimate.additionalCosts.forEach(cost => {
    if (typeof cost.cost === 'number') {
      total += cost.cost;
    }
  });

  return total;
};



const recalculateCosts = () => {
  fetchCostEstimates().then(() => {
    updateLocalInvoiceWithCostEstimates();
  });
};

const isValidNewLineItem = (newLineItem) => {
  if (newLineItem.type === 'resource') {
    return newLineItem.resourceId && newLineItem.cost > 0
  } else {
    return newLineItem.description.trim() !== '' && newLineItem.cost > 0
  }
}

const onTypeChange = (slot) => {
  console.log('Type changed for slot:', slot.id, 'New type:', slot.newLineItem.type);
  if (slot.newLineItem.type === 'resource') {
    slot.newLineItem.description = '';
    slot.newLineItem.resourceId = null;
    slot.newLineItem.cost = 0;
  } else {
    slot.newLineItem.resourceId = null;
    slot.newLineItem.description = '';
    slot.newLineItem.cost = 0;
  }
};

watch(currentVersionNumber, async (newVersion) => {
  if (costEstimateVersions.value[newVersion - 1]) {
    const versionData = costEstimateVersions.value[newVersion - 1];
    costEstimates.value = versionData.costEstimates;
    await fetchCostEstimates();
  }
});

onMounted(async () => {
  await fetchCostEstimateVersions();
  await fetchCostEstimates();
});


const totalCost = computed(() => {
  let total = 0;
  Object.values(groupedCostEstimates.value).forEach(slot => {
    total += Number(calculateSlotTotal(slot)) || 0;
  });
  return formatCurrency(total);
});


const calculateSlotTotal = (slot) => {
  let total = 0;
  slot.rooms.forEach(room => {
    total += Number(room.daytimePrice) || 0;
    total += Number(room.eveningPrice) || 0;
    room.additionalCosts.forEach(cost => {
      total += Number(cost.cost) || 0;
    });
  });
  slot.perSlotCosts.forEach(cost => {
    total += Number(cost.cost) || 0;
  });
  slot.customLineItems?.forEach(item => {
    total += Number(item.amount) || 0;
  });
  return total;
};
const removeInvoiceItem = (item) => {
  const [date, slotId, itemType] = item.id.split('_');
  const slot = groupedCostEstimates.value[slotId];

  if (!slot) {
    console.error('Slot not found for', { date, slotId, itemType });
    return;
  }

  switch (itemType) {
    case 'perSlot':
      slot.perSlotCosts = slot.perSlotCosts.filter(cost => cost.description !== item.description);
      break;
    case 'daytime':
    case 'evening':
      const roomIndex = slot.rooms.findIndex(room => room[`${itemType}Price`] === item.amount);
      if (roomIndex !== -1) {
        slot.rooms[roomIndex][`${itemType}Price`] = 0;
        slot.rooms[roomIndex][`${itemType}Hours`] = 0;
      }
      break;
    case 'additional':
      slot.rooms.forEach(room => {
        room.additionalCosts = room.additionalCosts.filter(cost => cost.description !== item.description);
      });
      break;
    default:
      console.warn('Unknown item type:', itemType);
      return;
  }

  // Force reactivity
  groupedCostEstimates.value = { ...groupedCostEstimates.value };

  slot.totalCost = calculateSlotTotal(slot);

  console.log('Item removed:', item);
  console.log('Updated slot:', slot);
};

watch(currentVersionNumber, async (newVersion) => {
  if (costEstimateVersions.value[newVersion - 1]) {
    const versionData = costEstimateVersions.value[newVersion - 1];
    costEstimates.value = versionData.costEstimates;
    await fetchCostEstimates();
  }
});

</script>