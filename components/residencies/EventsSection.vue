<template>
  <section>
    <header class="mb-4">
      <h2 class="text-xl font-semibold">Events</h2>
      <p class="text-gray-600">Manage all event records and workflows.</p>
    </header>

    <!-- Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <MetricCard title="Scheduled Events" :count="metrics.scheduled" />
      <MetricCard title="Pending Review" :count="metrics.pending_review" />
      <MetricCard title="Published Events" :count="metrics.published" />
    </div>

    <!-- Table -->
    <UTable :rows="events" :columns="columns" />
  </section>
</template>

<script setup lang="ts">
import { useEventsData } from '@/composables/useEventsData';

const { events, metrics } = useEventsData();

const columns = [
  { key: 'status', label: 'Status', sortable: true },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'startDate', label: 'Start Date', sortable: true },
  { key: 'endDate', label: 'End Date', sortable: true },
];
</script>
