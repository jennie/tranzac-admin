// composables/useResidencyDashboard.ts
import { ref, computed } from "vue";
import type { Residency } from "~/types/residency";

export const useResidencyDashboard = () => {
  const selectedResidencies = ref<string[]>([]);
  const filterStatus = ref<string[]>([]);
  const searchQuery = ref("");
  const currentPage = ref(1);
  const itemsPerPage = ref(30);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // GraphQL query with filtering, search, and pagination
  const DASHBOARD_QUERY = `
    query ResidencyDashboard(
      $first: IntType!
      $skip: IntType!
      $status: [String!]
      $search: String
    ) {
      residencies: allResidencies(
        first: $first
        skip: $skip
        filter: {
          activeStatus: { in: $status }
          title: { matches: { pattern: $search } }
        }
        orderBy: _updatedAt_DESC
      ) {
        id
        title
        activeStatus
        _createdAt
        _updatedAt
        startDate
        endDate
      }
      stats: {
        new: _allResidenciesMeta(filter: { activeStatus: { eq: "new" } }) { count }
        pendingInput: _allResidenciesMeta(filter: { activeStatus: { eq: "pending_input" } }) { count }
        pendingReview: _allResidenciesMeta(filter: { activeStatus: { eq: "pending_review" } }) { count }
        changesRequested: _allResidenciesMeta(filter: { activeStatus: { eq: "changes_requested" } }) { count }
        approved: _allResidenciesMeta(filter: { activeStatus: { eq: "approved" } }) { count }
      }
    }
  `;

  const fetchDashboardData = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const variables = {
        first: itemsPerPage.value,
        skip: (currentPage.value - 1) * itemsPerPage.value,
        status: filterStatus.value.length ? filterStatus.value : undefined,
        search: searchQuery.value || undefined,
      };

      const { data } = await useGraphqlQuery({
        query: DASHBOARD_QUERY,
        variables,
      });

      return data;
    } catch (e) {
      error.value = e.message;
      console.error("Dashboard data fetch error:", e);
    } finally {
      isLoading.value = false;
    }
  };

  // Bulk actions
  const bulkApprove = async () => {
    if (!selectedResidencies.value.length) return;

    const promises = selectedResidencies.value.map((id) =>
      $fetch(`/api/residencies/${id}/status`, {
        method: "PUT",
        body: { status: "approved" },
      })
    );

    try {
      await Promise.all(promises);
      await fetchDashboardData();
      selectedResidencies.value = [];
    } catch (e) {
      error.value = "Failed to approve selected residencies";
      console.error("Bulk approve error:", e);
    }
  };

  const bulkRequestChanges = async (note: string) => {
    if (!selectedResidencies.value.length || !note) return;

    const promises = selectedResidencies.value.map(async (id) => {
      // Fetch member emails for each residency
      const { data: memberData } = await useFetch(
        `/api/members/byResidencyId/${id}`
      );

      return $fetch(`/api/residencies/${id}/requestChanges`, {
        method: "PUT",
        body: {
          recipientEmails: memberData.value?.emails || [],
          note,
          status: "changes_requested",
        },
      });
    });

    try {
      await Promise.all(promises);
      await fetchDashboardData();
      selectedResidencies.value = [];
    } catch (e) {
      error.value = "Failed to request changes for selected residencies";
      console.error("Bulk request changes error:", e);
    }
  };

  // Computed properties for UI state
  const canBulkApprove = computed(() => {
    return selectedResidencies.value.length > 0;
  });

  const canBulkRequestChanges = computed(() => {
    return selectedResidencies.value.length > 0;
  });

  // Selection handling
  const toggleSelection = (id: string) => {
    const index = selectedResidencies.value.indexOf(id);
    if (index === -1) {
      selectedResidencies.value.push(id);
    } else {
      selectedResidencies.value.splice(index, 1);
    }
  };

  const selectAll = (residencies: Residency[]) => {
    selectedResidencies.value = residencies.map((r) => r.id);
  };

  const clearSelection = () => {
    selectedResidencies.value = [];
  };

  return {
    // State
    selectedResidencies,
    filterStatus,
    searchQuery,
    currentPage,
    itemsPerPage,
    isLoading,
    error,

    // Actions
    fetchDashboardData,
    bulkApprove,
    bulkRequestChanges,
    toggleSelection,
    selectAll,
    clearSelection,

    // Computed
    canBulkApprove,
    canBulkRequestChanges,
  };
};
