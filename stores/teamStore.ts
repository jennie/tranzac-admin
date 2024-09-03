import { defineStore, createPinia, setActivePinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { useUserStore } from "@/stores/userStore";
const userStore = useUserStore();
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export default { store: setActivePinia(pinia) };

export const useTeamStore = defineStore("teamStore", {
  state: () => ({
    currentTeam: null,
    userTeams: [],
  }),
  getters: {
    currentTeamId(state) {
      return state.currentTeam?._id || null;
    },
    hasTeams(state) {
      return state.userTeams.length > 0;
    },
    firstTeam(state) {
      return state.userTeams[0] || null;
    },
  },
  actions: {
    selectTeam(teamId) {
      const foundTeam = this.userTeams.find((team) => team._id === teamId);
      if (foundTeam) {
        this.currentTeam = foundTeam;
      } else {
      }
    },
    addTeam(newTeam) {
      this.userTeams.push(newTeam);
    },

    async fetchTeamsWithMembers() {
      try {
        const teams = await $fetch("/api/teams/");
        const teamMembersPromises = teams.map(async (team) => {
          const teamWithMembers = await $fetch(
            `/api/teams/${team._id}/members`
          );
          return {
            ...team,
            members: [
              { user: teamWithMembers.owner, role: "owner" },
              ...teamWithMembers.members,
            ],
          };
        });
        this.userTeams = await Promise.all(teamMembersPromises);
      } catch (error) {
        console.error("Failed to fetch teams with members:", error);
      }
    },

    reset() {
      this.currentTeam = null; // Reset to null to indicate no team is selected
      this.userTeams = [];
    },
  },
  persist: true,
});
