<template>
  <div class="cost-estimate-editor space-y-8">
    <div class="flex space-x-4">
      <div class="mt-6 space-y-4">
        <h4 class="text-lg font-semibold">Versions</h4>
        <div class="flex space-x-4">
          <USelect v-model="currentVersionNumber" :options="versionOptions" @update:modelValue="handleVersionChange" />
          <UButton @click="createNewVersion" color="primary">Create New Version</UButton>
        </div>
      </div>
    </div>

    <UCard class="shadow-lg">
      <template #header>
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-row items-center">
            <h3 class="text-2xl inline font-semibold dark:text-stone-200 mr-2">Cost Estimate</h3>
            <UBadge :label="currentVersionLabel" variant="subtle" class="text-xs" color="blue" />
          </div>
          <div>
            <span class="text-lg font-semibold dark:text-stone-100">{{ formatCurrency(totalCost || 0) }}</span>
          </div>
        </div>
      </template>

      <!-- Loop through grouped cost estimates -->
      <div v-for="(slot, slotId) in groupedCostEstimates" :key="slotId">
        <div class="bg-white dark:bg-stone-950 border dark:border-stone-700 rounded-lg overflow-hidden shadow-sm mb-4">
          <div
            class="bg-stone-100 dark:bg-stone-800 px-6 py-4 dark:text-stone-100 font-semibold flex justify-between items-center">
            <span>{{ formatDate(slot.date) }} - {{ formatTimeRange(slot.start, slot.end) }}</span>
          </div>

          <!-- Per-Slot Costs -->
          <div v-if="slot.perSlotCosts && slot.perSlotCosts.length > 0" class="p-4">
            <h4 class="text-sm uppercase font-bold text-primary">Per-Slot Costs</h4>
            <div v-for="(cost, costIndex) in slot.perSlotCosts" :key="costIndex">
              <InvoiceItem :item="getInvoiceItem(slot, cost.description, cost.cost, 'perSlot')"
                @update="updateInvoiceItem" @remove="removeInvoiceItem" />
            </div>
          </div>

          <!-- Room-Specific Costs -->
          <div v-for="(room, roomIndex) in slot.rooms" :key="roomIndex" class="p-4">
            <h4 class="text-xl font-bold">{{ getRoomName(room.roomSlug) }}</h4>

            <div v-if="room.daytimeHours > 0">
              <InvoiceItem :item="getInvoiceItem(room, 'Daytime Hours', room.daytimePrice, 'daytime')"
                @update="updateInvoiceItem" @remove="removeInvoiceItem" />
            </div>
            <div v-if="room.eveningHours > 0">
              <InvoiceItem :item="getInvoiceItem(room, 'Evening Hours', room.eveningPrice, 'evening')"
                @update="updateInvoiceItem" @remove="removeInvoiceItem" />
            </div>

            <!-- Additional Costs for each room -->
            <div v-if="room.additionalCosts && room.additionalCosts.length > 0">
              <h5 class="text-base font-semibold">Additional Costs</h5>
              <div v-for="(cost, costIndex) in room.additionalCosts" :key="costIndex">
                <InvoiceItem :item="getInvoiceItem(room, cost.description, cost.cost, 'additional')"
                  @update="updateInvoiceItem" @remove="removeInvoiceItem" />
              </div>
            </div>
          </div>

          <!-- Custom Line Item Input -->
          <div class="p-4">
            <h4 class="text-lg font-semibold mb-2">Add Custom Line Item</h4>
            <div v-if="slot.newLineItem" class="flex items-center space-x-4">
              <USelect v-if="slot.newLineItem" v-model="slot.newLineItem.type" :options="[
                { label: 'Custom', value: 'custom' },
                { label: 'Resource', value: 'resource' }
              ]" @update:modelValue="(value) => handleNewLineItemTypeChange(slot, value)" />

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
          <div v-if="slot.customLineItems && slot.customLineItems.length > 0" class="p-4">
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
          <span class="text-lg font-semibold dark:text-stone-100">{{ formatCurrency(totalCost) }}</span>
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
import { ref, computed, watch, onMounted } from 'vue';
import { useRoomMapping } from '@/composables/useRoomMapping';
import { useResources } from '@/composables/useResources';
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

const costEstimateVersions = ref([]);
const currentVersionNumber = ref(0);
const groupedCostEstimatesData = ref({});
const isLoading = ref(false);
const error = ref(null);

const versionOptions = computed(() => costEstimateVersions.value);

const currentVersionLabel = computed(() => {
  const version = versionOptions.value.find(v => v.value === currentVersionNumber.value);
  return version ? version.label : 'Original Request';
});

const groupedCostEstimates = computed(() => {
  return Object.values(groupedCostEstimatesData.value);
});

const totalCost = computed(() => {
  const currentVersion = costEstimateVersions.value.find(v => v.value === currentVersionNumber.value);
  return currentVersion?.totalCost ?? 0;
});

const updateStoredTotal = () => {
  const calculatedTotal = groupedCostEstimates.value.reduce((total, slot) => total + slot.totalCost, 0);
  const versionIndex = costEstimateVersions.value.findIndex(v => v.value === currentVersionNumber.value);
  if (versionIndex !== -1) {
    costEstimateVersions.value[versionIndex].totalCost = calculatedTotal;
  }
};

const fetchVersions = async () => {
  try {
    const { data } = await useFetch(`/api/costEstimates/${props.rentalRequestId}`);
    console.log("Raw API response:", data.value);

    if (data.value && Array.isArray(data.value.versions)) {
      costEstimateVersions.value = [
        { label: 'Original Request', value: 0, totalCost: data.value.versions[0]?.totalCost ?? 0 },
        ...data.value.versions.map((version) => ({
          label: `Version ${version.version}`,
          value: version.version,
          totalCost: version.totalCost,
          createdAt: version.createdAt
        }))
      ];
      currentVersionNumber.value = data.value.currentVersion || 0;
    } else {
      console.warn('Invalid or missing versions data returned from API');
      costEstimateVersions.value = [{ label: 'Original Request', value: 0, totalCost: 0 }];
    }
  } catch (err) {
    console.error('Error fetching versions:', err);
    error.value = 'Failed to fetch versions';
    costEstimateVersions.value = [{ label: 'Original Request', value: 0, totalCost: 0 }];
  }
};

const handleVersionChange = async (newVersion) => {
  currentVersionNumber.value = newVersion;
  await fetchVersionDetails(newVersion);
};

const fetchVersionDetails = async (versionNumber) => {
  isLoading.value = true;
  try {
    const { data } = await useFetch(`/api/costEstimates/${props.rentalRequestId}/versions/${versionNumber}`);
    console.log('Raw API response:', data.value);

    if (data.value && (data.value.costEstimates || (data.value.versions && data.value.versions[0]))) {
      const costEstimates = data.value.costEstimates || (data.value.versions && data.value.versions[0].costEstimates) || [];
      groupedCostEstimatesData.value = groupCostEstimates(costEstimates);

      // Update the total cost for the current version
      const versionIndex = costEstimateVersions.value.findIndex(v => v.value === versionNumber);
      if (versionIndex !== -1) {
        costEstimateVersions.value[versionIndex].totalCost = data.value.totalCost;
      }

      console.log('Grouped cost estimates:', groupedCostEstimates.value);
    } else {
      console.error('No cost estimates found in the response');
      groupedCostEstimatesData.value = {};
    }
  } catch (err) {
    console.error('Error fetching version details:', err);
    error.value = 'Failed to fetch version details';
    groupedCostEstimatesData.value = {};
  } finally {
    isLoading.value = false;
  }
};

const groupCostEstimates = (costEstimates) => {
  return costEstimates.reduce((acc, estimate) => {
    const slotId = estimate.id || 'unspecified';
    if (!acc[slotId]) {
      acc[slotId] = {
        id: slotId,
        date: estimate.date || '',
        start: estimate.start || '',
        end: estimate.end || '',
        perSlotCosts: estimate.perSlotCosts || [],
        rooms: [],
        totalCost: estimate.totalCost || 0,
        newLineItem: {
          type: 'custom',
          description: '',
          resourceId: null,
          cost: 0
        },
        customLineItems: []
      };
    }
    acc[slotId].rooms.push({
      roomSlug: estimate.roomSlug || 'unknown',
      basePrice: estimate.basePrice || 0,
      daytimePrice: estimate.daytimePrice || 0,
      eveningPrice: estimate.eveningPrice || 0,
      additionalCosts: estimate.additionalCosts || []
    });
    return acc;
  }, {});
};

const handleNewLineItemTypeChange = (slot, value) => {
  if (!slot.newLineItem) {
    slot.newLineItem = {
      type: value,
      description: '',
      resourceId: null,
      cost: 0
    };
  } else {
    slot.newLineItem.type = value;
  }
  onTypeChange(slot);
};

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

const getAvailableResourcesForSlot = (slot) => {
  const usedResources = new Set(
    slot.additionalCosts?.map(cost => cost.description) || []
  );

  return resourceOptions.value
    .filter(resource => !usedResources.has(resource.description))
    .map(resource => ({
      label: resource.description,
      value: resource.id
    }));
};

const onResourceSelect = (slot, resourceId) => {
  const selectedResource = resourceOptions.value.find(r => r.id === resourceId);
  if (selectedResource) {
    slot.newLineItem.description = selectedResource.description;
    slot.newLineItem.cost = selectedResource.cost || 0;
  }
};

const updateCost = (slot, value) => {
  slot.newLineItem.cost = value !== '' ? Number(value) : null;
  console.log('Cost updated:', slot.newLineItem.cost);
};

const isValidNewLineItem = (newLineItem) => {
  if (!newLineItem) return false;
  if (newLineItem.type === 'resource') {
    return newLineItem.resourceId && newLineItem.cost > 0;
  } else {
    return newLineItem.description && newLineItem.description.trim() !== '' && newLineItem.cost > 0;
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

const getRoomName = (roomSlug) => {
  const room = roomMapping.value.find(r => r.slug === roomSlug);
  return room ? room.name : roomSlug;
};

const getInvoiceItem = (estimate, description, amount, type) => {
  return {
    id: `${estimate.date}_${estimate.id}_${type}`,
    description: description,
    amount: amount,
    type: type
  };
};

const updateInvoiceItem = async (item) => {
  const [date, slotId, itemType] = item.id.split('_');
  const slot = groupedCostEstimatesData.value[slotId];

  if (!slot) {
    console.error('Slot not found for', { date, slotId, itemType });
    return;
  }

  try {
    const { data } = await useFetch(`/api/costEstimates/${props.rentalRequestId}/versions/${currentVersionNumber.value}/items`, {
      method: 'PUT',
      body: {
        slotId,
        itemType,
        itemDescription: item.description,
        newAmount: item.amount
      }
    });

    if (data.value && data.value.success) {
      // Update local state with the new data from the server
      Object.assign(slot, data.value.updatedSlot);
    } else {
      console.error('Failed to update item:', data.value?.error);
    }
  } catch (error) {
    console.error('Error updating invoice item:', error);
  }
};

const removeInvoiceItem = (item) => {
  const [date, slotId, itemType] = item.id.split('_');
  const slot = groupedCostEstimatesData.value[slotId];

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

  groupedCostEstimatesData.value = { ...groupedCostEstimatesData.value };
  slot.totalCost = calculateSlotTotal(slot);

  console.log('Item removed:', item);
  console.log('Updated slot:', slot);
};

const updateCustomLineItem = (slot, updatedItem) => {
  const index = slot.customLineItems.findIndex(item => item.id === updatedItem.id);
  if (index !== -1) {
    slot.customLineItems[index] = updatedItem;
    recalculateSlotTotal(slot);
  }
};

const removeCustomLineItem = (slot, item) => {
  slot.customLineItems = slot.customLineItems.filter(i => i.id !== item.id);
  recalculateSlotTotal(slot);
};

const recalculateSlotTotal = (slot) => {
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
  slot.totalCost = total;
};

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

const saveCostEstimate = async () => {
  try {
    await useFetch(`/api/costEstimates/${props.rentalRequestId}/versions/${currentVersionNumber.value}`, {
      method: 'PUT',
      body: {
        costEstimates: Object.values(groupedCostEstimatesData.value),
        totalCost: totalCost.value
      }
    });
    await fetchVersionDetails(currentVersionNumber.value);
  } catch (err) {
    console.error('Error saving cost estimate:', err);
    error.value = 'Failed to save cost estimate';
  }
};

const createNewVersion = async () => {
  try {
    const { data } = await useFetch(`/api/costEstimates/${props.rentalRequestId}/versions`, {
      method: 'POST',
      body: {
        costEstimates: Object.values(groupedCostEstimatesData.value),
        totalCost: totalCost.value
      }
    });
    costEstimateVersions.value.push(data.value);
    currentVersionNumber.value = data.value.version;
    await fetchVersionDetails(data.value.version);
  } catch (err) {
    console.error('Error creating new version:', err);
    error.value = 'Failed to create new version';
  }
};

const recalculateCosts = async () => {
  try {
    const { data } = await useFetch(`/api/costEstimates/${props.rentalRequestId}/recalculate`, {
      method: 'POST',
      body: {
        version: currentVersionNumber.value
      }
    });
    if (data.value && data.value.success) {
      await fetchVersionDetails(currentVersionNumber.value);
    } else {
      console.error('Failed to recalculate costs:', data.value?.error);
    }
  } catch (err) {
    console.error('Error recalculating costs:', err);
    error.value = 'Failed to recalculate costs';
  }
};

const generateStripeEstimate = async () => {
  try {
    const { data } = await useFetch(`/api/costEstimates/${props.rentalRequestId}/stripe-estimate`, {
      method: 'POST',
      body: {
        version: currentVersionNumber.value
      }
    });
    if (data.value && data.value.success) {
      console.log('Stripe estimate generated:', data.value.estimateId);
      // You might want to update the UI or show a success message here
    } else {
      console.error('Failed to generate Stripe estimate:', data.value?.error);
    }
  } catch (err) {
    console.error('Error generating Stripe estimate:', err);
    error.value = 'Failed to generate Stripe estimate';
  }
};

watch(() => props.rentalRequestId, async (newId, oldId) => {
  if (newId !== oldId) {
    await fetchVersions();
    if (currentVersionNumber.value !== null) {
      await fetchVersionDetails(currentVersionNumber.value);
    }
  }
});

onMounted(async () => {
  await fetchVersions();
  if (currentVersionNumber.value !== null) {
    await fetchVersionDetails(currentVersionNumber.value);
  }
});
</script>