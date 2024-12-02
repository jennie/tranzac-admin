import { ref, computed } from "vue";
import type { Residency } from "~/types/residency";

export const useWorkflowActions = (
  residency: Ref<Residency>,
  refreshData: () => Promise<void>
) => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const wrapAction = async (action: () => Promise<any>) => {
    isLoading.value = true;
    try {
      await action();
      await refreshData();
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const actions = computed(() => {
    if (!residency.value) return [];

    switch (residency.value.workflowStatus) {
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

  const associateMember = (member: Ref<string>) =>
    wrapAction(async () => {
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/members`,
        {
          method: "POST",
          body: { memberId: member.value },
        }
      );
      return response;
    });

  const removeMember = (memberId: string) =>
    wrapAction(async () => {
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/members/${memberId}`,
        { method: "DELETE" }
      );
      return response;
    });

  const notifyAndProgress = () =>
    wrapAction(async () => {
      await updateStatus("resident_action_required");
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
    });

  const submitForReview = () =>
    wrapAction(async () => {
      await updateStatus("pending_review");
    });

  const approve = () =>
    wrapAction(async () => {
      await updateStatus("approved");
    });

  const requestChanges = (payload) =>
    wrapAction(async () => {
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/requestChanges`,
        {
          method: "POST",
          body: payload,
        }
      );
      await updateStatus("resident_action_required", payload);
      return response;
    });

  const publish = () =>
    wrapAction(async () => {
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/publish`,
        { method: "PUT" }
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to publish");
      }
      residency.value = {
        ...residency.value,
        _status: "published",
      };
      return response;
    });

  const approveAndPublish = () =>
    wrapAction(async () => {
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/approveAndPublish`,
        { method: "PUT" }
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to approve and publish");
      }
      residency.value = {
        ...residency.value,
        workflowStatus: "approved",
        _status: "published",
      };
      return response;
    });

  const updateStatus = async (newStatus: string, payload?: any) => {
    const response = await $fetch(
      `/api/residencies/${residency.value.id}/status`,
      {
        method: "PUT",
        body: { status: newStatus, ...payload },
      }
    );
    if (!response.success) {
      throw new Error(response.message || "Failed to update status");
    }
    residency.value = {
      ...residency.value,
      workflowStatus: newStatus,
    };
    return response;
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
    wrapAction,
  };
};

export const useEventWorkflowActions = (
  event: Ref<Event>,
  refreshData: () => Promise<void>
) => {
  const { wrapAction } = useWorkflowActions(ref({}), refreshData); // Add wrapAction from parent composable

  const actions = computed(() => {
    if (!event.value) return [];

    switch (event.value.workflowStatus) {
      case "approved":
        return ["publish"];
      case "pending_review":
        return ["approve", "request_changes"];
      default:
        return [];
    }
  });

  const publishEvent = () =>
    wrapAction(async () => {
      const response = await $fetch(`/api/events/${event.value.id}/publish`, {
        method: "PUT",
      });
      if (!response.success) {
        throw new Error(response.message || "Failed to publish event");
      }
      return response;
    });

  const submitEventChanges = (changes: any) =>
    wrapAction(async () => {
      const response = await $fetch(`/api/events/${event.value.id}`, {
        method: "PUT",
        body: {
          ...changes,
          workflowStatus: "pending_review",
        },
      });
      return response;
    });

  return {
    actions,
    publishEvent,
    submitEventChanges,
  };
};
