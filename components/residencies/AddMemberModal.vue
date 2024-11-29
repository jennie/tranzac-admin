<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>
        <div class="text-lg font-semibold">Add New Member</div>
      </template>

      <UForm :state="state" @submit="handleSubmit">
        <div class="space-y-4">
          <UFormGroup label="First Name" name="firstName" :ui="{ label: 'font-medium' }">
            <UInput v-model="state.firstName" placeholder="Enter first name" />
          </UFormGroup>

          <UFormGroup label="Last Name" name="lastName" :ui="{ label: 'font-medium' }">
            <UInput v-model="state.lastName" placeholder="Enter last name" />
          </UFormGroup>

          <UFormGroup label="Email" name="email" :ui="{ label: 'font-medium' }">
            <UInput v-model="state.email" type="email" placeholder="Enter email address" />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton color="gray" variant="soft" @click="close">
              Cancel
            </UButton>
            <UButton type="submit" color="primary">
              Create Member
            </UButton>
          </div>
        </template>
      </UForm>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  initialName?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [{ firstName: string, lastName: string, email: string }]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const state = reactive({
  firstName: '',
  lastName: '',
  email: ''
})

watch(() => props.initialName, (newName) => {
  if (newName) {
    const names = newName.split(' ')
    state.firstName = names[0] || ''
    state.lastName = names.slice(1).join(' ') || ''
  }
}, { immediate: true })

const handleSubmit = () => {
  emit('submit', {
    firstName: state.firstName,
    lastName: state.lastName,
    email: state.email
  })
  close()
}

const close = () => {
  isOpen.value = false
  state.firstName = ''
  state.lastName = ''
  state.email = ''
}
</script>