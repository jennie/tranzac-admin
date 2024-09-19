<template>
  <div v-if="statusHistory.length > 0" class="status-history">
    <ul>
      <li v-for="(statusItem, index) in statusHistory" :key="index">
        <p><strong>Status:</strong> {{ statusItem.status }}</p>
        <p><strong>Timestamp:</strong> {{ formatDate(statusItem.timestamp) }}</p>
        <p><strong>Changed By:</strong> {{ statusItem.changedBy }}</p>
      </li>
    </ul>
  </div>
  <div v-else>
    <!-- <p>No status history available.</p> -->
  </div>
</template>

<script setup>
import { format } from 'date-fns';

// Props to accept the version data
const props = defineProps({
  version: {
    type: Object,
    required: true
  }
});

// Get the status history from the version, default to an empty array if undefined
const statusHistory = computed(() => {
  return props.version?.statusHistory || [];
});

// Helper to format timestamps
const formatDate = (timestamp) => {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
};
</script>
