<template>
  <UDashboardPanel grow>
    <UDashboardPanelContent class="pb-24">
      <div v-if="isLoading" class="p-4 text-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
        <p class="mt-2 text-sm text-gray-500">Loading...</p>
      </div>

      <template v-else>
        <div>
          <UDashboardSection title="Events" description="Manage events for this residency">
            <template #links v-if="residency?.workflowStatus === 'approved'">
              <UButton color="primary" @click="handleGenerateEvents" :loading="isGeneratingEvents">
                {{ residencyEvents.length ? 'Regenerate Events' : 'Generate Events' }}
              </UButton>
            </template>

            <div v-if="isLoadingEvents" class="p-4 text-center">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
              <p class="mt-2 text-sm text-gray-500">Loading events...</p>
            </div>

            <div v-else>
              <!-- Events Table -->
              <div v-if="sortedEvents.length > 0">
                <UTable :rows="sortedEvents" :columns="eventColumns">
                  <template #title-data="{ row }">
                    <div v-if="row._status === 'published'" class="items-center flex flex-row">
                      <div class="mr-1">{{ row.title }}</div>
                      <UIcon v-if="row._status === 'published'" name="ic-round-circle" class="w-3 h-3 text-green-500" />
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

              <!-- No Events State -->
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
          </UDashboardSection>
        </div>
      </template>
    </UDashboardPanelContent>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { format, parseISO, compareAsc } from 'date-fns'
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

// Add debug logging
const debug = (message: string, data?: any) => {
  console.log(`[Events Page] ${message}`, data || '');
};

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
      // Set events directly from the residency data
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
  isGeneratingEvents.value = true;
  try {
    await $fetch(`/api/residencies/${residency.value.id}/generate-events`, { method: 'POST' });
    // Refresh the events data
    await refresh();
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

const handleRegenerateEvents = async () => {
  await handleGenerateEvents();
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

// Table configuration
const eventColumns = [
  { key: 'title', label: 'Title', slot: 'title-data' },
  { key: 'dates', label: 'Dates', slot: 'dates-data' },
  { key: 'workflowStatus', label: 'Workflow Status', slot: 'workflowStatus-data' },
  { key: 'actions', label: 'Actions', slot: 'actions-data' }
];

// Utility functions
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '—';
  return format(parseISO(dateTime), 'MMM d, yyyy h:mm a');
};

const prettyStatus = (status: string) => {
  return status?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || '—';
};

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

// Computed properties
const pageTitle = computed(() =>
  residency.value ? `Events - ${residency.value.title}` : 'Events'
)

// Computed property to sort events by start date
const sortedEvents = computed(() => {
  const sorted = residencyEvents.value.slice().sort((a, b) => compareAsc(parseISO(a.startDate), parseISO(b.startDate)));
  debug('Sorted events:', sorted);
  return sorted;
});

// Event action handlers
const getEventActions = (event) => {
  const actions = []

  if (event._status === 'draft') {
    actions.push(
      {
        label: 'Edit',
        icon: 'i-heroicons-pencil',
        to: `/events/${event.id}/edit`
      }
    )
  }

  return actions
}

// Update lifecycle hooks
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

// Add navigation guard
onBeforeRouteLeave((to, from) => {
  debug('Leaving events page', { to, from });
});

definePageMeta({
  middleware: 'auth'
});
</script>