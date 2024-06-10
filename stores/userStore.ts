import { defineStore, createPinia, setActivePinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export default { store: setActivePinia(pinia) };

export const useUserStore = defineStore("userStore", {
  state: () => ({
    userInfo: {},
  }),
  actions: {
    setUser(userData) {
      console.log("Updating user store with:", userData);
      this.userInfo = userData; // Assuming userInfo expects an object
      console.log("Updated user store:", this.userInfo);
    },
  },
  getters: {
    getUserInfo: (state) => state.userInfo,
    getUserId: (state) => state.userInfo._id,
  },
  persist: true,
});
