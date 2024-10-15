<template>
  <div class="cost-estimate-editor space-y-8">
    <!-- Status History Button and Slideover (unchanged) -->

    <UCard class="shadow-lg" v-if="!isLoading">
      <!-- Card Header (unchanged) -->

      <RentalsDateManager :initialDates="addedDates" @trigger-modal="handleModalOpen"
        @update:dates="handleDateUpdates" />

      <div v-if="Object.keys(groupedCostEstimates).length > 0" class="space-y-8">
        <div v-for="(slots, date) in groupedCostEstimates" :key="date"
          class="bg-stone-50 dark:bg-stone-900 p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4 text-primary">
            {{ formatDate(date, 'MMMM d, yyyy') }}


          </h2>

          <div v-for="slot in slots" :key="slot.id" class="mb-6 p-4 bg-white dark:bg-stone-800 rounded-md shadow">
            <h3 class="text-lg font-semibold mb-2">
              <!-- {{ formatTimeRange(slot.start, slot.end) }} -->
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <!-- Per-Slot Costs -->
                <div v-if="slot.perSlotCosts && slot.perSlotCosts.length > 0">
                  <h4 class="text-sm uppercase font-bold text-primary mb-2">Slot Costs</h4>
                  <div v-for="(cost, costIndex) in slot.perSlotCosts" :key="costIndex">
                    <InvoiceItem :item="cost" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
                  </div>
                </div>

                <!-- Room Estimates -->
                <h4 class="text-sm uppercase font-bold text-primary mb-2">Room Costs</h4>
                <div v-for="(estimate, estimateIndex) in slot.estimates" :key="estimateIndex" class="mb-4">

                  <h4 class="text-md font-semibold mb-2">{{ store.getRoomName(estimate.roomSlug) }}</h4>

                  <template v-if="estimate.fullDayCostItem">
                    <InvoiceItem :item="estimate.fullDayCostItem" @update="updateInvoiceItem"
                      @remove="removeInvoiceItem" />
                  </template>

                  <template v-if="estimate.daytimeCostItem">
                    <InvoiceItem :item="estimate.daytimeCostItem" @update="updateInvoiceItem"
                      @remove="removeInvoiceItem" />
                  </template>

                  <template v-if="estimate.eveningCostItem">
                    <InvoiceItem :item="estimate.eveningCostItem" @update="updateInvoiceItem"
                      @remove="removeInvoiceItem" />
                  </template>

                  <!-- Additional Costs -->
                  <div v-if="estimate.additionalCosts && estimate.additionalCosts.length > 0" class="mt-2">
                    <h5 class="text-sm font-semibold text-gray-600 mb-1">Additional Costs</h5>
                    <div v-for="(cost, costIndex) in estimate.additionalCosts" :key="costIndex">
                      <InvoiceItem :item="cost" @update="updateInvoiceItem" @remove="removeInvoiceItem" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-stone-100 dark:bg-stone-950 p-4 rounded-md space-y-4">
                <!-- Custom Line Item Input -->
                <h4 class="text-sm uppercase font-bold text-primary mb-2">Add Custom Line Item</h4>
                <div v-if="slot.newLineItem" class="grid grid-cols-2 gap-4">
                  <USelect v-model="slot.newLineItem.type" :options="[
                    { label: 'Custom', value: 'custom' },
                    { label: 'Resource', value: 'resource' }
                  ]" @update:modelValue="(value) => handleNewLineItemTypeChange(slot, value)" />

                  <USelect v-if="slot.newLineItem.type === 'resource'" v-model="slot.newLineItem.resourceId"
                    :options="getAvailableResourcesForSlot(slot)"
                    :disabled="getAvailableResourcesForSlot(slot).length === 0"
                    @update:modelValue="(value) => onResourceSelect(slot, value)" />

                  <UInput v-else v-model="slot.newLineItem.description" placeholder="Description" />
                  <UInput v-model="slot.newLineItem.cost" type="number" step="0.01" placeholder="Cost"
                    @update:modelValue="(event) => updateCost(slot, event)" />
                  <UButton @click="() => addLineItem(slot)" :disabled="!isValidNewLineItem(slot.newLineItem)"
                    class="col-span-2">
                    Add
                  </UButton>
                </div>

                <!-- Display Custom Line Items -->
                <div v-if="slot.customLineItems && slot.customLineItems.length > 0">
                  <h4 class="text-sm uppercase font-bold text-primary mb-2">Custom Line Items</h4>
                  <div v-for="(item, itemIndex) in slot.customLineItems" :key="itemIndex">
                    <InvoiceItem :item="item" @update="(updatedItem) => updateCustomLineItem(slot, updatedItem)"
                      @remove="() => removeCustomLineItem(slot, item)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="py-8">
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
        startTime: slot.startTime || slot.start,
        endTime: slot.endTime || slot.end,
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


</script>