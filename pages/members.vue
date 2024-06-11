<script setup lang="ts">
import { ref, computed } from 'vue';
import { format } from "date-fns";
import { useSorted } from '@vueuse/core';
import type { Member } from '~/types';

const { data: members } = await useFetch<Member[]>('/api/members', {
  transform: (members) => {
    return members.map(member => ({
      ...member,
      name: `${member.firstName} ${member.lastName}`
    }))
  }
}
);

const q = ref('');
const page = ref(1);
const pageCount = 50;

const sort = ref({
  column: 'membershipStartDate',
  direction: 'desc' as 'asc' | 'desc'
});

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "membershipType", label: "Membership Type" },
  {
    key: "membershipStartDate", label: "Membership Start Date", sortable: true
  },
  {
    key: "membershipEndDate", label: "Membership End Date", sortable: true
  },
];

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

// Flatten members data
const flattenedMembers = computed(() =>
  members.value.map(member => ({
    ...member,
    membershipType: member.membership.type,
    membershipStartDate: member.membership.startDate ? new Date(member.membership.startDate) : null,
    membershipEndDate: member.membership.endDate ? new Date(member.membership.endDate) : null,

  }))
);

// Filtered and sorted members
const filteredMembers = computed(() => {
  let result = flattenedMembers.value;

  if (q.value) {
    result = result.filter(person => {
      return Object.values(person).some(value => {
        return String(value).toLowerCase().includes(q.value.toLowerCase());
      });
    });
  }

  return result;
});

// Sort members using useSorted
const sortedMembers = useSorted(filteredMembers, {
  compareFn: (a, b) => {
    const aValue = a[sort.value.column];
    const bValue = b[sort.value.column];

    if (aValue === bValue) return 0;
    return (aValue > bValue ? 1 : -1) * (sort.value.direction === 'asc' ? 1 : -1);
  }
});

const paginatedMembers = computed(() => {
  const start = (page.value - 1) * pageCount;
  const end = page.value * pageCount;
  return sortedMembers.value.slice(start, end);
});

const onSortChange = (column) => {
  if (sort.value.column === column) {
    sort.value.direction = sort.value.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sort.value.column = column;
    sort.value.direction = 'asc';
  }
  page.value = 1; // Reset to the first page after sorting
};
</script>

<template>
  <UDashboardPanelContent class="pb-24">
    <UDashboardNavbar title="Members" :badge="filteredMembers.length">
      <template #right>
        <UInput ref="input" v-model="q" icon="i-heroicons-funnel" autocomplete="off" placeholder="Filter users..."
          class="hidden lg:block" @keydown.esc="$event.target.blur()">
          <template #trailing>
            <UKbd value="/" />
          </template>
        </UInput>

        <UButton label="New user" trailing-icon="i-heroicons-plus" color="gray" @click="isNewUserModalOpen = true" />
      </template>
    </UDashboardNavbar>
    <UCard :ui="{ header: { padding: 'p-4 sm:px-6' }, body: { padding: '' } }" class="min-w-0">


      <UTable :rows="paginatedMembers" :columns="columns" :sort="sort" @sort-change="onSortChange">
        <template #name-data="{ row }">
          <span class="flex flex-row items-center">
            <UAvatar :src="`https://unavatar.io/gravatar/${row.email}`" class="bg-gray-200 dark:bg-neutral-800 mr-2" />
            {{ row.name }}
          </span>
        </template>
        <template #membershipStartDate-data="{ row }">
          {{ row.membershipStartDate ? format(row.membershipStartDate, "MMMM d, y") : "–" }}
        </template>
        <template #membershipEndDate-data="{ row }">
          {{ row.membershipEndDate ? format(row.membershipEndDate, "MMMM d, y") : '–' }}
        </template>
      </UTable>

      <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
        <UPagination v-model="page" :page-count="pageCount" :total="filteredMembers.length" />
      </div>
    </UCard>
  </UDashboardPanelContent>
</template>
