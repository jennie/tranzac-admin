import { useTeamStore } from "@/stores/teamStore";
import { useUserStore } from "@/stores/userStore";

export function usePreferences(userProfile) {
  const teamStore = useTeamStore();
  const userStore = useUserStore();

  const initializeUserAndTeam = async () => {
    try {
      if (
        userProfile &&
        userProfile.preferences &&
        userProfile.preferences.currentTeam
      ) {
        teamStore.selectTeam(userProfile.preferences.currentTeam);
      } else {
        const teams = await teamStore.fetchUserTeams();
        if (teams && teams.length > 0) {
          teamStore.selectTeam(teams[0]._id);
        }
      }
    } catch (error) {
      console.error("Error initializing user and team:", error);
    }
  };

  return { initializeUserAndTeam };
}
