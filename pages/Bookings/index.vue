<script setup lang="ts">
import { format } from "date-fns";
import { useSorted } from '@vueuse/core';

const defaultColumns = [
  { key: "_status", label: "Status" },
  { key: "title", label: "Title" },
  { key: "organization", label: "Organization" },
  { key: "startDate", label: "Start Date", sortable: true },
  { key: "endDate", label: "End Date", sortable: true },
];

const defaultStatuses = ["draft", "published"];
const selectedColumns = ref(defaultColumns)
const selectedStatuses = ref([])
const columns = computed(() => defaultColumns.filter(column => selectedColumns.value.includes(column)))

const q = ref('');
const page = ref(1);
const pageCount = 50;

const sort = ref({
  column: 'title',
  direction: 'desc' as 'asc' | 'desc'
});



const filteredBookings = computed(() => {
  let result = bookings.value;

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
    result = result.filter(booking => selectedStatuses.value.includes(booking._status));
  }

  return result;
});

const QUERY = `query {
  allRentals {
    _status
    title
    startDate
    organization
    endDate
    id
  }
}
`;

const { data, error } = useGraphqlQuery({ query: QUERY, includeDrafts: true });

let bookings = ref([]);
const isLoading = ref(false);

const fetchBookings = async () => {
  isLoading.value = true; // Set loading to true at the start

  const { data, error } = useGraphqlQuery({ query: QUERY, includeDrafts: true });
  console.log(data.value)
  if (error.value) {
    console.error('Failed to fetch events', error.value);
  } else if (data.value) {
    isLoading.value = false;
    bookings.value = data.value.allRentals.map(rental => ({
      ...rental,
      start: new Date(rental.startDate),
      end: new Date(rental.endDate),
    }));
  }
};
onMounted(fetchBookings);


</script>

<template>
  <UDashboardPanelContent class="pb-24">
    <UDashboardNavbar title="Rental Requests" :badge="bookings.length">
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
            :options="defaultStatuses" :ui-menu="{ option: { base: 'capitalize' } }" />

        </template>

        <template #right>
          <USelectMenu v-model="selectedColumns" icon="i-heroicons-adjustments-horizontal-solid" :options="columns"
            multiple class="hidden lg:block">
            <template #label>
              Display
            </template>
          </USelectMenu>
        </template>
      </UDashboardToolbar>

      <UTable :rows="filteredBookings" :columns="columns" :sort="sort">
        <template #title-data="{ row }">
          <NuxtLink :to="`/bookings/${row.id}`" class="underline">{{ row.title }}</NuxtLink>
        </template>
        <template #_status-data="{ row }">
          <UBadge :label="row._status"
            :color="row._status === 'published' ? 'green' : row._status === 'draft' ? 'orange' : 'red'" variant="subtle"
            class="capitalize" />
        </template>
      </UTable>

      <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
        <UPagination v-model="page" :page-count="pageCount" :total="filteredBookings.length" />
      </div>
    </UCard>
  </UDashboardPanelContent>
</template>
