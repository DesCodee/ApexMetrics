import React, { useState, useEffect } from 'react';
import { Target, Activity, ChevronRight, Zap, TrendingUp, Moon, Droplets, Flame, Clock, Loader2 } from 'lucide-react';
import { type DbUser, saveDailyStats, getDailyStats } from '../lib/api';
import { calculateCNS, getCNSStatus, calculateMacros, calculateTDEE, calculateSleepDuration } from '../lib/formulas';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTelegram } from '../hooks/useTelegram';

export function Dashboard({ onStartWorkout, dbUser }: { onStartWorkout: () => void, dbUser: DbUser | null }) {
  const { triggerHaptic } = useTelegram();
  
  // Sleep & CNS
  const [bedtime, setBedtime] = useLocalStorage('apex_bedtime', '23:00');
  const [waketime, setWaketime] = useLocalStorage('apex_waketime', '07:00');
  const [sleepQuality, setSleepQuality] = useLocalStorage('apex_sleep_quality', 3);
  const [soreness, setSoreness] = useLocalStorage('apex_soreness', 3);
  const [stress, setStress] = useLocalStorage('apex_stress', 3);
  
  // Daily Fuel
  const [waterMl, setWaterMl] = useState(0);
  const [cals, setCals] = useState(0);
  const [consumedProtein, setConsumedProtein] = useState(0);
  const [consumedCarbs, setConsumedCarbs] = useState(0);
  const [consumedFats, setConsumedFats] = useState(0);
  
  const [foodQuery, setFoodQuery] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  
  const [isCnsModalOpen, setCnsModalOpen] = useState(false);
  const [isFuelModalOpen, setFuelModalOpen] = useState(false);

  useEffect(() => {
    if (dbUser?.uid) {
      getDailyStats(dbUser.uid).then(stats => {
        if (stats) {
          setCals(stats.cals || 0);
          setWaterMl(stats.waterMl || 0);
          setConsumedProtein(stats.protein || 0);
          setConsumedCarbs(stats.carbs || 0);
          setConsumedFats(stats.fats || 0);
        }
      }).catch(console.error);
    }
  }, [dbUser]);

  const updateStats = (newCals: number, newWater: number, newProtein: number = consumedProtein, newCarbs: number = consumedCarbs, newFats: number = consumedFats) => {
    setCals(newCals);
    setWaterMl(newWater);
    setConsumedProtein(newProtein);
    setConsumedCarbs(newCarbs);
    setConsumedFats(newFats);
    if (dbUser?.uid) {
      saveDailyStats(dbUser.uid, { cals: newCals, waterMl: newWater, protein: newProtein, carbs: newCarbs, fats: newFats }).catch(console.error);
    }
  };

  const parseFood = async () => {
    if (!foodQuery) return;
    setIsParsing(true);
    triggerHaptic('medium');
    try {
      const res = await fetch('/api/gemini/parse-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: foodQuery })
      });
      if (res.ok) {
        const data = await res.json();
        updateStats(
          cals + (data.cals || 0), 
          waterMl, 
          consumedProtein + (data.protein || 0),
          consumedCarbs + (data.carbs || 0),
          consumedFats + (data.fats || 0)
        );
        setFoodQuery('');
        setFuelModalOpen(false);
        triggerHaptic('success');
      }
    } catch (e) {
      console.error(e);
      triggerHaptic('error');
    }
    setIsParsing(false);
  };
  
  const cnsScore = calculateCNS(sleepQuality, soreness, stress);
  const cnsStatus = getCNSStatus(cnsScore);
  const sleepHours = calculateSleepDuration(bedtime, waketime);
  
  const weight = dbUser?.weight || 75;
  const height = dbUser?.height || 180;
  const age = dbUser?.age || 20;
  const activity = dbUser?.activityLevel || 1.55;
  const goal = dbUser?.goal || 'hard';
  
  const tdee = calculateTDEE(weight, height, age, activity);
  const { surplus, protein, carbs, fats } = calculateMacros(weight, tdee, goal);

  const addWater = (amount: number) => {
    triggerHaptic('light');
    updateStats(cals, Math.min(waterMl + amount, 3000));
  };

  return (
    <div className="p-4 flex flex-col gap-6 pt-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-xl font-bold text-[#CCFF00]">
            {dbUser?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <h1 className="font-bold text-lg">{dbUser?.username || 'Атлет'}</h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#A1A1AA] flex items-center gap-1"><Zap size={12} className="text-orange-400"/> 3 дня стрик</span>
              <span className="bg-[#CCFF00]/10 text-[#CCFF00] px-2 py-0.5 rounded-full uppercase font-bold text-[9px] border border-[#CCFF00]/20">FREE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main CTA */}
      <button 
        onClick={onStartWorkout}
        className="w-full bg-[#CCFF00] text-black font-black uppercase tracking-widest text-lg rounded-2xl py-5 shadow-[0_0_20px_rgba(204,255,0,0.2)] active:scale-95 transition-all"
      >
        Начать тренировку
      </button>

      {/* CNS & Sleep Hub */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-3xl rounded-full pointer-events-none" />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <h2 className="text-sm text-[#A1A1AA] uppercase tracking-wider font-bold">CNS Readiness</h2>
            <div className={`text-3xl font-black ${cnsStatus.color}`}>{Math.round(cnsScore)}%</div>
          </div>
          <button onClick={() => setCnsModalOpen(!isCnsModalOpen)} className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 active:scale-95 transition-transform">
            <Activity size={18} className={isCnsModalOpen ? "text-[#CCFF00]" : "text-white"} />
          </button>
        </div>
        
        <div className="h-2 w-full bg-black rounded-full overflow-hidden mb-3 border border-white/5">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${cnsScore}%`, backgroundColor: cnsScore > 80 ? '#CCFF00' : cnsScore >= 50 ? '#FBBF24' : '#FF3333' }}
          />
        </div>
        
        {/* Dynamic AI Verdict */}
        <div className="bg-black/40 border border-[#262626] rounded-xl p-3 mb-2 flex items-start gap-2">
          <Zap size={16} className={`shrink-0 mt-0.5 ${cnsStatus.color}`} />
          <p className="text-xs text-white/90 leading-snug">{cnsStatus.recommend}</p>
        </div>

        {isCnsModalOpen && (
          <div className="mt-4 pt-4 border-t border-[#262626] flex flex-col gap-4 animate-in fade-in zoom-in-95 relative z-10">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="text-[10px] text-[#A1A1AA] uppercase font-bold mb-1 block flex items-center gap-1"><Moon size={10}/> Сон</label>
                <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} className="w-full bg-black border border-[#262626] rounded-lg p-2 text-sm text-center focus:border-[#CCFF00] outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-[#A1A1AA] uppercase font-bold mb-1 block flex items-center gap-1"><Clock size={10}/> Подъем</label>
                <input type="time" value={waketime} onChange={e => setWaketime(e.target.value)} className="w-full bg-black border border-[#262626] rounded-lg p-2 text-sm text-center focus:border-[#CCFF00] outline-none" />
              </div>
            </div>
            <div className="text-center text-xs font-bold text-[#CCFF00] mb-2">Общее время: {sleepHours} ч.</div>

            <Slider label="Качество сна (1-5)" value={sleepQuality} setter={setSleepQuality} icon={<Moon size={14}/>} />
            <Slider label="Стресс/Учеба (1-5)" value={stress} setter={setStress} icon={<Zap size={14}/>} />
            <Slider label="Крепатура (1-5)" value={soreness} setter={setSoreness} icon={<Activity size={14}/>} />
            
            <button onClick={() => setCnsModalOpen(false)} className="mt-2 w-full py-3 bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20 rounded-xl text-xs font-bold uppercase tracking-wider">Скрыть параметры</button>
          </div>
        )}
      </div>

      {/* Daily Fuel */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm text-[#A1A1AA] uppercase tracking-wider font-bold flex items-center gap-2">
            <Flame size={16} /> Daily Fuel
          </h2>
          <button onClick={() => setFuelModalOpen(!isFuelModalOpen)} className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full active:scale-95">+ Еда</button>
        </div>

        {isFuelModalOpen && (
          <div className="mb-6 p-4 border border-[#262626] bg-black/40 rounded-xl animate-in slide-in-from-top-2">
            <h3 className="text-xs font-bold uppercase text-[#A1A1AA] mb-3 flex items-center gap-2"><Zap size={14} className="text-[#CCFF00]"/> Умный трекинг питания</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={foodQuery}
                onChange={e => setFoodQuery(e.target.value)}
                placeholder="Съел двойной чизбургер..."
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg p-2 text-xs focus:border-[#CCFF00] outline-none text-white"
                disabled={isParsing}
              />
              <button 
                onClick={parseFood} 
                disabled={isParsing || !foodQuery}
                className="bg-[#CCFF00] text-black px-3 py-2 rounded-lg font-bold text-xs disabled:opacity-50 flex items-center justify-center shrink-0 active:scale-95"
              >
                {isParsing ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
              </button>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={() => updateStats(0, waterMl, 0, 0, 0)} className="text-[10px] text-red-400 font-bold uppercase tracking-wider active:scale-95">Сбросить день</button>
            </div>
          </div>
        )}

        {/* Calories Progress */}
        <div className="mb-5">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span>{cals} / {surplus} kcal</span>
            <span className="text-[#CCFF00]">{Math.round((cals / surplus) * 100) || 0}%</span>
          </div>
          <div className={`h-2 w-full bg-black rounded-full overflow-hidden border border-white/5 transition-all duration-500 ${cals >= surplus ? 'shadow-[0_0_15px_rgba(204,255,0,0.8)] border-[#CCFF00]/50' : ''}`}>
            <div className={`h-full bg-[#CCFF00] rounded-full transition-all duration-500 ${cals >= surplus ? 'animate-pulse' : ''}`} style={{ width: `${Math.min((cals / surplus) * 100, 100)}%` }} />
          </div>
          
          {/* Macros Split */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="bg-black border border-[#262626] rounded-lg p-2">
              <div className="text-[9px] text-[#A1A1AA] uppercase font-bold mb-1">Белки</div>
              <div className="text-xs font-bold text-white">{consumedProtein} / {protein}г</div>
            </div>
            <div className="bg-black border border-[#262626] rounded-lg p-2">
              <div className="text-[9px] text-[#A1A1AA] uppercase font-bold mb-1">Углеводы</div>
              <div className="text-xs font-bold text-white">{consumedCarbs} / {carbs}г</div>
            </div>
            <div className="bg-black border border-[#262626] rounded-lg p-2">
              <div className="text-[9px] text-[#A1A1AA] uppercase font-bold mb-1">Жиры</div>
              <div className="text-xs font-bold text-white">{consumedFats} / {fats}г</div>
            </div>
          </div>
        </div>

        <hr className="border-[#262626] mb-5" />

        {/* Water Tracker */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm font-bold flex items-center gap-1 text-blue-400"><Droplets size={16}/> {waterMl} / 3000 мл</div>
            <div className="flex gap-2">
              <button onClick={() => addWater(250)} className="bg-[#1A1A1A] border border-[#262626] text-xs font-bold px-3 py-1.5 rounded-lg hover:border-blue-500/50 active:scale-95">+250</button>
              <button onClick={() => addWater(500)} className="bg-[#1A1A1A] border border-[#262626] text-xs font-bold px-3 py-1.5 rounded-lg hover:border-blue-500/50 active:scale-95">+500</button>
            </div>
          </div>
          <div className={`h-3 w-full bg-black rounded-full overflow-hidden border border-white/5 relative transition-all duration-500 ${waterMl >= 3000 ? 'shadow-[0_0_15px_rgba(59,130,246,0.8)] border-blue-500/50' : ''}`}>
            <div className={`absolute top-0 bottom-0 left-0 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] rounded-full transition-all duration-500 ${waterMl >= 3000 ? 'animate-pulse' : ''}`} style={{ width: `${Math.min((waterMl / 3000) * 100, 100)}%` }} />
          </div>
          {waterMl >= 3000 && <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-2 text-center">Цель достигнута!</p>}
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, setter, icon }: { label: string, value: number, setter: (v: number) => void, icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[#A1A1AA] mb-2 font-bold uppercase tracking-wider items-center">
        <span className="flex items-center gap-1">{icon} {label}</span>
        <span className="text-white">{value}</span>
      </div>
      <input 
        type="range" min="1" max="5" step="1" 
        value={value} onChange={(e) => setter(Number(e.target.value))}
        className="w-full h-1 bg-black rounded-lg appearance-none cursor-pointer accent-[#CCFF00]"
      />
    </div>
  );
}
