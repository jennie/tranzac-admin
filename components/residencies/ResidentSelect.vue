<!-- // components/residencies/ResidentSelect.vue -->
<template>
  <div>
    <div class="relative">
      <UInput v-model="search" placeholder="Search residents..." :loading="isLoading" />
      <div v-if="residents.length"
        class="absolute w-full bg-white border mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
        <div v-if="!matchingResident" class="p-2 hover:bg-gray-100 cursor-pointer" @click="handleCreate(search)">
          <div>Create new member: "{{ search }}"</div>
        </div>
        <div v-for="resident in residents" :key="resident.value" class="p-2 hover:bg-gray-100 cursor-pointer"
          @click="selectResident(resident)">
          <div>{{ resident.label }}</div>
          <div class="text-sm text-gray-500">{{ resident.email }}</div>
        </div>
      </div>
    </div>

    <UModal v-model="showCreateModal">
      <UCard>
        <template #header>Create New Member</template>
        <form @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <UFormGroup label="First Name" required>
              <UInput v-model="newMember.firstName" />
            </UFormGroup>
            <UFormGroup label="Last Name" required>
              <UInput v-model="newMember.lastName" />
            </UFormGroup>
            <UFormGroup label="Email" required>
              <UInput v-model="newMember.email" type="email" />
            </UFormGroup>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <UButton color="gray" @click="showCreateModal = false">Cancel</UButton>
            <UButton type="submit" color="primary" :loading="isCreating">Create</UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
const search = ref('')
const isLoading = ref(false)
const residents = ref([])
const showCreateModal = ref(false)
const isCreating = ref(false)
const emit = defineEmits(['select'])

const newMember = ref({
  firstName: '',
  lastName: '',
  email: ''
})

const selectResident = (resident) => {
  emit('select', resident)
  search.value = ''
  residents.value = []
}

const handleCreate = (input) => {
  showCreateModal.value = true
  const [firstName, lastName] = input.split(' ')
  newMember.value = {
    firstName: firstName || '',
    lastName: lastName || '',
    email: ''
  }
}

const handleSubmit = async () => {
  if (!newMember.value.firstName || !newMember.value.lastName || !newMember.value.email) return

  isCreating.value = true
  try {
    const member = await $fetch('/api/members', {
      method: 'POST',
      body: newMember.value
    })

    const newOption = {
      value: member._id,
      label: `${member.firstName} ${member.lastName}`,
      email: member.email
    }

    selectResident(newOption)
    showCreateModal.value = false
    newMember.value = { firstName: '', lastName: '', email: '' }
  } catch (e) {
    console.error(e)
  } finally {
    isCreating.value = false
  }
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