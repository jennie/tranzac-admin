<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/composables/useAuth";
import { useRouter } from 'vue-router';
import { ref, watch, watchEffect } from 'vue';
import { useRuntimeConfig } from '#app';

const authStore = useAuthStore();
const { me, user, onLogin, register } = useAuth(); // include register here
const emit = defineEmits(["onLogin", "onRegister", "onError"]);
const router = useRouter();
const errorMessage = ref('');
const isRegistering = ref(false); // state to toggle between forms

const toggleAuthMode = () => {
  isRegistering.value = !isRegistering.value;
};

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
    authStore.showAuthModal = false;

  } catch (error) {
    errorMessage.value = error?.message || "An unexpected error occurred";
  }
}

const onSubmit = async (state: AuthFormState) => {
  console.log('Submitting login form:', state);
  try {
    await login(state);
  } catch (error) {
    errorMessage.value = error?.message || "An unexpected error occurred";
  }
};

const fields = [
  {
    name: 'email',
    type: 'text',
    label: 'Email',
    placeholder: 'Enter your email'
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password'
  }
];

const validate = (state: any) => {
  const errors = [];
  if (!state.email) errors.push({ path: 'email', message: 'Email is required' });
  if (!state.password) errors.push({ path: 'password', message: 'Password is required' });
  return errors;
}

const onRegisterSubmit = async (state: AuthFormState) => {
  console.log('Submitting registration form:', state);
  try {
    await register(state);
  } catch (error) {
    errorMessage.value = error?.message || "An unexpected error occurred";
  }
};

const registrationFields = [
  {
    name: 'name',
    type: 'text',
    label: 'Name',
    placeholder: 'Enter your name'
  },
  {
    name: 'email',
    type: 'text',
    label: 'Email',
    placeholder: 'Enter your email'
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password'
  }
];

const registrationValidate = (state: any) => {
  const errors = [];
  if (!state.name) errors.push({ path: 'name', message: 'Name is required' });
  if (!state.email) errors.push({ path: 'email', message: 'Email is required' });
  if (!state.password) errors.push({ path: 'password', message: 'Password is required' });
  return errors;
}

</script>

<template>
  <div class="mx-auto h-full w-full flex justify-center items-center">
    <UCard class="max-w-sm w-full bg-white/75 dark:bg-white/5 backdrop-blur">
      <template v-if="isRegistering">
        <!-- Registration Form -->
        <UAuthForm :fields="registrationFields" :validate="registrationValidate" title="Register for Tranzac admin!"
          align="top" icon="i-heroicons-user-add" :ui="{ base: 'text-center', footer: 'text-center' }"
          @submit="onRegisterSubmit">
          <template #description>
            Register to gain access to rental requests & member details.
          </template>
          <template #validation>
            <UAlert color="red" icon="i-heroicons-information-circle-20-solid" title="Error signing up"
              v-if="errorMessage" :description="errorMessage" />
          </template>
          <template #footer>
            <!-- Switch to Login Form -->
            <button @click.prevent="toggleAuthMode" class="text-primary font-medium">
              Already have an account? Log in
            </button>
          </template>
        </UAuthForm>
      </template>
      <template v-else>
        <!-- Login Form -->
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
          <template #footer>
            <!-- Switch to Registration Form -->
            <button @click.prevent="toggleAuthMode" class="text-primary font-medium">
              Don't have an account? Register
            </button>
          </template>
        </UAuthForm>
      </template>
    </UCard>
  </div>


</template>
