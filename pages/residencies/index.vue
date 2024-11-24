<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { format } from 'date-fns';
import useGraphqlQuery from '~~/composables/useGraphqlQuery'; // Ensure correct import path
import debounce from 'lodash.debounce'; // For debouncing search input

// Define Items Per Page
const itemsPerPage = 30;

// Columns Configuration
const defaultColumns = [
  { key: "activeStatus", label: "Status", sortable: true },
  { key: "title", label: "Title", sortable: true },
  { key: "startDate", label: "Start Date", sortable: true },
  { key: "endDate", label: "End Date", sortable: true },
  { key: "_createdAt", label: "Created", sortable: true },
];

const selectedColumns = ref(defaultColumns);
const columns = computed(() =>
  defaultColumns.filter(column =>
    selectedColumns.value.some(selected => selected.key === column.key)
  )
);

// Statuses for Filtering
const residencyStatuses = [
  "active",
  'new',
  'pending_input',
  'pending_review',
  'changes_requested',
  'approved',
  'archived'
];

// Function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return 'blue';
    case 'pending_input':
      return 'yellow';
    case 'pending_review':
      return 'orange';
    case 'changes_requested':
      return 'red';
    case 'approved':
      return 'green';
    case 'archived':
      return 'gray';
    default:
      return 'gray';
  }
};

// Reactive Variables
const q = ref('');
const page = ref(1);
const sort = ref({
  column: '_createdAt',
  direction: 'desc' as const,
});
const residencies = ref([]);
const isLoading = ref(false);
const selectedStatuses = ref([]); // For filtering
const errorMessage = ref(''); // For error handling

// Total Pages
const totalPages = ref(1);

// Define reactive variables for metrics
const totalNewResidencies = ref(0);
const pendingInput = ref(0);
const pendingReview = ref(0);
const changesRequested = ref(0);
const approved = ref(0);
const archived = ref(0);

// GraphQL Query with Pagination and Filters
const RESIDENCY_QUERY = `
  query GetResidencies($skip: IntType!, $first: IntType!, $filter: ResidencyModelFilter) {
    allResidencies(
      orderBy: _createdAt_ASC
      skip: $skip
      first: $first
      filter: $filter
    ) {
      id
      title
      activeStatus
      description
      startDate
      endDate
      _createdAt
      slug
      photo {
        url
      }
    }
    totalCountFiltered: _allResidenciesMeta(filter: $filter) {
      count
    }
    totalNewResidencies: _allResidenciesMeta(filter: { activeStatus: { eq: "new" } }) {
      count
    }
    pendingInput: _allResidenciesMeta(filter: { activeStatus: { eq: "pending_input" } }) {
      count
    }
    pendingReview: _allResidenciesMeta(filter: { activeStatus: { eq: "pending_review" } }) {
      count
    }
    changesRequested: _allResidenciesMeta(filter: { activeStatus: { eq: "changes_requested" } }) {
      count
    }
    approved: _allResidenciesMeta(filter: { activeStatus: { eq: "approved" } }) {
      count
    }
    archived: _allResidenciesMeta(filter: { activeStatus: { eq: "archived" } }) {
      count
    }
  }
`;

// Fetch Residencies with Server-Side Pagination and Filtering
const fetchResidencies = async () => {
  isLoading.value = true;
  errorMessage.value = ''; // Reset error message
  const variables: any = {
    skip: (page.value - 1) * itemsPerPage,
    first: itemsPerPage,
    filter: {},
  };

  if (selectedStatuses.value.length > 0) {
    variables.filter.activeStatus = { eq: selectedStatuses.value[0] }; // Assuming single selection
  }

  try {
    const { data, error } = await useGraphqlQuery({ query: RESIDENCY_QUERY, variables, includeDrafts: true });
    if (error.value) {
      console.error('Failed to fetch residencies', error.value);
      errorMessage.value = 'Failed to load residencies. Please try again later.';
    } else if (data.value) {
      residencies.value = data.value.allResidencies;

      const total = data.value.totalCountFiltered.count;
      totalPages.value = Math.ceil(total / itemsPerPage);

      // Set metrics directly from data
      totalNewResidencies.value = data.value.totalNewResidencies.count;
      pendingInput.value = data.value.pendingInput.count;
      pendingReview.value = data.value.pendingReview.count;
      changesRequested.value = data.value.changesRequested.count;
      approved.value = data.value.approved.count;
      archived.value = data.value.archived.count;
    }
  } catch (e) {
    console.error('Failed to fetch residencies', e);
    errorMessage.value = 'An unexpected error occurred. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

// Fetch residencies immediately during setup (runs on both server and client)
fetchResidencies();

// Format Dates
const formatDates = (start: string, end: string) => {
  const startDate = format(new Date(start), 'MMM d, yyyy');
  const endDateFormatted = format(new Date(end), 'MMM d, yyyy');
  return `${startDate} - ${endDateFormatted}`;
};

const formatCreatedAt = (createdAt: string) => {
  return format(new Date(createdAt), 'MMM d, yyyy');
};

// Debounce search input to optimize performance
const debouncedFetchResidencies = debounce(() => {
  page.value = 1; // Reset to first page on search
  fetchResidencies();
}, 300);

// Watchers to refetch data when page or filters change
watch([page, selectedStatuses], () => {
  fetchResidencies();
});

// Watcher for search input
watch(q, () => {
  debouncedFetchResidencies();
});
</script>



<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <!-- Wrapper for dashboard content -->
      <UDashboardPanelContent class="pb-24">
        <!-- Section for Key Metrics -->
        <section class="metrics-section mb-8">
          <h2 class="text-xl font-semibold mb-4">Residency Overview</h2>
          <p class="text-gray-600 mb-6">Monitor the status of all residencies.</p>

          <div class="dashboard-key-metrics grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- New Residencies Card -->
            <UDashboardCard title="New" @click="filterByStatus('new')" class="cursor-pointer">
              <template #default>
                <div class="text-3xl font-bold">{{ totalNewResidencies }}</div>
                <p class="text-sm text-gray-500 mt-2">New residencies awaiting input</p>
              </template>
            </UDashboardCard>

            <!-- Pending Input Card -->
            <UDashboardCard title="Pending Input" @click="filterByStatus('pending_input')" class="cursor-pointer">
              <template #default>
                <div class="text-3xl font-bold">{{ pendingInput }}</div>
                <p class="text-sm text-gray-500 mt-2">Residencies awaiting input from residents</p>
              </template>
            </UDashboardCard>

            <!-- Pending Review Card -->
            <UDashboardCard title="Pending Review" @click="filterByStatus('pending_review')" class="cursor-pointer">
              <template #default>
                <div class="text-3xl font-bold">{{ pendingReview }}</div>
                <p class="text-sm text-gray-500 mt-2">Residencies submitted for review</p>
              </template>
            </UDashboardCard>

            <!-- Changes Requested Card -->
            <UDashboardCard title="Changes Requested" @click="filterByStatus('changes_requested')"
              class="cursor-pointer">
              <template #default>
                <div class="text-3xl font-bold">{{ changesRequested }}</div>
                <p class="text-sm text-gray-500 mt-2">Residencies needing changes</p>
              </template>
            </UDashboardCard>

            <!-- Approved Card -->
            <UDashboardCard title="Approved" @click="filterByStatus('approved')" class="cursor-pointer">
              <template #default>
                <div class="text-3xl font-bold">{{ approved }}</div>
                <p class="text-sm text-gray-500 mt-2">Approved residencies</p>
              </template>
            </UDashboardCard>

            <!-- Archived Card -->
            <UDashboardCard title="Archived" @click="filterByStatus('archived')" class="cursor-pointer">
              <template #default>
                <div class="text-3xl font-bold">{{ archived }}</div>
                <p class="text-sm text-gray-500 mt-2">Archived residencies</p>
              </template>
            </UDashboardCard>
          </div>
        </section>

        <!-- Table Section -->
        <section class="table-section">
          <!-- Filter toolbar and search bar -->
          <UDashboardNavbar title="Residencies" :badge="residencies.length">
            <template #right>
              <UInput v-model="q" icon="i-heroicons-funnel" autocomplete="off" placeholder="Search residencies..."
                class="hidden lg:block" @keydown.esc="$event.target.blur()">
                <template #trailing>
                  <UKbd value="/" />
                </template>
              </UInput>
            </template>
          </UDashboardNavbar>

          <UCard :ui="{ header: { padding: 'p-4 sm:px-6' }, body: { padding: '' } }" class="min-w-0">
            <UDashboardToolbar>
              <template #left>
                <USelectMenu v-model="selectedStatuses" icon="i-heroicons-check-circle" placeholder="Filter by Status"
                  multiple :options="residencyStatuses" :ui-menu="{ option: { base: 'capitalize' } }" />
              </template>

              <template #right>
                <USelectMenu v-model="selectedColumns" icon="i-heroicons-adjustments-horizontal-solid"
                  :options="columns" multiple class="hidden lg:block">
                  <template #label>
                    Display Columns
                  </template>
                </USelectMenu>
              </template>
            </UDashboardToolbar>

            <!-- Table and Pagination -->
            <div v-if="isLoading" class="text-center py-4">Loading...</div>
            <UTable :rows="residencies" :columns="columns" :sort="sort" v-if="!isLoading">
              <!-- Custom Cell Templates -->
              <template #title-data="{ row }">
                <NuxtLink :to="`/residencies/${row.id}`" class="underline">{{ row.title }}</NuxtLink>
              </template>
              <template #activeStatus-data="{ row }">
                <UBadge :label="row.activeStatus" :color="getStatusColor(row.activeStatus)" variant="subtle"
                  class="capitalize" />
              </template>
              <template #startDate-data="{ row }">
                {{ format(new Date(row.startDate), 'MMM d, yyyy') }}
              </template>
              <template #endDate-data="{ row }">
                {{ format(new Date(row.endDate), 'MMM d, yyyy') }}
              </template>
              <template #_createdAt-data="{ row }">
                {{ formatCreatedAt(row._createdAt) }}
              </template>
            </UTable>

            <!-- No Results Message -->
            <div v-if="!isLoading && residencies.length === 0" class="text-center py-4 text-gray-500">
              No residencies found.
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="text-center py-4 text-red-500">
              {{ errorMessage }}
            </div>

            <!-- Pagination Controls -->
            <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
              <UPagination v-model="page" :page-count="totalPages" :total="totalPages * itemsPerPage" />
            </div>
          </UCard>
        </section>
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<style scoped>
.contents {
  display: contents;
}
</style>
