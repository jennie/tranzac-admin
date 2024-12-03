<template>
  <section class="metrics-section mb-8">
    <h2 class="text-xl font-semibold mb-4">Residency Overview</h2>
    <p class="text-gray-600 mb-6">Track and manage residency applications through their workflow stages.</p>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- New -->
      <UDashboardCard title="New" class="cursor-pointer" @click="$emit('filter', 'new')">
        <template #default>
          <div class="text-3xl font-bold">{{ metrics.new }}</div>
          <p class="text-sm text-gray-500 mt-2">New residencies needing review</p>
          <div v-if="metrics.new > 0" class="mt-4">
            <UButton size="sm" color="primary" @click.stop="$emit('reviewNew')">
              Review Now
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
            <UButton size="sm" color="primary" @click.stop="$emit('reviewPending')">
              Review Pending
            </UButton>
          </div>
        </template>
      </UDashboardCard>

      <!-- Changes Requested -->
      <UDashboardCard title="Changes Requested" class="cursor-pointer"
        @click="$emit('filter', 'resident_action_required')">
        <template #default>
          <div class="text-3xl font-bold">{{ metrics.resident_action_required }}</div>
          <p class="text-sm text-gray-500 mt-2">Waiting for resident updates</p>
        </template>
      </UDashboardCard>

      <!-- Pending Input -->
      <UDashboardCard title="Pending Input" class="cursor-pointer" @click="$emit('filter', 'resident_action_required')">
        <template #default>
          <div class="text-3xl font-bold">{{ metrics.resident_action_required }}</div>
          <p class="text-sm text-gray-500 mt-2">Awaiting resident input</p>
        </template>
      </UDashboardCard>

      <!-- Approved -->
      <UDashboardCard title="Approved" class="cursor-pointer" @click="$emit('filter', 'approved')">
        <template #default>
          <div class="text-3xl font-bold">{{ metrics.approved }}</div>
          <p class="text-sm text-gray-500 mt-2">Ready for publishing</p>
          <div v-if="metrics.approved > 0" class="mt-4">
            <UButton size="sm" color="primary" @click.stop="$emit('bulkPublish')">
              Publish All
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
  resident_action_required: number;
  pending_review: number;
  approved: number;
  published: number;
}

defineProps<{
  metrics: Metrics;
}>();

defineEmits<{
  (e: 'filter', status: string): void;
  (e: 'reviewNew'): void;
  (e: 'reviewPending'): void;
  (e: 'bulkPublish'): void;
}>();
</script>