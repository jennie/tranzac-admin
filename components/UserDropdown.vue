<script setup lang="ts">
const { isHelpSlideoverOpen } = useDashboard();
const { isDashboardSearchModalOpen } = useUIState();
const { metaSymbol } = useShortcuts();
const toast = useToast();

const { authModal } = useAuthModal();
const { loggedIn, user, onLogin, onRegister, onSignOut, onError } = useAuth();

const items = computed(() => [
  [
    {
      slot: "account",
      label: "",
      disabled: true,
    },
  ],
  [
    {
      label: "Settings",
      icon: "i-heroicons-cog-8-tooth",
      to: "/settings",
    },
    {
      label: "Command menu",
      icon: "i-heroicons-command-line",
      shortcuts: [metaSymbol.value, "K"],
      click: () => {
        isDashboardSearchModalOpen.value = true;
      },
    },
    {
      label: "Help & Support",
      icon: "i-heroicons-question-mark-circle",
      shortcuts: ["?"],
      click: () => (isHelpSlideoverOpen.value = true),
    },
  ],
  [
    {
      label: "Sign out",
      icon: "i-heroicons-arrow-left-on-rectangle",
      click: () => {
        onSignOut();
      },
    },
  ],
]);
</script>

<template>
  <UDropdown v-if="loggedIn" :items="items" mode="hover">
    <UAvatar :src="`https://unavatar.io/gravatar/${user.email}`" class="bg-gray-200 dark:bg-neutral-800" />

    <template #account>
      <div class="text-left w-full">
        <p>Signed in as</p>
        <p class="truncate font-medium">
          {{ user.email }}
        </p>
      </div>
    </template>
  </UDropdown>

  <UButton v-else color="gray" @click="authModal = true"> Login </UButton>
</template>
