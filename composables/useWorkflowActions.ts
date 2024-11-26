// composables/useWorkflowActions.ts
import { ref, computed } from "vue";
import type { Residency } from "~/types/residency";

export const useWorkflowActions = (residency: Ref<Residency>) => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Available actions based on current status
  const actions = computed(() => {
    if (!residency.value) return [];

    switch (residency.value.activeStatus) {
      case "new":
        return ["associate_member"];
      case "pending_input":
        return ["submit_for_review"];
      case "pending_review":
        return ["approve", "request_changes"];
      case "changes_requested":
        return ["submit_for_review"];
      case "approved":
        return ["publish", "request_changes"];
      default:
        return [];
    }
  });

  // Action handlers
  const associateMember = async (memberIds: string[]) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/members`,
        {
          method: "POST",
          body: { memberIds },
        }
      );
      return response;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const removeMember = async (memberId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );
      return response;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const notifyAndProgress = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // First update the status
      await updateStatus("pending_input");

      // Then send notifications to all associated members
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/notify-members`,
        {
          method: "POST",
          body: {
            type: "ready_for_input",
            residencyTitle: residency.value.title,
          },
        }
      );

      return response;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const submitForReview = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      await updateStatus("pending_review");
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const approve = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      await updateStatus("approved");
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const requestChanges = async (note: string, recipientEmails: string[]) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/requestChanges`,
        {
          method: "PUT",
          body: {
            note,
            recipientEmails,
            residencyTitle: residency.value.title,
            status: "changes_requested",
          },
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to request changes");
      }

      // Update local state
      residency.value = {
        ...residency.value,
        activeStatus: "changes_requested",
      };

      return response;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const publish = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/publish`,
        {
          method: "PUT",
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to publish");
      }

      // Update local state
      residency.value = {
        ...residency.value,
        _status: "published",
      };

      return response;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/status`,
        {
          method: "PUT",
          body: { status: newStatus },
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to update status");
      }

      // Update local state
      residency.value = {
        ...residency.value,
        activeStatus: newStatus,
      };

      return response;
    } catch (e) {
      error.value = e.message;
      throw e;
    }
  };

  return {
    actions,
    isLoading,
    error,
    associateMember,
    submitForReview,
    approve,
    requestChanges,
    publish,
  };
};
