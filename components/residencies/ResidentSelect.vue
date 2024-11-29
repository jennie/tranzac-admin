<!-- // components/residencies/ResidentSelect.vue -->
<template>
  <div class="relative" ref="containerRef">
    <UInput v-model="searchQuery" :loading="isLoading" placeholder="Search for a resident..." class="w-full"
      @focus="handleFocus" @input="debouncedSearch">
      <template #append>
        <UButton v-if="searchQuery" color="gray" variant="ghost" icon="i-heroicons-x-mark" @click.stop="clearSearch" />
      </template>
    </UInput>

    <div v-if="isOpen" class="absolute left-0 right-0 mt-1 bg-white rounded-lg border shadow-lg z-50">
      <div class="p-2 max-h-[300px] overflow-y-auto">
        <!-- Loading state -->
        <div v-if="isLoading" class="p-2 text-sm text-gray-500">
          Searching...
        </div>

        <!-- No results -->
        <div v-else-if="searchQuery && !members.length" class="p-2">
          <div class="text-sm text-gray-500 mb-2">
            No members found
          </div>
          <UButton color="primary" variant="soft" class="w-full justify-start" @click="createNewMember">
            <template #leading>
              <UIcon name="i-heroicons-plus" />
            </template>
            Create "{{ searchQuery }}"
          </UButton>
        </div>

        <!-- Results list -->
        <div v-else-if="members.length" class="space-y-1">
          <UButton v-for="member in members" :key="member.value" color="gray" variant="ghost"
            class="w-full justify-start" @click="handleSelect(member)">
            <div class="flex justify-between items-center w-full">
              <span>{{ member.label }}</span>
              <span class="text-sm text-gray-500">{{ member.email }}</span>
            </div>
          </UButton>
        </div>

        <!-- Initial state -->
        <div v-else class="p-2 text-sm text-gray-500">
          Type to search members...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside, useDebounceFn } from '@vueuse/core'
import type { Member } from '~/types/member'

const props = defineProps<{
  residencyId: string
}>()

const emit = defineEmits<{
  select: [member: Member]
  close: []
  create: [query: string]
}>()

const containerRef = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const isOpen = ref(false)
const isLoading = ref(false)
const members = ref([])

onClickOutside(containerRef, () => {
  isOpen.value = false
})

const handleSearch = async (query: string) => {
  if (query.length < 2) {
    members.value = []
    return
  }

  isLoading.value = true
  try {
    console.log('Searching for:', query)
    const { data } = await useFetch('/api/members/search', {
      query: { q: query },
      server: false
    })

    console.log('Search response:', data.value)

    if (!data.value || !Array.isArray(data.value)) {
      console.warn('Invalid response format')
      members.value = []
      return
    }

    // The API is already returning formatted data
    members.value = data.value
    console.log('Set members:', members.value)
  } catch (e) {
    console.error('Search failed:', e)
    members.value = []
  } finally {
    isLoading.value = false
  }
}

const debouncedSearch = useDebounceFn((event: Event) => {
  const value = (event.target as HTMLInputElement).value
  if (!isOpen.value) isOpen.value = true
  handleSearch(value)
}, 300)

const handleFocus = () => {
  isOpen.value = true
  if (searchQuery.value.length >= 2) {
    handleSearch(searchQuery.value)
  }
}

const createNewMember = () => {
  // Emit event to parent to handle new member creation
  emit('create', searchQuery.value)
  clearSearch()
}

const clearSearch = () => {
  searchQuery.value = ''
  members.value = []
  isOpen.value = false
  emit('close')
}

const handleSelect = (member) => {
  emit('select', member)
  clearSearch()
}

defineExpose({
  focus: () => {
    isOpen.value = true
  }
})
</script>

<style scoped>
.v-popper__popper {
  width: 100%;
}
</style>