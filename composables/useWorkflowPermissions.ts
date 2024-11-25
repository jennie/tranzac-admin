// composables/useWorkflowPermissions.ts

interface WorkflowPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
}

export const useWorkflowPermissions = () => {
  const { user } = useAuth();

  const permissions = computed<WorkflowPermissions>(() => ({
    canView: ["comms_manager", "resident"].includes(user.value?.role),
    canEdit: user.value?.role === "comms_manager",
    canDelete: user.value?.role === "comms_manager",
    canManageMembers: user.value?.role === "comms_manager",
  }));

  return {
    ...toRefs(permissions),
    isCommsManager: computed(() => user.value?.role === "comms_manager"),
    isResident: computed(() => user.value?.role === "resident"),
  };
};
