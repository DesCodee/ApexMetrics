import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile } from './appEngine';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const logEvent = (eventName: string, eventParams?: any) => {
    // Firebase Analytics is not provisioned in this environment (prevents 404 config fetch error).
    // Logging to console for MVP tracking:
    console.log(`[Analytics] ${eventName}`, eventParams || '');
};

// Custom auth object to satisfy existing codebase dependencies
export const auth = {
    currentUser: null as { uid: string } | null
};

// Initialize user using Telegram ID (Bypassing Firebase Auth entirely)
export const initFirebaseUser = async () => {
    return new Promise((resolve) => {
        const tg = (window as any).Telegram?.WebApp;
        const tgUser = tg?.initDataUnsafe?.user;
        
        // Use Telegram ID if available, otherwise a fallback ID for local testing
        const uid = tgUser?.id ? String(tgUser.id) : 'dev_athlete_123';
        
        auth.currentUser = { uid };
        resolve(auth.currentUser);
    });
};

export const saveUserProfile = async (profile: UserProfile, userId: string) => {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
        await setDoc(userRef, {
            ...profile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } else {
        await updateDoc(userRef, {
            ...profile,
            updatedAt: serverTimestamp(),
        });
    }
};

export const deleteUserProfile = async (userId: string) => {
    const { deleteDoc, getDocs, collection } = await import('firebase/firestore');
    
    // Wipe workouts subcollection first
    const workoutsSnap = await getDocs(collection(db, 'users', userId, 'workouts'));
    for (const d of workoutsSnap.docs) {
        await deleteDoc(d.ref);
    }
    
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
};

export const saveWorkoutLog = async (userId: string, workout: any) => {
    const workoutRef = doc(db, 'users', userId, 'workouts', workout.id);
    await setDoc(workoutRef, {
        ...workout,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

export const loadWorkoutLogs = async (userId: string): Promise<any[]> => {
    const logsRef = collection(db, 'users', userId, 'workouts');
    const q = query(logsRef, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
};

export const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
        const data = snap.data();
        return {
            weight: data.weight,
            height: data.height,
            age: data.age,
            gender: data.gender,
            activityLevel: data.activityLevel,
            goal: data.goal,
            accessState: data.accessState,
        };
    }
    return null;
};

export const saveDailyStats = async (userId: string, dateStr: string, data: any) => {
    const statsRef = doc(db, 'users', userId, 'daily_stats', dateStr);
    await setDoc(statsRef, {
        ...data,
        updatedAt: serverTimestamp(),
    }, { merge: true });
};

export const loadDailyStats = async (userId: string, dateStr: string): Promise<any | null> => {
    const statsRef = doc(db, 'users', userId, 'daily_stats', dateStr);
    const snap = await getDoc(statsRef);
    return snap.exists() ? snap.data() : null;
};

