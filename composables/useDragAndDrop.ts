export function useDragAndDrop() {
  const draggedIndex = ref<number | null>(null);
  const overIndex = ref<number | null>(null);

  function onDragStart(event: DragEvent, index: number) {
    event.dataTransfer.setData("text/plain", index.toString());
  }

  function onDragOver(event: DragEvent, index: number) {
    event.preventDefault(); // Necessary for onDrop to work
    overIndex.value = index;
  }

  function onDragEnd() {
    draggedIndex.value = null;
    overIndex.value = null;
  }

  function onDrop(
    updateFunction: (draggedIndex: number, overIndex: number) => void
  ) {
    if (
      draggedIndex.value === null ||
      overIndex.value === null ||
      draggedIndex.value === overIndex.value
    ) {
      return;
    }

    updateFunction(draggedIndex.value, overIndex.value);
    onDragEnd(); // Reset indices after drop
  }

  return {
    draggedIndex,
    overIndex,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
  };
}
