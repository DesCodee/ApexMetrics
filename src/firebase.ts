import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile } from './appEngine';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// Sign in anonymously and ensure UID exists
export const initFirebaseUser = async () => {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                resolve(user);
            } else {
                try {
                    const result = await signInWithPopup(auth, new GoogleAuthProvider());
                    resolve(result.user);
                } catch (e) {
                    reject(e);
                }
            }
        });
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
    const { deleteDoc } = await import('firebase/firestore');
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
