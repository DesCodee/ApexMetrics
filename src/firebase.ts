import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    setLogLevel,
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    updateDoc, 
    serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile } from './appEngine';

// Suppress network connectivity warnings in iframe/sandboxed environments
setLogLevel('error');

const app = initializeApp(firebaseConfig);

// Initialize Firestore with database ID from configuration as required
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
}

// Utility to ensure network calls never freeze the UI if Firestore backend is unreachable
const withTimeout = async <T>(promise: Promise<T>, timeoutMs = 2500): Promise<T> => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Firestore query timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        promise
            .then(res => {
                clearTimeout(timer);
                resolve(res);
            })
            .catch(err => {
                clearTimeout(timer);
                reject(err);
            });
    });
};

export const logEvent = (eventName: string, eventParams?: any) => {
    // Firebase Analytics is not provisioned in this environment (prevents 404 config fetch error).
    // Logging to console for MVP tracking:
    console.log(`[Analytics] ${eventName}`, eventParams || '');
};

const getInitialUid = () => {
    try {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.initDataUnsafe?.user?.id) return String(tg.initDataUnsafe.user.id);
    } catch {}
    return 'dev_athlete_123';
};

// Custom auth object to satisfy existing codebase dependencies
export const auth = {
    currentUser: { uid: getInitialUid() } as { uid: string } | null
};

// Initialize user using Telegram ID (Bypassing Firebase Auth entirely)
export const initFirebaseUser = async () => {
    return new Promise((resolve) => {
        const uid = getInitialUid();
        auth.currentUser = { uid };
        resolve(auth.currentUser);
    });
};

export const saveUserProfile = async (profile: UserProfile, userId: string) => {
    try {
        localStorage.setItem(`apex_profile_${userId}`, JSON.stringify(profile));
        const userRef = doc(db, 'users', userId);
        const snap = await withTimeout(getDoc(userRef), 2500);
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
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${userId}`);
    }
};

export const deleteUserProfile = async (userId: string) => {
    try {
        localStorage.removeItem(`apex_profile_${userId}`);
        localStorage.removeItem(`apex_workouts_${userId}`);
        const { deleteDoc, getDocs, collection } = await import('firebase/firestore');
        
        // Wipe workouts subcollection first
        const workoutsSnap = await withTimeout(getDocs(collection(db, 'users', userId, 'workouts')), 2500);
        for (const d of workoutsSnap.docs) {
            await deleteDoc(d.ref);
        }
        
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
    } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${userId}`);
    }
};

export const saveWorkoutLog = async (userId: string, workout: any) => {
    let existingWorkout: any = null;
    try {
        const cached = localStorage.getItem(`apex_workouts_${userId}`);
        const list = cached ? JSON.parse(cached) : [];
        existingWorkout = list.find((w: any) => w.id === workout.id);
        const filtered = list.filter((w: any) => w.id !== workout.id);
        filtered.push(workout);
        localStorage.setItem(`apex_workouts_${userId}`, JSON.stringify(filtered));
    } catch (err) {
        console.warn('Local cache error for workout', err);
    }

    try {
        const workoutRef = doc(db, 'users', userId, 'workouts', workout.id);
        const payload: any = {
            ...workout,
            userId,
            updatedAt: serverTimestamp(),
        };
        // Preserve initial createdAt if document already existed
        if (!existingWorkout && !workout.createdAt) {
            payload.createdAt = serverTimestamp();
        }
        await setDoc(workoutRef, payload, { merge: true });
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${userId}/workouts/${workout.id}`);
    }
};

export const loadWorkoutLogs = async (userId: string): Promise<any[]> => {
    const cached = localStorage.getItem(`apex_workouts_${userId}`);
    let cachedList: any[] = [];
    if (cached) {
        try {
            cachedList = JSON.parse(cached);
        } catch {
            cachedList = [];
        }
    }

    // Trigger background or foreground fetch
    const fetchRemote = async () => {
        try {
            const logsRef = collection(db, 'users', userId, 'workouts');
            const q = query(logsRef, orderBy('createdAt', 'asc'));
            const snap = await withTimeout(getDocs(q), 2000);
            const items = snap.docs.map(d => d.data());
            if (items.length > 0) {
                localStorage.setItem(`apex_workouts_${userId}`, JSON.stringify(items));
                return items;
            }
        } catch (e) {
            handleFirestoreError(e, OperationType.LIST, `users/${userId}/workouts`);
        }
        return null;
    };

    // If we have cached workouts, return immediately (0ms lag) and revalidate in background
    if (cachedList.length > 0) {
        fetchRemote(); // fire and forget in background
        return cachedList;
    }

    // Otherwise wait for remote or fallback to empty
    const remote = await fetchRemote();
    return remote || [];
};

export const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const cached = localStorage.getItem(`apex_profile_${userId}`);
    let localProfile: UserProfile | null = null;
    if (cached) {
        try {
            localProfile = JSON.parse(cached);
        } catch {
            localProfile = null;
        }
    }

    const fetchRemote = async (): Promise<UserProfile | null> => {
        try {
            const userRef = doc(db, 'users', userId);
            const snap = await withTimeout(getDoc(userRef), 2000);
            if (snap.exists()) {
                const data = snap.data();
                const profile: UserProfile = {
                    weight: Number(data.weight) || 75,
                    height: Number(data.height) || 178,
                    age: Number(data.age) || 25,
                    gender: (data.gender === 'F' || data.gender === 'female' ? 'F' : 'M'),
                    activityLevel: data.activityLevel || 'moderate',
                    goal: data.goal === 'cut' || data.goal === 'bulk' ? data.goal : 'maintain',
                    accessState: data.accessState || (data.isPro ? 'beta-vip' : 'free'),
                };
                localStorage.setItem(`apex_profile_${userId}`, JSON.stringify(profile));
                return profile;
            }
        } catch (e) {
            handleFirestoreError(e, OperationType.GET, `users/${userId}`);
        }
        return null;
    };

    // Instant return if cached
    if (localProfile) {
        fetchRemote(); // fire and forget
        return localProfile;
    }

    // Otherwise wait with timeout
    return await fetchRemote();
};

export const saveDailyStats = async (userId: string, dateStr: string, data: any) => {
    const cacheKey = `apex_daily_stats_${userId}_${dateStr}`;
    try {
        const existing = localStorage.getItem(cacheKey);
        const merged = existing ? { ...JSON.parse(existing), ...data } : data;
        localStorage.setItem(cacheKey, JSON.stringify(merged));
        const statsRef = doc(db, 'users', userId, 'daily_stats', dateStr);
        await setDoc(statsRef, {
            ...data,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${userId}/daily_stats/${dateStr}`);
    }
};

export const loadDailyStats = async (userId: string, dateStr: string): Promise<any | null> => {
    const cacheKey = `apex_daily_stats_${userId}_${dateStr}`;
    const cached = localStorage.getItem(cacheKey);
    let localData = null;
    if (cached) {
        try {
            localData = JSON.parse(cached);
        } catch {}
    }

    const fetchRemote = async () => {
        try {
            const statsRef = doc(db, 'users', userId, 'daily_stats', dateStr);
            const snap = await withTimeout(getDoc(statsRef), 2000);
            if (snap.exists()) {
                const data = snap.data();
                const existing = localStorage.getItem(cacheKey);
                const merged = existing ? { ...JSON.parse(existing), ...data } : data;
                localStorage.setItem(cacheKey, JSON.stringify(merged));
                return merged;
            }
        } catch (e) {
            handleFirestoreError(e, OperationType.GET, `users/${userId}/daily_stats/${dateStr}`);
        }
        return null;
    };

    if (localData) {
        fetchRemote(); // fire and forget
        return localData;
    }

    return await fetchRemote();
};

export const saveCnsLog = async (userId: string, data: {
    sleep: number;
    soreness: number;
    stress: number;
    hrDeviation?: number;
    score: number;
    status: string;
    recommendation?: string;
}) => {
    const todayStr = new Date().toISOString().split('T')[0];
    await saveDailyStats(userId, todayStr, {
        cnsScore: data.score,
        cnsStatus: data.status,
        cnsRecommendation: data.recommendation || '',
        sleepHours: data.sleep,
        lastCnsUpdated: Date.now()
    });

    try {
        const logId = 'cns_' + Date.now();
        const logRef = doc(db, 'users', userId, 'cnsLogs', logId);
        await setDoc(logRef, {
            userId,
            sleep: data.sleep,
            soreness: data.soreness,
            stress: data.stress,
            hrDeviation: data.hrDeviation || 0,
            score: data.score,
            status: data.status,
            createdAt: serverTimestamp(),
        });
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `users/${userId}/cnsLogs`);
    }
};

export const loadCnsLogs = async (userId: string): Promise<any[]> => {
    try {
        const logsRef = collection(db, 'users', userId, 'cnsLogs');
        const q = query(logsRef, orderBy('createdAt', 'desc'), limit(14));
        const snap = await withTimeout(getDocs(q), 2500);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        handleFirestoreError(e, OperationType.LIST, `users/${userId}/cnsLogs`);
        return [];
    }
};


