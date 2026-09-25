import { useState, useEffect } from 'react';
import { UserProfile, ApexEngine } from '../appEngine';
import { Apple, Droplet, Dumbbell, Moon, Brain, Heart, Plus, Minus, Activity, Check } from 'lucide-react';
import WorkoutLogger from '../components/WorkoutLogger';
import CnsRecoveryModal from '../components/CnsRecoveryModal';
import { loadDailyStats, saveDailyStats, auth } from '../firebase';
import { tgHaptic } from '../utils/haptics';

export default function Log({ user }: { user: UserProfile }) {
  const [activeView, setActiveView] = useState<'grid' | 'workout'>('grid');
  const [showCnsModal, setShowCnsModal] = useState(false);
  
  // Hydration
  const [waterGlasses, setWaterGlasses] = useState(0);
  const maxGlasses = 12; // 3L total (250ml each)
  
  // Daily Inputs
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [steps, setSteps] = useState('');
  const [isSavingStats, setIsSavingStats] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const dateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchStats = async () => {
      if (auth.currentUser) {
        const stats = await loadDailyStats(auth.currentUser.uid, dateStr);
        if (stats) {
           setWaterGlasses(stats.waterGlasses || 0);
           setProtein(stats.protein !== undefined && stats.protein !== null ? String(stats.protein) : '');
           setCarbs(stats.carbs !== undefined && stats.carbs !== null ? String(stats.carbs) : '');
           setFats(stats.fats !== undefined && stats.fats !== null ? String(stats.fats) : '');
           setSteps(stats.steps !== undefined && stats.steps !== null ? String(stats.steps) : '');
        }
      }
    };
    fetchStats();
  }, [dateStr]);

  const handleSaveStats = async () => {
     if (!auth.currentUser) return;
     tgHaptic('medium');
     setIsSavingStats(true);
     await saveDailyStats(auth.currentUser.uid, dateStr, {
        waterGlasses,
        protein: Math.max(0, parseFloat(protein.replace(',', '.')) || 0),
        carbs: Math.max(0, parseFloat(carbs.replace(',', '.')) || 0),
        fats: Math.max(0, parseFloat(fats.replace(',', '.')) || 0),
        steps: Math.max(0, parseInt(steps, 10) || 0)
     });
     setIsSavingStats(false);
     setSavedSuccess(true);
     tgHaptic('success');
     setTimeout(() => setSavedSuccess(false), 2500);
  };

  const updateWater = async (newVal: number) => {
     setWaterGlasses(newVal);
     if (auth.currentUser) {
        await saveDailyStats(auth.currentUser.uid, dateStr, { waterGlasses: newVal });
     }
  };

  const triggerHaptic = () => {
    tgHaptic('light');
  };

  if (activeView === 'workout') {
     return (
        <div className="animate-in slide-in-from-right duration-300">
           <div className="px-5 pt-5 pb-2">
              <button 
                onClick={() => { triggerHaptic(); setActiveView('grid'); }}
                className="text-[#D4FF00] text-sm font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                 ← Назад в Дневник
              </button>
           </div>
           <WorkoutLogger user={user} />
        </div>
     );
  }

  const cleanNum = (val: string) => parseFloat(val.replace(',', '.')) || 0;
  const currentCalories = Math.round((cleanNum(protein) * 4) + (cleanNum(carbs) * 4) + (cleanNum(fats) * 9));
  const macros = ApexEngine.calculateTDEE(user.weight, user.height, user.age, user.gender, user.activityLevel, user.goal);
  const calPercent = Math.min(currentCalories / (macros.calories || 2000), 1) * 100;

  return (
    <div className="px-6 py-6 space-y-6 animate-in fade-in duration-300 max-w-md mx-auto pb-28">
       <header className="pt-2">
         <h1 className="text-2xl font-light tracking-tight text-white font-sans">Быстрый лог</h1>
       </header>

       {/* Main Actions */}
       <div className="grid grid-cols-2 gap-3">
          <div 
             className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-5 flex flex-col items-center justify-center gap-2.5 active:scale-95 transition-all cursor-pointer"
             onClick={() => { triggerHaptic(); setActiveView('workout'); }}
          >
             <Dumbbell size={22} strokeWidth={1.5} className="text-neutral-300" />
             <span className="text-xs font-normal text-neutral-300 uppercase tracking-wider">Тренировка</span>
          </div>
          <div 
             className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-5 flex flex-col items-center justify-center gap-2.5 active:scale-95 transition-all cursor-pointer"
             onClick={() => { triggerHaptic(); setShowCnsModal(true); }}
          >
             <Brain size={22} strokeWidth={1.5} className="text-neutral-300" />
             <span className="text-xs font-normal text-neutral-300 uppercase tracking-wider">ЦНС Check</span>
          </div>
       </div>

       {/* Water Tracker */}
       <div className="bg-white/[0.02] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2 text-white font-normal text-sm">
                <Droplet size={15} strokeWidth={1.5} className="text-neutral-400" /> Водный баланс
             </div>
             <div className="text-xs text-neutral-400 font-normal tracking-wider uppercase tabular-nums">
                {(waterGlasses * 0.25).toFixed(2)} Л / 3.00 Л
             </div>
          </div>
          <div className="flex items-center justify-between gap-3">
             <button 
               type="button"
               className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white active:scale-95 transition-all"
               onClick={() => { triggerHaptic(); updateWater(Math.max(0, waterGlasses - 1)); }}
               title="Уменьшить"
             >
                <Minus size={15} strokeWidth={1.5} />
             </button>
             
             <div className="flex-1 flex gap-1.5 justify-center">
                {Array.from({ length: maxGlasses }).map((_, i) => (
                   <div 
                     key={i} 
                     className={`w-2.5 h-6 rounded-full transition-colors duration-300 ${i < waterGlasses ? 'bg-white' : 'bg-neutral-800'}`} 
                   />
                ))}
             </div>
             
             <button 
               type="button"
               className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white active:scale-95 transition-all"
               onClick={() => { triggerHaptic(); updateWater(Math.min(maxGlasses, waterGlasses + 1)); }}
               title="Увеличить"
             >
                <Plus size={15} strokeWidth={1.5} />
             </button>
          </div>
       </div>

       {/* Daily Manual Stats Form */}
       <div className="bg-white/[0.02] rounded-2xl p-6 space-y-5">
          <div className="flex justify-between items-center">
             <div className="text-sm font-normal text-white">Дневные показатели</div>
             <div className="text-xs font-normal text-neutral-400 tabular-nums">{currentCalories} ккал</div>
          </div>
          
          <div className="w-full h-[2px] bg-neutral-900 rounded-full overflow-hidden">
             <div className="h-full bg-neutral-400 transition-all duration-500" style={{ width: `${calPercent}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
             <div>
                <label className="text-xs font-normal text-neutral-400 uppercase tracking-wider mb-1.5 block">Белки (г)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={protein} 
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="w-full bg-neutral-900/60 border-0 rounded-xl py-2 px-2 text-center text-white outline-none focus:ring-1 focus:ring-neutral-700 font-normal transition-colors" 
                />
             </div>
             <div>
                <label className="text-xs font-normal text-neutral-400 uppercase tracking-wider mb-1.5 block">Жиры (г)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={fats} 
                  onChange={(e) => setFats(e.target.value)}
                  placeholder="0"
                  className="w-full bg-neutral-900/60 border-0 rounded-xl py-2 px-2 text-center text-white outline-none focus:ring-1 focus:ring-neutral-700 font-normal transition-colors" 
                />
             </div>
             <div>
                <label className="text-xs font-normal text-neutral-400 uppercase tracking-wider mb-1.5 block">Углеводы (г)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={carbs} 
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className="w-full bg-neutral-900/60 border-0 rounded-xl py-2 px-2 text-center text-white outline-none focus:ring-1 focus:ring-neutral-700 font-normal transition-colors" 
                />
             </div>
          </div>

          <div>
             <label className="text-xs font-normal text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
               <Activity size={14} strokeWidth={1.5} /> Шаги за день
             </label>
             <input 
               type="text" 
               inputMode="numeric"
               value={steps} 
               onChange={(e) => setSteps(e.target.value)}
               placeholder="10000"
               className="w-full bg-neutral-900/60 border-0 rounded-xl py-2.5 px-3 text-center text-white text-base font-normal outline-none focus:ring-1 focus:ring-neutral-700 transition-colors" 
             />
          </div>

          {/* Primary Action Button */}
          <button 
             id="save-daily-stats-btn"
             onClick={handleSaveStats}
             disabled={isSavingStats}
             className={`w-full font-medium text-sm py-4 px-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
                savedSuccess ? 'bg-emerald-500 text-black' : 'bg-[#D4FF00] hover:bg-[#c4ed00] text-black'
             } disabled:opacity-50`}
          >
             {isSavingStats ? (
                'Сохранение...'
             ) : savedSuccess ? (
                <><Check size={16} /> Сохранено!</>
             ) : (
                'Сохранить показатели'
             )}
          </button>
       </div>

       {/* CNS Modal integration */}
       <CnsRecoveryModal 
          isOpen={showCnsModal}
          onClose={() => setShowCnsModal(false)}
       />
    </div>
  )
}
