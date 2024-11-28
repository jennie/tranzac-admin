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
        <UPageHeader :title="residency.title" :links="pageHeaderLinks">
          <!-- Left slot for the title -->
          <template #title>
            <span class="font-bold text-3xl">{{ residency.title }}</span>
          </template>

          <!-- Center slot for status badges -->
          <template #headline>
            <div class="flex gap-4">
              <div class="flex items-center">
                <UBadge :label="prettyStatus(residency.activeStatus)" :color="getStatusColor(residency.activeStatus)"
                  variant="subtle" class="capitalize" />
              </div>
              <template v-if="residency.activeStatus === 'approved'">
                <div v-if="residency._status === 'published'" class="flex items-center gap-1 text-green-600">
                  <UIcon name="i-heroicons-check-circle" />
                  <span>Published</span>
                </div>
                <div v-else class="flex items-center gap-1 text-gray-500">
                  <UIcon name="i-heroicons-clock" />
                  <span>Not published</span>
                </div>
              </template>
            </div>
          </template>

          <template #description>
            <div class="text-stone-500">
              {{ formatDate(residency.startDate) }} - {{ formatDate(residency.endDate) }}
            </div>
          </template>
        </UPageHeader>

        <UDivider class="mb-4" />

        <div class="grid grid-cols-2 gap-8">
          <!-- Left Column -->
          <div class="space-y-8">
            <UDashboardSection>
              <div class="flex flex-row justify-between items-center">
                <h2 class="text-2xl font-bold">Resident Information</h2>
              </div>

              <!-- Current Members Display -->
              <div v-if="members.length > 0" class="mb-4">
                <div class="space-y-2">
                  <div v-for="member in members" :key="member._id"
                    class="flex justify-between items-center p-2 bg-stone-50 rounded">
                    <div>
                      {{ member.firstName }} {{ member.lastName }}
                      <span class="text-stone-500">({{ member.email }})</span>
                    </div>
                    <UButton color="red" variant="ghost" icon="i-heroicons-x-mark" size="xs"
                      @click="handleRemoveMember(member)">
                      Remove
                    </UButton>
                  </div>
                </div>
              </div>
              <div v-else>
                <p class="text-stone-500 mb-4">No members associated with this residency</p>
              </div>

              <!-- Member Selection -->
              <div class="border-t pt-4">
                <ResidenciesResidentSelect @select="handleMemberAssociation" />
              </div>
            </UDashboardSection>
          </div>

          <!-- Right Column -->
          <div class="space-y-8">
            <UDashboardSection>
              <div class="flex flex-row justify-between items-center">
                <h2 class="text-2xl font-bold">Details</h2>
                <UButton v-if="residency.activeStatus === 'pending_review'" color="gray"
                  @click="showRequestChangesModal = true" :loading="isLoading">
                  Request Changes
                </UButton>
              </div>


              <div class="space-y-4">
                <div v-if="residency.description" class="prose max-w-none">
                  <div class="font-semibold mb-2">Description</div>
                  <div class="text-stone-600" v-html="residency.description"></div>
                </div>

                <div v-if="residency.photo" class="mt-4">
                  <div class="font-semibold mb-2">Photo</div>
                  <img :src="residency.photo.url" alt="Residency Photo"
                    class="w-full max-w-md object-cover rounded-lg" />
                </div>
              </div>
            </UDashboardSection>
          </div>
        </div>
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

    <ResidenciesApprovePublishModal v-model="showApprovePublishModal" :residency-id="residency?.id"
      :initial-generate-events="residency?.generateEvents" @confirm="handleApproveAndPublish" />
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatDate } from '@/utils/formatters'
import type { Residency } from '~/types/residency'
import { useWorkflowActions } from '~/composables/useWorkflowActions'

interface Member {
  _id: string
  firstName: string
  lastName: string
  email: string
}

const toast = useToast();
const residency = ref<Residency | null>(null)
const showRequestChangesModal = ref(false)
const selectedResident = ref(null);
const showApprovePublishModal = ref(false);

const baseDatoUrl = 'https://tranzac.admin.datocms.com';
const itemTypeId = 'QjDbKyD5S0awBx6jliPMOA'; // Replace with your actual item type ID

const datoEditLink = computed(() => {
  return `${baseDatoUrl}/editor/item_types/${itemTypeId}/items/${residency.value?.id}/edit`;
});

const pageHeaderLinks = computed(() => {
  const links = [
    {
      label: 'Edit in DatoCMS',
      to: datoEditLink.value,
      target: '_blank',
      icon: 'i-mdi-pencil',
      color: 'gray',
      size: 'sm',
    },
  ];

  if (residency.value?.activeStatus === 'new' && members.value.length > 0) {
    links.push({
      label: 'Notify Members & Progress Status',
      click: handleNotifyAndProgress,
      color: 'primary',
      size: 'sm',
      loading: isLoading.value, // Fix: add .value
    });
  }

  if (residency.value?.activeStatus === 'pending_review') {
    links.push({
      label: 'Approve and Publish',
      click: () => showApprovePublishModal.value = true,
      color: 'primary',
      size: 'sm',
      loading: isLoading.value // Fix: add .value
    });
  }

  if (residency.value?.activeStatus === 'approved' && residency.value._status === 'draft') {
    links.push({
      label: 'Publish Residency',
      click: handlePublish,
      color: 'primary',
      size: 'sm',
      loading: isLoading.value, // Fix: add .value
    });
  }

  return links;
});

const fetchMemberData = async () => {
  if (!residency.value?.id) return;

  memberEmailsLoading.value = true;
  try {
    const { data } = await useFetch(`/api/members/byResidencyId/${residency.value.id}`);
    if (!data.value?.members) throw new Error('No member data found');
    members.value = data.value.members;
    memberEmails.value = data.value.members.map(member => member.email); // Restore memberEmails assignment
  } catch (e) {
    console.error(e);
    members.value = [];
    memberEmails.value = []; // Clear memberEmails on error
  } finally {
    memberEmailsLoading.value = false;
  }
};

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
} = useWorkflowActions(residency, fetchMemberData) // Pass fetchMemberData to composable

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

// Update handleRemoveMember in [id].vue
const handleRemoveMember = async (member: Member) => {
  try {
    console.log("Member object:", member); // Add this log
    console.log("Removing member with ID:", member._id); // Change to _id
    const response = await removeMember(member._id); // Change to _id
    console.log("Remove member response:", response); // Add this log
    await fetchMemberData();
    toast.add({
      title: 'Success',
      description: 'Member removed successfully',
      color: 'green'
    });
  } catch (e) {
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : 'Failed to remove member',
      color: 'red'
    });
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
  if (!member?.value) {
    console.error('No member ID received:', member);
    return;
  }

  try {
    await $fetch(`/api/residencies/${residency.value.id}/members`, {
      method: 'POST',
      body: { memberId: member.value }
    });
    await fetchMemberData();
  } catch (e) {
    throw new Error(e.message);
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

const handleRequestChangesSubmit = async ({ note, recipientEmails, commsManagerName }) => {
  if (!residency.value) return

  try {
    await requestChanges({
      note,
      recipientEmails,
      residencyTitle: residency.value.title,
      commsManagerName,
      status: 'resident_action_required'
    })
    residency.value.activeStatus = 'resident_action_required';
    showRequestChangesModal.value = false
    toast.add({
      title: 'Success',
      description: 'Changes requested successfully',
      color: 'green'
    })
  } catch (e) {
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : 'Failed to request changes',
      color: 'red'
    })
  }
}

const handlePublish = async () => {
  isLoading.value = true;
  try {
    await publish();
    toast.add({
      title: 'Success',
      description: 'Residency published successfully',
      color: 'green'
    });
  } catch (e) {
    toast.add({
      title: 'Error',
      description: e.message,
      color: 'red'
    });
  } finally {
    isLoading.value = false;
  }
}

const handleApproveAndPublish = async () => {
  isLoading.value = true;
  try {
    await approveAndPublish();
    toast.add({
      title: 'Success',
      description: 'Residency approved and published successfully',
      color: 'green'
    });
  } catch (e) {
    toast.add({
      title: 'Error',
      description: e.message,
      color: 'red'
    });
    if (e.message.includes('Publishing failed')) {
      await fetchResidencyData();
    }
  } finally {
    isLoading.value = false;
  }
};

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
        generateEvents
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

// const fetchMemberData = async () => {
//   if (!residency.value?.id) return;

//   memberEmailsLoading.value = true;
//   try {
//     const { data } = await useFetch(`/api/members/byResidencyId/${residency.value.id}`);
//     if (!data.value?.members) throw new Error('No member data found');
//     members.value = data.value.members;
//   } catch (e) {
//     console.error(e);
//     members.value = [];
//   } finally {
//     memberEmailsLoading.value = false;
//   }
// };

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