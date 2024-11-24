<template>
  <div>
    <h1>Residency Details</h1>
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="residency">
      <p>ID: {{ residency.id }}</p>
      <p>Status: {{ residency._status }}</p>
      <p>Title: {{ residency.title }}</p>
      <p>Created At: {{ residency._createdAt }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';

const route = useRoute();
const id = computed(() => route.params.id);
const residency = ref(null);
const error = ref(null);
const isLoading = ref(true);

const QUERY = `
  query Residency($id: ItemId!) {
    residency(filter: { id: { eq: $id } }) {
      id
      _status
      _createdAt
      title
    }
  }
`;

// Use 'useGraphqlQuery' without 'await'
const { data, error: gqlError } = useGraphqlQuery({
  query: QUERY,
  variables: { id: id.value }
});

// Watch 'data' and 'gqlError' to update local state
watchEffect(() => {
  if (data.value) {
    residency.value = data.value.residency;
    isLoading.value = false;
  }
  if (gqlError.value) {
    error.value = gqlError.value.message;
    isLoading.value = false;
  }
});
</script>
