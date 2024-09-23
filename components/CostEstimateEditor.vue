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

            </div>
          </div>
          <div>
            <span class="text-lg font-semibold dark:text-stone-100">{{ formatCurrency(totalCost || 0) }}</span>
          </div>
        </div>
      </template>

      <div v-if="Object.keys(groupedCostEstimates).length > 0">
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
  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useResources } from '@/composables/useResources';
import { formatDescription, formatCurrency, formatDate, formatTimeRange } from '@/utils/formatters';
import { isEqual } from 'lodash-es';

const toast = useToast();

import cloneDeep from 'lodash/cloneDeep';

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


const emit = defineEmits(['save', 'close']);
const originalGroupedCostEstimatesData = ref(null);

const { user } = useAuth();
const userId = computed(() => user.value?._id || null);
console.log('Current user ID:', user.value);
// Now you can use userId.value wherever you need the user ID


const hasChanges = computed(() => {
  return !isEqual(groupedCostEstimatesData.value, originalGroupedCostEstimatesData.value);
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
    console.log('Sending estimate with version:', currentVersionNumber.value, selectedVersion);

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

    console.log('PDF Payload:', JSON.stringify(pdfPayload, null, 2));

    const response = await fetch('/api/costEstimates/sendEstimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pdfPayload),
    });

    const result = await response.json();
    console.log("Response from server:", result);

    if (result.success) {
      toast.add({
        icon: 'i-heroicons-check-badge',
        title: 'Success!',
        color: 'green',
        description: 'This estimate has been emailed to the renter.',
      });
      console.log('Estimate sent successfully');
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


const ensureItemHasId = (item) => {
  if (!item.id) {
    console.warn('Item missing ID:', item);
    return { ...item, id: uuidv4() };
  }
  return item;
};
const versionOptions = computed(() => costEstimateVersions.value);
const groupCostEstimates = (costEstimates) => {
  return costEstimates.reduce((acc, estimate) => {
    const slotId = estimate.id;
    acc[slotId] = {
      id: slotId,
      ...estimate,
      rooms: (estimate.rooms || []).map(room => {
        const roomName = roomMapping.value.find((r) => r.slug === room.roomSlug)?.name || room.roomSlug;
        return {
          ...room,
          roomName,
          fullDayCostItem: room.fullDayPrice ? ensureItemHasId({
            id: uuidv4(),
            slotId: slotId,
            description: `Full Day Flat Rate`,
            cost: room.fullDayPrice
          }) : null,
          daytimeCostItem: room.daytimePrice ? ensureItemHasId({
            id: uuidv4(),
            slotId: slotId,
            description: formatDescription(room.daytimeHours, room.daytimeRate, room.daytimeRateType, 'Daytime', roomName),
            cost: room.daytimePrice
          }) : null,
          eveningCostItem: room.eveningPrice ? ensureItemHasId({
            id: uuidv4(),
            slotId: slotId,
            description: formatDescription(room.eveningHours, room.eveningRate, room.eveningRateType, 'Evening', roomName),
            cost: room.eveningPrice
          }) : null,
          additionalCosts: (room.additionalCosts || []).map(cost => ensureItemHasId({
            ...cost,
            slotId: slotId,
            id: cost.id || uuidv4(),
          })),
        };
      }),
      perSlotCosts: (estimate.perSlotCosts || []).map(cost => ensureItemHasId({
        ...cost,
        slotId: slotId,
        id: cost.id || uuidv4(),
      })),
      customLineItems: (estimate.customLineItems || []).map(item => ensureItemHasId({
        ...item,
        slotId: slotId,
        id: item.id || uuidv4(),
      })),
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


watch([costEstimateData, error], ([newData, newError]) => {
  if (newData) {
    // Set the estimate ID and current version number
    estimateIdRef.value = newData._id;
    currentVersionNumber.value = newData.currentVersion;

    // Map over versions to include statusHistory as well
    costEstimateVersions.value = newData.versions.map(v => ({
      value: v.version,
      label: v.label,
      totalCost: v.totalCost,
      tax: v.tax || 0,
      totalWithTax: v.totalWithTax || 0,
      statusHistory: v.statusHistory || [] // Ensure statusHistory is included
    }));

    // Find and set the current version data, including the cost estimates
    const currentVersion = newData.versions.find(v => v.version === newData.currentVersion);
    if (currentVersion) {
      // Process the grouped cost estimates and set the values
      groupedCostEstimatesData.value = groupCostEstimates(currentVersion.costEstimates);
      calculatedGrandTotal.value = currentVersion.totalCost || 0; // ✅ This will update the reactive source

      // totalCost.value = currentVersion.totalCost || 0;
      taxAmount.value = currentVersion.tax || 0;
      totalWithTax.value = currentVersion.totalWithTax || 0;
    }
  }
}, { immediate: true });



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

const transformVersionData = () => {

};

const fetchVersionDetails = async (versionNumber) => {
  const versionsArray = [...costEstimateData.value.versions];
  const version = versionsArray.find(v => v.version === versionNumber);
  if (version) {
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

  const updateItemInArray = (array) => array.map(item =>
    (item.id === updatedItem.id) ? { ...item, ...updatedItem } : item
  );

  slot.perSlotCosts = updateItemInArray(slot.perSlotCosts || []);
  slot.customLineItems = updateItemInArray(slot.customLineItems || []);
  slot.rooms = (slot.rooms || []).map(room => ({
    ...room,
    additionalCosts: updateItemInArray(room.additionalCosts || []),
    fullDayCostItem: room.fullDayCostItem?.id === updatedItem.id ? { ...room.fullDayCostItem, ...updatedItem } : room.fullDayCostItem,
    daytimeCostItem: room.daytimeCostItem?.id === updatedItem.id ? { ...room.daytimeCostItem, ...updatedItem } : room.daytimeCostItem,
    eveningCostItem: room.eveningCostItem?.id === updatedItem.id ? { ...room.eveningCostItem, ...updatedItem } : room.eveningCostItem,
  }));

  groupedCostEstimatesData.value = { ...groupedCostEstimatesData.value };
  recalculateSlotTotal(slot);
  recalculateCosts();
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
  }
};

const recalculateSlotTotal = (slot) => {
  slot.totalCost = calculateSlotTotal(slot);

  // Reassign the slot to trigger reactivity
  groupedCostEstimatesData.value = {
    ...groupedCostEstimatesData.value,
    [slot.id]: { ...slot },
  };
};

const calculateSlotTotal = (slot) => {
  let total = 0;

  // Sum per-slot costs
  total += (slot.perSlotCosts || []).reduce((sum, cost) => sum + (Number(cost.cost) || 0), 0);

  // Sum room costs
  (slot.rooms || []).forEach(room => {
    if (Number(room.fullDayPrice) > 0) {
      total += Number(room.fullDayPrice) || 0;
    } else {
      total += Number(room.daytimePrice) || 0;
      total += Number(room.eveningPrice) || 0;
    }
    total += (room.additionalCosts || []).reduce((sum, cost) => sum + (Number(cost.cost) || 0), 0);
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
    const preparedCostEstimates = prepareCostEstimatesForSave();

    if (preparedCostEstimates.length === 0) {
      throw new Error('No cost estimates to save.');
    }

    const { data, error } = await useFetch(`/api/costEstimates/${props.rentalRequestId}/versions`, {
      method: 'POST',
      body: {
        costEstimates: preparedCostEstimates,
        totalCost: totalCost.value,
        tax: taxAmount.value,
        totalWithTax: totalWithTax.value,
      },
    });

    // ... rest of your code ...
  } catch (err) {
    console.error('Error creating new version:', err);
    error.value = 'Failed to create new version';
  }
};



const prepareCostEstimatesForSave = () => {
  if (!groupedCostEstimatesData.value) {
    console.error('groupedCostEstimatesData is undefined or null.');
    return [];
  }

  return Object.values(groupedCostEstimatesData.value).map(slot => ({
    id: slot.id,
    date: slot.date,
    start: slot.start,
    end: slot.end,
    perSlotCosts: (slot.perSlotCosts || []).map(cost => ({
      id: cost.id || uuidv4(),
      description: cost.description,
      subDescription: cost.subDescription || '',
      cost: cost.cost
    })),
    rooms: (slot.rooms || []).map(room => ({
      roomSlug: room.roomSlug,
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
      additionalCosts: (room.additionalCosts || []).map(cost => ({
        id: cost.id || uuidv4(),
        description: cost.description,
        subDescription: cost.subDescription || '',
        cost: cost.cost
      }))
    })),
    customLineItems: (slot.customLineItems || []).map(item => ({
      id: item.id || uuidv4(),
      description: item.description,
      cost: item.cost
    })).filter(item => item.cost > 0 && item.description.trim() !== ''),
    slotTotal: slot.totalCost || 0
  }));
};
// const recalculateCosts = async () => {
//   console.log('Starting recalculateCosts');
//   const rentalDatesWithCostItems = [];

//   for (const slot of Object.values(groupedCostEstimatesData.value)) {
//     console.log('Processing slot:', slot.id);
//     const costItems = [];

//     // Add perSlotCosts
//     if (slot.perSlotCosts) {
//       costItems.push(...slot.perSlotCosts);
//     }

//     // Add customLineItems
//     if (slot.customLineItems) {
//       costItems.push(...slot.customLineItems);
//     }

//     // Add room costs
//     for (const room of slot.rooms) {
//       if (room.fullDayCostItem) costItems.push(room.fullDayCostItem);
//       if (room.daytimeCostItem) costItems.push(room.daytimeCostItem);
//       if (room.eveningCostItem) costItems.push(room.eveningCostItem);
//       if (room.additionalCosts) costItems.push(...room.additionalCosts);
//     }

//     rentalDatesWithCostItems.push({
//       date: slot.date,
//       start: slot.start,
//       end: slot.end,
//       costItems: costItems,
//       roomSlugs: slot.rooms.map(room => room.roomSlug),
//       isPrivate: slot.isPrivate || false,
//       resources: slot.resources || [],
//       expectedAttendance: slot.expectedAttendance || 0,
//     });
//   }

//   console.log('Data sent to server for recalculation:', JSON.stringify(rentalDatesWithCostItems, null, 2));

//   try {
//     const { data, error } = await useFetch(`/api/costEstimates/recalculate`, {
//       method: 'POST',
//       body: {
//         rentalDates: rentalDatesWithCostItems,
//       },
//     });

//     if (error.value) {
//       console.error('Error recalculating costs:', error.value);
//     } else if (data.value) {
//       console.log('Recalculated costs:', data.value);
//       totalCost.value = data.value.grandTotal || 0;
//       taxAmount.value = data.value.tax || 0;
//       totalWithTax.value = data.value.totalWithTax || 0;

//       // Update the cost estimates in your data structure
//       Object.entries(data.value.costEstimates).forEach(([date, estimates]) => {
//         if (groupedCostEstimatesData.value[date]) {
//           groupedCostEstimatesData.value[date] = estimates;
//         }
//       });

//     }
//   } catch (error) {
//     console.error('Error recalculating costs:', error);
//   }
// };

const totals = computed(() => {
  let newTotalCost = 0;
  for (const slot of Object.values(groupedCostEstimatesData.value)) {
    newTotalCost += slot.slotTotal || 0;
  }
  const newTaxAmount = newTotalCost * 0.13; // Assuming 13% tax rate
  const newTotalWithTax = newTotalCost + newTaxAmount;

  return {
    totalCost: newTotalCost,
    taxAmount: newTaxAmount,
    totalWithTax: newTotalWithTax
  };
});

// Function to recalculate costs
const recalculateCosts = async () => {
  try {
    const rentalDates = Object.values(groupedCostEstimatesData.value).map(slot => {
      const roomSlugs = (slot.rooms || []).map(roomId => {
        const room = roomMapping.value.find(r => r.id === roomId);
        return room ? room.slug : undefined;
      }).filter(Boolean);

      if (roomSlugs.length === 0) {
        console.warn(`No valid room slugs found for slot ${slot.id}. Using parking-lot as default.`);
        roomSlugs.push('parking-lot'); // Add a default room slug if none are found
      }

      const allCostItems = [
        ...(slot.perSlotCosts || []),
        ...(slot.customLineItems || []),
        ...(slot.costItems || []),
        ...((slot.rooms || []).flatMap(room =>
          [
            room.fullDayCostItem,
            room.daytimeCostItem,
            room.eveningCostItem,
            ...(room.additionalCosts || [])
          ].filter(Boolean)
        ))
      ].filter(Boolean);

      return {
        ...slot,
        roomSlugs,
        rooms: roomSlugs,
        isPrivate: slot.private || false,
        resources: slot.resources || [],
        expectedAttendance: slot.expectedAttendance || 0,
        costItems: allCostItems
      };
    });

    console.log('Rental dates to be sent for recalculation:', JSON.stringify(rentalDates, null, 2));

    const { data } = await useFetch('/api/costEstimates/recalculate', {
      method: 'POST',
      body: {
        rentalDates: rentalDates,
        roomMapping: roomMapping.value,
        resourceOptions: resourceOptions.value,
      }
    });

    if (data.value) {
      console.log('Recalculated data received:', JSON.stringify(data.value, null, 2));

      // Update the cost estimates in your data structure
      if (Array.isArray(data.value.costEstimates)) {
        const newGroupedCostEstimates = { ...groupedCostEstimatesData.value };
        data.value.costEstimates.forEach((updatedEstimate) => {
          if (newGroupedCostEstimates[updatedEstimate.id]) {
            newGroupedCostEstimates[updatedEstimate.id] = {
              ...newGroupedCostEstimates[updatedEstimate.id],
              ...updatedEstimate,
              slotTotal: updatedEstimate.slotTotal,
            };
          }
        });
        groupedCostEstimatesData.value = newGroupedCostEstimates;
      }

      // Update totals
      nextTick(() => {
        totalCost.value = data.value.grandTotal;
        taxAmount.value = data.value.tax;
        totalWithTax.value = data.value.totalWithTax;
      });
    }
  } catch (error) {
    console.error('Error recalculating costs:', error);
  }
};

// Watch for changes in the computed totals
watch(totals, (newTotals) => {
  totalCost.value = newTotals.totalCost;
  taxAmount.value = newTotals.taxAmount;
  totalWithTax.value = newTotals.totalWithTax;
});

// Function to remove an invoice item
const removeInvoiceItem = async (item) => {
  const slotId = item.slotId;
  const slot = groupedCostEstimatesData.value[slotId];

  if (!slot) {
    console.error('Slot not found:', slotId);
    return;
  }

  const newSlot = { ...slot };

  // Remove from perSlotCosts
  newSlot.perSlotCosts = (newSlot.perSlotCosts || []).filter(cost => cost.id !== item.id);

  // Remove from customLineItems
  newSlot.customLineItems = (newSlot.customLineItems || []).filter(lineItem => lineItem.id !== item.id);

  // Remove from rooms
  newSlot.rooms = (newSlot.rooms || []).map(room => ({
    ...room,
    additionalCosts: (room.additionalCosts || []).filter(cost => cost.id !== item.id),
    fullDayCostItem: room.fullDayCostItem?.id === item.id ? null : room.fullDayCostItem,
    daytimeCostItem: room.daytimeCostItem?.id === item.id ? null : room.daytimeCostItem,
    eveningCostItem: room.eveningCostItem?.id === item.id ? null : room.eveningCostItem,
  }));

  // Update the slot in the grouped cost estimates
  groupedCostEstimatesData.value = {
    ...groupedCostEstimatesData.value,
    [slotId]: newSlot
  };

  // Recalculate costs
  await recalculateCosts();
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
  if (hasChanges.value) {
    await saveCostEstimate();
  }
  await sendEstimate();
};

</script>