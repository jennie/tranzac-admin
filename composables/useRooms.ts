import { ref, onMounted } from "vue";

export function useRooms() {
  const { roomMapping: localRoomMapping } = useRoomMapping();
  const rooms = ref(localRoomMapping.value);
  const isLoading = ref(false);
  const error = ref(null);

  const fetchRooms = async () => {
    // We don't need to fetch rooms from the API if we already have them locally
    if (rooms.value.length > 0) return;

    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch("/api/rooms");
      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }
      const data = await response.json();
      rooms.value = data.rooms;
    } catch (err) {
      console.error("Error fetching rooms:", err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  const checkRoomAvailability = async (roomId, startDate, endDate) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      if (!response.ok) {
        throw new Error("Failed to check room availability");
      }
      const data = await response.json();
      return data.body;
    } catch (error) {
      console.error("Error checking room availability:", error);
      return { isAvailable: false, error: error.message };
    }
  };

  onMounted(() => {
    fetchRooms();
  });

  return {
    rooms,
    isLoading,
    error,
    fetchRooms,
    checkRoomAvailability,
  };
}
