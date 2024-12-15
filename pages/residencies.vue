<script setup lang="ts">
const links = [[{
  label: 'All Residencies',
  icon: 'i-heroicons-home',
  to: '/residencies',
  exact: true
}, {
  label: 'Create New',
  icon: 'i-heroicons-plus',
  to: '/residencies/new'
}]]
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="Residencies" />

      <UDashboardToolbar class="py-0 px-1.5 overflow-x-auto">
        <UHorizontalNavigation :links="links" />
      </UDashboardToolbar>

      <NuxtPage />
    </UDashboardPanel>
  </UDashboardPage>
</template>