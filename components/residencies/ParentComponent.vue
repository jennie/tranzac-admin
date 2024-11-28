<template>
  <!-- ...existing template code... -->
  <RequestChangesForm :title="residency.title" :recordId="residency.id" :recipientEmails="recipientEmails"
    @submit="handleRequestChangesSubmit" />
  <!-- ...existing template code... -->
</template>

<script>
import { useWorkflowActions } from '~/composables/useWorkflowActions';
import { ref } from 'vue';
import type { Residency } from '~/types/residency';

export default {
  // ...existing component options...
  props: {
    residency: {
      type: Object as () => Residency,
      required: true
    },
    // ...other props...
  },
  setup(props) {
    const recipientEmails = ref([...props.recipientEmails]); // Assuming recipientEmails comes as prop
    const fetchMemberData = async () => {
      // ...existing fetch logic...
    };

    const workflowActions = useWorkflowActions(ref(props.residency), fetchMemberData);

    const handleRequestChangesSubmit = async ({ note, recipientEmails, commsManagerName }) => {
      try {
        await workflowActions.requestChanges(note, recipientEmails, commsManagerName);
        // ...existing code after successful submission...
      } catch (error) {
        console.error(error);
        // ...handle error...
      }
    };

    return {
      recipientEmails,
      handleRequestChangesSubmit,
      // ...other returned properties...
    };
  },
  // ...existing component options...
};
</script>

<style scoped>
/* ...existing styles... */
</style>