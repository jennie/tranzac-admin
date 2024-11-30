<template>
  <UDashboardPanelContent class="pb-24">
    <UDashboardSection>
      <template #title>
        <div class="flex items-center justify-between">
          <div class="flex-1">{{ residency?.title }}</div>
          <div class="flex gap-2">
            <UButton v-if="residency?.activeStatus === 'approved' && residency._status !== 'published'" color="primary"
              @click="handlePublish" :loading="isLoading">
              Publish Residency
            </UButton>
            <UButton v-if="residency?.activeStatus === 'pending_review'" color="primary"
              @click="showApprovePublishModal = true" :loading="isLoading">
              Approve and Publish
            </UButton>
          </div>
        </div>
      </template>

      <template #description>
        <div class="space-y-4">
          <!-- Status Row -->
          <div class="flex items-center gap-4">
            <UBadge v-if="residency?.activeStatus" :label="prettyStatus(residency.activeStatus)"
              :color="getStatusColor(residency.activeStatus)" variant="subtle" class="capitalize" />
            <div v-if="residency?.activeStatus === 'approved'" class="flex items-center gap-1"
              :class="[residency._status === 'published' ? 'text-green-600' : 'text-gray-500']">
              <UIcon :name="residency._status === 'published' ? 'i-heroicons-check-circle' : 'i-heroicons-clock'" />
              <span>{{ residency._status === 'published' ? 'Published' : 'Not published' }}</span>
            </div>
          </div>

          <!-- Dates Row -->
          <div class="flex items-center gap-6 text-sm text-gray-500">
            <div class="flex items-center gap-1">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
              <span>{{ formatDate(residency?.startDate) }} - {{ formatDate(residency?.endDate) }}</span>
            </div>
            <div class="flex items-center gap-1">
              <UIcon name="i-heroicons-clock" class="w-4 h-4" />
              <span>Created {{ formatDate(residency?._createdAt) }}</span>
            </div>
            <div v-if="residency?._updatedAt" class="flex items-center gap-1">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
              <span>Updated {{ formatDate(residency._updatedAt) }}</span>
            </div>
          </div>
        </div>
      </template>
    </UDashboardSection>

    <!-- Navigation -->
    <div class="border-b border-gray-200 dark:border-gray-800">
      <UHorizontalNavigation :links="navigationLinks" />
    </div>

    <div class="mt-6">
      <NuxtPage />
    </div>
  </UDashboardPanelContent>
</template>

<script setup lang="ts">
import { useResidencyData } from '~/composables/useResidencyData'
import { format } from 'date-fns'

const route = useRoute()
const { residency, error, isLoading } = useResidencyData(route.params.id as string)

// Navigation links
const navigationLinks = computed(() => [
  {
    label: 'Details',
    icon: 'i-heroicons-document-text',
    to: `/residencies/${route.params.id}`,
  },
  {
    label: 'Events',
    icon: 'i-heroicons-calendar',
    to: `/residencies/${route.params.id}/events`,
  }
])

// Status helpers
const getStatusColor = (status) => {
  const colors = {
    new: 'blue',
    resident_action_required: 'yellow',
    pending_review: 'orange',
    approved: 'green',
    published: 'primary'
  }
  return colors[status] || 'gray'
}

const prettyStatus = (status) => {
  return status?.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') || '—'
}

// Format date helper
const formatDate = (date: string) => {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy')
}
</script>