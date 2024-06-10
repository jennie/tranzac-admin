<script setup lang="ts">
import { format } from "date-fns";
import type { Member } from '~/types';

const { data: members } = await useFetch<Member[]>('/api/members', { default: () => [] });

const q = ref('');
const page = ref(1);
const pageCount = 50;

const filteredMembers = computed(() => {
  if (!q.value) {
    return flattenedMembers.value;
  }
  return flattenedMembers.value.filter((person) => {
    return Object.values(person).some((value) => {
      return String(value).toLowerCase().includes(q.value.toLowerCase());
    });
  });
});

const paginatedMembers = computed(() => {
  const start = (page.value - 1) * pageCount;
  const end = page.value * pageCount;
  return filteredMembers.value.slice(start, end);
});

const sort = ref({
  column: 'membershipStartDate',
  direction: 'desc' as const
});

const columns: Column[] = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "membershipType", label: "Membership Type" },
  { key: "membershipStatus", label: "Membership Status" },
  {
    key: "membershipStartDate", label: "Membership Start Date", sortable: true, direction: 'desc'
  },
  {
    key: "membershipEndDate", label: "Membership End Date", sortable: true, direction: 'desc'
  },
  { key: "street", label: "Street" },
  { key: "city", label: "City" },
  { key: "province", label: "Province" },
  { key: "postalCode", label: "Postal Code" }
];

const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

// Flatten members data
const flattenedMembers = computed(() =>
  members.value.map(member => ({
    ...member,
    membershipType: member.membership.type,
    membershipStatus: member.membership.status,
    membershipStartDate: member.membership.startDate ? new Date(member.membership.startDate) : null,
    membershipEndDate: member.membership.endDate ? new Date(member.membership.endDate) : null,
    street: member.address.street,
    city: member.address.city,
    province: member.address.province,
    postalCode: member.address.postalCode
  }))
);
</script>

<template>
  <UDashboardPanelContent class="pb-24">
    <UCard :ui="{ header: { padding: 'p-4 sm:px-6' }, body: { padding: '' } }" class="min-w-0">
      <template #header>
        <div class="flex px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
          <UInput v-model="q" placeholder="Filter people..." />
        </div>
      </template>

      <UTable class="w-full" :rows="paginatedMembers" :columns="columns">
        <template #membershipStartDate-data="{ row }">
          <!-- {{ row.membershipStartDate }} -->
          {{ row.membershipStartDate ? format(row.membershipStartDate, "MMMM d, y") : "–" }}
        </template>
        <template #membershipEndDate-data="{ row }">
          <!-- {{ row.membershipEndDate }} -->
          {{ row.membershipEndDate ? format(row.membershipEndDate, "MMMM d, y") : '–' }}
        </template>
      </UTable>

      <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
        <UPagination v-model="page" :page-count="pageCount" :total="filteredMembers.length" />
      </div>
    </UCard>
  </UDashboardPanelContent>
</template>
