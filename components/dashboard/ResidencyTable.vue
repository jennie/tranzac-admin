// components/dashboard/ResidencyTable.vue
<template>
  <UCard :ui="{ header: { padding: 'p-4 sm:px-6' }, body: { padding: '' } }" class="min-w-0">
    <UDashboardToolbar>
      <template #left>
        <USelectMenu v-model="selectedStatus" icon="i-heroicons-check-circle" placeholder="Filter by Status"
          :options="statusOptions" :ui-menu="{ option: { base: 'capitalize' } }" />
      </template>

      <template #right>
        <UButton v-if="selectedIds.length > 0" color="primary" :loading="isLoading"
          @click="$emit('bulk-action', selectedIds)">
          {{ bulkActionText }}
        </UButton>
      </template>
    </UDashboardToolbar>

    <UTable :rows="residencies" :columns="columns" :loading="isLoading" :sort="sort" @select="handleSelect"
      @update:sort="$emit('update:sort', $event)">
      <!-- Checkbox Column -->
      <template #checkbox-data="{ row }">
        <UCheckbox v-model="selectedIds" :value="row.id" :disabled="!canSelectRow(row)" />
      </template>

      <!-- Title Column -->
      <template #title-data="{ row }">
        <NuxtLink :to="`/residencies/${row.id}`" class="underline">
          {{ row.title }}
        </NuxtLink>
      </template>

      <!-- Status Column -->
      <template #activeStatus-data="{ row }">
        <UBadge :label="formatStatus(row.activeStatus)" :color="getStatusColor(row.activeStatus)" variant="subtle"
          class="capitalize" />
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
          <UButton v-if="canApprove(row)" color="primary" size="sm" @click="$emit('approve', row.id)">
            Approve
          </UButton>
          <UButton v-if="canRequestChanges(row)" color="gray" size="sm" @click="$emit('request-changes', row.id)">
            Request Changes
          </UButton>
        </div>
      </template>
    </UTable>

    <!-- Pagination -->
    <div class="flex justify-between px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
      <div class="text-sm text-gray-500">
        {{ selectedIds.length }} selected
      </div>
      <UPagination v-model="currentPage" :page-count="totalPages" :total="total"
        @update:model-value="$emit('update:page', $event)" />
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { format } from 'date-fns';
import type { Residency } from '~/types/residency';

const props = defineProps<{
  residencies: Residency[];
  isLoading: boolean;
  sort: { column: string; direction: 'asc' | 'desc' };
  page: number;
  totalPages: number;
  total: number;
  selectedStatus?: string;
}>();

const emit = defineEmits<{
  (e: 'update:sort', sort: { column: string; direction: 'asc' | 'desc' }): void;
  (e: 'update:page', page: number): void;
  (e: 'update:selectedStatus', status: string): void;
  (e: 'bulk-action', ids: string[]): void;
  (e: 'approve', id: string): void;
  (e: 'request-changes', id: string): void;
}>();

const selectedIds = ref<string[]>([]);
const currentPage = useVModel(props, 'page', emit);
const selectedStatus = useVModel(props, 'selectedStatus', emit);

const columns = [
  { key: 'checkbox', label: '', sortable: false },
  { key: 'activeStatus', label: 'Status', sortable: true },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'startDate', label: 'Start Date', sortable: true },
  { key: 'endDate', label: 'End Date', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'resident_action_required', label: 'Pending Input' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'resident_action_required', label: 'Changes Requested' },
  { value: 'approved', label: 'Approved' },
];

// Utility functions
const formatDate = (date: string) => format(new Date(date), 'MMM d, yyyy');

const formatStatus = (status: string) => status.replace(/_/g, ' ');

const getStatusColor = (status: string) => {
  const colors = {
    new: 'blue',
    resident_action_required: 'yellow',
    pending_review: 'orange',
    resident_action_required: 'red',
    approved: 'green',
    published: 'primary',
  };
  return colors[status] || 'gray';
};

const canSelectRow = (row: Residency) => {
  return ['pending_review', 'approved'].includes(row.activeStatus);
};

const canApprove = (row: Residency) => {
  return row.activeStatus === 'pending_review';
};

const canRequestChanges = (row: Residency) => {
  return ['pending_review', 'approved'].includes(row.activeStatus);
};

const bulkActionText = computed(() => {
  const firstRow = props.residencies.find(r => r.id === selectedIds.value[0]);
  if (!firstRow) return 'Bulk Action';
  return firstRow.activeStatus === 'approved' ? 'Bulk Publish' : 'Bulk Approve';
});

// Clear selection when page changes
watch(currentPage, () => {
  selectedIds.value = [];
});
</script>