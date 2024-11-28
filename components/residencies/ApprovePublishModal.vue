<!-- components/residencies/ApprovePublishModal.vue -->
<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="text-lg font-medium">
          Approve and Publish Residency
        </div>
      </template>

      <div class="space-y-4">
        <p>Are you sure you want to approve and publish this residency?</p>

        <UFormGroup label="Generate Events" name="generateEvents">
          <UToggle v-model="generateEvents" :disabled="toggleLoading">
            <template #default="{ checked }">
              {{ checked ? 'Enabled' : 'Disabled' }}
            </template>
          </UToggle>
          <template #help>
            <span :class="{ 'text-gray-400': toggleLoading }">
              If enabled, events will be automatically generated based on the residency dates.
              Previously generated events in the past will not be modified.
            </span>
          </template>
        </UFormGroup>

        <div v-if="error" class="text-red-500 text-sm mt-2">
          {{ error }}
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="closeModal" :disabled="toggleLoading || loading">
            Cancel
          </UButton>
          <UButton color="primary" :loading="loading" :disabled="toggleLoading" @click="handleConfirm">
            Approve & Publish
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  residencyId: string;
  initialGenerateEvents?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'confirm': [options: { generateEvents: boolean }];
}>();

// Local reactive refs
const loading = ref(false);
const toggleLoading = ref(false);
const error = ref<string | null>(null);
const generateEvents = ref(props.initialGenerateEvents || false);

// Computed property for v-model binding
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Methods
const closeModal = () => {
  isOpen.value = false;
};

const handleGenerateEventsChange = async (value: boolean) => {
  toggleLoading.value = true;
  error.value = null;

  try {
    const response = await $fetch(`/api/residencies/${props.residencyId}/generateEvents`, {
      method: 'PUT',
      body: { generateEvents: value }
    });

    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (e) {
    error.value = e.message || 'Failed to update generate events setting';
    // Revert the toggle if the API call failed
    generateEvents.value = !value;
  } finally {
    toggleLoading.value = false;
  }
};

const handleConfirm = async () => {
  if (toggleLoading.value) return;

  loading.value = true;
  try {
    await emit('confirm', { generateEvents: generateEvents.value });
    closeModal();
  } finally {
    loading.value = false;
  }
};

// Watch for generateEvents changes
watch(generateEvents, handleGenerateEventsChange);

// Fetch initial value when modal opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.residencyId) {
    toggleLoading.value = true;
    try {
      const query = `
        query ResidencyGenerateEvents($id: ItemId!) {
          residency(filter: { id: { eq: $id } }) {
            generateEvents
          }
        }
      `;

      const { data } = await useGraphqlQuery({
        query,
        variables: { id: props.residencyId }
      });

      generateEvents.value = data.value?.residency?.generateEvents || false;
    } catch (e) {
      error.value = 'Failed to load generate events setting';
      console.error('Error fetching generateEvents:', e);
    } finally {
      toggleLoading.value = false;
    }
  }
});
</script>