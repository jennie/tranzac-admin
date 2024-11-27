<template>
  <div class="relative">
    <UInput v-model="search" placeholder="Search residents..." :loading="isLoading" />
    <div v-if="residents.length"
      class="absolute w-full bg-white border mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
      <div v-for="resident in residents" :key="resident.value" class="p-2 hover:bg-gray-100 cursor-pointer"
        @click="selectResident(resident)">
        <div>{{ resident.label }}</div>
        <div class="text-sm text-gray-500">{{ resident.email }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const search = ref('')
const isLoading = ref(false)
const residents = ref([])
const emit = defineEmits(['select'])

const selectResident = (resident) => {
  emit('select', resident)
  search.value = ''
  residents.value = []
}

watch(search, useDebounceFn(async (query) => {
  if (!query || query.length < 2) {
    residents.value = []
    return
  }

  isLoading.value = true
  try {
    residents.value = await $fetch(`/api/members/search?q=${query}`)
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}, 300))
</script>