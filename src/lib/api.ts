import { doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';

export interface DbUser {
  uid: string;
  telegramId: string;
  username: string;
  weight: number;
  goal?: string;
  experience?: string;
  onboardingCompleted?: boolean;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  exercises: {
    id: string;
    name: string;
    target: string;
    defaultSets: number;
    defaultReps: number | 'max';
  }[];
}

export interface WorkoutSession {
  id: string;
  userId: string;
  templateId: string;
  name: string;
  date: any;
  completed: boolean;
  totalTonnage: number;
  exercises: {
    id: string;
    name: string;
    target: string;
    sets: { weight: number; reps: number; completed: boolean }[];
  }[];
}

export function initAuth(tgUser: any, onUserLoaded: (user: DbUser | null, error?: string) => void) {
  // Пропускаем Firebase Auth (так как нет доступа к консоли для включения Anonymous)
  // В качестве uid используем ID из Telegram напрямую.
  const mockAuthAsync = async () => {
    if (!tgUser || !tgUser.id) {
      onUserLoaded(null, "Нет данных пользователя Telegram");
      return;
    }
    try {
      const uid = String(tgUser.id);
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      let userData;
      if (!userSnap.exists()) {
        userData = {
          telegramId: String(tgUser.id),
          username: tgUser.username || '',
          weight: 75,
          onboardingCompleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(userRef, userData);
        onUserLoaded({ uid, ...userData } as DbUser);
      } else {
        userData = userSnap.data();
        onUserLoaded({ uid, ...userData } as DbUser);
      }
    } catch (err: any) {
      console.error('Firebase DB Error:', err);
      onUserLoaded(null, err.message);
    }
  };

  mockAuthAsync();
  
  // Возвращаем пустую функцию отписки, так как больше не слушаем onAuthStateChanged
  return () => {};
}

export async function getTemplates(uid: string): Promise<WorkoutTemplate[]> {
  const q = query(collection(db, 'workoutTemplates'), where('userId', 'in', ['system', uid]));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutTemplate));
}

export async function saveSession(session: Omit<WorkoutSession, 'id'>) {
  const docRef = await addDoc(collection(db, 'workoutSessions'), session);
  return docRef.id;
}

export async function getRecentSessions(uid: string): Promise<WorkoutSession[]> {
  const q = query(collection(db, 'workoutSessions'), where('userId', '==', uid), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutSession));
}

export async function updateWeight(uid: string, newWeight: number) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { weight: newWeight, updatedAt: serverTimestamp() });
}

export async function completeOnboarding(uid: string, profileData: { goal: string; experience: string; weight: number }) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    weight: profileData.weight,
    goal: profileData.goal,
    experience: profileData.experience,
    onboardingCompleted: true,
    updatedAt: serverTimestamp()
  });

  // Fetch custom workout plan from Gemini via our backend
  const res = await fetch("/api/gemini/generate-workout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData)
  });

  if (!res.ok) {
    throw new Error("Failed to generate plan");
  }

  const data = await res.json();
  const exercises = data.exercises || [];

  const templateName = `Персональный план (${profileData.goal === 'mass' ? 'Масса' : profileData.goal === 'cut' ? 'Рельеф' : 'Тонус'})`;

  await addDoc(collection(db, 'workoutTemplates'), {
    userId: uid,
    name: templateName,
    createdAt: serverTimestamp(),
    exercises
  });
}
