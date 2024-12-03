<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardPanelContent class="pb-24">
        <!-- Navigation and page header -->
        <!-- Navigation -->
        <UNavbar :links="navigationLinks" />

        <!-- Action buttons -->
        <div class="flex justify-between items-center mb-4">
          <div></div> <!-- Empty div for spacing -->
          <div class="flex gap-2">
            <UButton color="primary" :loading="isGeneratingEvents" icon="i-mdi-refresh" variant="soft"
              @click="handleGenerateEvents">
              {{ residencyEvents.length ? 'Regenerate Events' : 'Generate Events' }}
            </UButton>
          </div>
        </div>

        <section class="table-section">
          <UCard :ui="{ header: { padding: 'p-4 sm:px-6' }, body: { padding: '' } }" class="min-w-0">
            <!-- Filters -->
            <div class="flex justify-between px-3 py-3.5 border-b border-gray-200">
              <div class="flex justify-start mb-4 items-center">
                <USelect v-model="viewMode" :options="[
                  { label: 'Upcoming Events', value: 'current' },
                  { label: 'Past Events', value: 'past' }
                ]" class="w-48 pr-2" />
              </div>
              <div v-if="viewMode === 'current'" class="flex justify-center mb-4 items-center">
                <USelectMenu v-model="selectedStatusOption" :options="statusOptions" option-attribute="label"
                  class="min-w-48">
                  <template #label>
                    <span
                      :class="[getStatusColorClass(selectedStatusOption.value), 'inline-block h-2 w-2 flex-shrink-0 rounded-full']"
                      aria-hidden="true" />
                    <span class="truncate">{{ prettyStatus(selectedStatusOption.label) }} ({{
                      selectedStatusOption.count
                    }})</span>
                  </template>

                  <template #option="{ option: status }">
                    <span
                      :class="[getStatusColorClass(status.value), 'inline-block h-2 w-2 flex-shrink-0 rounded-full']"
                      aria-hidden="true" />
                    <span class="truncate">{{ prettyStatus(status.label) }} ({{ status.count }})</span>
                  </template>
                </USelectMenu>
              </div>
            </div>

            <div v-if="isLoadingEvents" class="py-8">
              <div class="flex items-center justify-center">
                <div class="text-center">
                  <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
                  <p class="mt-2 text-sm text-gray-500">Loading events...</p>
                </div>
              </div>
            </div>

            <template v-else>
              <div>
                <div v-if="sortedEvents.length > 0">
                  <UTable :rows="filteredEvents" :columns="eventColumns">
                    <template #title-data="{ row }">
                      <div v-if="row._status === 'published'" class="items-center flex flex-row">
                        <div class="mr-1">{{ row.title }}</div>
                        <UIcon v-if="row._status === 'published'" name="ic-round-circle"
                          class="w-3 h-3 text-green-500" />
                      </div>
                      <div v-else class="items-center flex flex-row">
                        <div class="mr-1">{{ row.title }}</div>
                        <UIcon name="i-heroicons-clock" class="inline w-3 h-3" />
                      </div>
                    </template>
                    <template #dates-data="{ row }">
                      {{ formatDateRange(row.startDate, row.endDate) }}<br>
                      {{ formatTime(row.startDate) }} - {{ formatTime(row.endDate) }}
                    </template>
                    <template #workflowStatus-data="{ row }">
                      <UBadge v-if="row.workflowStatus?.toLowerCase() !== 'draft'"
                        :color="getStatusColor(row.workflowStatus)" size="sm">
                        {{ prettyStatus(row.workflowStatus || 'none') }}
                      </UBadge>
                      <span v-else>&nbsp;</span>
                    </template>

                    <template #actions-data="{ row }">
                      <UButton :to="row._editingUrl" color="gray" size="xs" target="_blank" icon="i-mdi-pencil"
                        variant="soft">
                        Edit in DatoCMS
                      </UButton>
                    </template>
                  </UTable>
                </div>

                <div v-else class="text-center py-12">
                  <UIcon name="i-heroicons-calendar" class="mx-auto h-12 w-12 text-gray-400" />
                  <h3 class="mt-2 text-sm font-semibold text-gray-900">No events</h3>
                  <p class="mt-1 text-sm text-gray-500">
                    {{ residency?.workflowStatus === 'approved'
                      ? 'Get started by generating events for this residency.'
                      : 'Events can be generated once the residency is approved.' }}
                  </p>
                </div>
              </div>
            </template>
          </UCard>
        </section>
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { format, parseISO, compareAsc, startOfToday, isBefore } from 'date-fns'
import type { Residency } from '~/types/residency'
import { useWorkflowDate } from '~/composables/useWorkflowDate'

const { formatDateRange, formatTime } = useWorkflowDate();

const toast = useToast();
const route = useRoute();
const residency = ref<Residency | null>(null);
const isLoadingEvents = ref(false);
const isGeneratingEvents = ref(false);
const residencyEvents = ref([]);
const isLoading = ref(false);

// Page title computed property
const pageTitle = computed(() => {
  return residency.value ? `Events - ${residency.value.title}` : 'Events';
});

// Debug logging
const debug = (message: string, data?: any) => {
  console.log(`[Events Page] ${message}`, data || '');
};

// Navigation and header links
const navigationLinks = computed(() => [
  {
    label: 'Details',
    icon: 'i-heroicons-document-text',
    to: `/residencies/${route.params.id}`,
  },
  {
    label: 'Events',
    icon: 'i-heroicons-calendar',
    to: `/residencies/${route.params.id}/events`,
  }
]);

// Action links configuration with null safety
const actionLinks = computed(() => {
  const canGenerateEvents = residency.value?.workflowStatus === 'approved';
  const hasEvents = residencyEvents.value?.length > 0;

  return [
    {
      label: hasEvents ? 'Regenerate Events' : 'Generate Events',
      icon: 'i-mdi-refresh',
      disabled: !canGenerateEvents,
      loading: isGeneratingEvents.value,
      onClick: handleGenerateEvents,
      color: 'primary',
      variant: 'soft'
    }
  ]
});

// Fetch residency data
const fetchResidencyData = async () => {
  const QUERY = `
    query Residency($id: ItemId!) {
      residency(filter: { id: { eq: $id } }) {
        id
        title
        workflowStatus
        _status
        _createdAt
        _updatedAt
        description
        startDate
        endDate
        slug
        generateEvents
        _allReferencingEvents {
          id
          title
          startDate
          endDate
          _status
          cancelled
          workflowStatus
          _editingUrl
        }
      }
    }
  `;

  try {
    debug('Executing GraphQL query with ID:', route.params.id);
    const { data, error: gqlError } = await useGraphqlQuery({
      query: QUERY,
      variables: { id: route.params.id }
    });

    if (data.value?.residency) {
      residency.value = data.value.residency;
      residencyEvents.value = data.value.residency._allReferencingEvents || [];
      debug('Fetched residency events:', residencyEvents.value);
    }

    if (gqlError.value) {
      throw new Error(gqlError.value.message);
    }
  } catch (e) {
    debug('Error in fetchResidencyData:', e);
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : 'Failed to fetch residency data',
      color: 'red'
    });
  }
};

// Event generation handlers
const handleGenerateEvents = async () => {
  if (!residency.value?.id) return;

  isGeneratingEvents.value = true;
  try {
    await $fetch(`/api/residencies/${residency.value.id}/generate-events`, { method: 'POST' });
    await fetchResidencyData();
    toast.add({
      title: 'Success',
      description: 'Events generated successfully',
      color: 'green'
    });
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'Failed to generate events',
      color: 'red'
    });
  } finally {
    isGeneratingEvents.value = false;
  }
};

// Table configuration
const eventColumns = [
  { key: 'title', label: 'Title', slot: 'title-data' },
  { key: 'dates', label: 'Dates', slot: 'dates-data' },
  { key: 'workflowStatus', label: 'Status', slot: 'workflowStatus-data' },
  { key: 'actions', label: 'Actions', slot: 'actions-data' }
];

// Status utilities
const getStatusColor = (status: string) => {
  const colors = {
    new: 'blue',
    resident_action_required: 'yellow',
    pending_review: 'orange',
    approved: 'green',
    published: 'primary'
  }
  return colors[status as keyof typeof colors] || 'stone'
}

const getStatusColorClass = (status: string) => {
  const colorClasses = {
    '': 'bg-gray-400',
    new: 'bg-blue-400',
    resident_action_required: 'bg-yellow-400',
    pending_review: 'bg-orange-400',
    approved: 'bg-green-400',
    published: 'bg-primary-400'
  }
  return colorClasses[status as keyof typeof colorClasses] || 'bg-gray-200'
}

const prettyStatus = (status: string) => {
  return status?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || '—';
};

// Metrics computed property
const metrics = computed(() => ({
  new: residencyEvents.value.filter(e => e.workflowStatus === 'new').length,
  pending_review: residencyEvents.value.filter(e => e.workflowStatus === 'pending_review').length,
  resident_action_required: residencyEvents.value.filter(e => e.workflowStatus === 'resident_action_required').length,
  approved: residencyEvents.value.filter(e => e.workflowStatus === 'approved').length
}));

// Status options
const statusOptions = computed(() => [
  { label: 'All Statuses', value: '', count: residencyEvents.value.length },
  { label: 'New', value: 'new', count: metrics.value.new },
  { label: 'Pending Input', value: 'resident_action_required', count: metrics.value.resident_action_required },
  { label: 'Pending Review', value: 'pending_review', count: metrics.value.pending_review },
  { label: 'Approved', value: 'approved', count: metrics.value.approved }
])

// Sort events by date
const sortedEvents = computed(() => {
  const sorted = residencyEvents.value.slice().sort((a, b) => compareAsc(parseISO(a.startDate), parseISO(b.startDate)));
  debug('Sorted events:', sorted);
  return sorted;
});

// Local state
const currentPage = ref(1)
const perPage = ref(10)
const selectedStatus = ref('')
const viewMode = ref('current')

// Filter events
const filteredEvents = computed(() => {
  let filtered = [...residencyEvents.value]
  const today = startOfToday()

  // Time-based filtering
  filtered = filtered.filter(e => {
    if (!e.endDate) {
      return viewMode.value === 'current'
    }

    const endDate = parseISO(e.endDate)
    if (!endDate) {
      console.warn(`Invalid end date for event: ${e.id}`)
      return viewMode.value === 'current'
    }

    const isCurrent = !isBefore(endDate, today)
    return viewMode.value === 'current' ? isCurrent : !isCurrent
  })

  // Status filter
  if (selectedStatus.value) {
    filtered = filtered.filter(e => e.workflowStatus === selectedStatus.value)
  }

  // Sort by start date
  filtered.sort((a, b) => compareAsc(parseISO(a.startDate), parseISO(b.startDate)))

  return filtered
})

// Initialize selectedStatusOption
const selectedStatusOption = ref(
  statusOptions.value.find(option => option.value === selectedStatus.value) || statusOptions.value[0]
)

// Watchers
watch(selectedStatusOption, (newOption) => {
  selectedStatus.value = newOption.value
})

watch(selectedStatus, (newStatus) => {
  const matchingOption = statusOptions.value.find(option => option.value === newStatus)
  if (matchingOption) {
    selectedStatusOption.value = matchingOption
  } else {
    selectedStatusOption.value = statusOptions.value[0]
  }
})

watch(viewMode, () => {
  selectedStatus.value = ''
  selectedStatusOption.value = statusOptions.value[0]
})

// Lifecycle hooks
onMounted(async () => {
  debug('Component mounted');
  await fetchResidencyData();
});

watch(() => route.params.id, async (newId, oldId) => {
  debug('Route ID changed', { newId, oldId });
  if (newId && newId !== oldId) {
    await fetchResidencyData();
  }
}, { immediate: true });

onBeforeRouteLeave((to, from) => {
  debug('Leaving events page', { to, from });
});

definePageMeta({
  middleware: 'auth'
});
</script>