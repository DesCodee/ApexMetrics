/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { UserProfile } from './appEngine';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Log from './screens/Log';
import Body from './screens/Body';
import Pro from './screens/Pro';
import BottomNav from './components/BottomNav';
import { auth, initFirebaseUser, loadUserProfile, saveUserProfile } from './firebase';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [tgUser, setTgUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Initialize Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#000000');
      tg.setBackgroundColor('#000000');
      
      // Auto-register mock logic using TG ID
      if (tg.initDataUnsafe?.user) {
        setTgUser(tg.initDataUnsafe.user);
      }
    }

    // 2. Initialize Firebase and check persistence
    initFirebaseUser().then(async (firebaseUser: any) => {
      const profile = await loadUserProfile(firebaseUser.uid);
      if (profile) {
        setUser(profile);
      }
      setLoadingAuth(false);
    }).catch((e) => {
      console.error('Firebase Auth Error:', e);
      if (e.code === 'auth/admin-restricted-operation') {
        setAuthError('В Firebase отключена анонимная авторизация. Пожалуйста, включите её в консоли Firebase (Authentication -> Sign-in method -> Anonymous).');
      } else {
        setAuthError(e.message);
      }
      setLoadingAuth(false);
    });
  }, []);

  const handleCompleteOnboarding = async (data: UserProfile | null) => {
    if (data && auth.currentUser) {
      await saveUserProfile(data, auth.currentUser.uid);
      setUser(data);
      setActiveTab('home');
    } else {
      setUser(null);
    }
  };

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
        <div className="text-red-500 mb-4 text-4xl">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Ошибка базы данных</h2>
        <p className="text-neutral-400 text-sm max-w-sm">{authError}</p>
      </div>
    );
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-[#D4FF00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no user exists, show the interactive onboarding flow
  if (!user) {
    return <Onboarding onComplete={handleCompleteOnboarding} tgUser={tgUser} />;
  }

  // Main App Shell (4 Tabs)
  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      {activeTab === 'home' && <Home user={user} tgUser={tgUser} />}
      {activeTab === 'log' && <Log user={user} />}
      {activeTab === 'body' && <Body user={user} />}
      {activeTab === 'pro' && <Pro user={user} onUpdate={handleCompleteOnboarding} />}
      
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

