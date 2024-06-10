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

  async function clear() {
    console.log("Clearing user session...");
    const teamStore = useTeamStore();
    const userStore = useUserStore();
    const preferences = {
      currentTeam: teamStore.currentTeam,
      lastDiagram: null,
    };

    const savePreferences = async () => {
      try {
        const response = await $fetch(
          `/api/users/${userStore.getUserInfo._id}/preferences/save`,
          {
            method: "POST",
            body: JSON.stringify(preferences),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Preferences saved successfully:", response);
      } catch (error) {
        console.error("Error saving preferences:", error);
      }
    };
    await savePreferences();
    await $fetch("/api/auth/logout", { method: "DELETE" });
    sessionState.value = {};
    loggedIn.value = false;
    user.value = null;
    teamStore.reset();
  }

  async function onLogin(userData) {
    try {
      authModal.value = false;
      loggedIn.value = true;
      user.value = userData;

      const userStore = useUserStore();
      userStore.setUser(userData);

      const teamStore = useTeamStore();
      await teamStore.fetchUserTeams();

      toast.add({
        title: "Logged In",
        icon: "i-ph-sign-in",
        description: `${userData.name} logged in successfully.`,
      });

      await initializePreferences(userData);
    } catch (error) {
      onError(error);
    }
  }

  async function initializePreferences(userData) {
    const teamStore = useTeamStore();

    // Make sure userData and its preferences are defined
    if (!userData || !userData.preferences) {
      console.error("User data or preferences are undefined");
      return;
    }

    try {
      if (userData.preferences.currentTeam) {
        teamStore.selectTeam(userData.preferences.currentTeam);
      } else {
        await teamStore.fetchUserTeams();
        if (teamStore.userTeams.length > 0) {
          console.log(
            "Setting current team to the first team in the list:",
            teamStore.userTeams[0].name
          );
          // the following line is not working
          console.log(
            "about to select team because nothing is in the database",
            teamStore.userTeams[0]
          );
          teamStore.selectTeam(teamStore.userTeams[0]._id);
        } else {
          console.log("No teams found for the user.");
        }
      }
    } catch (error) {
      console.error("Error initializing user and team preferences:", error);
    }
  }

  async function onRegister(registeredUser) {
    try {
      authModal.value = false;
      authStore.showAuthModal = false;
      loggedIn.value = true;
      user.value = registeredUser;
      const userStore = useUserStore();
      userStore.setUser(registeredUser);
      console.log("registeredUser", registeredUser);
      // Fetch user profile to ensure preferences are available

      //actually the data i need is on the user object in the database
      //so i need to fetch that data

      await initializePreferences(registeredUser);

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

  function onSignOut() {
    clear();
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
      const userSessionState = useUserSessionState();
      const requestFetch = useRequestFetch();
      userSessionState.value = await requestFetch("/api/auth/me", {
        headers: {
          Accept: "text/json",
        },
      });
    } catch (error) {
      onError(error);
    }
  }
  async function fetchUserProfile() {
    console.log("Fetching user profile...");
    try {
      const profile = await $fetch("/api/users/profile");
      sessionState.value = { ...sessionState.value, ...profile };
      console.log("sessionState.value", sessionState.value);
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
    initializePreferences,
  };
}
