<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";
const authStore = useAuthStore();
const userStore = useUserStore();
const emit = defineEmits(['onLogin', 'onRegister', 'onError'])


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



watchEffect(() => {
  if (
    authStore.needsRegistration
  ) {
    authStore.showAuthModal = true;
  }
});



watch(
  loggedIn,
  (newValue) => {
    // console.log("loggedIn changed:", newValue);
    authStore.showAuthModal = !newValue;
  },
  { immediate: true }
);



useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
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
        <NuxtPage @open-login="authStore.showAuthModal = true" />
        <UNotifications />
        <UModals />
        <Teleport to="body">
          <UNotifications />
        </Teleport>
      </NuxtLayout>
    </template>
    <template v-else>
      <NuxtLayout>
        <UModal v-if="!loggedIn" v-model="authStore.showAuthModal" prevent-close fullscreen class="mx-auto">
          <Auth @onLogin="onLogin" @onRegister="onRegister" @onError="onError" />
        </UModal>
        <Teleport to="body">
          <UNotifications />
        </Teleport>
      </NuxtLayout>
    </template>

  </div>
</template>
