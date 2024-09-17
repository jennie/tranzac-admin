<!-- /components/CostEstimateEditor.vue -->
<template>
  <div class="cost-estimate-editor space-y-8">
    <div class="flex space-x-4">
      <div class="mt-6 space-y-4">
        <h4 class="text-lg font-semibold">Versions</h4>
        <div class="flex space-x-4">
          <USelect v-model="currentVersionNumber" :options="versionOptions" @update:modelValue="handleVersionChange" />
          <UButton v-if="hasChanges" @click="createNewVersion" color="primary">Save New Version</UButton>
        </div>
      </div>
    </div>

    <UCard class="shadow-lg" v-if="!isLoading">
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

      <div v-if="Object.keys(groupedCostEstimates).length > 0">
        <!-- Loop through grouped cost estimates -->
        <div v-for="(slot, slotId) in groupedCostEstimates" :key="slotId">

          <div
            class="bg-white dark:bg-stone-950 border dark:border-stone-700 rounded-lg overflow-hidden shadow-sm mb-4">
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
            <div v-if="slot.rooms && slot.rooms.length > 0">
              <div v-for="(room, roomIndex) in slot.rooms" :key="roomIndex" class="p-4">
                <h4 class="text-xl font-bold">{{ getRoomName(room.roomSlug) }}</h4>

                <template v-if="room.fullDayPrice">
                  <InvoiceItem
                    :item="getInvoiceItem(slot, 'Full Day Rental (Flat Rate)', room.fullDayPrice, 'fullDay', room.roomSlug)"
                    @update="updateInvoiceItem" @remove="removeInvoiceItem" />
                </template>

                <template v-else>
                  <InvoiceItem v-if="room.daytimePrice > 0" :item="getInvoiceItem(
                    slot,
                    formatDescription(room.daytimeHours, room.daytimeRate, room.daytimeRateType, 'Daytime'),
                    room.daytimeHourly ? room.daytimeHours * room.daytimePrice : room.daytimePrice,
                    'daytime',
                    room.roomSlug
                  )" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
                  <InvoiceItem v-if="room.eveningPrice > 0" :item="getInvoiceItem(
                    slot,
                    formatDescription(room.eveningHours, room.eveningRate, room.eveningRateType, 'Evening'),
                    room.eveningHourly ? room.eveningHours * room.eveningPrice : room.eveningPrice,
                    'evening',
                    room.roomSlug
                  )" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
                </template>

                <div v-if="room.additionalCosts && room.additionalCosts.length > 0">
                  <h5 class="text-base font-semibold mt-6">Additional Costs</h5>
                  <div v-for="(cost, costIndex) in room.additionalCosts" :key="costIndex">
                    <InvoiceItem :item="getInvoiceItem(slot, cost.description, cost.cost, 'additional', room.roomSlug)"
                      @update="updateInvoiceItem" @remove="removeInvoiceItem" />
                  </div>
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
                <UButton @click="() => addLineItem(slot)" :disabled="!isValidNewLineItem(slot.newLineItem)"
                  class="w-1/6">
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
      </div>
      <div v-else class=" py-8">
        <p class="text-lg text-gray-500">No cost estimates available for this version.</p>
      </div>

      <template #footer>
        <div class="flex justify-between items-center mt-6 pt-4 border-t border-stone-300 dark:border-stone-700">
          <span class="text-lg font-semibold dark:text-stone-100">Grand Total</span>
          <span class="text-lg font-semibold dark:text-stone-100">{{ formatCurrency(totalCost) }}</span>
        </div>
        <div class="flex justify-end space-x-4 mt-4">

          <UButton @click="sendEstimate" color="primary">Send Estimate</UButton>
        </div>

      </template>
    </UCard>

    <div v-else class=" py-8">
      <p class="text-lg">Loading cost estimates...</p>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useResources } from '@/composables/useResources';
import { formatDescription } from '@/utils/formatters';
import { formatCurrency, formatDate, formatTimeRange } from '@/utils/formatters';
import cloneDeep from 'lodash/cloneDeep';
const originalData = ref(null);
const editedData = ref(null);
import { v4 as uuidv4 } from 'uuid';
const estimateIdRef = ref(null);
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
// console.log('Component setup: rentalRequestId =', props.rentalRequestId);
const roomMapping = ref([]);

async function fetchRoomMapping() {
  try {
    const response = await fetch('/api/getRoomMapping');
    const data = await response.json();
    if (data.success) {
      roomMapping.value = data.data;
    } else {
      console.error('Failed to fetch room mapping:', data.error);
    }
  } catch (err) {
    console.error('Error fetching room mapping:', err);
  }
}

onMounted(async () => {
  await fetchRoomMapping();
});
const fetchVersions = async () => {
  //   console.log('fetchVersions: Starting fetch for rentalRequestId:', props.rentalRequestId);
  try {
    const { data, error } = await useFetch(`/api/costEstimates/${props.rentalRequestId}`);
    //     console.log('fetchVersions: API response:', data.value, 'Error:', error.value);

    if (error.value) {
      throw new Error(error.value.message || 'Unknown error occurred');
    }

    if (data.value) {
      //       console.log('fetchVersions: Returning data');
      return data.value;
    } else {
      console.warn('fetchVersions: No data returned from API');
      throw new Error('No data returned from API');
    }
  } catch (err) {
    console.error('fetchVersions: Error:', err);
    throw err;
  }
};
const { data: costEstimateData, pending, error: asyncError, refresh } = useAsyncData(
  'costEstimate',
  async () => {
    //     console.log('useAsyncData: Fetching data for rentalRequestId:', props.rentalRequestId);
    try {
      const result = await fetchVersions();
      //       console.log('useAsyncData: Fetched data:', result);
      return result;
    } catch (err) {
      console.error('useAsyncData: Error fetching data:', err);
      throw err;
    }
  },
  {
    watch: [() => props.rentalRequestId],
    immediate: true
  }
);

// Add a watcher to log when the async data changes
watch(costEstimateData, (newData) => {
  //   console.log('costEstimateData changed:', newData);
}, { immediate: true });
const emit = defineEmits(['save', 'close']);
const originalGroupedCostEstimatesData = ref(null);

const { user } = useAuth();
const userId = computed(() => user.value?._id || null);
console.log('Current user ID:', user.value);
// Now you can use userId.value wherever you need the user ID

const hasChanges = computed(() => {
  return JSON.stringify(groupedCostEstimatesData.value) !== JSON.stringify(originalGroupedCostEstimatesData.value);
});


const sendEstimate = async () => {
  const estimateId = estimateIdRef.value; // Use the stored estimateId

  if (!estimateId) {
    console.error('Estimate ID is undefined');
    return;
  }

  try {
    console.log('Sending estimate:', {
      rentalRequestId: props.rentalRequestId,
      estimateId: estimateId,
      currentVersion: currentVersionNumber.value,
      totalCost: totalCost.value,

    });
    const response = await fetch('/api/costEstimates/sendEstimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rentalRequestId: props.rentalRequestId,  // Rental Request ID
        estimateId: estimateId,  // The correct MongoDB document _id
        currentVersion: currentVersionNumber.value, // The current version number
        totalCost: totalCost.value,
        primaryContactEmail: props.rentalRequest.primaryContactEmail,
        primaryContactName: props.rentalRequest.primaryContactName,
        organization: props.rentalRequest.organization
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('Updating status for:', {
        rentalRequestId: props.rentalRequestId,
        versionNumber: currentVersionNumber.value,
      });

      // Add new status entry to statusHistory
      await fetch(`/api/costEstimates/${props.rentalRequestId}/versions/${currentVersionNumber.value}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'sent',
          changedBy: userId.value,
          timestamp: new Date(),
        }),
      });
      // console.log('Estimate sent successfully');
    } else {
      console.error('Failed to send estimate:', result.message);
    }

  } catch (err) {
    console.error('Error sending estimate:', err);
  }
};


const daytimeDescription = computed(() => {
  return formatDescription(props.room.daytimeHours, props.room.daytimePrice, props.room.daytimeRateType, 'Daytime');
});

const eveningDescription = computed(() => {
  return formatDescription(props.room.eveningHours, props.room.eveningPrice, props.room.eveningRateType, 'Evening');
});
const { resourceOptions } = useResources();

const costEstimateVersions = ref([]);
const currentVersionNumber = ref(0);
const groupedCostEstimatesData = ref({});
const error = ref(null);
watch(groupedCostEstimatesData, (newVal) => {
  //   console.log('groupedCostEstimatesData updated:', newVal);
  // You can add any additional logic here if needed
}, { deep: true });
const versionOptions = computed(() => costEstimateVersions.value);
const groupCostEstimates = (costEstimates) => {
  return costEstimates.reduce((acc, estimate) => {
    const slotId = estimate.id;
    acc[slotId] = {
      id: slotId,
      date: estimate.date,
      start: estimate.start,
      end: estimate.end,
      perSlotCosts: estimate.perSlotCosts,
      rooms: estimate.rooms,
      totalCost: estimate.slotTotal,
      newLineItem: {
        type: 'custom',
        description: '',
        resourceId: null,
        cost: 0
      },
      customLineItems: []
    };
    return acc;
  }, {});
};

const currentVersionLabel = computed(() => {
  const version = versionOptions.value.find(v => v.value === currentVersionNumber.value);
  return version ? version.label : 'Original Request';
});

const groupedCostEstimates = computed(() => {
  return Object.values(groupedCostEstimatesData.value || {});
});

const totalCost = computed(() => {
  const currentVersion = costEstimateVersions.value.find(v => v.value === currentVersionNumber.value);
  return currentVersion?.totalCost ?? 0;
});

const isLoading = computed(() => {
  return Object.keys(groupedCostEstimatesData.value).length === 0;
});

const updateStoredTotal = () => {
  let calculatedTotal = 0;
  groupedCostEstimates.value.forEach(slot => {
    calculatedTotal += slot.totalCost || 0;
  });
  const versionIndex = costEstimateVersions.value.findIndex(v => v.value === currentVersionNumber.value);
  if (versionIndex !== -1) {
    costEstimateVersions.value[versionIndex] = {
      ...costEstimateVersions.value[versionIndex],
      totalCost: calculatedTotal
    };
  }
};

const isDataReady = computed(() => {
  //   console.log('isLoading computed: pending =', pending.value, 'costEstimateData =', !!costEstimateData.value);
  return pending.value || !costEstimateData.value;
});


watch([costEstimateData, error], ([newData, newError]) => {
  //   console.log('Watch triggered: newData =', newData, 'newError =', newError);
  if (newData) {
    estimateIdRef.value = newData._id;
    currentVersionNumber.value = newData.currentVersion;
    costEstimateVersions.value = newData.versions.map(v => ({
      value: v.version,
      label: v.label,
      totalCost: v.totalCost
    }));
    const currentVersion = newData.versions.find(v => v.version === newData.currentVersion);
    if (currentVersion) {
      groupedCostEstimatesData.value = groupCostEstimates(currentVersion.costEstimates);
    }

  }
}, { immediate: true });


const handleVersionChange = async (newVersion) => {
  currentVersionNumber.value = newVersion;
  await fetchVersionDetails(newVersion);
};

const fetchVersionDetails = async (versionNumber) => {
  if (!costEstimateData.value) return;

  const version = costEstimateData.value.versions.find(v => v.version === versionNumber);
  if (version) {
    groupedCostEstimatesData.value = groupCostEstimates(version.costEstimates);
    //     console.log('Updated groupedCostEstimatesData:', groupedCostEstimatesData.value);
  } else {
    console.error('Version not found:', versionNumber);
    error.value = 'Version not found';
  }
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
    id: uuidv4(),
    slotId: slot.id,
    description: slot.newLineItem.description,
    amount: Number(slot.newLineItem.cost),
    type: slot.newLineItem.type,
    roomSlug: slot.newLineItem.roomSlug
  };

  if (!slot.customLineItems) {
    slot.customLineItems = [];
  }
  slot.customLineItems.push(newItem);

  recalculateSlotTotal(slot);
  updateStoredTotal();

  resetNewLineItem(slot);
};

const removeCustomLineItem = (slot, item) => {
  slot.customLineItems = slot.customLineItems.filter(i => i.id !== item.id);
  recalculateSlotTotal(slot);
  updateStoredTotal();
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

const getInvoiceItem = (slot, description, amount, type, roomSlug) => {
  if (type === 'fullDay') {
    const room = slot.rooms.find(r => r.roomSlug === roomSlug);
    amount = room.fullDayPrice || room.basePrice;
  }

  return {
    id: uuidv4(),
    slotId: slot.id,
    description: description,
    amount: amount,
    type: type,
    roomSlug: roomSlug
  };
};

const updateInvoiceItem = async (item) => {
  const [slotId, itemType, roomSlug] = item.id.split('_');
  const slot = groupedCostEstimatesData.value[slotId];

  if (!slot) {
    console.error('Slot not found for', { slotId, itemType, roomSlug });
    return;
  }

  const requestBody = {
    slotId,
    itemType,
    itemDescription: item.description,
    newAmount: item.amount,
    ...(itemType !== 'perSlot' && { roomSlug })
  };

  //   console.log('Updating item with data:', requestBody);

  try {
    const { data } = await useFetch(`/api/costEstimates/${props.rentalRequestId}/versions/${currentVersionNumber.value}/items`, {
      method: 'PUT',
      body: requestBody
    });

    if (data && data._value) {
      const updatedSlot = data._value;

      // Merge the updated slot data with the existing slot data
      groupedCostEstimatesData.value[slotId] = {
        ...slot,
        ...updatedSlot,
        perSlotCosts: updatedSlot.perSlotCosts || slot.perSlotCosts,
        rooms: updatedSlot.rooms?.map(updatedRoom => {
          const existingRoom = slot.rooms.find(room => room.roomSlug === updatedRoom.roomSlug);
          return existingRoom ? { ...existingRoom, ...updatedRoom } : updatedRoom;
        }) || slot.rooms,
      };

      recalculateSlotTotal(groupedCostEstimatesData.value[slotId]);
      updateStoredTotal();
    } else if (data.error) {
      console.error('Failed to update item:', data.error);
    } else {
      console.error('Failed to update item: unexpected response structure', data);
    }
  } catch (error) {
    console.error('Error updating invoice item:', error);
  }
};


const removeInvoiceItem = async (item) => {
  //   console.log('Removing item:', item);  // For debugging

  if (!item || !item.id) {
    console.error('Invalid item object:', item);
    return;
  }

  let itemRemoved = false;

  // Search and remove the item from all possible locations
  for (const slot of Object.values(groupedCostEstimatesData.value)) {
    // Check perSlotCosts
    const perSlotIndex = slot.perSlotCosts.findIndex(cost => cost.id === item.id);
    if (perSlotIndex !== -1) {
      slot.perSlotCosts.splice(perSlotIndex, 1);
      itemRemoved = true;
      break;
    }

    // Check rooms
    for (const room of slot.rooms) {
      // Check fullDay, daytime, evening prices
      for (const priceType of ['fullDayPrice', 'daytimePrice', 'eveningPrice']) {
        if (room[priceType] && room[priceType].id === item.id) {
          delete room[priceType];
          itemRemoved = true;
          break;
        }
      }
      if (itemRemoved) break;

      // Check additionalCosts
      const additionalIndex = room.additionalCosts.findIndex(cost => cost.id === item.id);
      if (additionalIndex !== -1) {
        room.additionalCosts.splice(additionalIndex, 1);
        itemRemoved = true;
        break;
      }
    }
    if (itemRemoved) break;

    // Check customLineItems
    const customIndex = slot.customLineItems.findIndex(customItem => customItem.id === item.id);
    if (customIndex !== -1) {
      slot.customLineItems.splice(customIndex, 1);
      itemRemoved = true;
      break;
    }
  }

  if (!itemRemoved) {
    console.error('Item not found for deletion', item);
    return;
  }

  try {
    const { data } = await useFetch(`/api/costEstimates/${props.rentalRequestId}/versions/${currentVersionNumber.value}/items`, {
      method: 'DELETE',
      body: { itemId: item.id }
    });

    if (data.value && data.value.success) {
      recalculateAllSlotTotals();
      updateStoredTotal();
    } else {
      console.error('Failed to remove item:', data.value?.error);
    }
  } catch (error) {
    console.error('Error removing invoice item:', error);
  }
};

const recalculateAllSlotTotals = () => {
  for (const slot of Object.values(groupedCostEstimatesData.value)) {
    recalculateSlotTotal(slot);
  }
};






const updateCustomLineItem = (slot, updatedItem) => {
  const index = slot.customLineItems.findIndex(item => item.id === updatedItem.id);
  if (index !== -1) {
    slot.customLineItems[index] = updatedItem;
    recalculateSlotTotal(slot);
    updateStoredTotal();
  }
};

const recalculateSlotTotal = (slot) => {
  slot.totalCost = calculateSlotTotal(slot);
};

const calculateSlotTotal = (slot) => {
  let total = 0;

  slot.perSlotCosts.forEach(cost => {
    total += Number(cost.cost) || 0;
  });

  slot.rooms.forEach(room => {
    if (room.isFullDay) {
      total += Number(room.fullDayPrice || room.basePrice) || 0;
    } else {
      total += Number(room.basePrice) || 0;
      total += Number(room.daytimePrice) || 0;
      total += Number(room.eveningPrice) || 0;
    }
    room.additionalCosts.forEach(cost => {
      total += Number(cost.cost) || 0;
    });
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
    await refresh();
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
    await refresh();
    currentVersionNumber.value = data.value.version;
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
      //       console.log('Stripe estimate generated:', data.value.estimateId);
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
watch(groupedCostEstimatesData, (newVal) => {
  if (!originalGroupedCostEstimatesData.value) {
    originalGroupedCostEstimatesData.value = cloneDeep(newVal);
  }
});


watch(groupedCostEstimatesData, (newVal) => {
  //   console.log('groupedCostEstimatesData updated:', newVal);
}, { deep: true });



watch(costEstimateData, (newData) => {
  if (newData) {
    estimateIdRef.value = newData._id;
    currentVersionNumber.value = newData.currentVersion;
    costEstimateVersions.value = newData.versions.map(v => ({
      value: v.version,
      label: v.label,
      totalCost: v.totalCost
    }));
    const currentVersion = newData.versions.find(v => v.version === newData.currentVersion);
    if (currentVersion) {
      groupedCostEstimatesData.value = groupCostEstimates(currentVersion.costEstimates);
    }
    //     console.log('Data loaded:', newData);
  }
}, { immediate: true });

</script>