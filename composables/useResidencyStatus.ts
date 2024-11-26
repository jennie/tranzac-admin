// composables/useResidencyStatus.ts
import type { Residency } from "~/types/residency";

export const useResidencyStatus = (residency: Ref<Residency>) => {
  const { user } = useAuth();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const canApprove = computed(() => {
    return (
      residency.value?.activeStatus === "pending_review" &&
      user.value?.role === "comms_manager"
    );
  });

  const canPublish = computed(() => {
    return (
      residency.value?.activeStatus === "approved" &&
      residency.value?._status === "draft" &&
      user.value?.role === "comms_manager"
    );
  });

  const canRequestChanges = computed(() => {
    return (
      ["pending_review", "approved"].includes(residency.value?.activeStatus) &&
      user.value?.role === "comms_manager"
    );
  });

  const shouldShowRequestChangesForm = computed(() => {
    return canRequestChanges.value && residency.value?.activeStatus !== "new";
  });

  const canEdit = computed(() => {
    if (user.value?.role === "comms_manager") return true;
    if (user.value?.role === "resident") {
      return ["resident_action_required", "resident_action_required"].includes(
        residency.value?.activeStatus
      );
    }
    return false;
  });

  const updateStatus = async (
    newStatus: string,
    options?: {
      note?: string;
      recipientEmails?: string[];
      commsManagerName?: string;
    }
  ) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch(
        `/api/residencies/${residency.value.id}/status`,
        {
          method: "PUT",
          body: {
            status: newStatus,
            ...options,
          },
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to update status");
      }

      // Update local residency state
      residency.value = {
        ...residency.value,
        activeStatus: newStatus,
      };

      return response;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    canApprove,
    canPublish,
    canRequestChanges,
    canEdit,
    updateStatus,
    isLoading,
    error,
    shouldShowRequestChangesForm,
  };
};
