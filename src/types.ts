export interface UserProfile {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  sets: number;
  reps: string; // e.g. "8-12"
  lastWeight: number; // kg
}

export interface WorkoutSession {
  id: string;
  date: string;
  readinessScore: number;
  exercises: ExerciseLog[];
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

export interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export type Tab = 'dashboard' | 'workout' | 'analytics' | 'vip';
