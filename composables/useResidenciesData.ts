// composables/useResidenciesData.ts
import { ref, readonly, watchEffect, onMounted } from "vue";
import useServerGraphQlQuery from "@/composables/useServerGraphQlQuery";

export const useResidenciesData = () => {
  const residencies = ref([]);
  const totalResidencies = ref(0);
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  let isDataLoaded = false;

  const fetchAllResidencies = async () => {
    if (isDataLoaded) return;
    isDataLoaded = true;
    isLoading.value = true;
    residencies.value = [];
    console.log("Fetching all residencies...");
    error.value = null;

    const runtimeConfig = useRuntimeConfig();
    let hasMore = true;
    let skip = 0;
    const first = 100;

    try {
      while (hasMore) {
        const query = `
          query FetchResidencies($first: IntType, $skip: IntType) {
            allResidencies(first: $first, skip: $skip) {
              id
              title
              description
              startDate
              endDate
              activeStatus
              _status
              _createdAt
            }
            _allResidenciesMeta {
              count
            }
          }
        `;

        const variables = { first, skip };

        const data = await useServerGraphQlQuery({
          query,
          variables,
          includeDrafts: true,
          token: runtimeConfig.public.datoCmsToken,
        });

        if (data?.allResidencies?.length) {
          residencies.value.push(...data.allResidencies);
          skip += data.allResidencies.length;
          hasMore = data.allResidencies.length === first;
        } else {
          hasMore = false;
        }
      }

      totalResidencies.value = residencies.value.length;
    } catch (e) {
      console.error("Error fetching all residencies:", e);
      error.value = "Failed to load residencies";
    } finally {
      isLoading.value = false;
    }
  };

  watchEffect(() => {
    fetchAllResidencies();
  });

  onMounted(async () => {
    await fetchAllResidencies();
  });

  return {
    residencies: readonly(residencies),
    totalResidencies: readonly(totalResidencies),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchAllResidencies,
  };
};
