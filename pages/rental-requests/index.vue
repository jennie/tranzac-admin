<script setup lang="ts">
import { format } from 'date-fns';

const defaultColumns = [
  {
    key: "inquiryStatus", label: "Status", sortable: true
  },
  { key: "organization", label: "Organization", sortable: true },
  {
    key: "primaryContactName", label: "Contact", sortable: true, direction: 'desc' as const
  },
  { key: "dates", label: "Event Date", sortable: true },
  { key: "_createdAt", label: "Created", sortable: true },
];
const inquiryStatuses = ['new', 'estimate_sent', 'estimate_accepted', 'contract_signed', 'deposit_paid', 'balance_paid'];

const selectedColumns = ref(defaultColumns);
const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)));

const q = ref('');
const page = ref(1);
const pageCount = 50;

const sort = ref({
  column: '_createdAt',
  direction: 'desc' as const,
});

const rentalRequests = ref([]);
const isLoading = ref(false);

const QUERY = `query {
  allRentals(first: 100, orderBy: _createdAt_ASC) {
    _status
    inquiryStatus
    organization
    id
    primaryContactName
    dates {
      date
    }
    _createdAt
  }
}

`;
const selectedStatuses = ref([]); // For filtering the table

// Fetch the rental requests (adjust as per your code)
const fetchRentalRequests = async () => {
  isLoading.value = true;
  try {
    const { data, error } = await useGraphqlQuery({ query: QUERY, includeDrafts: true });
    if (error.value) {
      console.error('Failed to fetch events', error.value);
    } else if (data.value) {
      rentalRequests.value = data.value.allRentals;
    }
  } catch (e) {
    console.error('Failed to fetch events', e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchRentalRequests();
});

const totalNewRequests = computed(() => rentalRequests.value.filter(request => request.inquiryStatus === 'new').length);
const estimateSent = computed(() => rentalRequests.value.filter(request => request.inquiryStatus === 'estimate_sent').length);
const estimateAccepted = computed(() => rentalRequests.value.filter(request => request.inquiryStatus === 'estimate_accepted').length);
const contractSigned = computed(() => rentalRequests.value.filter(request => request.inquiryStatus === 'contract_signed').length);
const depositPaid = computed(() => rentalRequests.value.filter(request => request.inquiryStatus === 'deposit_paid').length);
const balancePaid = computed(() => rentalRequests.value.filter(request => request.inquiryStatus === 'balance_paid').length);


// Method to set filters when clicking a card
const filterByStatus = (status: string) => {
  selectedStatuses.value = [status];
};
const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return 'blue';
    case 'estimate_sent':
      return 'yellow';
    case 'estimate_accepted':
      return 'orange';
    case 'contract_signed':
      return 'green';
    case 'deposit_paid':
      return 'purple';
    case 'balance_paid':
      return 'teal';
    default:
      return 'gray';
  }
};

// Watchers to re-fetch or filter data when relevant values change
watch([selectedStatuses], () => {
  fetchRentalRequests();
}, { immediate: true });


const formatDates = (dates: { date: string }[]) => {
  if (!dates || dates.length === 0) return 'No dates';

  const sortedDates = dates.map(d => new Date(d.date)).sort((a, b) => a.getTime() - b.getTime());
  const startDate = format(sortedDates[0], 'MMM d, yyyy');

  return `${startDate}`;
};

const formatCreatedAt = (createdAt: string) => {
  return format(new Date(createdAt), 'MMM d, yyyy');
};
// const fetchRentalRequests = async () => {
//   //   console.log('fetching rentalRequests');
//   isLoading.value = true; // Set loading to true at the start

//   try {
//     const { data, error } = await useGraphqlQuery({ query: QUERY, includeDrafts: true });

//     if (error.value) {
//       console.error('Failed to fetch events', error.value);
//     } else if (data.value) {
//       //       console.log('data', data.value);
//       rentalRequests.value = data.value.allRentals.map(rental => ({
//         ...rental,
//         start: new Date(rental.startDate),
//         end: new Date(rental.endDate),
//       }));
//       //       console.log(rentalRequests.value);
//     }
//   } catch (e) {
//     console.error('Failed to fetch events', e);
//   } finally {
//     isLoading.value = false;
//   }
// };

onMounted(() => {
  fetchRentalRequests();
});

watch([selectedStatuses, selectedColumns, q], () => {
  fetchRentalRequests();
}, { immediate: true });

const filteredRentalRequests = computed(() => {
  let result = rentalRequests.value;

  // Text filter
  if (q.value) {
    result = result.filter(booking => {
      return Object.values(booking).some(value => {
        return String(value).toLowerCase().includes(q.value.toLowerCase());
      });
    });
  }

  // Status filter
  if (selectedStatuses.value.length > 0) {
    result = result.filter(booking => selectedStatuses.value.includes(booking.inquiryStatus));
  }

  return result;
});
</script>
<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <!-- Wrapper for dashboard content -->
      <UDashboardPanelContent class="pb-24">
        <!-- Section for Key Metrics -->
        <section class="metrics-section mb-8">
          <h2 class="text-xl font-semibold mb-4">Booking Overview</h2>
          <p class="text-stone-600 mb-6">Monitor the status of rental requests.</p>

          <div class="dashboard-key-metrics grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- New Requests Card -->
            <UDashboardCard title="New Requests" @click="filterByStatus('new')" class="cursor-pointer">
              <template #default>
                <div class="text-3xl font-bold">{{ totalNewRequests }}</div>
                <p class="text-sm text-stone-500 mt-2">Total new requests in the system</p>
              </template>
            </UDashboardCard>

            <!-- Estimate Sent Card -->
            <UDashboardCard title="Estimate Sent" @click="filterByStatus('estimate_sent')" class="cursor-pointer">
              <template #default>
                <div class="text-3xl font-bold">{{ estimateSent }}</div>
                <p class="text-sm text-stone-500 mt-2">Requests where estimates were sent</p>
              </template>
            </UDashboardCard>

            <!-- Estimate Accepted Card -->
            <UDashboardCard title="Estimate Accepted" @click="filterByStatus('estimate_accepted')"
              class="cursor-pointer">
              <template #default>
                <div class="text-3xl font-bold">{{ estimateAccepted }}</div>
                <p class="text-sm text-stone-500 mt-2">Requests where estimates were accepted</p>
              </template>
            </UDashboardCard>

            <!-- Contract Signed Card -->
            <UDashboardCard title="Contract Signed" @click="filterByStatus('contract_signed')" class="cursor-pointer">
              <template #default>
                <div class="text-3xl font-bold">{{ contractSigned }}</div>
                <p class="text-sm text-stone-500 mt-2">Contracts signed by clients</p>
              </template>
            </UDashboardCard>

            <!-- Deposit Paid Card -->
            <UDashboardCard title="Deposit Paid" @click="filterByStatus('deposit_paid')" class="cursor-pointer">
              <template #default>
                <div class="text-3xl font-bold">{{ depositPaid }}</div>
                <p class="text-sm text-stone-500 mt-2">Requests where deposit has been paid</p>
              </template>
            </UDashboardCard>

            <!-- Balance Paid Card -->
            <UDashboardCard title="Balance Paid" @click="filterByStatus('balance_paid')" class="cursor-pointer">
              <template #default>
                <div class="text-3xl font-bold">{{ balancePaid }}</div>
                <p class="text-sm text-stone-500 mt-2">Requests where full balance has been paid</p>
              </template>
            </UDashboardCard>
          </div>
        </section>

        <!-- Table Section -->
        <section class="table-section">


          <!-- Filter toolbar and search bar -->
          <UDashboardNavbar title="Rental Requests" :badge="rentalRequests.length">
            <template #right>
              <UInput ref="input" v-model="q" icon="i-heroicons-funnel" autocomplete="off"
                placeholder="Filter rental requests..." class="hidden lg:block" @keydown.esc="$event.target.blur()">
                <template #trailing>
                  <UKbd value="/" />
                </template>
              </UInput>
            </template>
          </UDashboardNavbar>

          <UCard :ui="{ header: { padding: 'p-4 sm:px-6' }, body: { padding: '' } }" class="min-w-0">
            <UDashboardToolbar>
              <template #left>
                <USelectMenu v-model="selectedStatuses" icon="i-heroicons-check-circle" placeholder="Status" multiple
                  :options="inquiryStatuses" :ui-menu="{ option: { base: 'capitalize' } }" />
              </template>

              <template #right>
                <USelectMenu v-model="selectedColumns" icon="i-heroicons-adjustments-horizontal-solid"
                  :options="columns" multiple class="hidden lg:block">
                  <template #label>
                    Display
                  </template>
                </USelectMenu>
              </template>
            </UDashboardToolbar>

            <!-- Table and Pagination -->
            <div v-if="isLoading">Loading...</div>
            <UTable :rows="filteredRentalRequests" :columns="columns" :sort="sort" v-if="!isLoading">
              <template #organization-data="{ row }">
                <NuxtLink :to="`/rental-requests/${row.id}`" class="underline">{{ row.organization }}</NuxtLink>
              </template>
              <template #inquiryStatus-data="{ row }">
                <UBadge :label="row.inquiryStatus" :color="getStatusColor(row.inquiryStatus)" variant="subtle"
                  class="capitalize" />
              </template>
              <template #dates-data="{ row }">
                {{ formatDates(row.dates) }}
              </template>
              <template #_createdAt-data="{ row }">
                {{ formatCreatedAt(row._createdAt) }}
              </template>
            </UTable>

            <div class="flex justify-end px-3 py-3.5 border-t border-stone-200 dark:border-stone-700">
              <UPagination v-model="page" :page-count="pageCount" :total="filteredRentalRequests.length" />
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