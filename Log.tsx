import { useState, useEffect } from 'react';
import { UserProfile, ApexEngine } from '../appEngine';
import { Apple, Droplet, Dumbbell, Moon, Brain, Heart, Plus, Minus, Activity, Check, History, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import WorkoutLogger from '../components/WorkoutLogger';
import WorkoutHistory from '../components/WorkoutHistory';
import CnsRecoveryModal from '../components/CnsRecoveryModal';
import { loadDailyStats, saveDailyStats, auth } from '../firebase';
import { tgHaptic } from '../utils/haptics';

export default function Log({ user }: { user: UserProfile }) {
  const [activeView, setActiveView] = useState<'grid' | 'workout' | 'history'>('grid');
  const [showCnsModal, setShowCnsModal] = useState(false);
  
  // Date selection logic (supports Yesterday / Today and stepping by day)
  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const dateStr = formatLocalDate(selectedDate);

  const today = new Date();
  const todayStr = formatLocalDate(today);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterday);

  const isToday = dateStr === todayStr;
  const isYesterday = dateStr === yesterdayStr;

  const shiftDay = (days: number) => {
    tgHaptic('light');
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      // Prevent selecting future dates beyond today
      const now = new Date();
      if (next > now) return now;
      return next;
    });
  };

  const setSpecificDate = (target: 'today' | 'yesterday') => {
    tgHaptic('light');
    if (target === 'today') {
      setSelectedDate(new Date());
    } else {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      setSelectedDate(y);
    }
  };

  const getDateLabel = () => {
    if (isToday) return 'Сегодня';
    if (isYesterday) return 'Вчера';
    return selectedDate.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const getFullDateDisplay = () => {
    return selectedDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: selectedDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

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

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      if (auth.currentUser) {
        const stats = await loadDailyStats(auth.currentUser.uid, dateStr);
        if (!isMounted) return;
        if (stats) {
           setWaterGlasses(stats.waterGlasses || 0);
           setProtein(stats.protein !== undefined && stats.protein !== null ? String(stats.protein) : '');
           setCarbs(stats.carbs !== undefined && stats.carbs !== null ? String(stats.carbs) : '');
           setFats(stats.fats !== undefined && stats.fats !== null ? String(stats.fats) : '');
           setSteps(stats.steps !== undefined && stats.steps !== null ? String(stats.steps) : '');
        } else {
           setWaterGlasses(0);
           setProtein('');
           setCarbs('');
           setFats('');
           setSteps('');
        }
      }
    };
    fetchStats();
    return () => {
      isMounted = false;
    };
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
           <WorkoutLogger 
             user={user} 
             onOpenHistory={() => { triggerHaptic(); setActiveView('history'); }} 
           />
        </div>
     );
  }

  if (activeView === 'history') {
     return (
        <div className="animate-in slide-in-from-right duration-300 px-6 pt-5">
           <WorkoutHistory 
              onBack={() => { triggerHaptic(); setActiveView('grid'); }}
              onStartWorkout={() => { triggerHaptic(); setActiveView('workout'); }}
           />
        </div>
     );
  }

  const cleanNum = (val: string) => parseFloat(val.replace(',', '.')) || 0;
  const currentCalories = Math.round((cleanNum(protein) * 4) + (cleanNum(carbs) * 4) + (cleanNum(fats) * 9));
  const macros = ApexEngine.calculateTDEE(user.weight, user.height, user.age, user.gender, user.activityLevel, user.goal);
  const calPercent = Math.min(currentCalories / (macros.calories || 2000), 1) * 100;

  return (
    <div className="px-6 py-6 space-y-6 animate-in fade-in duration-300 max-w-md mx-auto pb-28">
       <header className="pt-2 flex items-center justify-between">
         <h1 className="text-2xl font-light tracking-tight text-white font-sans">Быстрый лог</h1>
         <button 
           onClick={() => { triggerHaptic(); setActiveView('history'); }}
           className="flex items-center gap-1.5 text-xs font-normal text-neutral-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer"
         >
           <History size={13} strokeWidth={1.5} className="text-[#D4FF00]" />
           <span>История</span>
         </button>
       </header>

       {/* Main Actions */}
       <div className="grid grid-cols-3 gap-2.5">
          <div 
             className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer text-center"
             onClick={() => { triggerHaptic(); setActiveView('workout'); }}
          >
             <Dumbbell size={20} strokeWidth={1.5} className="text-neutral-300" />
             <span className="text-[11px] font-normal text-neutral-300 uppercase tracking-wider">Тренировка</span>
          </div>
          <div 
             className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer text-center"
             onClick={() => { triggerHaptic(); setActiveView('history'); }}
          >
             <History size={20} strokeWidth={1.5} className="text-[#D4FF00]" />
             <span className="text-[11px] font-normal text-neutral-300 uppercase tracking-wider">История</span>
          </div>
          <div 
             className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer text-center"
             onClick={() => { triggerHaptic(); setShowCnsModal(true); }}
          >
             <Brain size={20} strokeWidth={1.5} className="text-neutral-300" />
             <span className="text-[11px] font-normal text-neutral-300 uppercase tracking-wider">ЦНС Check</span>
          </div>
       </div>

       {/* Date Navigator */}
       <div className="bg-white/[0.02] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
             <button
               onClick={() => shiftDay(-1)}
               className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
               title="Предыдущий день"
             >
                <ChevronLeft size={18} strokeWidth={1.5} />
             </button>

             <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-1.5">
                   <Calendar size={13} strokeWidth={1.5} className="text-[#D4FF00]" />
                   <span className="text-sm font-medium text-white tracking-tight">
                      {getDateLabel()}
                   </span>
                </div>
                <span className="text-[11px] text-neutral-400 font-normal tabular-nums">
                   {getFullDateDisplay()}
                </span>
             </div>

             <button
               onClick={() => shiftDay(1)}
               disabled={isToday}
               className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
               title="Следующий день"
             >
                <ChevronRight size={18} strokeWidth={1.5} />
             </button>
          </div>

          {/* Quick Shortcuts: Вчера / Сегодня */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/[0.04]">
             <button
               type="button"
               onClick={() => setSpecificDate('yesterday')}
               className={`text-xs px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                 isYesterday 
                   ? 'bg-[#D4FF00] text-black font-medium' 
                   : 'bg-white/[0.03] text-neutral-400 hover:text-white hover:bg-white/[0.06] font-normal'
               }`}
             >
                Вчера
             </button>
             <button
               type="button"
               onClick={() => setSpecificDate('today')}
               className={`text-xs px-4 py-1.5 rounded-xl transition-all cursor-pointer ${
                 isToday 
                   ? 'bg-[#D4FF00] text-black font-medium' 
                   : 'bg-white/[0.03] text-neutral-400 hover:text-white hover:bg-white/[0.06] font-normal'
               }`}
             >
                Сегодня
             </button>
          </div>
       </div>

       {/* Water Tracker */}
       <div className="bg-white/[0.02] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2 text-white font-normal text-sm">
                <Droplet size={15} strokeWidth={1.5} className="text-neutral-400" /> Водный баланс
                <span className="text-[10px] text-neutral-400 font-normal px-2 py-0.5 rounded-full bg-white/[0.04]">
                   {getDateLabel()}
                </span>
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
             <div className="flex items-center gap-2 text-sm font-normal text-white">
                <span>Дневные показатели</span>
                <span className="text-[10px] text-neutral-400 font-normal px-2 py-0.5 rounded-full bg-white/[0.04]">
                   {getDateLabel()}
                </span>
             </div>
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
                `Сохранить (${getDateLabel().toLowerCase()})`
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
