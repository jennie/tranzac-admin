import { ref, readonly, computed, onMounted } from "vue";

export const useResidenciesData = () => {
  const residencies = ref([]);
  const residenciesWithoutMembers = ref([]); // Add this here
  const totalResidencies = ref(0);
  const metrics = ref({
    new: 0,
    pending_input: 0,
    pending_review: 0,
    changes_requested: 0,
    approved: 0,
    published: 0,
  });
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  const fetchResidenciesWithoutMembers = async () => {
    try {
      const { data }: { data: { residenciesWithoutMembers: any[] } } =
        await $fetch("/api/members/withoutMembers");
      residenciesWithoutMembers.value = data?.residenciesWithoutMembers || [];
    } catch (error) {
      console.error("Error fetching residencies without members:", error);
    }
  };
  let isDataLoaded = false;

  const fetchAllResidencies = async () => {
    if (isDataLoaded) return; // Skip fetch if data is already loaded
    isDataLoaded = true;
    isLoading.value = true;
    residencies.value = [];
    console.log("Fetching all residencies...");
    error.value = null;

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
              _createdAt
            }
            _allResidenciesMeta {
              count
            }
          }
        `;

        const variables = { first, skip };

        const { data } = await useGraphqlQuery({ query, variables });
        if (data.value?.allResidencies?.length) {
          residencies.value.push(...data.value.allResidencies);
          skip += data.value.allResidencies.length;
          hasMore = data.value.allResidencies.length === first;
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
  const calculateMetrics = () => {
    metrics.value = {
      new: residencies.value.filter((r) => r.activeStatus === "new").length,
      pending_input: residencies.value.filter(
        (r) => r.activeStatus === "pending_input"
      ).length,
      pending_review: residencies.value.filter(
        (r) => r.activeStatus === "pending_review"
      ).length,
      changes_requested: residencies.value.filter(
        (r) => r.activeStatus === "changes_requested"
      ).length,
      approved: residencies.value.filter((r) => r.activeStatus === "approved")
        .length,
      published: residencies.value.filter((r) => r.activeStatus === "published")
        .length,
    };
  };

  onMounted(async () => {
    await fetchAllResidencies();
    await fetchResidenciesWithoutMembers();
    calculateMetrics();
  });

  return {
    residencies: readonly(residencies),
    totalResidencies: readonly(totalResidencies),
    residenciesWithoutMembers: readonly(residenciesWithoutMembers),
    metrics: readonly(metrics),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchAllResidencies,
    calculateMetrics,
  };
};
