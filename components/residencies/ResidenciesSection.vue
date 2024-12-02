<template>
  <section>
    <header class="mb-4">
      <h2 class="text-xl font-semibold">Residencies</h2>
      <p class="text-gray-600">Manage all residency records and workflows.</p>
    </header>

    <!-- Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <MetricCard title="New Applications" :count="metrics.new" />
      <MetricCard title="Pending Review" :count="metrics.pending_review" />
      <MetricCard title="Approved" :count="metrics.approved" />
    </div>

    <!-- Table -->
    <UTable :rows="residencies" :columns="columns" />
  </section>
</template>

<script setup lang="ts">
import { useResidenciesData } from '@/composables/useResidenciesData';

const { residencies, metrics } = useResidenciesData();

const columns = [
  { key: 'workflowStatus', label: 'Status', sortable: true },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'startDate', label: 'Start Date', sortable: true },
  { key: 'endDate', label: 'End Date', sortable: true },
];
</script>
