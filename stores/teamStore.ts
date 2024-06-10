import { defineStore, createPinia, setActivePinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

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

    async fetchUserTeams() {
      const userStore = useUserStore();
      const userId = userStore.getUserId;

      if (!userId) {
        console.error("User ID is not available");
        return;
      }

      try {
        // Adjust the endpoint if needed to include the userId in the request
        const teams = await $fetch("/api/teams/");
        teams.value = teams;

        if (teams.length > 0) {
          this.userTeams = teams;
          this.selectTeam(teams[0]);
        } else {
          console.log("No teams found for the user:", userId);
        }
      } catch (error) {
        console.error("Error fetching user teams for userId:", userId, error);
      }
    },

    reset() {
      this.currentTeam = null; // Reset to null to indicate no team is selected
      this.userTeams = [];
    },
  },
  persist: true,
});
