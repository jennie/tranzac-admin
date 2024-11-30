<template>
  <UDashboardPanelContent class="pb-24">
    <UDashboardSection>
      <template #title>
        <div class="flex items-center justify-between">
          <div class="flex-1 text-2xl">{{ residency?.title }}</div>
          <div class="flex gap-2">
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
            <div v-if="residency?.activeStatus === 'approved'" class="flex items-center space-x-2"
              :class="[residency._status === 'published' ? 'text-green-600' : 'text-stone-500']">
              <UIcon
                :name="residency._status === 'published' ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-triangle'" />
              <span v-if="residency._status === 'published'">Published</span>
              <UButton v-else variant="link" class="text-stone-500 text-primary-500 p-0 underline"
                @click="handlePublish" :loading="isLoading">
                Not published
              </UButton>
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

    <UModal v-model="showPublishModal">
      <UCard>
        <template #header>
          <div class="text-lg font-semibold">
            Publish Residency
          </div>
        </template>
        <div class="p-4">
          <p>Are you sure you want to publish this residency?</p>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="gray" variant="ghost" @click="showPublishModal = false">
              Cancel
            </UButton>
            <UButton color="primary" :loading="isPublishing" @click="confirmPublish">
              Publish
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <ResidenciesApprovePublishModal v-model="showApprovePublishModal" :residency-id="residency?.id"
      :initial-generate-events="residency?.generateEvents" @confirm="handleApproveAndPublish" />
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

const showPublishModal = ref(false)
const isPublishing = ref(false)
const showApprovePublishModal = ref(false)

const handlePublish = () => {
  showPublishModal.value = true
}

const confirmPublish = async () => {
  isPublishing.value = true
  try {
    await $fetch(`/api/residencies/${residency.value?.id}/publish`, { method: 'PUT' })
    showPublishModal.value = false
    await refresh()
    toast.add({
      title: 'Success',
      description: 'Residency published successfully',
      color: 'green'
    })
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'Failed to publish residency',
      color: 'red'
    })
  } finally {
    isPublishing.value = false
  }
}

const handleApproveAndPublish = async () => {
  isPublishing.value = true
  try {
    await approveAndPublish()
    toast.add({
      title: 'Success',
      description: 'Residency approved and published successfully',
      color: 'green'
    })
  } catch (e) {
    toast.add({
      title: 'Error',
      description: e.message,
      color: 'red'
    })
  } finally {
    isPublishing.value = false
  }
}
</script>