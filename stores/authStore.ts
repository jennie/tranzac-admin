import { defineStore, createPinia, setActivePinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export default { store: setActivePinia(pinia) };

// authStore.ts
export const useAuthStore = defineStore("authStore", {
  state: () => ({
    showAuthModal: false,
    needsRegistration: false,
    teamName: "",
    teamId: "",
    invitationEmail: "",
    invitationToken: "",
    registeredUser: null,
  }),
  actions: {
    setInvitationDetails(email, token, teamName, teamId, needsRegistration) {
      this.needsRegistration = needsRegistration;
      this.invitationEmail = email;
      this.invitationToken = token;
      this.teamName = teamName;
      this.teamId = teamId;
      this.showAuthModal = true;
    },
    resetInvitationDetails() {
      this.showAuthModal = false;
      this.needsRegistration = false;
      this.teamName = "";
      this.teamId = "";
      this.invitationEmail = "";
      this.invitationToken = "";
    },
    registerUser(user) {
      this.registeredUser = user;
      this.showAuthModal = false; // Assuming registration is successful, hide the modal
    },
  },
});
