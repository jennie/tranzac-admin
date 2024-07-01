<script setup lang="ts">
import type { Member } from '~/types';
const { data: members } = await useFetch<Member[]>('/api/members', {
  transform: (members) => {
    return members
      .sort((a, b) => new Date(b.membership.startDate).getTime() - new Date(a.membership.startDate).getTime())
      .slice(0, 5)
      .map(member => ({
        ...member,
        name: `${member.firstName} ${member.lastName}`
      }))
  }
}
);


</script>

<template>
  <UDashboardCard title="New members" description="5 new members joined this month"
    icon="i-heroicons-chart-bar-20-solid">
    <NuxtLink v-for="(member, index) in members" :key="index"
      class="px-3 py-2 -mx-2 last:-mb-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer flex items-center gap-3 relative">
      <UAvatar :src="`https://unavatar.io/gravatar/${member.email}`" class="bg-gray-200 dark:bg-neutral-800 mr-2" />
      <div class="text-sm flex-1">
        <div>
          <p class="text-gray-900 dark:text-white font-medium">
            {{ member.name }}
          </p>
          <p class="text-gray-500 dark:text-gray-400">
            {{ member.email }}
          </p>
        </div>
      </div>
      <!-- 
      <p class="text-gray-900 dark:text-white font-medium text-lg">
        {{ formatNumber(member.price) }}
      </p> -->
    </NuxtLink>
  </UDashboardCard>
</template>
