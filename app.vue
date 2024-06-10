<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";
const authStore = useAuthStore();
const userStore = useUserStore();
const emit = defineEmits(['onLogin', 'onRegister', 'onError'])
const { authModal } = useAuthModal();


const colorMode = useColorMode();
const {
  loggedIn,
  user,
  clear,
  onLogin,
  onRegister,
  onSignOut,
  onError,

} = useAuth();
const toast = useToast();
const router = useRouter();

const color = computed(() =>
  colorMode.value === "dark" ? "#111827" : "white"
);

watchEffect(() => {
  if (

    authStore.needsRegistration
  ) {
    authModal.value = true;
  }
});

watch(
  loggedIn,
  (newValue) => {
    authModal.value = !newValue;
  },
  { immediate: true }
);

useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { key: "theme-color", name: "theme-color", content: color },
  ],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: {
    lang: "en",
  },
});

</script>

<template>
  <div>
    <NuxtLoadingIndicator />


    <template v-if="loggedIn">
      <NuxtLayout>
        <NuxtPage @open-login="authModal = true" />
        <UNotifications />
        <UModals />
        <Teleport to="body">
          <UNotifications />
        </Teleport>
      </NuxtLayout>
    </template>
    <template v-else>
      <NuxtLayout>
        <UModal v-model="authModal" prevent-close fullscreen class="mx-auto">
          <Auth @onLogin="onLogin" @onRegister="onRegister" @onError="onError" />
        </UModal>
      </NuxtLayout>
    </template>

  </div>
</template>
