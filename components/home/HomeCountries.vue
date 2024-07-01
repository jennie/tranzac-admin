<script setup lang="ts">
const bookings = ref([]);
const isLoading = ref(false);
const error = ref(null);

const QUERY = `query {
  allRentals {
    _status
    title
    startDate
    organization
    endDate
    id
  }
}
`;

const fetchBookings = async () => {
  isLoading.value = true;

  try {
    const { data, error: fetchError } = await useGraphqlQuery({ query: QUERY, includeDrafts: true });
    console.log(data)

    if (fetchError.value) {
      throw new Error(fetchError.value);
    }

    if (data.value && data.value.allRentals) {
      bookings.value = data.value.allRentals.map(rental => ({
        ...rental,
        start: new Date(rental.startDate),
        end: new Date(rental.endDate),
      }));
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchBookings();
});
</script>

<template>
  <div v-if="error">
    <p>Error: {{ error }}</p>
  </div>
  <div v-else-if="isLoading">
    <p>Loading...</p>
  </div>
  <div v-else>
    {{ bookings }}
  </div>
  <!-- Rest of your template -->
</template>