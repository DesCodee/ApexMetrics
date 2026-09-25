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
    <div className="p-5 space-y-4 animate-in fade-in duration-300 max-w-md mx-auto pb-24">
       <header className="pt-2">
         <h1 className="text-xl font-bold tracking-tight text-white font-sans">Быстрый лог</h1>
       </header>

       {/* Main Actions (Featured Cards) */}
       <div className="grid grid-cols-2 gap-3">
          <div 
             className="bg-neutral-900/90 border border-[#D4FF00]/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 active:scale-95 transition-all cursor-pointer hover:border-[#D4FF00] shadow-[0_0_24px_rgba(212,255,0,0.08)]"
             onClick={() => { triggerHaptic(); setActiveView('workout'); }}
          >
             <div className="w-12 h-12 rounded-xl bg-[#D4FF00]/15 flex items-center justify-center text-[#D4FF00]">
                <Dumbbell size={24} />
             </div>
             <span className="text-xs font-bold text-white uppercase tracking-wider">Тренировка</span>
          </div>
          <div 
             className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 active:scale-95 transition-all hover:border-purple-500/40 cursor-pointer"
             onClick={() => { triggerHaptic(); setShowCnsModal(true); }}
          >
             <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                <Brain size={24} />
             </div>
             <span className="text-xs font-bold text-white uppercase tracking-wider">ЦНС Check</span>
          </div>
       </div>

       {/* Water Tracker (Standard Card) */}
       <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
             <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Droplet size={16} className="text-blue-400" /> Водный баланс
             </div>
             <div className="text-xs text-neutral-300 font-semibold tracking-wider uppercase tabular-nums">
                {(waterGlasses * 0.25).toFixed(2)} Л / 3.00 Л
             </div>
          </div>
          <div className="flex items-center justify-between gap-3">
             <button 
               type="button"
               className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-neutral-300 active:scale-95 transition-all hover:bg-white/[0.1]"
               onClick={() => { triggerHaptic(); updateWater(Math.max(0, waterGlasses - 1)); }}
               title="Уменьшить"
             >
                <Minus size={15} />
             </button>
             
             <div className="flex-1 flex gap-1.5 justify-center">
                {Array.from({ length: maxGlasses }).map((_, i) => (
                   <div 
                     key={i} 
                     className={`w-3.5 h-7 rounded-xl transition-colors duration-300 ${i < waterGlasses ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]' : 'bg-neutral-900 border border-neutral-800'}`} 
                   />
                ))}
             </div>
             
             <button 
               type="button"
               className="w-10 h-10 rounded-xl bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-bold flex items-center justify-center active:scale-95 transition-all shadow-[0_0_15px_rgba(212,255,0,0.2)]"
               onClick={() => { triggerHaptic(); updateWater(Math.min(maxGlasses, waterGlasses + 1)); }}
               title="Увеличить"
             >
                <Plus size={15} />
             </button>
          </div>
       </div>

       {/* Daily Manual Stats Form (Standard Card) */}
       <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-4 space-y-3.5">
          <div className="flex justify-between items-center">
             <div className="text-sm font-semibold text-white">Дневные показатели</div>
             <div className="text-xs font-bold text-[#D4FF00] tabular-nums">{currentCalories} <span className="text-neutral-400 font-normal">ккал</span></div>
          </div>
          
          <div className="w-full h-1.5 bg-neutral-900 rounded-xl overflow-hidden mb-2">
             <div className="h-full bg-[#D4FF00] transition-all duration-500" style={{ width: `${calPercent}%` }} />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
             <div>
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 block">Белки (г)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={protein} 
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-2 px-2 text-center text-white outline-none focus:border-[#D4FF00] font-bold transition-colors" 
                />
             </div>
             <div>
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 block">Жиры (г)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={fats} 
                  onChange={(e) => setFats(e.target.value)}
                  placeholder="0"
                  className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-2 px-2 text-center text-white outline-none focus:border-[#D4FF00] font-bold transition-colors" 
                />
             </div>
             <div>
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 block">Углеводы (г)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={carbs} 
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-2 px-2 text-center text-white outline-none focus:border-[#D4FF00] font-bold transition-colors" 
                />
             </div>
          </div>

          <div>
             <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Activity size={14}/> Шаги за день</label>
             <input 
               type="text" 
               inputMode="numeric"
               value={steps} 
               onChange={(e) => setSteps(e.target.value)}
               placeholder="10000"
               className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-2.5 px-3 text-center text-white text-base font-bold outline-none focus:border-[#D4FF00] transition-colors" 
             />
          </div>

          <button 
             id="save-daily-stats-btn"
             onClick={handleSaveStats}
             disabled={isSavingStats}
             className={`w-full font-extrabold text-sm py-3.5 px-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
                savedSuccess ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-[#D4FF00] hover:bg-[#c4ed00] text-black shadow-[0_0_20px_rgba(212,255,0,0.25)]'
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
