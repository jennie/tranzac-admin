<template>
  <UDashboardPanel grow>
    <UDashboardPanelContent class="pb-24">
      <div v-if="isLoading" class="p-4">
        Loading…
      </div>
      <div v-else-if="error" class="text-red-500 p-4">
        <p>Error: {{ error }}</p>
      </div>
      <template v-else-if="residency">
        <UPageHeader headline="Residency" :title="residency.title" icon="i-heroicons-clipboard"
          :description="`Last updated: ${formatDate(residency._updatedAt)}`" />

        <UDivider class="mb-4" />

        <UDashboardSection title="Details" class="mb-8">
          <div class="grid gap-4">
            <div class="grid grid-cols-2 gap-4">
              <span class="font-semibold">Status:</span>
              <div>
                <span class="block">{{ residency._status }}</span>
                <UCard v-if="canApprove || canRequestChanges">
                  <div class="flex gap-4">
                    <UButton v-if="canApprove" @click="handleStatusUpdate('approved')">
                      Approve Residency
                    </UButton>
                    <UButton v-if="canRequestChanges" color="gray" @click="showRequestChangesForm = true">
                      Request Changes
                    </UButton>
                  </div>
                </UCard>

              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <span class="font-semibold">Description:</span>
              <p>{{ residency.description }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <span class="font-semibold">Date Range:</span>
              <span>{{ formatDate(residency.startDate) }} - {{ formatDate(residency.endDate) }}</span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <span class="font-semibold">Active Status:</span>
              <span>{{ residency.activeStatus }}</span>
            </div>

            <div v-if="residency.photo" class="grid grid-cols-2 gap-4">
              <span class="font-semibold">Photo:</span>
              <img :src="residency.photo.url" alt="Residency Photo" class="w-32 h-32 object-cover rounded-lg" />
            </div>
          </div>
        </UDashboardSection>

        <UDashboardSection title="Associated Members" class="mb-8">
          <div v-if="memberEmailsLoading">
            <p class="text-stone-500">Loading...</p>
          </div>
          <div v-else-if="memberEmailsError" class="text-red-500">
            Error loading member emails: {{ memberEmailsError }}
          </div>
          <div v-else>
            <div v-if="memberEmails.length" class="space-y-2">
              <div v-for="member in members" :key="member" class="p-2 bg-stone-50 rounded">
                <a class="text-flamingo underline" :href="'mailto:' + member.email">{{ member.firstName }} {{
                  member.lastName }}</a>
              </div>
            </div>
            <p v-else class="text-stone-500">No member emails associated with this residency</p>
          </div>
        </UDashboardSection>

        <UDashboardSection title="Actions">

          <UButton v-if="canApprove" @click="updateStatus('approved')">
            Approve
          </UButton>
          <ResidenciesRequestChangesForm v-if="shouldShowRequestChangesForm" :title="residency.title"
            :record-id="residency.id" :recipient-emails="memberEmails" @submit="handleRequestChanges" />
          <div v-else>
            <p class="text-stone">No actions available</p>
          </div>
        </UDashboardSection>
      </template>
    </UDashboardPanelContent>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { formatDate } from '@/utils/formatters';
import { first } from 'lodash';
import type { Residency } from '~/types/residency'


const residency = ref<Residency | null>(null)

definePageMeta({
  middleware: 'auth'
});

const route = useRoute();
const id = computed(() => route.params.id);

const error = ref(null);
const isLoading = ref(true);
const { canApprove, canRequestChanges, updateStatus, isLoading: statusUpdateLoading, shouldShowRequestChangesForm } = useResidencyStatus(residency)
const showRequestChangesForm = ref(false)

const handleStatusUpdate = async (newStatus: string) => {
  await updateStatus(newStatus)
  await refresh()
}
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
`;

const { data, error: gqlError } = useGraphqlQuery({
  query: QUERY,
  variables: { id: id.value },
});

watchEffect(() => {
  if (data.value) {
    residency.value = data.value.residency;
    isLoading.value = false;
  }
  if (gqlError.value) {
    error.value = gqlError.value.message;
    isLoading.value = false;
  }
});

// Replace useUser with useAuth
const { user } = useAuth();

const handleRequestChanges = async ({ recipientEmails, note }) => {
  if (!recipientEmails?.length || !note) {
    alert("Please provide both recipient emails and a note.");
    return;
  }

  try {
    const response = await fetch(`/api/residencies/${residency.value.id}/requestChanges`, {
      method: "PUT", // Changed to PUT to match the endpoint
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientEmails,
        note,
        residencyTitle: residency.value.title,
        commsManagerName: user.value?.name || 'Communications Manager', // Use actual user name
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert("Change request email sent successfully!");
    } else {
      console.error("Failed to send change request:", result.message);
      alert("Failed to send change request. Please try again.");
    }
  } catch (error) {
    console.error("Error in handleRequestChanges:", error);
    alert("An error occurred while sending the change request.");
  }
};

const members = ref([]);
const memberEmails = ref([]);
const memberEmailsLoading = ref(false);
const memberEmailsError = ref(null);

const fetchMemberEmails = async () => {
  memberEmailsLoading.value = true;
  memberEmailsError.value = null;

  try {
    const { data, error } = await useFetch(`/api/members/byResidencyId/${residency.value.id}`);

    if (error.value) throw new Error(error.value.message);
    if (!data.value?.emails) throw new Error('No emails found');

    members.value = data.value.members || [];
    memberEmails.value = data.value.emails;
  } catch (error) {
    memberEmailsError.value = error.message;
    memberEmails.value = [];
  } finally {
    memberEmailsLoading.value = false;
  }
};

watchEffect(() => {
  if (residency.value) {
    fetchMemberEmails();
  }
});
</script>
