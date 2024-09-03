import type { AuthPayload } from "~/types";
import { useAuthStore } from "@/stores/authStore";
import { useTeamStore } from "@/stores/teamStore";
import { useUserStore } from "@/stores/userStore";

const authStore = useAuthStore();
const teamStore = useTeamStore();
const userStore = useUserStore();

const useUserSessionState = () =>
  useState<AuthPayload>("nuxt-mongoose-auth", () => ({}));

export function useAuth() {
  const sessionState = useUserSessionState();
  const toast = useToast();
  const loggedIn = ref(false);
  const user = ref(null);
  const authModal = ref(false); // Define authModal
  // console.log("Initializing useAuth. Session State:", sessionState);

  async function clear() {
    console.log("Clearing user session...");
    const userStore = useUserStore();

    // await savePreferences();
    await $fetch("/api/auth/logout", { method: "DELETE" });
    sessionState.value = {};
    loggedIn.value = false;
    user.value = null;
    teamStore.reset();
  }

  async function onLogin(userData) {
    try {
      console.log("onLogin triggered with user data:", userData);

      const token = userData.token;

      if (!token) {
        console.warn("No token found in userData:", userData);
      }

      authStore.showAuthModal = false;

      loggedIn.value = true;
      user.value = userData;

      const userStore = useUserStore();
      userStore.setUser(userData);

      sessionState.value = {
        ...sessionState.value,
        token,
        _id: userData._id.toString(), // Ensure _id is included
        email: userData.email,
      };

      // Ensure _id is preserved if me() is called after this
      await me(); // You may call me() here to merge additional data if necessary

      toast.add({
        title: "Logged In",
        icon: "i-ph-sign-in",
        description: `${userData.name} logged in successfully.`,
      });
    } catch (error) {
      console.error("Error during onLogin:", error);
      onError(error);
    }
  }

  async function onRegister(registeredUser) {
    try {
      authStore.showAuthModal = false;
      authStore.showAuthModal = false;
      loggedIn.value = true;
      user.value = registeredUser;

      const userStore = useUserStore();
      userStore.setUser(registeredUser);

      // Include the user ID in the session state
      sessionState.value = { ...sessionState.value, _id: registeredUser._id };

      //       console.log("registeredUser", registeredUser);

      navigateTo("/");
      toast.add({
        title: "Registered",
        icon: "i-ph-sign-in",
        description: `${
          registeredUser.name || registeredUser.email
        } registered successfully.`,
      });
    } catch (error) {
      onError(error);
    }
  }

  async function onSignOut() {
    await clear();
    toast.add({
      title: "Signed out",
      icon: "i-ph-sign-in",
      description: `You've been signed out.`,
    });
  }

  function onError(error: H3Error) {
    const statusCode = error?.statusCode || "Unknown status code";
    const statusMessage = error?.statusMessage || "Unknown error";
    toast.add({
      title: `Error ${error}`,
      icon: "i-ph-warning-duotone",
      description: statusMessage,
    });
  }
  async function me() {
    try {
      const sessionState = useUserSessionState();
      const requestFetch = useRequestFetch();
      const fetchedData = await requestFetch("/api/auth/me", {
        headers: {
          Accept: "text/json",
        },
      });

      // Merge the fetched data with the existing session state, ensuring _id is not overwritten
      sessionState.value = {
        ...sessionState.value,
        ...fetchedData,
        _id: sessionState.value._id || fetchedData._id, // Ensure _id is preserved
      };

      console.log("sessionState.value after me():", sessionState.value);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      onError(error);
    }
  }

  async function fetchUserProfile() {
    //     console.log("Fetching user profile...");
    try {
      const profile = await $fetch("/api/users/profile");
      sessionState.value = { ...sessionState.value, ...profile };

      // Ensure the user ID is included in the session state
      sessionState.value = { ...sessionState.value, _id: profile._id };

      //       console.log("sessionState.value", sessionState.value);
    } catch (error) {
      console.error("Fetch profile error:", error);
      toast.add({
        title: "Failed to load profile",
        icon: "i-heroicons-x-circle",
        description: "An error occurred while fetching the user profile.",
      });
    }
  }

  return {
    loggedIn: computed(() => Boolean(sessionState.value?.email)),
    user: computed(() => sessionState.value || null),
    me,
    onLogin,
    authModal,
    onRegister,
    onSignOut,
    onError,
    clear,
    fetchUserProfile,
  };
}
