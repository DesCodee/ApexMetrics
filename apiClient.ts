import { UserProfile, WorkoutLog } from "./appEngine";

export const apiClient = {
  async getUser(tgId: string): Promise<UserProfile | null> {
    const res = await fetch(`/api/user/${tgId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
  },

  async saveUser(tgId: string, profile: UserProfile): Promise<void> {
    const res = await fetch(`/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tgId, profile }),
    });
    if (!res.ok) throw new Error("Failed to save user");
  },

  async generateProgram(profile: UserProfile): Promise<any> {
    const res = await fetch(`/api/generate-program`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });
    if (!res.ok) throw new Error("Failed to generate program");
    return res.json();
  },

  async logWorkout(tgId: string, workout: WorkoutLog): Promise<void> {
    const res = await fetch(`/api/workouts/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tgId, workout }),
    });
    if (!res.ok) throw new Error("Failed to log workout");
  },

  async getWorkouts(tgId: string): Promise<WorkoutLog[]> {
    const res = await fetch(`/api/workouts/${tgId}`);
    if (!res.ok) throw new Error("Failed to fetch workouts");
    return res.json();
  },
};
