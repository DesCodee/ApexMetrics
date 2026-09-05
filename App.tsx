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
import DevPanel from './components/DevPanel';
import { auth, initFirebaseUser, loadUserProfile, saveUserProfile } from './firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  // Helper to identify user ID synchronously
  const getStoredUid = () => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user?.id) return String(tg.initDataUnsafe.user.id);
    } catch {}
    return 'dev_athlete_123';
  };

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const uid = getStoredUid();
      const cached = localStorage.getItem(`apex_profile_${uid}`) || localStorage.getItem('apex_profile_dev_athlete_123') || localStorage.getItem('apex_profile_777000');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });

  const [activeTab, setActiveTab] = useState('home');
  const [tgUser, setTgUser] = useState<any>(null);
  
  // If we already have a cached user, we don't block the screen with a spinner!
  const [loadingAuth, setLoadingAuth] = useState(() => {
    try {
      const uid = getStoredUid();
      const hasProfile = localStorage.getItem(`apex_profile_${uid}`) || localStorage.getItem('apex_profile_dev_athlete_123') || localStorage.getItem('apex_profile_777000');
      return !hasProfile;
    } catch {
      return true;
    }
  });
  
  const [devClicks, setDevClicks] = useState(0);
  const [showDevPanel, setShowDevPanel] = useState(false);

  useEffect(() => {
    // 1. Initialize Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#000000');
      tg.setBackgroundColor('#000000');
      
      if (tg.initDataUnsafe?.user) {
        setTgUser(tg.initDataUnsafe.user);
      }
    }
    
    import('./firebase').then(({ logEvent }) => {
        logEvent('app_opened');
    });

    // 2. Initialize Firebase and sync profile in background
    initFirebaseUser().then(async (firebaseUser: any) => {
      const profile = await loadUserProfile(firebaseUser.uid);
      if (profile) {
        setUser(profile);
      }
      setLoadingAuth(false);
    });
  }, []);

  const handleCompleteOnboarding = async (data: UserProfile | null) => {
    if (data && auth.currentUser) {
      try {
        await saveUserProfile(data, auth.currentUser.uid);
        setUser(data);
        setActiveTab('home');
      } catch (e: any) {
        alert("Save Profile Error: " + e.message);
        console.error(e);
      }
    } else {
      setUser(null);
    }
  };

  const handleDevClick = () => {
      const newClicks = devClicks + 1;
      setDevClicks(newClicks);
      if (newClicks >= 5) {
          setShowDevPanel(true);
          setDevClicks(0);
          const tg = (window as any).Telegram?.WebApp;
          if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
      }
  };

  if (loadingAuth) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-black flex items-center justify-center">
           <div className="w-8 h-8 border-4 border-[#D4FF00] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </ErrorBoundary>
    );
  }

  // If no user exists, show the interactive onboarding flow
  if (!user) {
    return (
      <ErrorBoundary>
        <Onboarding onComplete={handleCompleteOnboarding} tgUser={tgUser} />
        <div 
          onClick={handleDevClick}
          className="fixed top-2 right-2 text-[8px] text-neutral-800 p-2 z-50 select-none"
        >
          v1.0.0
        </div>
        {showDevPanel && user && (
            <DevPanel user={user} onUpdateUser={setUser} onClose={() => setShowDevPanel(false)} />
        )}
      </ErrorBoundary>
    );
  }

  // Main App Shell (4 Tabs)
  return (
    <ErrorBoundary>
      <div className="h-[100dvh] bg-transparent text-white font-sans flex flex-col relative overflow-hidden">
        
        {/* Ambient Liquid Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
           <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#D4FF00]/10 rounded-full mix-blend-screen filter blur-[80px] animate-pulse" style={{ animationDuration: '8s' }} />
           <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 pb-24 overflow-y-auto"
            >
              {activeTab === 'home' && <Home user={user} tgUser={tgUser} onNavigate={setActiveTab} />}
              {activeTab === 'log' && <Log user={user} />}
              {activeTab === 'body' && <Body user={user} onNavigate={setActiveTab} onUpdateUser={setUser} />}
              {activeTab === 'pro' && <Pro user={user} onUpdate={handleCompleteOnboarding} />}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <BottomNav active={activeTab} onChange={setActiveTab} />

        <div 
          onClick={handleDevClick}
          className="fixed bottom-[70px] right-2 text-[10px] text-neutral-800 p-2 z-40 select-none"
        >
          v1.0.0
        </div>

        {showDevPanel && (
            <DevPanel user={user} onUpdateUser={setUser} onClose={() => setShowDevPanel(false)} />
        )}
      </div>
    </ErrorBoundary>
  );
}

