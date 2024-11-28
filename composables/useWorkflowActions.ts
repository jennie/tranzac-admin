// composables/useWorkflowActions.ts
import { ref, computed } from "vue";
import type { Residency } from "~/types/residency";

export const useWorkflowActions = (
  residency: Ref<Residency>,
  fetchMemberData: () => Promise<void>
) => {
  // Added fetchMemberData as a parameter
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Available actions based on current status
  const actions = computed(() => {
    if (!residency.value) return [];

    switch (residency.value.activeStatus) {
      case "new":
        return ["associate_member"];
      case "resident_action_required":
        return ["submit_for_review"];
      case "pending_review":
        return ["request_changes", "approve_and_publish"];
      default:
        return [];
    }
  });

  const prettyStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // composables/useWorkflowActions.ts
  // Add to existing file:
  const associateMember = async (member) => {
    try {
      await $fetch(`/api/residencies/${residency.value.id}/members`, {
        method: "POST",
        body: { memberId: member.value },
      });
      await fetchMemberData(); // Now accessible
      return true;
    } catch (error) {
      throw new Error(error.data?.message || "Failed to associate member");
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
      await updateStatus("resident_action_required");

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

  const requestChanges = async ({
    note,
    recipientEmails,
    commsManagerName,
    residencyTitle,
  }) => {
    isLoading.value = true;
    error.value = null;

    try {
      // Send the change request first
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/requestChanges`,
        {
          method: "POST",
          body: {
            note,
            recipientEmails,
            residencyTitle,
            commsManagerName,
          },
        }
      );

      // Then update status with the same recipient info
      await updateStatus("resident_action_required", {
        note,
        recipientEmails,
        commsManagerName,
      });

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

  const approveAndPublish = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/approveAndPublish`,
        {
          method: "PUT",
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to approve and publish");
      }

      // Update local state
      residency.value = {
        ...residency.value,
        activeStatus: "approved",
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
    removeMember,
    publish,
    approveAndPublish,
  };
};
