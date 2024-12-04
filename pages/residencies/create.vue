<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardPanelContent class="pb-24">
        <UPageHeader title="Create Residency" icon="i-heroicons-plus" />
        <section class="form-section">
          <UCard :ui="{ header: { padding: 'p-4 sm:px-6' }, body: { padding: '' } }" class="min-w-0">
            <template #header>
              <div class="text-lg font-semibold">Create Residency</div>
            </template>
            <ResidencyForm @submit="handleCreateResidencySubmit" />
          </UCard>
        </section>
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<script setup lang="ts">


import ResidencyForm from '~/components/ResidencyForm.vue'
import { useResidenciesData } from '~/composables/useResidenciesData'

const toast = useToast()
const { refresh } = useResidenciesData()

const handleCreateResidencySubmit = async (formData) => {
  try {
    const response = await $fetch('/api/residencies/create', {
      method: 'POST',
      body: formData,
    });

    if (response.success) {
      await refresh();
      toast.add({
        icon: 'i-heroicons-check-badge',
        title: 'Success',
        description: 'Residency created successfully',
        color: 'green',
      });
    } else {
      throw new Error(response.message || 'Failed to create residency');
    }
  } catch (e) {
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: 'Error',
      description: 'Failed to create residency',
      color: 'red',
    });
  }
};
</script>