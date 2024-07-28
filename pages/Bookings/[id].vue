<template>
  <UDashboardPanel grow>
    <UDashboardPanelContent class="pb-24">
      <UPageHeader v-if="rental._status === 'published'" headline="Rental" :title="rental.organization"
        icon="i-heroicons-clipboard" :description="formattedDate">
      </UPageHeader>
      <UPageHeader v-else headline="Rental Request" :title="rental.organization" :description="formattedDate"
        :links="rental._status !== 'published' ? [{ label: 'Edit', color: 'black', to: rental._editingUrl }, { label: 'Approve', color: 'green', click: approveRental }] : []"
        icon="i-heroicons-clipboard" />

      <UDivider class="mb-4" />

      <UDashboardSection title="Submission" description="">
        <div v-for="property in rentalProperties" :key="property.key"
          class="grid grid-cols-2 gap-2 border-b items-center">
          <p class="flex self-start font-bold">{{ property.label }}</p>
          <p v-if="property.key === '_status' && rental[property.key] === 'published'"
            class="flex flex-row items-center uppercase text-green-500 text-2xl font-bold">
            <UIcon name="i-heroicons-clipboard-document-check" class="mr-2" /> <span>Approved</span>
          </p>
          <p v-else-if="property.key === '_status' && rental[property.key] === 'draft'"
            class="flex flex-row items-center uppercase text-2xl font-bold">
            <UIcon name="i-heroicons-pencil" class="mr-2" /> <span>Draft</span>
          </p>
          <p v-else-if="property.isHTML" class="prose dark:prose-invert" v-html="rental[property.key]"></p>
          <p v-else-if="property.key !== '_status'">{{ property.format ? property.format(rental[property.key]) :
            rental[property.key] }}</p>
        </div>
        <div class="grid grid-cols-2 col-start-2 gap-2 border-b items-center">
          <div class="self-start font-bold">Notes & History</div>
          <pre v-text="rental.internalNotes" class="w-full text-sm font-display" />
        </div>
      </UDashboardSection>

      <UDashboardSection title="Rental Dates and Slots" description="">
        <div v-for="date in rental.dates || []" :key="date.id" class="mb-6">
          <h3 class="text-lg font-semibold mb-2">{{ formatDate(date.date) }}</h3>
          <div v-for="slot in date.slots || []" :key="slot.id" class="ml-4 mb-4 p-4 border rounded">
            <UInput v-model="slot.title" label="Title" class="mb-2" />
            <UInput v-model="slot.startTime.time" label="Start Time" class="mb-2" />
            <UInput v-model="slot.endTime.time" label="End Time" class="mb-2" />
            <UToggle v-model="slot.allAges" label="All Ages" class="mb-2" />
            <UTextarea v-model="slot.description" label="Description" class="mb-2" />
            <UInput v-model="slot.doorsTime.time" label="Doors Time" class="mb-2" />
            <UInput v-model="slot.eventType" label="Event Type" class="mb-2" />
            <UInput v-model="slot.expectedAttendance" label="Expected Attendance" type="number" class="mb-2" />
            <UInput v-model="slot.loadInTime.time" label="Load In Time" class="mb-2" />
            <UInput v-model="slot.loadOutTime.time" label="Load Out Time" class="mb-2" />
            <UToggle v-model="slot.private" label="Private Event" class="mb-2" />
            <UInput v-model="slot.resources" label="Resources" class="mb-2" />
            <USelect v-model="slot.rooms" :options="availableRooms" label="Rooms" multiple class="mb-2" />
            <UInput v-model="slot.soundCheckTime.time" label="Sound Check Time" class="mb-2" />
          </div>
        </div>
      </UDashboardSection>

      <UDashboardSection title="Cost Estimate" description="">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-2xl">Cost Estimate</h3>
          <div class="text-right">
            <p class="text-lg font-semibold text-stone-500 dark:text-stone-300">
              Total: {{ formatCurrency(calculateGrandTotal()) }}
            </p>
            <button @click="openModal" type="button" class="text-red-400 hover:text-red-300 underline">
              View Full Breakdown
            </button>
          </div>
        </div>
        <p class="text-stone-500 dark:text-stone-300 text-sm">
          <em>This is an estimate. Your final cost may be different based on final options. Our staff will be in touch
            to confirm.</em>
        </p>
        <CostBreakdownModal v-if="isModalOpen" :costEstimates="costEstimates" @close="closeModal" />
      </UDashboardSection>

    </UDashboardPanelContent>
  </UDashboardPanel>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { format, formatDistance, isValid } from "date-fns";
import { useRoomMapping } from '@/composables/useRoomMapping';
import { useResources } from '@/composables/useResources';
import { calculateCostEstimates, formatCurrency } from '@/utils/costCalculations';

const router = useRouter();
const route = useRoute();
const id = ref(route.params.id);
const rental = reactive({});
const error = ref(null);
const isLoading = ref(true);
const isModalOpen = ref(false);
const componentKey = ref(0);

const QUERY = `
  query Rental($id: ItemId!) {
    rental(filter: {id: {eq: $id}}) {
      id
      _status
      _createdAt
      _editingUrl
      _updatedAt
      inquiryStatus
      internalNotes
      organization
      primaryContactEmail
      primaryContactName
      primaryContactPhone
      primaryContactPronouns
      dates {
        id
        date
        slots {
          id
          title
          startTime {
            time
          }
          endTime {
            time
          }
          allAges
          description
          doorsTime {
            time
          }
          eventType
          expectedAttendance
          loadInTime {
            time
          }
          loadOutTime {
            time
          }
          private
          resources
          rooms {
            name
          }
          soundCheckTime {
            time
          }
        }
      }
    }
  }
`;

const fetchRental = () => {
  const { data, error: fetchError } = useGraphqlQuery({
    query: QUERY,
    variables: { id: id.value },
    includeDrafts: true,
    transform: (data) => ({
      ...data,
      submissionDate: new Date(data.rental._createdAt),
    })
  });

  watchEffect(() => {
    if (fetchError.value) {
      console.error('Failed to fetch rental', fetchError.value);
    } else if (data.value) {
      Object.assign(rental, data.value.rental);
    }
  });
};

onMounted(fetchRental);
watchEffect(() => {
  fetchRental();
});

const rentalProperties = [
  { key: '_status', label: 'Status' },
  { key: '_updatedAt', label: 'Last Updated', format: (date) => isValid(new Date(date)) ? format(new Date(date), 'MMM d, y') : 'Invalid date' },
  { key: 'primaryContactName', label: 'Primary Contact Name' },
  { key: 'primaryContactEmail', label: 'Primary Contact Email' },
  { key: 'primaryContactPhone', label: 'Primary Contact Phone' },
  { key: 'primaryContactPronouns', label: 'Primary Contact Pronouns' },
  { key: 'resources', label: 'Resources' },
  { key: 'rooms', label: 'Rooms', format: (rooms) => rooms ? rooms.map(room => room.name).join(', ') : '' },
  { key: 'allAges', label: 'All Ages', format: (allAges) => allAges ? 'Yes' : 'No' },
  { key: 'private', label: 'Private', format: (privateEvent) => privateEvent ? 'Yes' : 'No' },
  { key: 'organization', label: 'Organization' },
  { key: 'description', label: 'Description', isHTML: true },
  { key: 'loadInTime', label: 'Load In Time', format: (timeObj) => timeObj ? timeObj.time : 'N/A' },
  { key: 'soundCheckTime', label: 'Sound Check Time', format: (timeObj) => timeObj ? timeObj.time : 'N/A' },
  { key: 'doorsTime', label: 'Doors Time', format: (timeObj) => timeObj ? timeObj.time : 'N/A' },
  { key: 'loadOutTime', label: 'Load Out Time', format: (timeObj) => timeObj ? timeObj.time : 'N/A' },
  { key: 'eventType', label: 'Event Type' },
  { key: 'expectedAttendance', label: 'Expected Attendance' },
];

const formattedDate = computed(() => {
  if (rental._createdAt && isValid(new Date(rental._createdAt))) {
    return `Submitted on ${format(new Date(rental._createdAt), 'MMM d, y')} (${formatDistance(new Date(rental._createdAt), new Date(), { addSuffix: true })})`;
  } else {
    return 'Loading…';
  }
});

const { roomMapping } = useRoomMapping();
const { resourceOptions } = useResources();

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const costEstimates = computed(() => {
  if (!rental.dates) {
    return [];
  }

  return calculateCostEstimates(rental.dates, roomMapping.value, resourceOptions.value);
});

const calculateGrandTotal = () => {
  return costEstimates.value.reduce((total, estimate) =>
    total + estimate.roomCosts.reduce((slotTotal, roomCost) => slotTotal + roomCost.totalCost, 0), 0);
};

const availableRooms = computed(() => {
  return roomMapping.value.map(room => ({ label: room.name, value: room.id }));
});
</script>
