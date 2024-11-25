// components/dashboard/ResidencyMetrics.vue
<template>
  <section class="metrics-section mb-8">
    <h2 class="text-xl font-semibold mb-4">Residency Overview</h2>
    <p class="text-gray-600 mb-6">Track and manage residency applications through their workflow stages.</p>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- New Applications -->
      <UDashboardCard title="New Applications" class="cursor-pointer" @click="$emit('filter', 'new')">
        <template #default>
          <div class="text-3xl font-bold">{{ metrics.new }}</div>
          <p class="text-sm text-gray-500 mt-2">New applications needing review</p>
          <div v-if="metrics.new > 0" class="mt-4">
            <UButton size="sm" color="primary" @click.stop="$emit('review-new')">
              Review New
            </UButton>
          </div>
        </template>
      </UDashboardCard>

      <!-- Pending Review -->
      <UDashboardCard title="Pending Review" class="cursor-pointer" @click="$emit('filter', 'pending_review')">
        <template #default>
          <div class="text-3xl font-bold">{{ metrics.pending_review }}</div>
          <p class="text-sm text-gray-500 mt-2">Applications awaiting your review</p>
          <div v-if="metrics.pending_review > 0" class="mt-4">
            <UButton size="sm" color="primary" @click.stop="$emit('bulk-approve')">
              Bulk Approve
            </UButton>
          </div>
        </template>
      </UDashboardCard>

      <!-- Changes Requested -->
      <UDashboardCard title="Changes Requested" class="cursor-pointer" @click="$emit('filter', 'changes_requested')">
        <template #default>
          <div class="text-3xl font-bold">{{ metrics.changes_requested }}</div>
          <p class="text-sm text-gray-500 mt-2">Waiting for resident updates</p>
        </template>
      </UDashboardCard>

      <!-- Pending Input -->
      <UDashboardCard title="Pending Input" class="cursor-pointer" @click="$emit('filter', 'pending_input')">
        <template #default>
          <div class="text-3xl font-bold">{{ metrics.pending_input }}</div>
          <p class="text-sm text-gray-500 mt-2">Awaiting resident input</p>
        </template>
      </UDashboardCard>

      <!-- Approved -->
      <UDashboardCard title="Approved" class="cursor-pointer" @click="$emit('filter', 'approved')">
        <template #default>
          <div class="text-3xl font-bold">{{ metrics.approved }}</div>
          <p class="text-sm text-gray-500 mt-2">Ready for publishing</p>
          <div v-if="metrics.approved > 0" class="mt-4">
            <UButton size="sm" color="primary" @click.stop="$emit('bulk-publish')">
              Bulk Publish
            </UButton>
          </div>
        </template>
      </UDashboardCard>

      <!-- Published -->
      <UDashboardCard title="Published" class="cursor-pointer" @click="$emit('filter', 'published')">
        <template #default>
          <div class="text-3xl font-bold">{{ metrics.published }}</div>
          <p class="text-sm text-gray-500 mt-2">Active residencies</p>
        </template>
      </UDashboardCard>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Metrics {
  new: number;
  pending_input: number;
  pending_review: number;
  changes_requested: number;
  approved: number;
  published: number;
}

defineProps<{
  metrics: Metrics;
}>();

defineEmits<{
  (e: 'filter', status: string): void;
  (e: 'review-new'): void;
  (e: 'bulk-approve'): void;
  (e: 'bulk-publish'): void;
}>();
</script>