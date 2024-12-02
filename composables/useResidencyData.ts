import { ref, watch } from "vue";
import type { Residency } from "~/types/residency";

export const useResidencyData = (id: string) => {
  const residency = ref<Residency | null>(null);
  const error = ref<string | null>(null);
  const isLoading = ref(true);

  const fetchResidencyData = async () => {
    const QUERY = `
      query Residency($id: ItemId!) {
        residency(filter: { id: { eq: $id } }) {
          id
          _status
          _createdAt
          _updatedAt
          title
          description
          photo {
            url
          }
          startDate
          endDate
          slug
          workflowStatus
          generateEvents
          socialMediaAssets {
            url
            title
          }
          _allReferencingEvents {
            id
          }
        }
      }
    `;

    try {
      isLoading.value = true;
      const { data, error: gqlError } = await useGraphqlQuery({
        query: QUERY,
        variables: { id },
      });

      if (data.value?.residency) {
        residency.value = data.value.residency;
      }
      if (gqlError.value) {
        error.value = gqlError.value.message;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "An error occurred";
    } finally {
      isLoading.value = false;
    }
  };

  // Initial fetch
  fetchResidencyData();

  // Refetch when ID changes
  watch(() => id, fetchResidencyData);

  return {
    residency,
    error,
    isLoading,
    refresh: fetchResidencyData,
  };
};
