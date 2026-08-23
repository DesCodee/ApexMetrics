import React, { useState, useEffect } from 'react';
import { Play, Check, X, Timer, ChevronRight, Activity, Zap } from 'lucide-react';
import { type DbUser } from '../lib/api';
import { calculateTonnage } from '../lib/formulas';
import { useTelegram } from '../hooks/useTelegram';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Mock Template for instant UI
const mockWorkout = [
  { id: '1', name: 'Жим штанги лежа', target: 'Грудь', prevSets: [{w: 80, r: 8}, {w: 80, r: 8}, {w: 80, r: 7}], sets: [{ weight: 80, reps: 8, completed: false }, { weight: 80, reps: 8, completed: false }, { weight: 80, reps: 8, completed: false }] },
  { id: '2', name: 'Приседания', target: 'Ноги', prevSets: [{w: 100, r: 8}, {w: 100, r: 8}], sets: [{ weight: 100, reps: 8, completed: false }, { weight: 100, reps: 8, completed: false }] },
  { id: '3', name: 'Подтягивания', target: 'Спина', prevSets: [{w: 0, r: 10}], sets: [{ weight: 0, reps: 10, completed: false }, { weight: 0, reps: 10, completed: false }, { weight: 0, reps: 10, completed: false }] },
];

export function WorkoutTracker({ onComplete, user }: { onComplete: () => void, user: DbUser }) {
  const { triggerHaptic } = useTelegram();
  const [exercises, setExercises] = useLocalStorage('apex_active_workout', mockWorkout);
  const [activeExIdx, setActiveExIdx] = useState(0);
  
  // Timer State
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTime > 0) {
      interval = setInterval(() => setRestTime(t => t - 1), 1000);
    } else if (restTime === 0 && isResting) {
      setIsResting(false);
      triggerHaptic('heavy');
      // In real app, play sound here
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const startRest = (seconds: number) => {
    setRestTime(seconds);
    setIsResting(true);
    triggerHaptic('medium');
  };

  const toggleSet = (exIdx: number, setIdx: number) => {
    const newExs = [...exercises];
    const set = newExs[exIdx].sets[setIdx];
    set.completed = !set.completed;
    setExercises(newExs);
    
    if (set.completed) {
      triggerHaptic('success');
      if (!isResting) startRest(90);
    } else {
      triggerHaptic('light');
    }
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', val: string) => {
    const num = Number(val);
    if (isNaN(num)) return;
    const newExs = [...exercises];
    newExs[exIdx].sets[setIdx][field] = num;
    setExercises(newExs);
  };

  // Calculate total session tonnage real-time
  const totalTonnage = exercises.reduce((acc, ex) => acc + calculateTonnage(ex.sets), 0);

  const activeEx = exercises[activeExIdx];

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D]">
      {/* Top Timer Bar if Resting */}
      {isResting && (
        <div className="bg-[#CCFF00] text-black font-black p-3 flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-2"><Timer size={18} /> ОТДЫХ</div>
          <div className="text-xl">{Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}</div>
          <button onClick={() => setIsResting(false)} className="bg-black text-[#CCFF00] px-3 py-1 rounded-full text-xs uppercase">Пропустить</button>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-[#262626] bg-[#1A1A1A] flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-lg">Тренировка</h2>
          <div className="text-[#CCFF00] text-xs font-bold uppercase tracking-wider">{totalTonnage} кг Тоннаж</div>
        </div>
        <button 
          onClick={onComplete}
          className="bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider border border-white/10"
        >
          Завершить
        </button>
      </div>

      {/* Exercise Selector Horizontal Scroll */}
      <div className="flex overflow-x-auto gap-2 p-4 border-b border-[#262626] no-scrollbar">
        {exercises.map((ex, idx) => (
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

      {/* Active Exercise Logger */}
      <div className="p-4 flex-1 overflow-y-auto pb-24">
        <h3 className="text-2xl font-black mb-1">{activeEx.name}</h3>
        <p className="text-[#A1A1AA] text-sm mb-6 flex items-center gap-1"><Activity size={14}/> {activeEx.target}</p>

        {/* Header Row */}
        <div className="grid grid-cols-[30px_1fr_60px_60px_40px] gap-2 mb-2 text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider px-2">
          <div>#</div>
          <div>Прошлый</div>
          <div className="text-center">Вес</div>
          <div className="text-center">Повт</div>
          <div className="text-center">✓</div>
        </div>

        {/* Sets */}
        <div className="flex flex-col gap-2">
          {activeEx.sets.map((set, sIdx) => {
            const prev = activeEx.prevSets[sIdx];
            return (
              <div key={sIdx} className={`grid grid-cols-[30px_1fr_60px_60px_40px] gap-2 items-center bg-[#1A1A1A] border rounded-xl p-2 transition-colors ${set.completed ? 'border-[#CCFF00]' : 'border-[#262626]'}`}>
                <div className="font-bold text-[#A1A1AA] text-center">{sIdx + 1}</div>
                <div className="text-xs text-[#A1A1AA]">
                  {prev ? `${prev.w}кг x ${prev.r}` : '-'}
                </div>
                <input 
                  type="number" value={set.weight} onChange={(e) => updateSet(activeExIdx, sIdx, 'weight', e.target.value)}
                  className="bg-black border border-[#262626] rounded-lg w-full text-center py-2 font-bold focus:border-[#CCFF00] outline-none"
                />
                <input 
                  type="number" value={set.reps} onChange={(e) => updateSet(activeExIdx, sIdx, 'reps', e.target.value)}
                  className="bg-black border border-[#262626] rounded-lg w-full text-center py-2 font-bold focus:border-[#CCFF00] outline-none"
                />
                <button 
                  onClick={() => toggleSet(activeExIdx, sIdx)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${set.completed ? 'bg-[#CCFF00] text-black' : 'bg-black border border-[#262626] text-[#262626]'}`}
                >
                  <Check size={20} strokeWidth={3} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Quick Rest Buttons */}
        <div className="mt-8 flex gap-2">
          <button onClick={() => startRest(60)} className="flex-1 bg-[#1A1A1A] border border-[#262626] py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#A1A1AA] hover:text-white">60s Отдых</button>
          <button onClick={() => startRest(90)} className="flex-1 bg-[#1A1A1A] border border-[#262626] py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#A1A1AA] hover:text-white">90s Отдых</button>
          <button onClick={() => startRest(120)} className="flex-1 bg-[#1A1A1A] border border-[#262626] py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#A1A1AA] hover:text-white">120s Отдых</button>
        </div>
      </div>
    </div>
  );
}
