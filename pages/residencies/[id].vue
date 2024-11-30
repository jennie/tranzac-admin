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

        <UDashboardSection title="Resident Information" description="Manage members associated with this residency.">
          <UFormGroup label="Members" class="grid grid-cols-[300px_1fr] gap-4 items-start" :ui="{ container: '' }">
            <div>
              <ResidenciesResidentSelect :residency-id="route.params.id" @select="handleMemberSelection"
                @create="handleCreateMember" @close="handleResidentSelectClose" />

              <div v-if="members.length > 0" class="space-y-2 mt-4">
                <div v-for="member in members" :key="member._id"
                  class="flex justify-between items-center p-2 bg-stone-50 rounded">
                  <div>
                    {{ member.firstName }} {{ member.lastName }}
                    <span class="text-stone-500">({{ member.email }})</span>
                  </div>
                  <UTooltip v-if="members.length <= 1" text="A residency must have at least one member">
                    <UButton color="red" variant="ghost" icon="i-heroicons-x-mark" size="xs" disabled
                      @click="handleRemoveMember(member)">
                      Remove
                    </UButton>
                  </UTooltip>
                  <UButton v-else color="red" variant="ghost" icon="i-heroicons-x-mark" size="xs"
                    @click="handleRemoveMember(member)">
                    Remove
                  </UButton>
                </div>
              </div>
              <div v-else class="text-stone-500 mt-4">
                No members associated with this residency
              </div>
            </div>
          </UFormGroup>
        </UDashboardSection>

        <UDivider class="mb-4" />

        <UDashboardSection title="Details" description="Residency information and media assets.">
          <template #links>
            <UButton v-if="residency.activeStatus === 'pending_review'" color="gray"
              @click="showRequestChangesModal = true" :loading="isLoading">
              Request Changes
            </UButton>
          </template>

          <UFormGroup label="Description" class="grid grid-cols-[300px_1fr] gap-4 items-start" :ui="{ container: '' }">
            <div v-if="residency.description" class="prose max-w-none text-stone-600" v-html="residency.description">
            </div>
            <div v-else class="p-4 bg-stone-50 rounded border border-stone-200 text-stone-500">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-information-circle" />
                <span>No description provided</span>
              </div>
            </div>
          </UFormGroup>

          <UFormGroup label="Photo" class="grid grid-cols-[300px_1fr] gap-4 items-start" :ui="{ container: '' }">
            <div v-if="residency.photo">
              <img :src="residency.photo.url" alt="Residency Photo" class="w-full max-w-md object-cover rounded-lg" />
            </div>
            <div v-else class="p-4 bg-stone-50 rounded border border-stone-200 text-stone-500">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-photo" />
                <span>No photo uploaded</span>
              </div>
            </div>
          </UFormGroup>

          <UFormGroup label="Social Media Assets" class="grid grid-cols-[300px_1fr] gap-4 items-start"
            :ui="{ container: '' }">
            <div v-if="residency.socialMediaAssets && residency.socialMediaAssets.length > 0" class="space-y-4">
              <!-- Grid of thumbnails -->
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div v-for="(asset, index) in residency.socialMediaAssets" :key="index"
                  class="relative group cursor-pointer" @click="openLightbox(index)">
                  <img :src="asset.url" :alt="asset.title || 'Social media asset'"
                    class="w-full h-32 object-cover rounded-lg transition-transform duration-200 group-hover:scale-105" />

                  <!-- Hover overlay with asset type icon -->
                  <div
                    class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                    <UIcon :name="getAssetTypeIcon(asset.type)"
                      class="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size="lg" />
                  </div>
                </div>
              </div>

              <!-- Single Lightbox Modal -->
              <UModal v-model="showLightbox" size="xl">
                <UCard>
                  <template #header>
                    <div class="flex justify-between items-center">
                      <span class="text-lg font-semibold">
                        {{ currentAsset?.title || 'Social Media Asset' }}
                      </span>
                      <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="closeLightbox" />
                    </div>
                  </template>

                  <div class="relative">
                    <img v-if="currentAsset" :src="currentAsset.url" :alt="currentAsset.title || 'Social media asset'"
                      class="w-full rounded-lg" />

                    <!-- Navigation buttons -->
                    <UButton v-if="currentAssetIndex > 0" class="absolute left-2 top-1/2 -translate-y-1/2" color="white"
                      variant="solid" icon="i-heroicons-chevron-left" @click="previousAsset" />

                    <UButton v-if="currentAssetIndex < residency.socialMediaAssets.length - 1"
                      class="absolute right-2 top-1/2 -translate-y-1/2" color="white" variant="solid"
                      icon="i-heroicons-chevron-right" @click="nextAsset" />
                  </div>

                  <template #footer>
                    <div class="text-sm text-stone-500">
                      {{ currentAssetIndex + 1 }} of {{ residency.socialMediaAssets.length }}
                    </div>
                  </template>
                </UCard>
              </UModal>
            </div>
            <div v-else class="p-4 bg-stone-50 rounded border border-stone-200 text-stone-500">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-photo" />
                <span>No social media assets provided</span>
              </div>
            </div>
          </UFormGroup>
        </UDashboardSection>

        <UDivider class="mb-4" />

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

        <ResidenciesAddMemberModal v-model="showAddMemberModal" :initial-name="newMemberName"
          @submit="handleAddMember" />
      </template>
    </UDashboardPanelContent>
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

const showLightbox = ref(false)
const currentAssetIndex = ref(0)
const currentAsset = computed(() =>
  residency.value?.socialMediaAssets?.[currentAssetIndex.value] || null
)

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
  memberEmailsError.value = null;

  try {
    const { data } = await useFetch(`/api/members/byResidencyId/${residency.value.id}`);
    if (!data.value?.members) throw new Error('No member data found');

    members.value = data.value.members;
    memberEmails.value = data.value.members.map(member => member.email);
  } catch (e) {
    console.error('Failed to fetch member data:', e);
    members.value = [];
    memberEmails.value = [];
    memberEmailsError.value = e instanceof Error ? e.message : 'Failed to fetch member data';
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
  submitForReview,
  approve,
  requestChanges,
  publish,
  approveAndPublish
} = useWorkflowActions(residency, fetchMemberData) // Pass fetchMemberData to composable


const handleMemberSelection = async (member) => {
  try {
    await handleMemberAssociation(member)
    toast.add({
      title: 'Success',
      description: 'Member associated successfully',
      color: 'green'
    })
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error.message,
      color: 'red'
    })
  }
}

const handleRemoveMember = async (member: Member) => {
  try {
    // Check if this is the last member
    if (members.value.length <= 1) {
      toast.add({
        title: 'Cannot Remove Member',
        description: 'A residency must have at least one member',
        color: 'red'
      });
      return;
    }

    console.log("Member object:", member);
    console.log("Removing member with ID:", member._id);
    const response = await removeMember(member._id);
    console.log("Remove member response:", response);
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
        socialMediaAssets {
          url
        }
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

// Watch for route changes to reload data
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await fetchResidencyData();
    }
  },
  { immediate: true }
)

definePageMeta({
  middleware: 'auth'
})

// Helper function to determine icon based on asset type
const getAssetTypeIcon = (type: string) => {
  const icons = {
    image: 'i-heroicons-photo',
    video: 'i-heroicons-video-camera',
    // Add more asset types as needed
  }
  return icons[type] || icons.image
}

// Lightbox controls
const openLightbox = (index: number) => {
  currentAssetIndex.value = index;
  showLightbox.value = true;
}

const closeLightbox = () => {
  showLightbox.value = false;
}

const previousAsset = () => {
  if (currentAssetIndex.value > 0) {
    currentAssetIndex.value--;
  }
}

const nextAsset = () => {
  if (currentAssetIndex.value < (residency.value?.socialMediaAssets?.length || 0) - 1) {
    currentAssetIndex.value++;
  }
}

const notifyAndProgress = async () => {
  if (!residency.value?.id) return;

  try {
    await submitForReview();
    return true;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : 'Failed to notify members');
  }
}

const createNewMemberModal = ref(false)
const newMemberName = ref('')

const handleCreateMember = (name: string) => {
  newMemberName.value = name
  showAddMemberModal.value = true // Changed from createNewMemberModal to showAddMemberModal
}

const showAddMemberModal = ref(false)

const handleAddMember = async ({ firstName, lastName, email }) => {
  try {
    const { data } = await useFetch('/api/members', {
      method: 'POST',
      body: {
        firstName,
        lastName,
        email,
      }
    })

    if (data.value?._id) {
      // Associate the new member with the residency
      await handleMemberAssociation({ value: data.value._id })
    }

    toast.add({
      title: 'Success',
      description: 'Member added successfully',
      color: 'green'
    })
  } catch (e) {
    toast.add({
      title: 'Error',
      description: e instanceof Error ? e.message : 'Failed to add member',
      color: 'red'
    })
  }
}
</script>
