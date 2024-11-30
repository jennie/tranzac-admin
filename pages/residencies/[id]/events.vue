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
            <template #links v-if="residency?.activeStatus === 'approved'">
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
              <div v-if="residencyEvents.length > 0">
                <UTable :rows="residencyEvents" :columns="eventColumns">
                  <template #actions-data="{ row }">
                    <UDropdown :items="getEventActions(row)">
                      <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-vertical" />
                    </UDropdown>
                  </template>
                </UTable>
              </div>

              <!-- No Events State -->
              <div v-else class="text-center py-12">
                <UIcon name="i-heroicons-calendar" class="mx-auto h-12 w-12 text-gray-400" />
                <h3 class="mt-2 text-sm font-semibold text-gray-900">No events</h3>
                <p class="mt-1 text-sm text-gray-500">
                  {{ residency?.activeStatus === 'approved'
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
import { format, parseISO } from 'date-fns'
import type { Residency } from '~/types/residency'

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
        activeStatus
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
  { key: 'title', label: 'Title' },
  {
    key: 'startDate',
    label: 'Start Time',
    render: (value) => formatDateTime(value)
  },
  {
    key: 'endDate',
    label: 'End Time',
    render: (value) => formatDateTime(value)
  },
  {
    key: '_status',
    label: 'Status',
    render: (value, row) => {
      if (row.cancelled) return 'Cancelled';
      return prettyStatus(value);
    }
  },
  { key: 'actions', label: 'Actions' }
];

// Utility functions
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '—';
  return format(parseISO(dateTime), 'MMM d, yyyy h:mm a');
};

const prettyStatus = (status: string) => {
  return status?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || '—';
};

// Computed properties
const pageTitle = computed(() =>
  residency.value ? `Events - ${residency.value.title}` : 'Events'
)

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