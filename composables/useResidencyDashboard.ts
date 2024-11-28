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

  const metrics = ref({
    new: 0,
    resident_action_required: 0,
    pending_review: 0,
    approved: 0,
    published: 0,
  });

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
      newCount: _allResidenciesMeta(filter: { activeStatus: { eq: "new" } }) {
        count
      }
      pendingInputCount: _allResidenciesMeta(filter: { activeStatus: { eq: "resident_action_required" } }) {
        count
      }
      pendingReviewCount: _allResidenciesMeta(filter: { activeStatus: { eq: "pending_review" } }) {
        count
      }
      changesRequestedCount: _allResidenciesMeta(filter: { activeStatus: { eq: "resident_action_required" } }) {
        count
      }
      approvedCount: _allResidenciesMeta(filter: { activeStatus: { eq: "approved" } }) {
        count
      }
      publishedCount: _allResidenciesMeta(filter: { activeStatus: { eq: "published" } }) {
        count
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

      if (data) {
        metrics.value = {
          new: data.newCount?.count || 0,
          resident_action_required: data.pendingInputCount?.count || 0,
          pending_review: data.pendingReviewCount?.count || 0,
          resident_action_required: data.changesRequestedCount?.count || 0,
          approved: data.approvedCount?.count || 0,
          published: data.publishedCount?.count || 0,
        };
      }
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
        method: "POST",
        body: {
          recipientEmails: memberData.value?.emails ?? [],
          note,
          status: "resident_action_required",
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
    metrics,

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
