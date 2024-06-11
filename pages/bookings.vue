<script setup lang="ts">
import { format } from "date-fns";
import { useSorted } from '@vueuse/core';


const q = ref('');
const page = ref(1);
const pageCount = 50;

const sort = ref({
  column: 'title',
  direction: 'desc' as 'asc' | 'desc'
});

const columns = [
  { key: "title", label: "Title" },
  { key: "organization", label: "Organization" },
  { key: "startDate", label: "Start Date", sortable: true },
  { key: "endDate", label: "End Date", sortable: true },
];

// 

const QUERY = `query {
  allRentals {
    _status
    title
    startDate
    organization
    endDate
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
    <UDashboardNavbar title="bookings" :badge="bookings.length">
      <template #right>
        <UInput ref="input" v-model="q" icon="i-heroicons-funnel" autocomplete="off" placeholder="Filter users..."
          class="hidden lg:block" @keydown.esc="$event.target.blur()">
          <template #trailing>
            <UKbd value="/" />
          </template>
        </UInput>
      </template>
    </UDashboardNavbar>
    <UCard :ui="{ header: { padding: 'p-4 sm:px-6' }, body: { padding: '' } }" class="min-w-0">

      <UTable :rows="bookings" :columns="columns" :sort="sort">

      </UTable>

      <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
        <UPagination v-model="page" :page-count="pageCount" :total="bookings.length" />
      </div>
    </UCard>
  </UDashboardPanelContent>
</template>
