// composables/useEventSelection.ts

interface Event {
  id: string;
  activeStatus: string;
  _status: "draft" | "published";
}

export const useEventSelection = () => {
  const selectedIds = ref<string[]>([]);
  const isAllSelected = ref(false);

  const toggleSelection = (id: string) => {
    const index = selectedIds.value.indexOf(id);
    index === -1
      ? selectedIds.value.push(id)
      : selectedIds.value.splice(index, 1);
  };

  const toggleAll = (events: Event[]) => {
    selectedIds.value = isAllSelected.value ? [] : events.map((e) => e.id);
    isAllSelected.value = !isAllSelected.value;
  };

  const canBulkApprove = (events: Event[]) => {
    return (
      selectedIds.value.length > 0 &&
      selectedIds.value.every(
        (id) =>
          events.find((e) => e.id === id)?.activeStatus === "pending_review"
      )
    );
  };

  return {
    selectedIds,
    isAllSelected,
    toggleSelection,
    toggleAll,
    canBulkApprove,
  };
};
