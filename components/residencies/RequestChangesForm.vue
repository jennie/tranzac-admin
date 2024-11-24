<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <span class="font-semibold">Title:</span>
      <span>{{ title || 'No title provided' }}</span>

      <span class="font-semibold">From:</span>
      <span>comms@tranzac.org</span>

      <span class="font-semibold">Recipient Email(s):</span>
      <div class="space-y-1">
        <div v-for="email in recipientEmails" :key="email" class="text-sm">
          {{ email }}
        </div>
        <span v-if="!recipientEmails.length" class="text-gray-500 text-sm">
          No recipients selected
        </span>
      </div>
    </div>

    <UTextarea v-model="note" label="Note" placeholder="Enter your change request note" />

    <UButton @click="handleSubmit" :loading="isSubmitting" :disabled="!note || isSubmitting || !recipientEmails.length">
      Submit Change Request
    </UButton>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  recordId: {
    type: String,
    required: true
  },
  recipientEmails: {
    type: Array,
    required: true,
    default: () => []
  }
});

const note = ref('');
const isSubmitting = ref(false);
const emit = defineEmits(['submit']);

const handleSubmit = async () => {
  isSubmitting.value = true;
  try {
    await emit('submit', {
      recipientEmails: props.recipientEmails,
      note: note.value
    });
    note.value = ''; // Reset form after successful submission
  } finally {
    isSubmitting.value = false;
  }
};
</script>