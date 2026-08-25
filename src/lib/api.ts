import { doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface DbUser {
  uid: string;
  telegramId: string;
  username: string;
  weight: number;
  height?: number;
  age?: number;
  activityLevel?: number;
  goal?: 'hard' | 'lean';
  onboardingCompleted?: boolean;
  isVip?: boolean;
}

export function initAuth(tgUser: any, onUserLoaded: (user: DbUser | null, error?: string) => void) {
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
          isVip: false,
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
  return () => {};
}

export async function completeOnboarding(uid: string, profileData: { weight: number, height: number, age: number, activityLevel: number, goal: 'hard' | 'lean' }) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...profileData,
    onboardingCompleted: true,
    updatedAt: serverTimestamp()
  });
}

export async function upgradeToVip(uid: string) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    isVip: true,
    updatedAt: serverTimestamp()
  });
}

export async function saveCustomTemplate(uid: string, name: string, exercises: any[]) {
  const docRef = await addDoc(collection(db, 'workoutTemplates'), {
    userId: uid,
    name,
    exercises,
    createdAt: serverTimestamp()
  });
  return { id: docRef.id, name, exercises };
}

export async function getUserTemplates(uid: string) {
  const q = query(collection(db, 'workoutTemplates'), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveWorkoutSession(uid: string, workout: any[], totalTonnage: number) {
  const docRef = await addDoc(collection(db, 'workoutSessions'), {
    userId: uid,
    exercises: workout,
    totalTonnage,
    date: new Date().toISOString(),
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function getWorkoutHistory(uid: string) {
  const q = query(
    collection(db, 'workoutSessions'),
    where('userId', '==', uid)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return docs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function saveDailyStats(uid: string, stats: { cals: number, waterMl: number, protein?: number, carbs?: number, fats?: number }) {
  const dateStr = new Date().toISOString().split('T')[0];
  const q = query(collection(db, 'dailyStats'), where('userId', '==', uid), where('date', '==', dateStr));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    await addDoc(collection(db, 'dailyStats'), {
      userId: uid,
      date: dateStr,
      ...stats,
      updatedAt: serverTimestamp()
    });
  } else {
    const docRef = doc(db, 'dailyStats', snap.docs[0].id);
    await updateDoc(docRef, {
      ...stats,
      updatedAt: serverTimestamp()
    });
  }
}

export async function getDailyStats(uid: string) {
  const dateStr = new Date().toISOString().split('T')[0];
  const q = query(collection(db, 'dailyStats'), where('userId', '==', uid), where('date', '==', dateStr));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].data();
  }
  return null;
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
}

export async function toggleUserVipAdmin(uid: string, isVip: boolean) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { isVip, updatedAt: serverTimestamp() });
}

export async function getGlobalStats() {
  const sessionsSnap = await getDocs(collection(db, 'workoutSessions'));
  let totalTonnage = 0;
  let totalWorkouts = sessionsSnap.docs.length;
  
  sessionsSnap.forEach(doc => {
    totalTonnage += (doc.data().totalTonnage || 0);
  });
  
  return {
    totalTonnage,
    totalWorkouts
  };
}
