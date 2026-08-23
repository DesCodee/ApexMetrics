import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTelegram } from './hooks/useTelegram';
import { initAuth, type DbUser } from './lib/api';
import { Home, Dumbbell, BarChart2, Crown, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';
import { Dashboard } from './components/Dashboard';
import { WorkoutTracker } from './components/WorkoutTracker';
import { Analytics } from './components/Analytics';
import { VipOffer } from './components/VipOffer';
import { Onboarding } from './components/Onboarding';

export type Tab = 'dashboard' | 'workout' | 'analytics' | 'vip';

export default function App() {
  const { user, triggerHaptic } = useTelegram();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const unsubscribe = initAuth(user, (loadedUser, error) => {
        if (loadedUser) setDbUser(loadedUser);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleTabChange = (tab: Tab) => {
    triggerHaptic('light');
    setActiveTab(tab);
    if (tab !== 'workout') setIsWorkoutActive(false);
  };

  const startWorkout = () => {
    triggerHaptic('medium');
    setIsWorkoutActive(true);
    setActiveTab('workout');
  };

  const finishWorkout = () => {
    setIsWorkoutActive(false);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center text-[#CCFF00]">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-white text-sm">Инициализация APEX...</p>
      </div>
    );
  }

  if (dbUser && !dbUser.onboardingCompleted) {
    return <Onboarding uid={dbUser.uid} onComplete={() => setDbUser({ ...dbUser, onboardingCompleted: true })} />;
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-sans selection:bg-[#CCFF00]/30 overflow-hidden">
      <main className="max-w-md mx-auto relative h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden scroll-smooth pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (isWorkoutActive ? '-workout' : '')}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="min-h-full"
          >
            {activeTab === 'dashboard' && <Dashboard onStartWorkout={startWorkout} dbUser={dbUser} />}
            {activeTab === 'workout' && (
              isWorkoutActive && dbUser ? (
                <WorkoutTracker onComplete={finishWorkout} user={dbUser} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center mt-20">
                  <Dumbbell size={48} className="text-[#262626] mb-4" />
                  <h2 className="text-xl font-bold mb-2">Нет активной тренировки</h2>
                  <p className="text-[#A1A1AA] mb-6">Запусти тренировку дня с главного экрана.</p>
                  <button 
                    onClick={() => handleTabChange('dashboard')}
                    className="bg-white text-black px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm active:scale-95 transition-transform"
                  >
                    На главную
                  </button>
                </div>
              )
            )}
            {activeTab === 'analytics' && dbUser && <Analytics user={dbUser} />}
            {activeTab === 'vip' && dbUser && <VipOffer user={dbUser} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isWorkoutActive && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D]/90 backdrop-blur-md border-t border-[#262626] z-50 h-[80px]">
          <div className="max-w-md mx-auto flex justify-between items-center px-4 h-full">
            <NavItem 
              icon={<Home size={24} />} label="Apex" 
              isActive={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} 
            />
            <NavItem 
              icon={<Dumbbell size={24} />} label="Дневник" 
              isActive={activeTab === 'workout'} onClick={() => handleTabChange('workout')} 
            />
            <NavItem 
              icon={<BarChart2 size={24} />} label="Аналитика" 
              isActive={activeTab === 'analytics'} onClick={() => handleTabChange('analytics')} 
            />
            <NavItem 
              icon={<Crown size={24} />} label="VIP" 
              isActive={activeTab === 'vip'} onClick={() => handleTabChange('vip')} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors active:scale-95",
        isActive ? "text-[#CCFF00]" : "text-[#A1A1AA] hover:text-white"
      )}
    >
      {React.cloneElement(icon as React.ReactElement, { strokeWidth: isActive ? 2.5 : 2 })}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
