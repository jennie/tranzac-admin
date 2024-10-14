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
      <RentalsDateManager :initialDates="addedDates" @trigger-modal="handleModalOpen"
        @update:dates="handleDateUpdates" />

      <div v-if="Object.keys(groupedCostEstimates).length > 0">
        <div v-for="(slots, key) in groupedCostEstimates" :key="key">
          <h2 class="text-xl font-bold my-4">{{ formatGroupKey(key) }}
          </h2>
          <div v-for="slot in slots" :key="slot.id">

            <!-- Per-Slot Costs -->
            <div v-if="slot.perSlotCosts && slot.perSlotCosts.length > 0" class="p-4">
              <h4 class="text-sm uppercase font-bold text-primary">Slot Costs</h4>
              <div v-for="(cost, costIndex) in slot.perSlotCosts" :key="costIndex">
                <InvoiceItem :item="cost" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
              </div>

            </div>
            <div v-for="(estimate, estimateIndex) in slot.estimates" :key="estimateIndex">
              <h4 class="text-sm uppercase font-bold">{{ estimate.roomSlug }}</h4>

              <!-- Full Day Rental -->
              <template v-if="estimate.fullDayCostItem">
                <InvoiceItem :item="estimate.fullDayCostItem" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
              </template>

              <!-- Daytime -->
              <template v-if="estimate.daytimeCostItem">
                <InvoiceItem :item="estimate.daytimeCostItem" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
              </template>

              <!-- Evening -->
              <template v-if="estimate.eveningCostItem">
                <InvoiceItem :item="estimate.eveningCostItem" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
              </template>

              <!-- Additional Costs -->
              <div v-if="estimate.additionalCosts && estimate.additionalCosts.length > 0" class="mt-6">
                <h4 class="text-sm uppercase font-bold text-primary">Additional Costs</h4>
                <div v-for="(cost, costIndex) in estimate.additionalCosts" :key="costIndex">
                  <InvoiceItem :item="cost" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
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
import { useAdminBookingStore } from '@/stores/adminBookingStore';
import { storeToRefs } from 'pinia';
import { useResources } from '@/composables/useResources';
import { isValid, parseISO, format } from 'date-fns';
import { formatDescription, formatCurrency, formatDate, formatTimeRange } from '@/utils/formatters';
import _ from 'lodash';
import { da } from 'date-fns/locale';
const newDate = ref(null);
const addedDates = ref([]);
const showDates = ref(true);  // For toggling the visibility of the date list

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

const store = useAdminBookingStore();
const {
  groupedCostEstimatesData,
  costEstimateVersions,
  currentVersionNumber,
  totalCost,
  taxAmount,
  totalWithTax,
  hasChanges,
  isLoading,
  sendButtonLabel,
  rentalData
} = storeToRefs(store);

const {
  fetchRoomMapping,
  fetchVersions,
  handleVersionChange,
  recalculateCosts,
  updateInvoiceItem,
  removeInvoiceItem,
  updateCustomLineItem,
  removeCustomLineItem,
  addLineItem,
  saveCostEstimate,
  createNewVersion,
  resetChanges,
  sendEstimate,
  updateResourceSelection,
  updateRoomSelection,
  groupCostEstimates
} = store;

const route = useRoute();
const toast = useToast();
const { user } = useAuth();
const userId = computed(() => user.value?._id || null);


// CostEstimateEditor.vue
const handleDateUpdates = async (updatedDates) => {
  addedDates.value = updatedDates;
  console.log('Updated Dates:', addedDates.value);

  // Save new dates and slots to the backend
  const slotsData = {
    dates: addedDates.value.map((date) => ({
      date: date.date,
      ...(date.id && !date.isNew ? { id: date.id } : {}),
      slots: date.slots.map((slot) => ({
        title: slot.title,
        startTime: slot.startTime,
        endTime: slot.endTime,
        rooms: slot.rooms.map((room) => ({ id: room.id })),
        resources: slot.resources || [],
        ...(slot.id && !slot.isNew ? { id: slot.id } : {}),
      })),
    })),
  };

  await store.saveEventSlots(slotsData);

  // Re-fetch rental data after saving
  await store.fetchRentalData(props.rentalRequestId);

  // Recalculate costs with the updated data
  await store.recalculateCosts();
};







const { resourceOptions } = useResources();

const isSubmitting = ref(false);
const statusHistorySlideoverIsOpen = ref(false);

// CostEstimateEditor.vue
watch(rentalData, (newData) => {
  if (newData && newData.dates && newData.dates.slots > 0) {
    const estimates = newData.dates.flatMap((date) =>

      date.slots.map((slot) => ({
        ...slot,
        rooms: slot.rooms || [],
        startTime: slot.startTime?.time
          ? slot.startTime
          : { time: slot.startTime },
        endTime: slot.endTime?.time ? slot.endTime : { time: slot.endTime },
        date: new Date(date.date).toISOString(),
      }))
    );
    groupedCostEstimatesData.value = groupCostEstimates(estimates);
  }
});
// after making these changes, when i saved a new slot, it overwrote the existing dates data in DatoCMS instead of appending a new date with the new slot data. (If a date already exists I would also expect it to append the slot to the existing date) additionally, i get an error about "invalid time value. values: Start Time: { time: '12:00' } End Time: { time: '17:00' }


const groupedCostEstimates = computed(() => {
  console.log("Computing groupedCostEstimates:", groupedCostEstimatesData.value);
  return groupedCostEstimatesData.value || {};
});



onMounted(async () => {
  isLoading.value = true;
  try {
    await store.fetchRoomMapping();
    await store.fetchVersions();

    if (props.rentalRequestId) {
      store.setCurrentRentalRequest(props.rentalRequestId);
      await store.fetchRentalData(props.rentalRequestId);
      console.log('Rental data fetched:', rentalData.value);

      // Initialize addedDates with existing dates from rentalData
      if (rentalData.value && rentalData.value.dates) {
        addedDates.value = rentalData.value.dates;
      }
    }

    await store.recalculateCosts();
  } finally {
    isLoading.value = false;
  }
});






// const versionOptions = computed(() => store.costEstimateVersions.value);

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

const handleAddLineItem = async (slot) => {
  if (!isValidNewLineItem(slot.newLineItem)) return;

  const newItem = {
    id: uuidv4(),
    slotId: slot.id,
    description: slot.newLineItem.description,
    cost: Number(slot.newLineItem.cost),
  };

  await addLineItem(slot, newItem);

  // Recalculate costs after adding a custom line item
  await store.recalculateCosts();
};


const saveAndSendEstimate = async () => {
  isSubmitting.value = true;
  try {
    if (hasChanges.value) {
      await saveCostEstimate();
    }
    await recalculateCosts(); // Recalculate before sending

    const pdfPayload = preparePdfPayload();
    await sendEstimate(pdfPayload);
    toast.add({
      icon: 'i-heroicons-check-badge',
      title: 'Success!',
      color: 'green',
      description: 'This estimate has been emailed to the renter.',
    });
  } catch (error) {
    console.error('Error in saveAndSendEstimate:', error);
    toast.add({
      title: 'Error',
      color: 'red',
      description: 'Failed to save and send estimate. Please try again.',
    });
  } finally {
    isSubmitting.value = false;
  }
};


const preparePdfPayload = () => {
  // Implement the logic to prepare the PDF payload
  // This should be similar to the pdfPayload object in your original sendEstimate function
};
const formatGroupKey = (key) => {
  if (key === 'unknown-date') return 'Unknown Date';
  if (isValid(parseISO(key))) return formatDate(key);
  return `Group: ${key}`;
};

</script>