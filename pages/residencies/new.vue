<template>

  <UDashboardPanelContent>
    <ResidencyForm @submit="handleSubmit" />
  </UDashboardPanelContent>


</template>

<script setup lang="ts">
const router = useRouter()
const toast = useToast()

const handleSubmit = async (result) => {
  if (result.success) {
    toast.add({
      icon: 'i-heroicons-check-badge',
      title: 'Success',
      description: 'Residency created successfully',
      color: 'green'
    })
    router.push('/residencies')
  }
}

// Add route meta
definePageMeta({
  layout: 'default'
})
</script>
