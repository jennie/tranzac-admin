<!-- components/residencies/BulkActions.vue -->
<template>
  <UDropdown :items="actionItems" :disabled="!selectedCount">
    <UButton color="gray" :disabled="!selectedCount" :label="`Actions (${selectedCount} selected)`"
      trailing-icon="i-heroicons-chevron-down" />

    <template #changes-note>
      <div class="p-4 w-80">
        <UTextarea v-model="note" label="Changes Note" placeholder="Enter details about requested changes..." />
        <UButton class="mt-4 w-full" :loading="isSubmitting" :disabled="!note" @click="handleRequestChanges">
          Submit Changes Request
        </UButton>
      </div>
    </template>
  </UDropdown>
</template>

<script setup lang="ts">
const props = defineProps<{
  selectedCount: number;
}>();

const emit = defineEmits<{
  (e: 'approve'): void;
  (e: 'requestChanges', note: string): void;
}>();

const note = ref('');
const isSubmitting = ref(false);

const handleRequestChanges = async () => {
  if (!note.value) return;

  isSubmitting.value = true;
  try {
    await emit('requestChanges', note.value);
    note.value = ''; // Reset after successful submission
  } finally {
    isSubmitting.value = false;
  }
};

const actionItems = computed(() => [
  [
    {
      label: 'Approve Selected',
      icon: 'i-heroicons-check-circle',
      click: () => emit('approve'),
      disabled: !props.selectedCount
    },
    {
      label: 'Request Changes',
      icon: 'i-heroicons-pencil-square',
      slot: 'changes-note',
      disabled: !props.selectedCount
    }
  ]
]);
</script>