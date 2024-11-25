<!-- pages/residencies/index.vue -->
<template>
  <UDashboardPage>

    <UDashboardPanel grow>
      <UDashboardPanelContent class="pb-24">
        <!-- Section for Key Metrics -->
        <section class="metrics-section mb-8">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-xl font-semibold">Residency Overview</h2>
              <p class="text-gray-600">Track and manage residency applications through their workflow stages.</p>
            </div>
            <!-- Clear filter button if a status is selected -->
            <UButton v-if="selectedStatus" color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="clearFilter">
              Clear filter
            </UButton>
          </div>

          <div class="dashboard-key-metrics grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- New Applications -->
            <UDashboardCard title="New Applications" @click="filterByStatus('new')"
              class="cursor-pointer transition-colors duration-200" :ui="{
                background: selectedStatus === 'new' ? 'bg-primary-50 dark:bg-primary-950' : '',
                ring: selectedStatus === 'new' ? 'ring-2 ring-primary-500' : '',
              }">
              <template #default>
                <div class="text-3xl font-bold">{{ metrics.new }}</div>
                <p class="text-sm text-gray-500 mt-2">New applications needing review</p>
              </template>
            </UDashboardCard>

            <!-- Pending Review -->
            <UDashboardCard title="Pending Review" @click="filterByStatus('pending_review')"
              class="cursor-pointer transition-colors duration-200" :ui="{
                background: selectedStatus === 'pending_review' ? 'bg-primary-50 dark:bg-primary-950' : '',
                ring: selectedStatus === 'pending_review' ? 'ring-2 ring-primary-500' : '',
              }">
              <template #default>
                <div class="text-3xl font-bold">{{ metrics.pending_review }}</div>
                <p class="text-sm text-gray-500 mt-2">Applications awaiting your review</p>
              </template>
            </UDashboardCard>

            <!-- Changes Requested -->
            <UDashboardCard title="Changes Requested" @click="filterByStatus('changes_requested')"
              class="cursor-pointer transition-colors duration-200" :ui="{
                background: selectedStatus === 'changes_requested' ? 'bg-primary-50 dark:bg-primary-950' : '',
                ring: selectedStatus === 'changes_requested' ? 'ring-2 ring-primary-500' : '',
              }">
              <template #default>
                <div class="text-3xl font-bold">{{ metrics.changes_requested }}</div>
                <p class="text-sm text-gray-500 mt-2">Waiting for resident updates</p>
              </template>
            </UDashboardCard>

            <!-- Pending Input -->
            <UDashboardCard title="Pending Input" @click="filterByStatus('pending_input')"
              class="cursor-pointer transition-colors duration-200" :ui="{
                background: selectedStatus === 'pending_input' ? 'bg-primary-50 dark:bg-primary-950' : '',
                ring: selectedStatus === 'pending_input' ? 'ring-2 ring-primary-500' : '',
              }">
              <template #default>
                <div class="text-3xl font-bold">{{ metrics.pending_input }}</div>
                <p class="text-sm text-gray-500 mt-2">Awaiting resident input</p>
              </template>
            </UDashboardCard>

            <!-- Approved -->
            <UDashboardCard title="Approved" @click="filterByStatus('approved')"
              class="cursor-pointer transition-colors duration-200" :ui="{
                background: selectedStatus === 'approved' ? 'bg-primary-50 dark:bg-primary-950' : '',
                ring: selectedStatus === 'approved' ? 'ring-2 ring-primary-500' : '',
              }">
              <template #default>
                <div class="text-3xl font-bold">{{ metrics.approved }}</div>
                <p class="text-sm text-gray-500 mt-2">Ready for publishing</p>
              </template>
            </UDashboardCard>

            <!-- Published -->
            <UDashboardCard title="Published" @click="filterByStatus('published')"
              class="cursor-pointer transition-colors duration-200" :ui="{
                background: selectedStatus === 'published' ? 'bg-primary-50 dark:bg-primary-950' : '',
                ring: selectedStatus === 'published' ? 'ring-2 ring-primary-500' : '',
              }">
              <template #default>
                <div class="text-3xl font-bold">{{ metrics.published }}</div>
                <p class="text-sm text-gray-500 mt-2">Active residencies</p>
              </template>
            </UDashboardCard>
          </div>
        </section>

        <!-- Table Section -->
        <section class="table-section">
          <!-- Header with search -->
          <UDashboardNavbar :title="tableTitle" :badge="filteredResidencies.length">
            <template #right>
              <UInput v-model="searchQuery" icon="i-heroicons-magnifying-glass" autocomplete="off"
                placeholder="Search residencies..." class="hidden lg:block" @keydown.esc="$event.target.blur()">
                <template #trailing>
                  <UKbd value="/" />
                </template>
              </UInput>
            </template>
          </UDashboardNavbar>

          <UCard :ui="{ header: { padding: 'p-4 sm:px-6' }, body: { padding: '' } }" class="min-w-0">
            <!-- Table -->
            <div v-if="isLoading" class="py-8">
              <div class="flex items-center justify-center">
                <div class="text-center">
                  <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
                  <p class="mt-2 text-sm text-gray-500">Loading residencies...</p>
                </div>
              </div>
            </div>

            <template v-else>
              <UTable :rows="paginatedResidencies" :columns="columns" :sort="sort" @update:sort="handleSortUpdate">
                <!-- Status Column -->
                <template #activeStatus-data="{ row }">
                  <UBadge :label="row.activeStatus" :color="getStatusColor(row.activeStatus)" variant="subtle"
                    class="capitalize" />
                </template>

                <!-- Title Column -->
                <template #title-data="{ row }">
                  <NuxtLink :to="`/residencies/${row.id}`" class="underline">
                    {{ row.title }}
                  </NuxtLink>
                </template>

                <!-- Date Columns -->
                <template #startDate-data="{ row }">
                  {{ formatDate(row.startDate) }}
                </template>
                <template #endDate-data="{ row }">
                  {{ formatDate(row.endDate) }}
                </template>

                <!-- Actions Column -->
                <template #actions-data="{ row }">
                  <div class="flex gap-2">
                    <UButton v-if="row.activeStatus === 'pending_review'" color="primary" variant="soft" size="xs"
                      @click="handleApprove(row.id)">
                      Approve
                    </UButton>
                    <UButton v-if="['pending_review', 'approved'].includes(row.activeStatus)" color="gray"
                      variant="soft" size="xs" @click="handleRequestChanges(row.id)">
                      Request Changes
                    </UButton>
                  </div>
                </template>
              </UTable>

              <!-- Empty State -->
              <div v-if="filteredResidencies.length === 0" class="py-12">
                <div class="text-center">
                  <UIcon name="i-heroicons-inbox" class="mx-auto h-12 w-12 text-gray-400" />
                  <h3 class="mt-2 text-sm font-semibold text-gray-900">No residencies found</h3>
                  <p class="mt-1 text-sm text-gray-500">No residencies match your current filters.</p>
                </div>
              </div>

              <!-- Pagination -->
              <div v-if="filteredResidencies.length > 0"
                class="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <p class="text-sm text-gray-500">
                  Showing {{ paginationStart }} to {{ paginationEnd }} of {{ totalResidencies }} residencies
                </p>
                <UPagination v-model="currentPage" :total="totalResidencies" :per-page="perPage" />
              </div>
            </template>
          </UCard>
        </section>

        <!-- Request Changes Modal -->
        <UModal v-model="showRequestChangesModal">
          <UCard>
            <template #header>
              <div class="text-lg font-semibold">
                Request Changes
              </div>
            </template>
            <ResidenciesRequestChangesForm v-if="selectedResidency" :title="selectedResidency.title"
              :record-id="selectedResidency.id" :recipient-emails="selectedResidency.recipientEmails"
              @submit="handleRequestChangesSubmit" />
          </UCard>
        </UModal>
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>


<script setup lang="ts">
import { format } from 'date-fns';
import type { Residency } from '~/types/residency';
// Page meta
definePageMeta({
  layout: 'default'
});

// Local state
const currentPage = ref(1);
const perPage = ref(10);
const searchQuery = ref('');
const selectedStatus = ref('');
const showRequestChangesModal = ref(false);
const selectedResidency = ref<Residency | null>(null);
const sort = ref({
  column: '_createdAt',
  direction: 'desc' as const
});

// Table configuration
const columns = [
  { key: 'activeStatus', label: 'Status', sortable: true },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'startDate', label: 'Start Date', sortable: true },
  { key: 'endDate', label: 'End Date', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false }
];

// Load residencies data
const { residencies: allResidencies, metrics, isLoading, error, refresh } = useResidenciesData();

// Filter residencies
const filteredResidencies = computed(() => {
  let filtered = [...allResidencies.value];

  // Apply status filter
  if (selectedStatus.value) {
    filtered = filtered.filter(r => r.activeStatus === selectedStatus.value);
  }

  // Apply search filter
  if (searchQuery.value) {
    const searchLower = searchQuery.value.toLowerCase();
    filtered = filtered.filter(r =>
      r.title?.toLowerCase().includes(searchLower) ||
      r.description?.toLowerCase().includes(searchLower)
    );
  }

  // Apply sorting
  if (sort.value.column) {
    filtered.sort((a, b) => {
      const aValue = a[sort.value.column];
      const bValue = b[sort.value.column];
      const direction = sort.value.direction === 'desc' ? -1 : 1;

      if (sort.value.column === 'startDate' || sort.value.column === 'endDate') {
        return (new Date(aValue) > new Date(bValue) ? 1 : -1) * direction;
      }
      return aValue > bValue ? direction : -direction;
    });
  }

  return filtered;
});


// Update the pagination computed properties in your page
const paginatedResidencies = computed(() => {
  console.log('Computing pagination:');
  console.log('- Current page:', currentPage.value);
  console.log('- Per page:', perPage.value);
  console.log('- Total records:', filteredResidencies.value.length);

  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;

  console.log('- Slice from', start, 'to', end);
  return filteredResidencies.value.slice(start, end);
});

// Add this right after the useResidenciesData call in your page
watchEffect(() => {
  console.log('hot reloading!')
  console.log('All residencies:', allResidencies.value?.length);
  console.log('Filtered residencies:', filteredResidencies.value?.length);
  console.log('Paginated residencies:', paginatedResidencies.value?.length);
});

const paginationStart = computed(() =>
  filteredResidencies.value.length === 0 ? 0 : ((currentPage.value - 1) * perPage.value) + 1
);
const paginationEnd = computed(() =>
  Math.min(currentPage.value * perPage.value, filteredResidencies.value.length)
);
const totalResidencies = computed(() => filteredResidencies.value.length);

const tableTitle = computed(() => {
  if (!selectedStatus.value) return 'All Residencies';
  return `${selectedStatus.value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Residencies`;
});

// Utility functions and handlers
const clearFilter = () => {
  selectedStatus.value = '';
  currentPage.value = 1;
};

const filterByStatus = (status: string) => {
  if (selectedStatus.value === status) {
    clearFilter();
  } else {
    selectedStatus.value = status;
    currentPage.value = 1;
  }
};

const formatDate = (date: string) => {
  if (!date) return 'No date';
  try {
    return format(new Date(date), 'MMM d, yyyy');
  } catch (e) {
    return 'Invalid date';
  }
};

const getStatusColor = (status: string) => {
  const colors = {
    new: 'blue',
    pending_input: 'yellow',
    pending_review: 'orange',
    changes_requested: 'red',
    approved: 'green',
    published: 'primary'
  };
  return colors[status] || 'gray';
};

const handleSortUpdate = (newSort: typeof sort.value) => {
  sort.value = newSort;
};

const handleApprove = async (id: string) => {
  isLoading.value = true;
  try {
    await $fetch(`/api/residencies/${id}/status`, {
      method: 'PUT',
      body: { status: 'approved' }
    });

    // Refresh data
    await refresh();

    const toast = useToast();
    toast.add({
      title: 'Success',
      description: 'Residency approved successfully',
      color: 'green'
    });
  } catch (error) {
    const toast = useToast();
    toast.add({
      title: 'Error',
      description: 'Failed to approve residency',
      color: 'red'
    });
  }
};

const handleRequestChanges = (id: string) => {
  selectedResidency.value = allResidencies.value.find(r => r.id === id) || null;
  showRequestChangesModal.value = true;
};

const handleRequestChangesSubmit = async ({ note, recipientEmails }: { note: string; recipientEmails: string[] }) => {
  if (!selectedResidency.value) return;

  try {
    await $fetch(`/api/residencies/${selectedResidency.value.id}/requestChanges`, {
      method: 'PUT',
      body: {
        note,
        recipientEmails,
        residencyTitle: selectedResidency.value.title
      }
    });

    showRequestChangesModal.value = false;
    await refresh();

    const toast = useToast();
    toast.add({
      title: 'Success',
      description: 'Changes requested successfully',
      color: 'green'
    });
  } catch (error) {
    const toast = useToast();
    toast.add({
      title: 'Error',
      description: 'Failed to request changes',
      color: 'red'
    });
  }
};

// Reset pagination when filters change
watch([searchQuery, selectedStatus], () => {
  currentPage.value = 1;
});
</script>
