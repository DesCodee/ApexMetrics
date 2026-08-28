import { useState, useEffect } from 'react';
import { UserProfile, ApexEngine } from '../appEngine';
import { Apple, Droplet, Dumbbell, Moon, Brain, Heart, Plus, Minus, Activity } from 'lucide-react';
import WorkoutLogger from '../components/WorkoutLogger';
import { loadDailyStats, saveDailyStats, auth } from '../firebase';

export default function Log({ user }: { user: UserProfile }) {
  const [activeView, setActiveView] = useState<'grid' | 'workout'>('grid');
  
  // Hydration
  const [waterGlasses, setWaterGlasses] = useState(0);
  const maxGlasses = 12; // 3L total (250ml each)
  
  // Daily Inputs
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [steps, setSteps] = useState('');
  const [isSavingStats, setIsSavingStats] = useState(false);

  const dateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchStats = async () => {
      if (auth.currentUser) {
        const stats = await loadDailyStats(auth.currentUser.uid, dateStr);
        if (stats) {
           setWaterGlasses(stats.waterGlasses || 0);
           setProtein(stats.protein || '');
           setCarbs(stats.carbs || '');
           setFats(stats.fats || '');
           setSteps(stats.steps || '');
        }
      }
    };
    fetchStats();
  }, [dateStr]);

  const handleSaveStats = async () => {
     if (!auth.currentUser) return;
     triggerHaptic();
     setIsSavingStats(true);
     await saveDailyStats(auth.currentUser.uid, dateStr, {
        waterGlasses,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fats: Number(fats) || 0,
        steps: Number(steps) || 0
     });
     setIsSavingStats(false);
  };

  // Auto-save water when it changes (debounced by the user mentally, but let's just save immediately for UX or require explicit save. We will just add it to the save block or save water implicitly).
  // Actually, we'll save water immediately on change
  const updateWater = async (newVal: number) => {
     setWaterGlasses(newVal);
     if (auth.currentUser) {
        await saveDailyStats(auth.currentUser.uid, dateStr, { waterGlasses: newVal });
     }
  };

  const triggerHaptic = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  };

  if (activeView === 'workout') {
     return (
        <div className="animate-in slide-in-from-right duration-300">
           <div className="px-5 pt-5 pb-2">
              <button 
                onClick={() => { triggerHaptic(); setActiveView('grid'); }}
                className="text-[#D4FF00] text-sm font-bold uppercase tracking-widest"
              >
                 ← Назад в Дневник
              </button>
           </div>
           <WorkoutLogger user={user} />
        </div>
     );
  }

  const macros = ApexEngine.calculateTDEE(user.weight, user.height, user.age, user.gender, user.activityLevel, user.goal);
  const currentCalories = (Number(protein) * 4) + (Number(carbs) * 4) + (Number(fats) * 9);
  const calPercent = Math.min(currentCalories / (macros.calories || 2000), 1) * 100;

  return (
    <div className="p-5 space-y-6 animate-in fade-in duration-500 max-w-md mx-auto pb-24">
       <header className="pt-2">
         <h1 className="text-2xl font-serif text-white">Быстрый лог</h1>
       </header>

       {/* Main Actions */}
       <div className="grid grid-cols-2 gap-3">
          <div 
             className="bg-[#D4FF00]/10 border border-[#D4FF00]/30 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
             onClick={() => { triggerHaptic(); setActiveView('workout'); }}
          >
             <Dumbbell size={28} className="text-[#D4FF00]" />
             <span className="text-xs font-bold text-white uppercase tracking-widest">Тренировка</span>
          </div>
          <div 
             className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform hover:border-neutral-700"
             onClick={() => { triggerHaptic(); setActiveView('workout'); }}
          >
             <Brain size={28} className="text-white" />
             <span className="text-xs font-bold text-white uppercase tracking-widest">ЦНС Check</span>
          </div>
       </div>

       {/* Water Tracker */}
       <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-3xl p-5">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Droplet size={14} className="text-blue-400" /> Вода
             </div>
             <div className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">
                {(waterGlasses * 0.25).toFixed(2)} Л / 3.00 Л
             </div>
          </div>
          <div className="flex items-center justify-between gap-2">
             <button 
               className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center active:scale-95 transition-transform"
               onClick={() => { triggerHaptic(); updateWater(Math.max(0, waterGlasses - 1)); }}
             >
                <Minus size={14} />
             </button>
             
             <div className="flex-1 flex gap-1 justify-center">
                {Array.from({ length: maxGlasses }).map((_, i) => (
                   <div 
                     key={i} 
                     className={`w-4 h-7 rounded-full transition-colors duration-300 ${i < waterGlasses ? 'bg-blue-400' : 'bg-white/[0.06]'}`} 
                   />
                ))}
             </div>
             
             <button 
               className="w-8 h-8 rounded-full bg-[#D4FF00] text-black flex items-center justify-center active:scale-95 transition-transform"
               onClick={() => { triggerHaptic(); updateWater(Math.min(maxGlasses, waterGlasses + 1)); }}
             >
                <Plus size={14} />
             </button>
          </div>
       </div>

       {/* Daily Manual Stats Form */}
       <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-3xl p-5 space-y-5">
          <div className="flex justify-between items-center">
             <div className="text-sm font-bold text-white">Дневные показатели</div>
             <div className="text-xs font-bold text-[#D4FF00]">{currentCalories} <span className="text-neutral-500">ккал</span></div>
          </div>
          
          <div className="w-full h-1.5 bg-black rounded-full overflow-hidden mb-3">
             <div className="h-full bg-[#D4FF00] transition-all duration-500" style={{ width: `${calPercent}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-3">
             <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 block">Белки (г)</label>
                <input 
                  type="number" 
                  value={protein} 
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl rounded-xl py-2 px-3 text-center text-white outline-none focus:border-[#D4FF00]" 
                />
             </div>
             <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 block">Жиры (г)</label>
                <input 
                  type="number" 
                  value={fats} 
                  onChange={(e) => setFats(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl rounded-xl py-2 px-3 text-center text-white outline-none focus:border-[#D4FF00]" 
                />
             </div>
             <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 block">Углеводы (г)</label>
                <input 
                  type="number" 
                  value={carbs} 
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl rounded-xl py-2 px-3 text-center text-white outline-none focus:border-[#D4FF00]" 
                />
             </div>
          </div>

          <div>
             <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 block flex items-center gap-1"><Activity size={12}/> Шаги</label>
             <input 
               type="number" 
               value={steps} 
               onChange={(e) => setSteps(e.target.value)}
               placeholder="10000"
               className="w-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl rounded-xl py-3 px-3 text-center text-white text-lg font-bold outline-none focus:border-[#D4FF00]" 
             />
          </div>

          <button 
             onClick={handleSaveStats}
             disabled={isSavingStats}
             className="w-full bg-white/[0.06] text-white font-bold text-sm py-3 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          >
             {isSavingStats ? 'Сохранение...' : 'Сохранить показатели'}
          </button>
       </div>
    </div>
  )
}
