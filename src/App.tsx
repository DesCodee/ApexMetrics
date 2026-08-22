import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { WorkoutTracker } from './components/WorkoutTracker';
import { Analytics } from './components/Analytics';
import { VipOffer } from './components/VipOffer';
import { useTelegram } from './hooks/useTelegram';
import { Home, Dumbbell, BarChart2, Crown } from 'lucide-react';
import { cn } from './lib/utils';
import type { Tab } from './types';

export default function App() {
  const { user, triggerHaptic } = useTelegram();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const handleTabChange = (tab: Tab) => {
    triggerHaptic('light');
    setActiveTab(tab);
    if (tab !== 'workout') {
      setIsWorkoutActive(false);
    }
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

  return (
    <div className="min-h-screen bg-apex-bg text-white font-sans selection:bg-apex-neon/30">
      <main className="max-w-md mx-auto relative h-screen overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard onStartWorkout={startWorkout} onNavigate={handleTabChange} userName={user?.firstName} />}
        {activeTab === 'workout' && (
          isWorkoutActive ? (
            <WorkoutTracker onComplete={finishWorkout} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center -mt-20">
              <Dumbbell size={48} className="text-apex-border mb-4" />
              <h2 className="text-xl font-bold mb-2">Нет активной тренировки</h2>
              <p className="text-apex-text-dim mb-6">Запусти тренировку дня с главного экрана.</p>
              <button 
                onClick={() => handleTabChange('dashboard')}
                className="bg-white text-black px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm active:scale-95 transition-transform"
              >
                На главную
              </button>
            </div>
          )
        )}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'vip' && <VipOffer />}
      </main>

      {/* Bottom Navigation */}
      {!isWorkoutActive && (
        <div className="fixed bottom-0 left-0 right-0 bg-apex-bg/80 backdrop-blur-xl border-t border-apex-border pb-safe z-50">
          <div className="max-w-md mx-auto flex justify-between items-center px-6 py-3">
            <NavItem 
              icon={<Home size={24} />} 
              label="Главная" 
              isActive={activeTab === 'dashboard'} 
              onClick={() => handleTabChange('dashboard')} 
            />
            <NavItem 
              icon={<Dumbbell size={24} />} 
              label="Треня" 
              isActive={activeTab === 'workout'} 
              onClick={() => handleTabChange('workout')} 
            />
            <NavItem 
              icon={<BarChart2 size={24} />} 
              label="Метрики" 
              isActive={activeTab === 'analytics'} 
              onClick={() => handleTabChange('analytics')} 
            />
            <NavItem 
              icon={<Crown size={24} />} 
              label="VIP" 
              isActive={activeTab === 'vip'} 
              onClick={() => handleTabChange('vip')} 
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
        "flex flex-col items-center gap-1 min-w-[64px] transition-colors",
        isActive ? "text-white" : "text-apex-text-dim hover:text-white/70"
      )}
    >
      <div className={cn(
        "transition-transform",
        isActive ? "scale-110" : "scale-100"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {/* Active Dot */}
      <div className={cn(
        "w-1 h-1 rounded-full mt-0.5 transition-opacity",
        isActive ? "bg-apex-neon opacity-100" : "opacity-0"
      )} />
    </button>
  );
}
