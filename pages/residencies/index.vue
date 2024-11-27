<!-- pages/residencies/index.vue -->
<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardPanelContent class="pb-24">
        <UPageHeader title="Residencies" icon="i-heroicons-microphone" />
        <!-- Table Section -->
        <section class="table-section">
          <!-- Header with search -->


          <UCard :ui="{ header: { padding: 'p-4 sm:px-6' }, body: { padding: '' } }" class="min-w-0">
            <!-- Loading State -->
            <div v-if="isLoading" class="py-8">
              <div class="flex items-center justify-center">
                <div class="text-center">
                  <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
                  <p class="mt-2 text-sm text-gray-500">Loading residencies...</p>
                </div>
              </div>
            </div>

            <template v-else>
              <div>
                <div class="flex justify-between px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
                  <div class="flex justify-start mb-4 items-center">
                    <USelect v-model="viewMode" :options="[
                      { label: 'Current Residencies', value: 'current' },
                      { label: 'Past Residencies', value: 'past' },
                      { label: 'All Residencies', value: 'all' }
                    ]" class="w-48 pr-2" />
                    <!-- Hide the count badge -->
                    <!-- <UBadge :label="filteredResidencies.length" class="h-6" /> -->

                  </div>
                  <div v-if="viewMode === 'current'" class="flex justify-center mb-4 items-center">
                    <USelectMenu v-model="selectedStatusOption" :options="statusOptions" option-attribute="label"
                      class="min-w-48">
                      <template #label>
                        <span
                          :class="[getStatusColorClass(selectedStatusOption.value), 'inline-block h-2 w-2 flex-shrink-0 rounded-full']"
                          aria-hidden="true" />
                        <span class="truncate">{{ prettyStatus(selectedStatusOption.label) }} ({{
                          selectedStatusOption.count
                        }})</span>
                      </template>

                      <template #option="{ option: status }">
                        <span
                          :class="[getStatusColorClass(status.value), 'inline-block h-2 w-2 flex-shrink-0 rounded-full']"
                          aria-hidden="true" />
                        <span class="truncate">{{ prettyStatus(status.label) }} ({{ status.count }})</span>
                      </template>
                    </USelectMenu>
                  </div>
                  <div class="flex justify-end mb-4">

                    <UInput v-model="searchQuery" icon="i-heroicons-magnifying-glass" autocomplete="off"
                      placeholder="Search residencies..." class="hidden lg:block" @keydown.esc="$event.target.blur()">
                      <template #trailing>
                        <UKbd value="/" />
                      </template>
                    </UInput>


                  </div>
                </div>
                <!-- Table -->
                <UTable :rows="paginatedResidencies" :columns="columns" :sort="sort" @update:sort="handleSortUpdate">

                  <!-- Status Column -->
                  <template #activeStatus-data="{ row }">
                    <UBadge :label="prettyStatus(row.activeStatus)" :color="getStatusColor(row.activeStatus)"
                      variant="subtle" class="capitalize" />
                  </template>

                  <!-- Title Column -->
                  <template #title-data="{ row }">
                    <NuxtLink :to="`/residencies/${row.id}`" class="underline hover:text-primary-600">
                      {{ row.title }}
                    </NuxtLink>
                  </template>

                  <!-- Date Columns -->
                  <template #startDate-data="{ row }">
                    <span :title="row.startDate">{{ formatDate(row.startDate) }}</span>
                  </template>
                  <template #endDate-data="{ row }">
                    <span :title="row.endDate">{{ formatDate(row.endDate) }}</span>
                  </template>

                  <!-- Actions Column -->
                  <template #actions-data="{ row }">
                    <div class="flex gap-2">
                      <UButton v-if="row.activeStatus === 'pending_review'" color="primary" variant="soft" size="xs"
                        @click="handleApproveAndPublish(row.id)">
                        Approve and Publish
                      </UButton>
                      <UButton v-if="row.activeStatus === 'pending_review'" color="gray" variant="soft" size="xs"
                        @click="handleRequestChanges(row.id)">
                        Request Changes
                      </UButton>
                    </div>
                  </template>
                </UTable>

                <!-- Empty State -->
                <div v-if="filteredResidencies.length === 0" class="py-12">
                  <div class="text-center">
                    <UIcon name="i-heroicons-inbox" class="mx-auto h-12 w-12 text-gray-400" />
                    <h3 class="mt-2 text-sm font-semibold text-gray-900">No residencies found</h3>
                    <p class="mt-1 text-sm text-gray-500">No residencies match your current filters.</p>
                  </div>
                </div>

                <!-- Pagination -->
                <div v-if="filteredResidencies.length > 0"
                  class="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                  <p class="text-sm text-gray-500">
                    Showing {{ paginationStart }} to {{ paginationEnd }} of {{ totalResidencies }} residencies
                  </p>
                  <UPagination v-model="currentPage" :total="totalResidencies" :per-page="perPage" />
                </div>
              </div>
            </template>
          </UCard>
        </section>

        <!-- Request Changes Modal -->
        <UModal v-model="showRequestChangesModal">
          <UCard>
            <template #header>
              <div class="text-lg font-semibold">Request Changes</div>
            </template>
            <ResidenciesRequestChangesForm v-if="selectedResidency" :title="selectedResidency.title"
              :record-id="selectedResidency.id" :recipient-emails="selectedResidency.recipientEmails"
              @submit="handleRequestChangesSubmit" />
          </UCard>
        </UModal>

      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<script setup lang="ts">
// script setup section for pages/residencies/index.vue
import { ref, computed, watch } from 'vue'
import { startOfToday, isBefore, parseISO, isValid, format } from 'date-fns'
import type { Residency } from '~/types/residency'
import { useResidenciesData } from '~/composables/useResidenciesData'

const toast = useToast()

// Page meta
definePageMeta({
  layout: 'default'
})

// Local state
const currentPage = ref(1)
const perPage = ref(10)
const searchQuery = ref('')
const selectedStatus = ref('')
const showRequestChangesModal = ref(false)
const selectedResidency = ref<Residency | null>(null)
const viewMode = ref('current')
const sort = ref({
  column: '_createdAt',
  direction: 'desc' as const
})

// Table configuration
const columns = [
  {
    key: 'activeStatus',
    label: 'Status',
    sortable: true
  },
  {
    key: 'title',
    label: 'Title',
    sortable: true
  },
  {
    key: 'startDate',
    label: 'Start Date',
    sortable: true,
    render: (date: string) => formatDate(date)
  },
  {
    key: 'endDate',
    label: 'End Date',
    sortable: true,
    render: (date: string) => formatDate(date)
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false
  }
]

// Load residencies data
const { residencies: allResidencies, isLoading, error, refresh } = useResidenciesData()

// Helper function to safely parse date
const safeParseDate = (dateString: string | null | undefined) => {
  if (!dateString) return null
  try {
    const date = parseISO(dateString)
    return isValid(date) ? date : null
  } catch (e) {
    console.error(`Error parsing date: ${dateString}`, e)
    return null
  }
}

// Format dates for display
const formatDate = (date: string | null | undefined) => {
  if (!date) return '—'
  try {
    const parsedDate = parseISO(date)
    if (!isValid(parsedDate)) {
      return '—'
    }
    return format(parsedDate, 'MMM d, yyyy')
  } catch (e) {
    console.error(`Error formatting date: ${date}`, e)
    return '—'
  }
}

// Filter residencies
const filteredResidencies = computed(() => {
  let filtered = [...allResidencies.value]
  const today = startOfToday()

  // First apply time-based filtering
  if (viewMode.value !== 'all') {
    filtered = filtered.filter(r => {
      // If no end date is set, consider it as current/ongoing
      if (!r.endDate) {
        return viewMode.value === 'current'
      }

      const endDate = safeParseDate(r.endDate)
      if (!endDate) {
        console.warn(`Invalid end date for residency: ${r.id}`)
        return viewMode.value === 'current' // Consider residencies with invalid dates as current
      }

      const isCurrent = !isBefore(endDate, today)
      return viewMode.value === 'current' ? isCurrent : !isCurrent
    })
  }

  // Apply status filter
  if (selectedStatus.value === 'approved') {
    filtered = filtered.filter(r => r.activeStatus === 'approved' && r._status !== 'published')
  } else if (selectedStatus.value === 'published') {
    filtered = filtered.filter(r => r._status === 'published')
  } else if (selectedStatus.value) {
    filtered = filtered.filter(r => r.activeStatus === selectedStatus.value)
  }

  // Apply search filter
  if (searchQuery.value) {
    const searchLower = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r =>
      r.title?.toLowerCase().includes(searchLower) ||
      r.description?.toLowerCase().includes(searchLower)
    )
  }

  // Apply sorting
  if (sort.value.column) {
    filtered.sort((a, b) => {
      const aValue = a[sort.value.column]
      const bValue = b[sort.value.column]
      const direction = sort.value.direction === 'desc' ? -1 : 1

      if (sort.value.column === 'startDate' || sort.value.column === 'endDate') {
        // Handle null dates in sorting
        if (!aValue && !bValue) return 0
        if (!aValue) return direction
        if (!bValue) return -direction

        const aDate = safeParseDate(aValue)
        const bDate = safeParseDate(bValue)

        if (!aDate && !bDate) return 0
        if (!aDate) return direction
        if (!bDate) return -direction

        return (aDate > bDate ? 1 : -1) * direction
      }

      return ((aValue ?? '') > (bValue ?? '') ? 1 : -1) * direction
    })
  }

  return filtered
})

// Filter residencies for metrics, excluding selectedStatus filter
const residenciesForMetrics = computed(() => {
  let filtered = [...allResidencies.value]
  const today = startOfToday()

  // Apply time-based filtering based on viewMode
  if (viewMode.value !== 'all') {
    filtered = filtered.filter(r => {
      if (!r.endDate) {
        return viewMode.value === 'current'
      }
      const endDate = safeParseDate(r.endDate)
      if (!endDate) return viewMode.value === 'current'
      const isCurrent = !isBefore(endDate, today)
      return viewMode.value === 'current' ? isCurrent : !isCurrent
    })
  }

  // Apply search filter
  if (searchQuery.value) {
    const searchLower = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r =>
      r.title?.toLowerCase().includes(searchLower) ||
      r.description?.toLowerCase().includes(searchLower)
    )
  }

  return filtered
})

// Compute metrics based on residenciesForMetrics
const metrics = computed(() => ({
  new: residenciesForMetrics.value.filter(r => r.activeStatus === 'new').length,
  pending_review: residenciesForMetrics.value.filter(r => r.activeStatus === 'pending_review').length,
  resident_action_required: residenciesForMetrics.value.filter(r => r.activeStatus === 'resident_action_required').length,
  approved: residenciesForMetrics.value.filter(r => r.activeStatus === 'approved' && r._status !== 'published').length,
  published: residenciesForMetrics.value.filter(r => r._status === 'published').length,
}))

// Pagination
const paginatedResidencies = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  const end = start + perPage.value
  return filteredResidencies.value.slice(start, end)
})

const paginationStart = computed(() =>
  filteredResidencies.value.length === 0 ? 0 : ((currentPage.value - 1) * perPage.value) + 1
)

const paginationEnd = computed(() =>
  Math.min(currentPage.value * perPage.value, filteredResidencies.value.length)
)

const totalResidencies = computed(() => filteredResidencies.value.length)

// Table title
const tableTitle = computed(() => {
  let title = selectedStatus.value
    ? `${selectedStatus.value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Residencies`
    : 'All Residencies'

  if (viewMode.value === 'current') {
    title = `Current ${title}`
  } else if (viewMode.value === 'past') {
    title = `Past ${title}`
  }

  return title
})

// Status helpers
const getStatusTitle = (status: string) => {
  const titles = {
    new: 'New',
    pending_review: 'Pending Review',
    resident_action_required: 'Pending Input',
    approved: 'Approved Drafts',
    published: 'Published'
  }
  return titles[status as keyof typeof titles] || status
}

const getStatusDescription = (status: string) => {
  const descriptions = {
    new: 'New residencies needing review',
    pending_review: 'Applications awaiting your review',
    resident_action_required: 'Waiting for resident input',
    approved: 'Ready for publishing',
    published: 'Active residencies'
  }
  return descriptions[status as keyof typeof descriptions] || ''
}

const getStatusColor = (status: string) => {
  const colors = {
    new: 'blue',
    resident_action_required: 'yellow',
    pending_review: 'orange',
    approved: 'green',
    published: 'primary'
  }
  return colors[status as keyof typeof colors] || 'gray'
}

const getStatusColorClass = (status: string) => {
  const colorClasses = {
    '': 'bg-gray-400', // For "All Statuses"
    new: 'bg-blue-400',
    resident_action_required: 'bg-yellow-400',
    pending_review: 'bg-orange-400',
    approved: 'bg-green-400',
    published: 'bg-primary-400'
  }
  return colorClasses[status as keyof typeof colorClasses] || 'bg-gray-200'
}

const prettyStatus = (status: string) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

// Action handlers
const handleSortUpdate = (newSort: typeof sort.value) => {
  sort.value = newSort
}

const handleApprove = async (id: string) => {
  try {
    await $fetch(`/api/residencies/${id}/status`, {
      method: 'PUT',
      body: { status: 'approved' }
    })
    await refresh()
    toast.add({
      title: 'Success',
      description: 'Residency approved successfully',
      color: 'green'
    })
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'Failed to approve residency',
      color: 'red'
    })
  }
}

const handleApproveAndPublish = async (id: string) => {
  try {
    await $fetch(`/api/residencies/${id}/approveAndPublish`, {
      method: 'PUT'
    })
    await refresh()
    toast.add({
      title: 'Success',
      description: 'Residency approved and published successfully',
      color: 'green'
    })
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'Failed to approve and publish residency',
      color: 'red'
    })
  }
}

const handleRequestChanges = (id: string) => {
  selectedResidency.value = allResidencies.value.find(r => r.id === id) || null
  showRequestChangesModal.value = true
}

const handleRequestChangesSubmit = async ({ note, recipientEmails }: { note: string; recipientEmails: string[] }) => {
  if (!selectedResidency.value) return

  try {
    await $fetch(`/api/residencies/${selectedResidency.value.id}/requestChanges`, {
      method: 'PUT',
      body: {
        note,
        recipientEmails,
        residencyTitle: selectedResidency.value.title
      }
    })
    showRequestChangesModal.value = false
    await refresh()
    toast.add({
      title: 'Success',
      description: 'Changes requested successfully',
      color: 'green'
    })
  } catch (e) {
    toast.add({
      title: 'Error',
      description: 'Failed to request changes',
      color: 'red'
    })
  }
}

// Reset pagination when filters change
watch([searchQuery, selectedStatus, viewMode], () => {
  currentPage.value = 1
})

// Utility functions
const clearFilter = () => {
  selectedStatus.value = ''
  currentPage.value = 1
}

const filterByStatus = (status: string) => {
  if (selectedStatus.value === status) {
    clearFilter()
  } else {
    selectedStatus.value = status
    currentPage.value = 1
  }
}

// statusOptions remains a computed property that updates with metrics
const statusOptions = computed(() => [
  { label: 'All Statuses', value: '', count: residenciesForMetrics.value.length },
  { label: 'New', value: 'new', count: metrics.value.new },
  { label: 'Pending Input', value: 'resident_action_required', count: metrics.value.resident_action_required },
  { label: 'Pending Review', value: 'pending_review', count: metrics.value.pending_review },
  { label: 'Published', value: 'published', count: metrics.value.published }
])

// Initialize selectedStatusOption based on selectedStatus or default to first option
const selectedStatusOption = ref(
  statusOptions.value.find(option => option.value === selectedStatus.value) || statusOptions.value[0]
)

// Watch for changes in selectedStatusOption and update selectedStatus
watch(selectedStatusOption, (newOption) => {
  selectedStatus.value = newOption.value
})

// Watch for changes in selectedStatus and update selectedStatusOption
watch(selectedStatus, (newStatus) => {
  const matchingOption = statusOptions.value.find(option => option.value === newStatus)
  if (matchingOption) {
    selectedStatusOption.value = matchingOption
  } else {
    selectedStatusOption.value = statusOptions.value[0]
  }
})

// Watch for changes in viewMode and reset status filters
watch(viewMode, () => {
  selectedStatus.value = ''
  selectedStatusOption.value = statusOptions.value[0]
})
</script>
