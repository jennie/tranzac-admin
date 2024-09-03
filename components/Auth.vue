<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/composables/useAuth";  // Moved to the top
import { useRouter } from 'vue-router';  // Add import for useRouter
import { ref, watch, watchEffect } from 'vue';
import { useRuntimeConfig } from '#app';

const authStore = useAuthStore();
const { me, user, onLogin } = useAuth();
const emit = defineEmits(["onLogin", "onRegister", "onError"]);
const router = useRouter();
const errorMessage = ref('');


watchEffect(() => {
  const query = router.currentRoute.value.query;
  const needsModal = query.token && query.email;
  // authStore.showAuthModal = Boolean(needsModal || authStore.needsRegistration);
});

watch(
  () => authStore.needsRegistration,
  (needsRegistration) => {
    if (needsRegistration) {
      authStore.showAuthModal = true;
    }
  },
  { immediate: true }
);

async function login(loginData) {
  try {
    const data = await $fetch("/api/auth/login", {
      method: "POST",
      body: loginData,
    });

    if (!data) {
      throw new Error("An unexpected error occurred");
    }
    console.log('data:', data);
    me();

    // Hide the modal after successful login
    authStore.showAuthModal = false;  // Ensure this state is controlled by the store

  } catch (error) {
    if (error) {
      errorMessage.value = error.message;
    } else if (error.message) {
      // Extract the actual error message if it contains status information
      const message = error.message;
      const errorCodeIndex = message.lastIndexOf(':');
      errorMessage.value = message.substring(errorCodeIndex + 1).trim();

    } else {
      errorMessage.value = "An unexpected error occurred";
    }
  }
}

const onSubmit = async (state: AuthFormState) => {
  console.log('Submitting login form:', state);
  try {
    await login(state); // This will trigger the onLogin function after successful login
  } catch (error) {
    const message = error.message || "An unexpected error occurred";
    const match = message.match(/: (.*)$/);
    errorMessage.value = match ? match[1] : message;
  }
};

const fields = [{
  name: 'email',
  type: 'text',
  label: 'Email',
  placeholder: 'Enter your email'
}, {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Enter your password'
}];

const validate = (state: any) => {
  const errors = []
  if (!state.email) errors.push({ path: 'email', message: 'Email is required' })
  if (!state.password) errors.push({ path: 'password', message: 'Password is required' })
  return errors;
}

</script>

<template>
  <div class="mx-auto h-full w-full flex justify-center items-center">
    <UCard class="max-w-sm w-full bg-white/75 dark:bg-white/5 backdrop-blur">
      <UAuthForm :fields="fields" :validate="validate" title="Hello, Tranzac admin!" align="top"
        icon="i-heroicons-lock-closed" :ui="{ base: 'text-center', footer: 'text-center' }" @submit="onSubmit">
        <template #description>
          Log in to access rental requests & member details.
        </template>

        <template #password-hint>
          <NuxtLink to="/" class="text-primary font-medium">Forgot password?</NuxtLink>
        </template>
        <template #validation>
          <UAlert color="red" icon="i-heroicons-information-circle-20-solid" title="Error signing in"
            v-if="errorMessage" :description="errorMessage" />
        </template>
      </UAuthForm>
    </UCard>
  </div>
</template>
