<!-- pages/residencies/[id].vue -->
<template>
  <UDashboardPanel grow>
    <UDashboardPanelContent class="pb-24">
      <div v-if="isLoading" class="p-4">
        Loading...
      </div>
      <div v-else-if="error" class="text-red-500 p-4">
        <p>Error: {{ error }}</p>
      </div>
      <template v-else-if="residency">
        <UPageHeader :headline="'Residency Status: ' + prettyStatus(residency.activeStatus)" :title="residency.title"
          icon="i-heroicons-clipboard" :description="getStatusDescription(residency.activeStatus)" />

        <UDivider class="mb-4" />

        <!-- Workflow Actions Section -->
        <UDashboardSection title="Actions" class="mb-8">
          <div class="space-y-4">
            <!-- Member Management (Available at all stages) -->
            <UDashboardSection title="Member Management" class="mb-8">
              <!-- Current Members Display -->
              <div v-if="members.length > 0" class="mb-4">
                <div class="space-y-2">
                  <div v-for="member in members" :key="member.id"
                    class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      {{ member.firstName }} {{ member.lastName }}
                      <span class="text-gray-500">({{ member.email }})</span>
                    </div>
                    <UButton color="red" variant="ghost" icon="i-heroicons-x-mark" size="xs"
                      @click="handleRemoveMember(member.id)">
                      Remove
                    </UButton>
                  </div>
                </div>
              </div>
              <div v-else>
                <p class="text-gray-500 mb-4">No members associated with this residency</p>
              </div>

              <!-- Member Selection -->
              <div class="border-t pt-4">
                <ResidenciesResidentSelect @select="handleMemberAssociation" />
                <!-- <ResidencyMemberSelect :residency-id="residency.id" @selected="handleMemberAssociation" /> -->
              </div>
            </UDashboardSection>

            <!-- New Status Actions -->
            <div v-if="residency.activeStatus === 'new'" class="space-y-4">
              <!-- Notification Action -->
              <div v-if="members.length > 0">
                <UAlert title="Ready to Proceed?" color="info" icon="i-heroicons-information-circle">
                  When you're ready, notify the members and allow them to start providing residency details.
                </UAlert>
                <div class="mt-4">
                  <UButton color="primary" :loading="isLoading" @click="handleNotifyAndProgress">
                    Notify Members & Progress Status
                  </UButton>
                </div>
              </div>
            </div>

            <!-- Pending Review Status Actions -->
            <div v-if="residency.activeStatus === 'pending_review'" class="space-y-4">
              <div class="flex gap-4">
                <UButton color="gray" @click="showRequestChangesModal = true">
                  Request Changes
                </UButton>
                <UButton color="primary" @click="handleApproveAndPublish" :loading="isLoading">
                  Approve and Publish
                </UButton>
              </div>
            </div>

            <!-- Approved Status Actions -->
            <div v-if="residency.activeStatus === 'approved'" class="space-y-4">
              <div v-if="residency._status === 'draft'" class="flex gap-4">
                <UButton color="primary" @click="handlePublish" :loading="isLoading">
                  Publish Residency
                </UButton>
              </div>
              <div>
                <a :href="`https://your-dato-cms-url.com/editor/item/${residency.id}`" target="_blank"
                  class="text-blue-500 underline">
                  Open in DatoCMS
                </a>
              </div>
            </div>
          </div>
        </UDashboardSection>

        <!-- Residency Details Section -->
        <UDashboardSection title="Details" class="mb-8">
          <div class="grid gap-4">
            <div class="grid grid-cols-2 gap-4">
              <span class="font-semibold">Status:</span>
              <UBadge :label="prettyStatus(residency.activeStatus)" :color="getStatusColor(residency.activeStatus)"
                variant="subtle" class="capitalize" />
            </div>

            <div v-if="residency.activeStatus === 'approved'" class="grid grid-cols-2 gap-4">
              <span class="font-semibold">Dato Status:</span>
              <UBadge :label="prettyStatus(residency._status)"
                :color="residency._status === 'published' ? 'primary' : 'gray'" variant="subtle" class="capitalize" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <span class="font-semibold">Description:</span>
              <p>{{ residency.description }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <span class="font-semibold">Date Range:</span>
              <span>{{ formatDate(residency.startDate) }} - {{ formatDate(residency.endDate) }}</span>
            </div>

            <div v-if="residency.photo" class="grid grid-cols-2 gap-4">
              <span class="font-semibold">Photo:</span>
              <img :src="residency.photo.url" alt="Residency Photo" class="w-32 h-32 object-cover rounded-lg" />
            </div>
          </div>
        </UDashboardSection>

        <!-- Associated Members Section -->
        <UDashboardSection title="Associated Members" class="mb-8">
          <div v-if="memberEmailsLoading">
            Loading...
          </div>
          <div v-else-if="memberEmailsError" class="text-red-500">
            Error loading member emails: {{ memberEmailsError }}
          </div>
          <div v-else>
            <div v-if="members.length" class="space-y-2">
              <div v-for="member in members" :key="member.id" class="p-2 bg-gray-50 rounded">
                {{ member.firstName }} {{ member.lastName }}
                <a :href="'mailto:' + member.email" class="text-blue-500 underline">
                  {{ member.email }}
                </a>
              </div>
            </div>
            <p v-else class="text-gray-500">
              No members associated with this residency
            </p>
          </div>
        </UDashboardSection>
      </template>
    </UDashboardPanelContent>

    <!-- Request Changes Modal -->
    <UModal v-model="showRequestChangesModal">
      <UCard>
        <template #header>
          <div class="text-lg font-semibold">
            Request Changes
          </div>
        </template>
        <ResidenciesRequestChangesForm :title="residency?.title" :record-id="residency?.id"
          :recipient-emails="memberEmails" @submit="handleRequestChangesSubmit" />
      </UCard>
    </UModal>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatDate } from '@/utils/formatters'
import type { Residency } from '~/types/residency'
import { useWorkflowActions } from '~/composables/useWorkflowActions'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
}

const toast = useToast();
const residency = ref<Residency | null>(null)
const showRequestChangesModal = ref(false)
const selectedResident = ref(null);

const {
  actions,
  isLoading,
  error,
  associateMember,
  removeMember,
  notifyAndProgress,
  submitForReview,
  approve,
  requestChanges,
  publish,
  approveAndPublish
} = useWorkflowActions(residency)


const handleMemberSelection = async (member) => {
  try {
    await handleMemberAssociation(member);
    const toast = useToast();
    toast.add({
      title: 'Success',
      description: 'Member associated successfully',
      color: 'green'
    });
  } catch (error) {
    const toast = useToast();
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'red'
    });
  }
};

const handleRemoveMember = async (memberId: string) => {
  try {
    await removeMember(memberId)
    await fetchMemberData() // Refresh member list
    const toast = useToast()
    toast.add({
      title: 'Success',
      description: 'Member removed successfully',
      color: 'green'
    })
  } catch (e) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : 'Failed to remove member',
      color: 'red'
    })
  }
}

const handleNotifyAndProgress = async () => {
  try {
    await notifyAndProgress()
    const toast = useToast()
    toast.add({
      title: 'Success',
      description: 'Members notified and status updated',
      color: 'green'
    })
  } catch (e) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : 'Failed to notify members',
      color: 'red'
    })
  }
}

// Status helpers
const getStatusDescription = (status: string) => {
  const descriptions = {
    new: 'Please associate members with this residency to begin.',
    resident_action_required: 'Waiting for resident to provide details.',
    pending_review: 'Residency is ready for review.',
    approved: 'Residency is approved and ready to publish.',
    published: 'Residency is live on the website.'
  }
  return descriptions[status] || ''
}

const getStatusColor = (status: string) => {
  const colors = {
    new: 'blue',
    resident_action_required: 'yellow',
    pending_review: 'orange',
    approved: 'green',
    published: 'primary'
  }
  return colors[status] || 'gray'
}

const prettyStatus = (status: string) => {
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const handleMemberAssociation = async (member) => {
  try {
    await $fetch(`/api/residencies/${residency.value.id}/members`, {
      method: 'POST',
      body: { memberId: member.value } // This is correct since resident.value contains the _id
    });
    await fetchMemberData();
    toast.add({ title: 'Success', description: 'Member associated successfully', color: 'green' });
  } catch (e) {
    toast.add({ title: 'Error', description: e.message, color: 'red' });
  }
};

const handleSubmitForReview = async () => {
  try {
    await submitForReview()
    const toast = useToast()
    toast.add({
      title: 'Success',
      description: 'Residency submitted for review',
      color: 'green'
    })
  } catch (e) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: e.message,
      color: 'red'
    })
  }
}

const handleApprove = async () => {
  try {
    await approve()
    const toast = useToast()
    toast.add({
      title: 'Success',
      description: 'Residency approved',
      color: 'green'
    })
  } catch (e) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: e.message,
      color: 'red'
    })
  }
}

const handleRequestChangesSubmit = async ({ note, recipientEmails }: { note: string; recipientEmails: string[] }) => {
  try {
    await requestChanges(note, recipientEmails)
    showRequestChangesModal.value = false
    const toast = useToast()
    toast.add({
      title: 'Success',
      description: 'Changes requested successfully',
      color: 'green'
    })
  } catch (e) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: e.message,
      color: 'red'
    })
  }
}

const handlePublish = async () => {
  try {
    await publish()
    const toast = useToast()
    toast.add({
      title: 'Success',
      description: 'Residency published successfully',
      color: 'green'
    })
  } catch (e) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: e.message,
      color: 'red'
    })
  }
}

const handleApproveAndPublish = async () => {
  try {
    await approveAndPublish()
    const toast = useToast()
    toast.add({
      title: 'Success',
      description: 'Residency approved and published successfully',
      color: 'green'
    })
  } catch (e) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: e.message,
      color: 'red'
    })
  }
}

// Data fetching
const route = useRoute()
const id = computed(() => route.params.id)

// Member data management
const members = ref<Member[]>([])
const memberEmails = ref<string[]>([])
const memberEmailsLoading = ref(false)
const memberEmailsError = ref<string | null>(null)

const fetchResidencyData = async () => {
  const QUERY = `
    query Residency($id: ItemId!) {
      residency(filter: { id: { eq: $id } }) {
        id
        _status
        _createdAt
        _updatedAt
        title
        description
        photo {
          url
        }
        startDate
        endDate
        slug
        activeStatus
      }
    }
  `

  const { data, error: gqlError } = await useGraphqlQuery({
    query: QUERY,
    variables: { id: id.value }
  })

  if (data.value) {
    residency.value = data.value.residency
  }
  if (gqlError.value) {
    error.value = gqlError.value.message
  }
}

const fetchMemberData = async () => {
  if (!residency.value?.id) return;

  memberEmailsLoading.value = true;
  try {
    const { data } = await useFetch(`/api/members/byResidencyId/${residency.value.id}`);
    if (!data.value?.members) throw new Error('No member data found');
    members.value = data.value.members;
  } catch (e) {
    console.error(e);
    members.value = [];
  } finally {
    memberEmailsLoading.value = false;
  }
};

// Initial data load
onMounted(async () => {
  console.log('Component mounted'); // Debugging log
  await fetchResidencyData()
  await fetchMemberData()
})

// Refresh data after status changes
watch(() => residency.value?.activeStatus, async () => {
  console.log('Residency status changed'); // Debugging log
  await fetchResidencyData()
  await fetchMemberData()
})

// Watch for route changes to reload data
watch(() => route.params.id, async () => {
  console.log('Route ID changed'); // Debugging log
  await fetchResidencyData()
  await fetchMemberData()
})

definePageMeta({
  middleware: 'auth'
})
</script>