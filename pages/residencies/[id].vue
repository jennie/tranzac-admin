<template>
  <UDashboardPage>

    <UDashboardPanel grow>
      <UDashboardPanelContent class="pb-24" :ui="{ wrapper: 'p-0' }">

        <UDashboardSection orientation="vertical" class="px-4 mt-12">
          <template #title>
            <div class="flex items-center gap-4">
              <span class="text-2xl">{{ residency?.title }}</span>
              <UBadge v-if="residency?.workflowStatus" :label="prettyStatus(residency.workflowStatus)"
                :color="getStatusColor(residency.workflowStatus)" variant="subtle" class="capitalize" />
            </div>
          </template>
          <template #description>
            <div class="flex items-center gap-6 text-sm text-gray-500">
              <div class="flex items-center gap-1">
                <UIcon name="i-heroicons-calendar" class="w-4 h-4" />
                <span>
                  {{ formatDate(residency?.startDate) }}
                  <template v-if="residency?.endDate">
                    - {{ formatDate(residency.endDate) }}
                  </template>
                  <span v-else class="text-stone-400 font-medium">
                    (Ongoing)
                  </span>
                </span>
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
          </template>
        </UDashboardSection>
        <!-- Navigation bars -->

        <div class="border-y border-gray-200 dark:border-gray-800 px-2">
          <UHorizontalNavigation :links="pageLinks" />
        </div>

        <!-- Only show action buttons on details page -->
        <div v-if="route.name === 'residencies-id'" class="border-b border-gray-200 dark:border-gray-800 px-2">
          <UHorizontalNavigation :links="actionLinks" />
        </div>

        <div>
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
    </UDashboardPanel>
  </UDashboardPage>
</template>

<script setup lang="ts">
import { useResidencyData } from '~/composables/useResidencyData'
import { useWorkflowDate } from '~/composables/useWorkflowDate'

const route = useRoute()
const { residency, error, isLoading } = useResidencyData(route.params.id as string)
const { formatDate, formatDateHeader } = useWorkflowDate()

// Update to use separate pageLinks for main navigation
const pageLinks = computed(() => [[
  {
    label: 'Details',
    icon: 'i-heroicons-document-text',
    to: `/residencies/${route.params.id}`,
    exact: true
  },
  {
    label: 'Events',
    icon: 'i-heroicons-calendar',
    to: `/residencies/${route.params.id}/events`,
  }
]])

// Update actionLinks structure with two groups
const actionLinks = computed(() => [
  [
    ...(residency.value?.workflowStatus === 'pending_review' ? [{
      label: 'Request Changes',
      icon: 'i-heroicons-chat-bubble-left-ellipsis',
      click: () => showRequestChangesModal.value = true
    }] : []),
    ...(residency.value?.workflowStatus === 'pending_review' ? [{
      label: 'Approve and Publish',
      icon: 'i-heroicons-check',
      click: () => showApprovePublishModal.value = true,
      color: 'primary'
    }] : [])
  ],
  [{
    label: 'Edit in DatoCMS',
    icon: 'i-mdi-pencil',
    to: datoEditLink.value,
    target: '_blank',
    color: 'gray'
  }]
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

const baseDatoUrl = 'https://tranzac.admin.datocms.com'
const itemTypeId = 'QjDbKyD5S0awBx6jliPMOA'

const datoEditLink = computed(() => {
  return `${baseDatoUrl}/editor/item_types/${itemTypeId}/items/${residency.value?.id}/edit`
})
</script>