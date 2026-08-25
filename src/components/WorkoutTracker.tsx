import React, { useState, useEffect } from 'react';
import { Play, Check, X, Timer, ChevronRight, Activity, Zap, Dumbbell, AlertTriangle, Plus, Save, Target, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { type DbUser, saveCustomTemplate, getUserTemplates, saveWorkoutSession } from '../lib/api';
import { calculateTonnage, calculateCNS } from '../lib/formulas';
import { useTelegram } from '../hooks/useTelegram';
import { useLocalStorage } from '../hooks/useLocalStorage';

const DEFAULT_PRESETS = [
  { id: '1', name: 'PUSH (Грудь/Плечи)', exercises: [
    { name: 'Жим лежа', target: 'Грудь', prevSets: [{w: 80, r: 8}, {w: 80, r: 8}, {w: 80, r: 7}] },
    { name: 'Жим гантелей сидя', target: 'Плечи', prevSets: [{w: 24, r: 10}, {w: 24, r: 10}, {w: 24, r: 9}] },
    { name: 'Отжимания на брусьях', target: 'Трицепс', prevSets: [{w: 10, r: 12}, {w: 10, r: 10}, {w: 10, r: 9}] }
  ]},
  { id: '2', name: 'PULL (Спина/Бицепс)', exercises: [
    { name: 'Подтягивания', target: 'Спина', prevSets: [{w: 10, r: 8}, {w: 10, r: 8}, {w: 10, r: 7}] },
    { name: 'Тяга штанги в наклоне', target: 'Спина', prevSets: [{w: 70, r: 10}, {w: 70, r: 10}, {w: 70, r: 9}] },
    { name: 'Подъем штанги на бицепс', target: 'Бицепс', prevSets: [{w: 35, r: 12}, {w: 35, r: 10}, {w: 35, r: 9}] }
  ]},
];

const EXERCISE_DB = [
  { name: 'Жим лежа', target: 'Грудь' },
  { name: 'Жим гантелей сидя', target: 'Плечи' },
  { name: 'Отжимания на брусьях', target: 'Трицепс' },
  { name: 'Подтягивания', target: 'Спина' },
  { name: 'Тяга штанги в наклоне', target: 'Спина' },
  { name: 'Подъем штанги на бицепс', target: 'Бицепс' },
  { name: 'Приседания со штангой', target: 'Ноги' },
  { name: 'Жим ногами', target: 'Ноги' },
  { name: 'Скручивания', target: 'Пресс' },
];

export function WorkoutTracker({ onComplete, user }: { onComplete: () => void, user: DbUser }) {
  const { triggerHaptic } = useTelegram();
  const [activeWorkout, setActiveWorkout] = useLocalStorage<any[]>('apex_active_workout', []);
  const [maxTonnage, setMaxTonnage] = useLocalStorage('apex_max_tonnage', 0);
  const [activeExIdx, setActiveExIdx] = useState(0);
  
  // Custom templates from Firebase
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [isBuildingCustom, setIsBuildingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedExs, setSelectedExs] = useState<any[]>([]);
  
  // CNS & Overload logic
  const [sleep] = useLocalStorage('apex_sleep_quality', 3);
  const [soreness] = useLocalStorage('apex_soreness', 3);
  const [stress] = useLocalStorage('apex_stress', 3);
  const cnsScore = calculateCNS(sleep, soreness, stress);
  const isDeloadMode = cnsScore < 50;

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const generateAIPlan = async () => {
    setIsGeneratingPlan(true);
    triggerHaptic('medium');
    try {
      const res = await fetch('/api/gemini/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          goal: user.goal === 'hard' ? 'Жесткий набор (Сила)' : 'Сухая гипертрофия', 
          experience: user.activityLevel && user.activityLevel > 1.5 ? 'Продвинутый' : 'Новичок', 
          weight: user.weight 
        })
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((ex: any) => ({
          name: ex.name,
          target: ex.target,
          prevSets: Array(ex.defaultSets || 3).fill({ w: 20, r: ex.defaultReps || 10 })
        }));
        loadPreset(formatted);
        triggerHaptic('success');
      }
    } catch (e) {
      console.error(e);
      triggerHaptic('error');
    }
    setIsGeneratingPlan(false);
  };

  // Timer & Record State
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [showRecordOverlay, setShowRecordOverlay] = useState(false);
  const [recordDiff, setRecordDiff] = useState(0);

  useEffect(() => {
    // Load custom templates if VIP
    if (user.isVip) {
      getUserTemplates(user.uid).then(setCustomTemplates).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTime > 0) {
      interval = setInterval(() => setRestTime(t => t - 1), 1000);
    } else if (restTime === 0 && isResting) {
      setIsResting(false);
      triggerHaptic('heavy');
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const startRest = (seconds: number) => {
    setRestTime(seconds);
    setIsResting(true);
    triggerHaptic('medium');
  };

  const toggleSet = (exIdx: number, setIdx: number) => {
    const newExs = [...activeWorkout];
    const set = newExs[exIdx].sets[setIdx];
    set.completed = !set.completed;
    setActiveWorkout(newExs);
    
    if (set.completed) {
      triggerHaptic('heavy');
      if (!isResting) startRest(90);
    } else {
      triggerHaptic('light');
    }
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', val: string) => {
    const num = Number(val);
    if (isNaN(num)) return;
    const newExs = [...activeWorkout];
    newExs[exIdx].sets[setIdx][field] = num;
    setActiveWorkout(newExs);
  };

  const loadPreset = (presetExs: any[]) => {
    triggerHaptic('medium');
    // Prepare workout structure with progressive overload targets
    const prepared = presetExs.map(ex => {
      return {
        ...ex,
        sets: Array(3).fill(null).map((_, i) => {
          let targetW = 0;
          let targetR = 0;
          if (ex.prevSets && ex.prevSets[i]) {
            // Progressive overload logic: +2.5kg or +1 rep
            targetW = ex.prevSets[i].w;
            targetR = ex.prevSets[i].r;
            
            // If deload mode, reduce weight by 20%
            if (isDeloadMode) {
              targetW = Math.round((targetW * 0.8) / 2.5) * 2.5; // round to nearest 2.5
            } else {
              targetW += 2.5; // standard progressive overload suggestion
            }
          }
          return { weight: targetW, reps: targetR, completed: false, targetW, targetR };
        })
      }
    });
    setActiveWorkout(prepared);
    setActiveExIdx(0);
  };

  const handleSaveCustom = async () => {
    if (!customName.trim() || selectedExs.length === 0) return;
    const saved = await saveCustomTemplate(user.uid, customName, selectedExs);
    setCustomTemplates([...customTemplates, saved]);
    setIsBuildingCustom(false);
    setCustomName('');
    setSelectedExs([]);
    triggerHaptic('success');
  };

  const totalTonnage = activeWorkout ? activeWorkout.reduce((acc, ex) => acc + calculateTonnage(ex.sets), 0) : 0;

  const [isSaving, setIsSaving] = useState(false);

  const finishSession = async () => {
    if (!activeWorkout || activeWorkout.length === 0) {
      onComplete();
      return;
    }
    
    setIsSaving(true);
    try {
      await saveWorkoutSession(user.uid, activeWorkout, totalTonnage);
    } catch (e) {
      console.error('Failed to save workout', e);
    }
    setIsSaving(false);

    if (totalTonnage > maxTonnage && totalTonnage > 0) {
      setRecordDiff(totalTonnage - maxTonnage);
      setMaxTonnage(totalTonnage);
      setShowRecordOverlay(true);
      triggerHaptic('heavy');
      setTimeout(() => triggerHaptic('heavy'), 200);
      setTimeout(() => triggerHaptic('heavy'), 400);
      
      setTimeout(() => {
        setShowRecordOverlay(false);
        setActiveWorkout([]);
        onComplete();
      }, 3500);
    } else {
      setActiveWorkout([]);
      onComplete();
    }
  };

  // VIEWS
  if (isBuildingCustom) {
    return (
      <div className="flex flex-col h-full bg-[#0D0D0D] p-6 pt-12 overflow-y-auto pb-24">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black uppercase text-white">Новый пресет</h2>
          <button onClick={() => setIsBuildingCustom(false)} className="text-[#A1A1AA]"><X size={24} /></button>
        </div>
        
        <input 
          value={customName} onChange={e => setCustomName(e.target.value)}
          placeholder="Название (например: Суровый Жим)"
          className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl p-4 text-white font-bold mb-6 focus:border-[#CCFF00] outline-none"
        />

        <div className="mb-4 text-[#A1A1AA] text-xs font-bold uppercase tracking-wider">База упражнений</div>
        <div className="grid gap-2 mb-6">
          {EXERCISE_DB.map((ex, i) => {
            const isSelected = selectedExs.find(s => s.name === ex.name);
            return (
              <div key={i} onClick={() => {
                if (isSelected) setSelectedExs(selectedExs.filter(s => s.name !== ex.name));
                else setSelectedExs([...selectedExs, { ...ex, prevSets: [] }]);
                triggerHaptic('light');
              }} className={`p-4 rounded-xl border flex justify-between items-center transition-colors cursor-pointer ${isSelected ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-[#CCFF00]' : 'bg-[#1A1A1A] border-[#262626] text-[#A1A1AA] hover:border-white'}`}>
                <div>
                  <div className="font-bold text-sm text-white">{ex.name}</div>
                  <div className="text-[10px] mt-1 uppercase tracking-wider opacity-80">{ex.target}</div>
                </div>
                {isSelected ? <Check size={20} /> : <Plus size={20} />}
              </div>
            )
          })}
        </div>

        <button 
          onClick={handleSaveCustom}
          disabled={!customName.trim() || selectedExs.length === 0}
          className="w-full bg-[#CCFF00] text-black font-black uppercase p-4 rounded-xl shadow-[0_0_15px_rgba(204,255,0,0.2)] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
        >
          <Save size={20} /> Сохранить Пресет
        </button>
      </div>
    );
  }

  if (!activeWorkout || activeWorkout.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#0D0D0D] p-6 pt-10 overflow-y-auto pb-24">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] mb-4 border border-[#CCFF00]/20 mx-auto">
          <Dumbbell size={32} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-wider mb-2 text-center text-white">Шаблоны</h2>
        
        {/* CNS Warning */}
        {isDeloadMode ? (
          <div className="bg-[#FF3333]/10 border border-[#FF3333]/50 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertTriangle className="text-[#FF3333] shrink-0" size={24} />
            <div>
              <div className="text-[#FF3333] font-bold text-sm uppercase tracking-wider mb-1">ЦНС Перегружена ({cnsScore}%)</div>
              <div className="text-[#A1A1AA] text-xs leading-relaxed">Система автоматически снизит рабочие веса на 20% для активного восстановления (Deload).</div>
            </div>
          </div>
        ) : (
          <div className="bg-[#CCFF00]/5 border border-[#CCFF00]/20 p-4 rounded-xl mb-6 flex items-center justify-between">
            <div>
              <div className="text-[#CCFF00] font-bold text-sm uppercase tracking-wider mb-1">ЦНС Восстановлена ({cnsScore}%)</div>
              <div className="text-[#A1A1AA] text-xs">Готов к прогрессивной перегрузке.</div>
            </div>
            <Zap className="text-[#CCFF00]" size={24} />
          </div>
        )}

        <div className="text-[#CCFF00] font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
          <Zap size={14} /> AI-Генерация (Gemini)
        </div>
        <button 
          onClick={generateAIPlan}
          disabled={isGeneratingPlan}
          className="w-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] font-black uppercase p-4 rounded-2xl mb-6 shadow-[0_0_15px_rgba(204,255,0,0.1)] active:scale-95 flex justify-center items-center gap-2 transition-all disabled:opacity-50"
        >
          {isGeneratingPlan ? "Генерация нейросетью..." : "Сгенерировать План"}
        </button>
        
        <div className="text-white font-bold uppercase tracking-wider text-xs mb-3">Базовые</div>
        <div className="w-full grid gap-3 mb-6">
          {DEFAULT_PRESETS.map((preset, i) => (
            <button key={i} onClick={() => loadPreset(preset.exercises)} className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4 hover:border-[#CCFF00] transition-all group flex justify-between items-center">
              <div className="text-left">
                <div className="font-bold text-sm text-white group-hover:text-[#CCFF00] transition-colors">{preset.name}</div>
                <div className="text-xs text-[#A1A1AA] mt-1">{preset.exercises.map(e => e.name).join(', ')}</div>
              </div>
              <ChevronRight size={18} className="text-[#262626] group-hover:text-[#CCFF00]" />
            </button>
          ))}
        </div>

        <div className="text-[#CCFF00] font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
          <Crown size={14} /> Мои (VIP)
        </div>
        {user.isVip ? (
          <div className="w-full grid gap-3 mb-6">
            {customTemplates.map((preset, i) => (
              <button key={i} onClick={() => loadPreset(preset.exercises)} className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4 hover:border-[#CCFF00] transition-all group flex justify-between items-center">
                <div className="text-left">
                  <div className="font-bold text-sm text-white group-hover:text-[#CCFF00] transition-colors">{preset.name}</div>
                  <div className="text-xs text-[#A1A1AA] mt-1">{preset.exercises.length} упр.</div>
                </div>
                <ChevronRight size={18} className="text-[#262626] group-hover:text-[#CCFF00]" />
              </button>
            ))}
            <button onClick={() => setIsBuildingCustom(true)} className="w-full bg-transparent border border-dashed border-[#262626] text-[#A1A1AA] rounded-2xl p-4 hover:border-white hover:text-white transition-all flex items-center justify-center gap-2 font-bold text-sm uppercase">
              <Plus size={18} /> Создать пресет
            </button>
          </div>
        ) : (
          <div className="w-full bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 text-center">
            <Crown size={24} className="text-[#A1A1AA] mx-auto mb-2 opacity-50" />
            <div className="text-[#A1A1AA] text-xs mb-4">Кастомные тренировки доступны только VIP-пользователям.</div>
          </div>
        )}
      </div>
    );
  }

  const activeEx = activeWorkout[activeExIdx];
  const totalSets = activeWorkout.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = activeWorkout.reduce((acc, ex) => acc + ex.sets.filter((s: any) => s.completed).length, 0);

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] relative">
      <AnimatePresence>
        {showRecordOverlay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-[#CCFF00]/10 blur-3xl rounded-full animate-pulse" />
            <div className="text-center relative z-10 px-4">
              <motion.div 
                initial={{ y: 20 }}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="inline-block text-[#CCFF00] mb-4"
              >
                <Zap size={64} fill="#CCFF00" />
              </motion.div>
              <h1 className="text-4xl font-black uppercase text-white mb-2 drop-shadow-[0_0_15px_rgba(204,255,0,0.8)]">NEW RECORD!</h1>
              <p className="text-xl font-bold text-[#CCFF00]">+{recordDiff} KG Тоннажа</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-1 w-full bg-black">
        <div 
          className="h-full bg-[#CCFF00] transition-all duration-500 shadow-[0_0_10px_rgba(204,255,0,0.8)]" 
          style={{ width: `${(completedSets / totalSets) * 100}%` }}
        />
      </div>

      {isResting && (
        <div className="bg-[#CCFF00] text-black font-black p-3 flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-2"><Timer size={18} /> ОТДЫХ</div>
          <div className="text-xl">{Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}</div>
          <button onClick={() => setIsResting(false)} className="bg-black text-[#CCFF00] px-3 py-1 rounded-full text-xs uppercase">Пропустить</button>
        </div>
      )}

      <div className="p-4 border-b border-[#262626] bg-[#1A1A1A] flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-lg">Тренировка</h2>
          <div className="text-[#CCFF00] text-xs font-bold uppercase tracking-wider">{totalTonnage} кг Тоннаж</div>
        </div>
        <button onClick={finishSession} disabled={isSaving} className="bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider border border-white/10 active:bg-white/20 disabled:opacity-50">
          {isSaving ? 'Сохранение...' : 'Завершить'}
        </button>
      </div>

      <div className="flex overflow-x-auto gap-2 p-4 border-b border-[#262626] no-scrollbar">
        {activeWorkout.map((ex, idx) => (
          <button
            key={idx}
            onClick={() => setActiveExIdx(idx)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              activeExIdx === idx 
                ? 'bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]' 
                : 'bg-[#1A1A1A] text-[#A1A1AA] border-[#262626]'
            }`}
          >
            {ex.name}
          </button>
        ))}
      </div>

      <div className="p-4 flex-1 overflow-y-auto pb-24">
        <h3 className="text-xl font-black mb-1">{activeEx?.name}</h3>
        <p className="text-[#A1A1AA] text-xs mb-6 flex items-center gap-1"><Activity size={14}/> {activeEx?.target}</p>
        
        <div className="grid grid-cols-[30px_1fr_60px_60px_40px] gap-2 mb-2 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider px-2">
          <div>#</div>
          <div>Цель / Итог</div>
          <div className="text-center">Вес</div>
          <div className="text-center">Повт</div>
          <div className="text-center">✓</div>
        </div>

        <div className="flex flex-col gap-2">
          {activeEx?.sets.map((set: any, sIdx: number) => {
            const prev = activeEx.prevSets?.[sIdx];
            return (
              <motion.div 
                key={sIdx} 
                className={`grid grid-cols-[30px_1fr_60px_60px_40px] gap-2 items-center bg-[#1A1A1A] border rounded-xl p-2 transition-all duration-300 ${set.completed ? 'border-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.15)] bg-[#CCFF00]/5' : 'border-[#262626]'}`}
                animate={set.completed ? { scale: [1, 1.02, 1] } : {}}
              >
                <div className="font-bold text-[#A1A1AA] text-center">{sIdx + 1}</div>
                <div className="text-[10px] flex flex-col justify-center">
                  {prev && (
                    <span className="text-[#A1A1AA] flex items-center gap-1 opacity-60">
                      Прош: {prev.w}x{prev.r}
                    </span>
                  )}
                  {set.targetW > 0 && (
                    <span className="text-[#CCFF00] font-bold flex items-center gap-1">
                      <Target size={10} /> Цель: {set.targetW}x{set.targetR || prev?.r}
                    </span>
                  )}
                </div>
                <input 
                  type="number" value={set.weight || ''} onChange={(e) => updateSet(activeExIdx, sIdx, 'weight', e.target.value)}
                  className="bg-black border border-[#262626] rounded-lg w-full text-center py-2 font-bold focus:border-[#CCFF00] outline-none text-white transition-colors"
                  placeholder={set.targetW ? String(set.targetW) : "0"}
                />
                <input 
                  type="number" value={set.reps || ''} onChange={(e) => updateSet(activeExIdx, sIdx, 'reps', e.target.value)}
                  className="bg-black border border-[#262626] rounded-lg w-full text-center py-2 font-bold focus:border-[#CCFF00] outline-none text-white transition-colors"
                  placeholder={set.targetR ? String(set.targetR) : "0"}
                />
                <motion.button 
                  onClick={() => toggleSet(activeExIdx, sIdx)}
                  whileTap={{ scale: 0.85 }}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${set.completed ? 'bg-[#CCFF00] text-black drop-shadow-[0_0_8px_rgba(204,255,0,0.6)]' : 'bg-black border border-[#262626] text-[#262626]'}`}
                >
                  <Check size={20} strokeWidth={3} />
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 flex gap-2">
          <button onClick={() => startRest(60)} className="flex-1 bg-[#1A1A1A] border border-[#262626] py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#A1A1AA] hover:text-white active:scale-95 transition-transform">60s Отдых</button>
          <button onClick={() => startRest(90)} className="flex-1 bg-[#1A1A1A] border border-[#262626] py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#A1A1AA] hover:text-white active:scale-95 transition-transform">90s Отдых</button>
          <button onClick={() => startRest(120)} className="flex-1 bg-[#1A1A1A] border border-[#262626] py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#A1A1AA] hover:text-white active:scale-95 transition-transform">120s Отдых</button>
        </div>
      </div>
    </div>
  );
}
