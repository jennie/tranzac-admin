import { ref, readonly, computed, onMounted } from "vue";

export const useEventsData = () => {
  const events = ref([]);
  const metrics = ref({
    scheduled: 0,
    pending_review: 0,
    published: 0,
  });
  const isLoading = ref(true);
  const error = ref(null);

  const fetchEvents = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const query = `
        query FetchEvents {
          allEvents {
            id
            title
            status
            startDate
            endDate
          }
          _allEventsMeta {
            count
          }
          metrics: _allEventsMeta {
            scheduled: count(filter: { status: { eq: "scheduled" } })
            pendingReview: count(filter: { status: { eq: "pending_review" } })
            published: count(filter: { status: { eq: "published" } })
          }
        }
      `;

      const { data } = await useGraphqlQuery({ query });

      if (data.value?.allEvents) {
        events.value = data.value.allEvents;
      }

      metrics.value = {
        scheduled: data.value?.metrics?.scheduled || 0,
        pending_review: data.value?.metrics?.pendingReview || 0,
        published: data.value?.metrics?.published || 0,
      };
    } catch (e) {
      console.error("Error fetching events:", e);
      error.value = "Failed to load events";
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(fetchEvents);

  return {
    events: readonly(events),
    metrics: readonly(metrics),
    isLoading: readonly(isLoading),
    error: readonly(error),
  };
};
