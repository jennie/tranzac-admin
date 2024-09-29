<!-- /components/CostEstimateEditor.vue -->
<template>
  <div class="cost-estimate-editor space-y-8">

    <UButton label="View Status History" @click="statusHistorySlideoverIsOpen = true" />

    <USlideover v-model="statusHistorySlideoverIsOpen">
      <UCard class="flex flex-col flex-1"
        :ui="{ body: { base: 'flex-1' }, ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              Status History
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
              @click="statusHistorySlideoverIsOpen = false" />
          </div>
        </template>
        <EstimateStatusHistory :version="currentVersion" />
      </UCard>
    </USlideover>



    <UCard class="shadow-lg" v-if="!isLoading">
      <template #header>
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-row items-center">
            <h3 class="text-2xl inline font-semibold dark:text-stone-200 mr-2">Cost Estimate</h3>
            <USelect class="" v-model="currentVersionNumber" :options="versionOptions"
              @update:modelValue="(val) => handleVersionChange(Number(val))" />

            <UButton v-if="hasChanges" @click="createNewVersion" color="primary" class="ml-6">Save New Version</UButton>
            <div class="flex items-center ml-6">
              <span v-if="hasChanges" class="text-yellow-500 mr-2">
                <i class="fas fa-exclamation-triangle"></i> Unsaved changes
              </span>
              <UButton v-if="hasChanges" @click="resetChanges" color="green" class="ml-2">
                Revert Changes
              </UButton>


            </div>
          </div>
          <div>
            <span class="text-lg font-semibold dark:text-stone-100">{{ formatCurrency(totalCost || 0) }}</span>
          </div>
        </div>
      </template>

      <div v-if="groupedCostEstimatesData && Object.keys(groupedCostEstimatesData).length > 0">
        <!-- Loop through grouped cost estimates -->
        <div v-for="(slot, slotId) in groupedCostEstimates" :key="slot.date">
          <div
            class="bg-white dark:bg-stone-950 border dark:border-stone-700 rounded-lg overflow-hidden shadow-sm mb-6">
            <div
              class="bg-stone-100 dark:bg-stone-800 px-6 py-4 dark:text-stone-100 font-semibold flex justify-between items-center">
              <span>{{ formatDate(slot.date) }} - {{ formatTimeRange(slot.start, slot.end) }}</span>
            </div>

            <!-- Per-Slot Costs -->
            <div v-if="slot.perSlotCosts && slot.perSlotCosts.length > 0" class="p-4">
              <h4 class="text-sm uppercase font-bold text-primary">Slot Costs</h4>
              <div v-for="(cost, costIndex) in slot.perSlotCosts" :key="costIndex">
                <InvoiceItem :item="cost" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
              </div>

            </div>
            <div v-if="slot.rooms && slot.rooms.length > 0">
              <div v-for="(room, roomIndex) in slot.rooms" :key="roomIndex" class="p-4">



                <h4 class="text-sm uppercase font-bold">{{ room.roomName }}</h4>

                <!-- Full Day Rental -->
                <template v-if="room.fullDayCostItem">
                  <InvoiceItem :item="room.fullDayCostItem" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
                </template>

                <!-- Daytime -->
                <template v-if="room.daytimeCostItem">
                  <InvoiceItem :item="room.daytimeCostItem" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
                </template>

                <!-- Evening -->
                <template v-if="room.eveningCostItem">
                  <InvoiceItem :item="room.eveningCostItem" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
                </template>

                <!-- Additional Costs -->
                <div v-if="room.additionalCosts && room.additionalCosts.length > 0" class="mt-6">
                  <h4 class="text-sm uppercase font-bold text-primary">Additional Costs</h4>
                  <div v-for="(cost, costIndex) in room.additionalCosts" :key="costIndex">
                    <InvoiceItem :item="cost" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
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
        <div class="mt-6 pt-4 border-t border-stone-300 dark:border-stone-700">
          <div class="flex justify-between items-center">
            <span class="text-lg font-semibold dark:text-stone-100">Subtotal</span>
            <span class="text-lg font-semibold dark:text-stone-100">{{ formatCurrency(totalCost) }}</span>
          </div>
          <div class="flex justify-between items-center mt-2">
            <span class="text-lg font-semibold dark:text-stone-100">Tax (13% HST)</span>
            <span class="text-lg font-semibold dark:text-stone-100">{{ formatCurrency(taxAmount) }}</span>
          </div>
          <div class="flex justify-between items-center mt-2">
            <span class="text-lg font-semibold dark:text-stone-100">Total</span>
            <span class="text-lg font-semibold dark:text-stone-100">{{ formatCurrency(totalWithTax) }}</span>
          </div>
        </div>
        <div class="flex justify-end space-x-4 mt-4">
          <UButton @click="saveAndSendEstimate" color="primary" :label="sendButtonLabel" />
          <!-- <UButton @click="sendEstimate" color="primary">Send Estimate</UButton> -->
        </div>
      </template>


    </UCard>

    <div v-else class=" py-8">
      <p class="text-lg">Loading cost estimates...</p>
    </div>
    <UModal v-model="isSubmitting" fullscreen>
      <div class="flex flex-col items-center justify-center h-screen text-center">
        <span>Sending estimate to renter...</span>
        <div class="flex items-center justify-center mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" class="w-12 h-12">
            <circle cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="#f5ce85" stroke-linecap="round"
              stroke-dasharray="31.4 31.4">
              <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" from="0 25 25"
                to="360 25 25" />
            </circle>
          </svg>
        </div>
      </div>
    </UModal>

  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useResources } from '@/composables/useResources';
import { formatDescription, formatCurrency, formatDate, formatTimeRange } from '@/utils/formatters';
import { isEqual } from 'lodash-es';
const isSubmitting = ref(false);

const toast = useToast();

import cloneDeep from 'lodash/cloneDeep';
import _ from 'lodash';

const taxAmount = ref(0);
const totalWithTax = ref(0);
const totalCost = ref(0);


const originalData = ref(null);
const editedData = ref(null);

const costEstimateVersions = ref([]);
const currentVersionNumber = ref(0);
const groupedCostEstimatesData = ref({});
const error = ref(null);
const statusHistorySlideoverIsOpen = ref(false);




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
  await fetchVersions();
  await recalculateCosts(); // Recalculate when the component is mounted
  originalGroupedCostEstimatesData.value = cloneDeep(groupedCostEstimatesData.value);

});

const fetchVersions = async () => {
  try {
    const { data, error } = await useFetch(`/api/costEstimates/${props.rentalRequestId}`);

    if (error.value) {
      throw new Error(error.value.message || 'Unknown error occurred');
    }

    if (data.value) {
      costEstimateVersions.value = data.value.versions.map(v => ({
        value: v.version,         // Version number
        label: v.label,           // Version label
        totalCost: v.totalCost,   // Total cost
        statusHistory: v.statusHistory || [], // Ensure statusHistory is included
      }));
      return data.value;
    } else {
      throw new Error('No data returned from API');
    }
  } catch (err) {
    throw err;
  }
};





const { data: costEstimateData, pending, error: asyncError, refresh } = useAsyncData(
  'costEstimate',
  async () => {
    try {
      const result = await fetchVersions();
      return result;
    } catch (err) {
      console.error('Error fetching cost estimate data:', err);
      throw err;
    }
  },
  {
    immediate: true
  }
);
const deletedItemIds = new Set();


const emit = defineEmits(['save', 'close']);
const originalGroupedCostEstimatesData = ref(null);

const { user } = useAuth();
const userId = computed(() => user.value?._id || null);
console.log('Current user ID:', user.value);
// Now you can use userId.value wherever you need the user ID


const hasChanges = computed(() => {
  return !_.isEqual(groupedCostEstimatesData.value, originalGroupedCostEstimatesData.value);
});



const sendEstimate = async () => {
  const estimateId = estimateIdRef.value;

  if (!estimateId) {
    console.error('Estimate ID is undefined');
    return;
  }

  const selectedVersion = costEstimateVersions.value.find(v => v.value === currentVersionNumber.value);

  if (!selectedVersion) {
    console.error('Selected version not found');
    return;
  }

  try {
    // Set isSubmitting to true to show the loading modal
    isSubmitting.value = true;

    const pdfPayload = {
      userId: userId.value,
      estimateId: estimateId,
      currentVersion: currentVersionNumber.value,
      costEstimates: Object.values(groupedCostEstimatesData.value).map(slot => ({
        date: formatDate(slot.date),
        startTime: formatTimeRange(slot.start, slot.start),
        endTime: formatTimeRange(slot.start, slot.end),
        perSlotCosts: slot.perSlotCosts.map(cost => ({
          description: cost.description,
          total: cost.cost.toFixed(2)
        })),
        rooms: slot.rooms.map(room => ({
          roomName: room.roomName,
          costItems: room.costItems,
          additionalCosts: room.additionalCosts.map(cost => ({
            description: cost.description,
            total: cost.cost.toFixed(2)
          }))
        })),
        customLineItems: slot.customLineItems.map(item => ({
          description: item.description,
          total: item.cost.toFixed(2)
        }))
      })),
      recipientEmail: props.rentalRequest.primaryContactEmail,
      recipientName: props.rentalRequest.primaryContactName,
      recipientOrganization: props.rentalRequest.organization,
      roomMapping: roomMapping.value,
    };

    const response = await fetch('/api/costEstimates/sendEstimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pdfPayload),
    });

    const result = await response.json();
    if (result.success) {
      toast.add({
        icon: 'i-heroicons-check-badge',
        title: 'Success!',
        color: 'green',
        description: 'This estimate has been emailed to the renter.',
      });
    } else {
      console.error('Failed to send estimate:', result.message);
    }
  } catch (err) {
    console.error('Error sending estimate:', err);
  } finally {
    // Hide the loading modal by setting isSubmitting to false
    isSubmitting.value = false;
  }
};




const daytimeDescription = computed(() => {
  return formatDescription(props.room.daytimeHours, props.room.daytimeRate, props.room.daytimeRateType, 'Daytime');
});

const eveningDescription = computed(() => {
  return formatDescription(props.room.eveningHours, props.room.eveningRate, props.room.eveningRateType, 'Evening');
});
const { resourceOptions } = useResources();


const ensureItemHasId = (item) => {
  if (!item.id) {
    console.warn('Item missing ID:', item);
    return { ...item, id: uuidv4() };
  }
  return item;
};

const assignUniqueIds = (costItems) => costItems.map(ensureItemHasId);


const versionOptions = computed(() => costEstimateVersions.value);



const groupCostEstimates = (costEstimates) => {
  return costEstimates.reduce((acc, estimate) => {
    const slotId = estimate.id;

    acc[slotId] = {
      id: slotId,
      ...estimate,
      resources: estimate.resources || [],
      newLineItem: {
        type: 'custom',
        description: '',
        resourceId: null,
        cost: 0,
      },
      // Use `ensureItemHasId` to assign unique IDs to per-slot costs and custom line items
      perSlotCosts: assignUniqueIds(estimate.perSlotCosts || []).map(cost => ({ ...cost, slotId })),
      customLineItems: assignUniqueIds(estimate.customLineItems || []).map(item => ({ ...item, slotId })),
      rooms: (estimate.rooms || []).map((room) => {
        const correspondingEstimate = (estimate.estimates || []).find(
          (est) => est.roomSlug === room.roomSlug
        );

        return {
          ...room,
          daytimeCostItem: correspondingEstimate?.daytimeCostItem
            ? ensureItemHasId({ ...correspondingEstimate.daytimeCostItem, slotId })
            : null,
          eveningCostItem: correspondingEstimate?.eveningCostItem
            ? ensureItemHasId({ ...correspondingEstimate.eveningCostItem, slotId })
            : null,
          fullDayCostItem: correspondingEstimate?.fullDayPrice
            ? ensureItemHasId({
              id: uuidv4(),
              description: `Full Day Rate`,
              cost: correspondingEstimate.fullDayPrice,
              slotId,
            })
            : null,
          additionalCosts: assignUniqueIds(room.additionalCosts || []).map(cost => ({ ...cost, slotId })),
        };
      }),
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




const isLoading = computed(() => {
  return Object.keys(groupedCostEstimatesData.value).length === 0;
});

const calculatedGrandTotal = computed(() => {
  return Object.values(groupedCostEstimatesData.value).reduce((total, slot) => {
    return total + (slot.totalCost || 0);
  }, 0);
});

watch([totalCost, taxAmount, totalWithTax], ([newTotalCost, newTax, newTotalWithTax]) => {
  console.log("Frontend Calculations:", {
    subtotal: newTotalCost.toFixed(2),
    tax: newTax.toFixed(2),
    grandTotal: newTotalWithTax.toFixed(2),
  });
});



const isDataReady = computed(() => {
  //   console.log('isLoading computed: pending =', pending.value, 'costEstimateData =', !!costEstimateData.value);
  return pending.value || !costEstimateData.value;
});


// In the watch function for costEstimateData
watch([costEstimateData, error], ([newData, newError]) => {
  if (newData) {
    console.log('Received cost estimate data:');
    console.log('Versions:', newData.versions.map(v => ({
      version: v.version,
      label: v.label,
      totalCost: v.totalCost,
      costEstimatesCount: v.costEstimates.length
    })));

    const currentVersion = newData.versions.find(v => v.version === newData.currentVersion);
    if (currentVersion) {
      console.log('Current version cost estimates:', currentVersion.costEstimates.map(ce => ({
        id: ce.id,
        date: ce.date,
        roomsCount: ce.rooms.length,
        perSlotCostsCount: ce.perSlotCosts.length
      })));
    }
  }
});


const handleVersionChange = async (newVersion) => {
  try {
    console.log('Version change triggered for version:', newVersion);
    currentVersionNumber.value = newVersion;
    await fetchVersionDetails(newVersion);
    originalGroupedCostEstimatesData.value = cloneDeep(groupedCostEstimatesData.value);

    resetChangesFlag();

    // Call recalculateCosts to ensure totals are updated for this version
    await recalculateCosts();
  } catch (error) {
    console.error('Error fetching version details:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to load version details. Please try again.',
      color: 'red',
    });
  }
};




watch(currentVersionNumber, async (newVersion) => {
  await fetchVersionDetails(newVersion);
  // Reset the original data to match the newly loaded version
  originalGroupedCostEstimatesData.value = cloneDeep(groupedCostEstimatesData.value);
});



const fetchVersionDetails = async (versionNumber) => {
  const versionsArray = [...costEstimateData.value.versions];
  const version = versionsArray.find(v => v.version === versionNumber);

  if (version) {
    console.log('Fetched version details:', version); // Add logging for debugging
    groupedCostEstimatesData.value = groupCostEstimates(version.costEstimates);
    originalGroupedCostEstimatesData.value = cloneDeep(groupedCostEstimatesData.value);
    updateAllSlotTotals();
  } else {
    throw new Error('Version not found');
  }
};


const resetChangesFlag = () => {
  if (typeof hasChanges !== 'undefined') {
    hasChanges.value = false;
  }
  originalGroupedCostEstimatesData.value = cloneDeep(groupedCostEstimatesData.value);
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
const updateTotals = () => {
  let newTotalCost = 0;
  for (const slot of Object.values(groupedCostEstimatesData.value)) {
    newTotalCost += slot.slotTotal || 0;
  }
  totalCost.value = newTotalCost;
  taxAmount.value = newTotalCost * 0.13; // Assuming 13% tax rate
  totalWithTax.value = newTotalCost + taxAmount.value;
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

const addLineItem = async (slot) => {
  if (!isValidNewLineItem(slot.newLineItem)) return;

  const newItem = ensureItemHasId({
    id: uuidv4(),
    slotId: slot.id,
    description: slot.newLineItem.description,
    cost: Number(slot.newLineItem.cost),
  });

  slot.customLineItems.push(newItem);

  recalculateSlotTotal(slot);
  groupedCostEstimatesData.value = { ...groupedCostEstimatesData.value };
  await recalculateCosts();
};





const removeCustomLineItem = (slot, item) => {
  // Filter out the deleted item from the slot's customLineItems array
  slot.customLineItems = slot.customLineItems.filter(i => i.id !== item.id);

  // Recalculate the total cost for this slot after removal
  recalculateSlotTotal(slot);

  // Trigger reactivity by updating groupedCostEstimatesData
  groupedCostEstimatesData.value = { ...groupedCostEstimatesData.value };

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
    cost: cost,
    type: type,
    roomSlug: roomSlug,
  };
};
const updateAllSlotTotals = async () => {
  Object.values(groupedCostEstimatesData.value).forEach(slot => {
    recalculateSlotTotal(slot);
  });

  await recalculateCosts();
};


const updateInvoiceItem = (updatedItem) => {
  const slot = groupedCostEstimatesData.value[updatedItem.slotId];
  if (!slot) {
    console.error('Slot not found for', updatedItem.slotId);
    return;
  }

  let itemFound = false;

  // Update per-slot costs
  slot.perSlotCosts = slot.perSlotCosts.map(cost => {
    if (cost.id === updatedItem.id) {
      itemFound = true;
      return { ...cost, ...updatedItem };
    }
    return cost;
  });

  // Update room costs
  if (!itemFound) {
    slot.rooms = slot.rooms.map(room => {
      if (room.fullDayCostItem && room.fullDayCostItem.id === updatedItem.id) {
        itemFound = true;
        room.fullDayCostItem = { ...room.fullDayCostItem, ...updatedItem };
      } else if (room.daytimeCostItem && room.daytimeCostItem.id === updatedItem.id) {
        itemFound = true;
        room.daytimeCostItem = { ...room.daytimeCostItem, ...updatedItem };
      } else if (room.eveningCostItem && room.eveningCostItem.id === updatedItem.id) {
        itemFound = true;
        room.eveningCostItem = { ...room.eveningCostItem, ...updatedItem };
      }

      // Update additionalCosts
      room.additionalCosts = room.additionalCosts.map(cost => {
        if (cost.id === updatedItem.id) {
          itemFound = true;
          return { ...cost, ...updatedItem };
        }
        return cost;
      });

      return room;
    });
  }

  // Update custom line items
  if (!itemFound) {
    slot.customLineItems = slot.customLineItems.map(item => {
      if (item.id === updatedItem.id) {
        itemFound = true;
        return { ...item, ...updatedItem };
      }
      return item;
    });
  }

  if (!itemFound) {
    console.error('Item not found in any category for update:', updatedItem.id);
  }

  // Trigger reactivity
  groupedCostEstimatesData.value = { ...groupedCostEstimatesData.value };
  recalculateSlotTotal(slot);
  updateTotals();
};




const updateCustomLineItem = (slot, updatedItem) => {
  const index = slot.customLineItems.findIndex(item => item.id === updatedItem.id);
  if (index !== -1) {
    slot.customLineItems[index] = updatedItem;
    recalculateSlotTotal(slot);
  }
};

const recalculateSlotTotal = (slot) => {
  let total = 0;

  // Sum per-slot costs
  total += (slot.perSlotCosts || []).reduce((sum, cost) => sum + (Number(cost.cost) || 0), 0);

  // Sum room costs
  (slot.rooms || []).forEach((room) => {
    if (room.fullDayCostItem) {
      total += Number(room.fullDayCostItem.cost || 0);
    } else {
      total += Number(room.daytimeCostItem?.cost || 0);
      total += Number(room.eveningCostItem?.cost || 0);
    }
    total += (room.additionalCosts || []).reduce((sum, cost) => sum + (Number(cost.cost) || 0), 0);
  });

  // Sum custom line items
  total += (slot.customLineItems || []).reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  slot.slotTotal = total;
  slot.totalCost = total;
};


watch(() => groupedCostEstimatesData.value, (newValue) => {
  console.log('groupedCostEstimatesData updated:', JSON.stringify(newValue, null, 2));
  Object.values(newValue).forEach(slot => {
    slot.rooms.forEach(room => {
      console.log(`Room ${room.roomSlug} daytimeCostItem:`, room.daytimeCostItem);
      console.log(`Room ${room.roomSlug} eveningCostItem:`, room.eveningCostItem);
    });
  });
}, { deep: true });


const calculateSlotTotal = (slot) => {
  let total = 0;

  // Sum per-slot costs (these are slot-wide and should be counted only once)
  total += (slot.perSlotCosts || []).reduce((sum, cost) => sum + (Number(cost.cost) || 0), 0);

  // Process room-specific costs
  (slot.rooms || []).forEach(room => {
    // Add full day cost, if applicable
    if (room.fullDayCostItem) {
      total += Number(room.fullDayCostItem.cost);
    } else {
      // Add daytime and evening costs if no full day cost
      if (room.daytimeCostItem) {
        total += Number(room.daytimeCostItem.cost || 0);
      }
      if (room.eveningCostItem) {
        total += Number(room.eveningCostItem.cost || 0);
      }
    }

    // Add room-specific additional costs
    (room.additionalCosts || []).forEach(cost => {
      // Only add if it's not already in perSlotCosts
      if (!slot.perSlotCosts.some(slotCost => slotCost.description === cost.description)) {
        total += Number(cost.cost || 0);
      }
    });
  });

  // Sum custom line items
  total += (slot.customLineItems || []).reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  return total;
};

const saveCostEstimate = async () => {
  try {
    await useFetch(`/api/costEstimates/${props.rentalRequestId}/versions/${currentVersionNumber.value}`, {
      method: 'PUT',
      body: {
        costEstimates: Object.values(groupedCostEstimatesData.value),
        totalCost: totalCost.value,
        tax: taxAmount.value,
        totalWithTax: totalWithTax.value,
      },
    });
    await refresh();
  } catch (err) {
    console.error('Error saving cost estimate:', err);
    error.value = 'Failed to save cost estimate';
  }
};


const createNewVersion = async () => {
  try {
    // Prepare the cost estimates with all the necessary data, including `estimates`
    const preparedCostEstimates = prepareCostEstimatesForSave();

    // Make the API call to create a new version with `estimates` included
    const { data, error: fetchError } = await useFetch(`/api/costEstimates/${props.rentalRequestId}/versions`, {
      method: 'POST',
      body: {
        costEstimates: preparedCostEstimates,
        totalCost: totalCost.value,
        tax: taxAmount.value,
        totalWithTax: totalWithTax.value,
      },
    });

    // Check if there is any error in the response
    if (fetchError?.value || !data?.value) {
      console.error('Error creating new version:', fetchError?.value || data?.value);
      throw new Error('Failed to create a new version');
    }

    // Clone the current data to ensure no reactive references exist
    originalGroupedCostEstimatesData.value = cloneDeep(groupedCostEstimatesData.value);

    // Reset the flag indicating unsaved changes
    resetChangesFlag();

    // Extract the new version data from the response
    const newVersion = data.value.version;

    // Update the dropdown to include the new version
    costEstimateVersions.value.push({
      value: newVersion.version,
      label: newVersion.label,
      totalCost: newVersion.totalCost,
      statusHistory: newVersion.statusHistory || [],
    });

    // Set the dropdown to the new version
    currentVersionNumber.value = newVersion.version;

    // Fetch the new version details to load the data into the editor
    await fetchVersionDetails(newVersion.version);

    // Handle success response, such as showing a notification to the user
    toast.add({
      title: 'Version Created',
      description: 'A new version has been successfully saved.',
      color: 'green',
    });

  } catch (err) {
    // Catch and handle any errors during the API call
    console.error('Error while creating new version:', err);
    toast.add({
      title: 'Error',
      description: 'Failed to save the new version. Please try again.',
      color: 'red',
    });
  }
};




const resetChanges = () => {
  groupedCostEstimatesData.value = _.cloneDeep(originalGroupedCostEstimatesData.value);
};


const prepareCostEstimatesForSave = () => {
  if (!groupedCostEstimatesData.value) {
    console.error('groupedCostEstimatesData is undefined or null.');
    return [];
  }

  return Object.values(groupedCostEstimatesData.value).map(slot => ({
    end: slot.end,
    resources: slot.resources || [],
    id: slot.id,
    date: slot.date,
    start: slot.start,
    end: slot.end,
    perSlotCosts: (slot.perSlotCosts || []).map(cost => ({
      id: cost.id || uuidv4(),
      slotId: cost.slotId,
      description: cost.description || "No description",
      subDescription: cost.subDescription || '',
      cost: cost.cost
    })),
    estimates: (slot.rooms || []).map(room => ({
      roomSlug: room.roomSlug || 'N/A',
      basePrice: room.basePrice || 0,
      daytimePrice: room.daytimePrice || 0,
      eveningPrice: room.eveningPrice || 0,
      fullDayPrice: room.fullDayPrice || 0,
      daytimeHours: room.daytimeHours || 0,
      eveningHours: room.eveningHours || 0,
      daytimeRate: room.daytimeRate || 0,
      eveningRate: room.eveningRate || 0,
      daytimeRateType: room.daytimeRateType || '',
      eveningRateType: room.eveningRateType || '',
      totalCost: room.totalCost || 0,
      additionalCosts: (room.additionalCosts || []).map(cost => ({
        id: cost.id || uuidv4(),
        slotId: cost.slotId,
        description: cost.description || "No description",
        subDescription: cost.subDescription || '',
        cost: cost.cost
      })),
      daytimeCostItem: room.daytimeCostItem
        ? { ...room.daytimeCostItem, slotId: room.daytimeCostItem.slotId }
        : null,
      eveningCostItem: room.eveningCostItem
        ? { ...room.eveningCostItem, slotId: room.eveningCostItem.slotId }
        : null,
      fullDayCostItem: room.fullDayCostItem
        ? { ...room.fullDayCostItem, slotId: room.fullDayCostItem.slotId }
        : null,
    })),
    customLineItems: (slot.customLineItems || []).map(item => ({
      id: item.id || uuidv4(),
      slotId: item.slotId,
      description: item.description || "No description",
      cost: item.cost
    })).filter(item => item.cost > 0 && item.description.trim() !== ''),
    slotTotal: slot.totalCost || 0
  }));
};





const recalculateCosts = async () => {
  try {
    const rentalDates = {};

    for (const slot of Object.values(groupedCostEstimatesData.value)) {
      const dateKey = new Date(slot.date).toISOString().split('T')[0];

      if (!rentalDates[dateKey]) {
        rentalDates[dateKey] = [];
      }

      // Use resources from the slot or fallback to the ones from the rental request
      const slotResources = (slot.resources && slot.resources.length > 0)
        ? slot.resources
        : props.rentalRequest.resources || [];

      // Ensure "door_staff" is included if it should be
      if (!slotResources.includes("door_staff")) {
        slotResources.push("door_staff");
      }

      rentalDates[dateKey].push({
        ...slot,
        roomSlugs: (slot.rooms || []).map(room => room.roomSlug).filter(Boolean),
        isPrivate: slot.private,
        resources: slotResources,
        expectedAttendance: slot.expectedAttendance,
      });
    }

    const { data } = await useFetch('/api/costEstimates/recalculate', {
      method: 'POST',
      body: {
        rentalDates,
      },
    });

    if (data.value) {
      data.value.costEstimates.forEach((updatedEstimate) => {
        const slotId = updatedEstimate.id;
        const existingSlot = groupedCostEstimatesData.value[slotId];

        if (existingSlot) {
          // Update slot totals
          existingSlot.totalCost = updatedEstimate.totalCost;
          existingSlot.slotTotal = updatedEstimate.slotTotal;

          // Overwrite perSlotCosts
          existingSlot.perSlotCosts = (updatedEstimate.perSlotCosts || []).map(cost => ({
            ...cost,
            id: cost.id || uuidv4(),
            slotId,
          }));

          // Overwrite rooms
          existingSlot.rooms = updatedEstimate.estimates.map(estimate => ({
            ...estimate,
            roomName: getRoomName(estimate.roomSlug),
            fullDayCostItem: estimate.fullDayPrice
              ? {
                id: uuidv4(),
                description: `Full Day Rate`,
                cost: estimate.fullDayPrice,
                slotId,
              }
              : null,
            daytimeCostItem: estimate.daytimeCostItem
              ? { ...estimate.daytimeCostItem, id: estimate.daytimeCostItem.id || uuidv4(), slotId }
              : null,
            eveningCostItem: estimate.eveningCostItem
              ? { ...estimate.eveningCostItem, id: estimate.eveningCostItem.id || uuidv4(), slotId }
              : null,
            additionalCosts: (estimate.additionalCosts || []).map(cost => ({
              ...cost,
              id: cost.id || uuidv4(),
              slotId,
            })),
          }));

          // Recalculate the slot total
          recalculateSlotTotal(existingSlot);
        } else {
          // If the slot doesn't exist, add it
          groupedCostEstimatesData.value[slotId] = {
            ...updatedEstimate,
            perSlotCosts: (updatedEstimate.perSlotCosts || []).map(cost => ({
              ...cost,
              id: cost.id || uuidv4(),
              slotId,
            })),
            rooms: updatedEstimate.estimates.map(estimate => ({
              ...estimate,
              roomName: getRoomName(estimate.roomSlug),
              fullDayCostItem: estimate.fullDayPrice
                ? {
                  id: uuidv4(),
                  description: `Full Day Rate`,
                  cost: estimate.fullDayPrice,
                  slotId,
                }
                : null,
              daytimeCostItem: estimate.daytimeCostItem
                ? { ...estimate.daytimeCostItem, id: estimate.daytimeCostItem.id || uuidv4(), slotId }
                : null,
              eveningCostItem: estimate.eveningCostItem
                ? { ...estimate.eveningCostItem, id: estimate.eveningCostItem.id || uuidv4(), slotId }
                : null,
              additionalCosts: (estimate.additionalCosts || []).map(cost => ({
                ...cost,
                id: cost.id || uuidv4(),
                slotId,
              })),
            })),
            newLineItem: {
              type: 'custom',
              description: '',
              resourceId: null,
              cost: 0,
            },
          };
        }
      });

      // Update totals
      updateTotals();
    }
  } catch (error) {
    console.error('Error recalculating costs:', error);
  }
};


const removeInvoiceItem = (item) => {
  const slotId = item.slotId;
  const slot = groupedCostEstimatesData.value[slotId];

  if (!slot) {
    console.error('Slot not found:', slotId);
    return;
  }

  let itemRemoved = false;

  // Remove from perSlotCosts
  slot.perSlotCosts = (slot.perSlotCosts || []).filter(cost => {
    if (cost.id === item.id) {
      itemRemoved = true;
      return false;
    }
    return true;
  });

  // Remove from rooms
  slot.rooms = slot.rooms.map(room => {
    if (room.fullDayCostItem?.id === item.id) {
      itemRemoved = true;
      room.fullDayCostItem = null;
    } else if (room.daytimeCostItem?.id === item.id) {
      itemRemoved = true;
      room.daytimeCostItem = null;
    } else if (room.eveningCostItem?.id === item.id) {
      itemRemoved = true;
      room.eveningCostItem = null;
    }

    // Remove from additionalCosts
    room.additionalCosts = (room.additionalCosts || []).filter(cost => {
      if (cost.id === item.id) {
        itemRemoved = true;
        return false;
      }
      return true;
    });

    return room;
  });

  // Remove from customLineItems
  slot.customLineItems = (slot.customLineItems || []).filter(lineItem => {
    if (lineItem.id === item.id) {
      itemRemoved = true;
      return false;
    }
    return true;
  });

  if (!itemRemoved) {
    console.error('Item not found for removal:', item.id);
  }

  // Trigger reactivity
  groupedCostEstimatesData.value = { ...groupedCostEstimatesData.value };
  recalculateSlotTotal(slot);
  updateTotals();
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

// watch(() => props.rentalRequestId, async (newId, oldId) => {
//   if (newId !== oldId) {
//     await fetchVersions();
//     if (currentVersionNumber.value !== null) {
//       await fetchVersionDetails(currentVersionNumber.value);
//     }
//   }
// });

watch(() => props.rentalRequestId, async (newId, oldId) => {
  if (newId !== oldId) {
    await fetchVersions();  // Fetch versions and version details in one go
  }
});


watch(groupedCostEstimatesData, () => {
  nextTick(updateTotals);
}, { deep: true });









watch(costEstimateData, (newData) => {
  if (newData) {
    currentVersionNumber.value = newData.currentVersion;

    costEstimateVersions.value = newData.versions.map(v => ({
      value: v.version,
      label: v.label,
      totalCost: v.totalCost,
      statusHistory: v.statusHistory || [],
      createdAt: v.createdAt,
      costEstimates: v.costEstimates || []
    }));

    const currentVersion = newData.versions.find(v => v.version === newData.currentVersion);
    if (currentVersion) {
      groupedCostEstimatesData.value = groupCostEstimates(currentVersion.costEstimates);
      updateAllSlotTotals();  // Ensure slot totals are updated
    }
  }
}, { immediate: true });



const currentVersion = computed(() => {
  console.log('costEstimateVersions.value', costEstimateVersions.value);
  return costEstimateVersions.value.find(v => v.value === currentVersionNumber.value) || {};
});
const sendButtonLabel = computed(() => {
  return hasChanges.value
    ? "Save Changes and Send Estimate"
    : "Send Estimate";
});

const saveAndSendEstimate = async () => {
  // Set isSubmitting to true to show the loading modal
  isSubmitting.value = true;

  if (hasChanges.value) {
    await saveCostEstimate();
  }
  await sendEstimate();

  // Hide the loading modal after the process is complete
  isSubmitting.value = false;
};




</script>