import { ref, onMounted } from "vue";

export function useResources() {
  const resourceOptions = ref([]);
  const isLoading = ref(true);
  const error = ref(null);

  const fetchResources = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch("/api/resources", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.resources)) {
        throw new Error("No resources found in the response");
      }

      resourceOptions.value = data.resources;
    } catch (err) {
      console.error("Error fetching resources:", err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    fetchResources();
  });

  return {
    resourceOptions,
    isLoading,
    error,
    fetchResources, // Optional if you need to trigger fetch manually
  };
}
