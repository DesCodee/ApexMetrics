import React, { useState, useEffect } from 'react';
import { Check, Dumbbell, ChevronRight, Play, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTelegram } from '../hooks/useTelegram';

interface WorkoutTrackerProps {
  onComplete: () => void;
}

const workoutPlan = [
  { id: '1', name: 'Жим штанги лежа', target: 'Грудь', sets: 4, reps: 8, targetWeight: 80 },
  { id: '2', name: 'Жим гантелей сидя', target: 'Плечи', sets: 3, reps: 10, targetWeight: 24 },
  { id: '3', name: 'Разводка в кроссовере', target: 'Грудь', sets: 3, reps: 12, targetWeight: 15 },
  { id: '4', name: 'Отжимания на брусьях', target: 'Трицепс', sets: 3, reps: 'max', targetWeight: 0 },
];

export function WorkoutTracker({ onComplete }: WorkoutTrackerProps) {
  const { showMainButton, hideMainButton, triggerHaptic } = useTelegram();
  const [activeExercise, setActiveExercise] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, number[]>>({});

  const exercise = workoutPlan[activeExercise];
  const totalExercises = workoutPlan.length;
  
  const isAllCompleted = Object.keys(completedSets).length === totalExercises && 
    (Object.values(completedSets) as number[][]).every((sets, index) => sets.length === workoutPlan[index].sets);

  useEffect(() => {
    if (isAllCompleted) {
      showMainButton('ЗАВЕРШИТЬ ТРЕНИРОВКУ', () => {
        triggerHaptic('heavy');
        onComplete();
        hideMainButton();
      });
    } else {
      hideMainButton();
    }
    return () => hideMainButton();
  }, [isAllCompleted, onComplete, showMainButton, hideMainButton, triggerHaptic]);

  const toggleSet = (exerciseId: string, setIndex: number) => {
    triggerHaptic('light');
    setCompletedSets(prev => {
      const current = prev[exerciseId] || [];
      if (current.includes(setIndex)) {
        return { ...prev, [exerciseId]: current.filter(i => i !== setIndex) };
      } else {
        return { ...prev, [exerciseId]: [...current, setIndex] };
      }
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-apex-bg pb-24 pt-4">
      {/* Progress Header */}
      <div className="px-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-mono text-apex-text-dim uppercase tracking-[2px]">ПРОГРЕСС СЕССИИ</span>
          <span className="text-apex-neon font-mono font-black text-sm">
            {Object.keys(completedSets).length} / {totalExercises}
          </span>
        </div>
        <div className="flex gap-1 h-2">
          {workoutPlan.map((ex, idx) => {
            const isDone = completedSets[ex.id]?.length === ex.sets;
            const isCurrent = idx === activeExercise;
            return (
              <div 
                key={ex.id} 
                className={cn(
                  "flex-1 rounded-sm transition-all duration-300 border border-apex-border/50",
                  isDone ? "bg-apex-neon border-apex-neon" : isCurrent ? "bg-white border-white" : "bg-apex-surface"
                )} 
              />
            );
          })}
        </div>
      </div>

      {/* Exercise Selector */}
      <div className="px-4 mb-6 flex overflow-x-auto gap-3 snap-x hide-scrollbar">
        {workoutPlan.map((ex, idx) => (
          <button
            key={ex.id}
            onClick={() => {
              triggerHaptic('soft');
              setActiveExercise(idx);
            }}
            className={cn(
              "snap-start shrink-0 p-3 rounded-xl border transition-colors flex flex-col items-start min-w-[140px]",
              activeExercise === idx 
                ? "bg-white text-black border-white" 
                : "bg-apex-card text-apex-text-dim border-apex-border"
            )}
          >
            <span className={cn(
              "text-[10px] font-mono uppercase tracking-wider mb-1",
              activeExercise === idx ? "text-black/60" : "text-apex-neon"
            )}>{ex.target}</span>
            <span className="font-bold text-left line-clamp-1 text-sm uppercase">{ex.name}</span>
          </button>
        ))}
      </div>

      {/* Active Exercise Logger */}
      <div className="px-4 flex-1">
        <div className="bg-apex-card border border-apex-border rounded-2xl p-5 border-t-4 border-t-apex-neon">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-[10px] text-apex-text-dim font-mono uppercase mb-2">Следующий подход</div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2">{exercise.name}</h2>
              <p className="text-apex-text-dim font-mono text-xs">{exercise.sets} ПОДХОДА • {exercise.reps} ПОВТОРЕНИЙ</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-apex-surface flex items-center justify-center border border-apex-border">
              <Dumbbell size={18} className="text-apex-neon" />
            </div>
          </div>

          <div className="space-y-3">
            {Array.from({ length: exercise.sets }).map((_, setIdx) => {
              const isDone = completedSets[exercise.id]?.includes(setIdx);
              return (
                <div 
                  key={setIdx}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                    isDone 
                      ? "bg-apex-neon/10 border-apex-neon/30" 
                      : "bg-apex-surface border-apex-border"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-apex-text-dim font-mono font-bold text-sm w-4">{setIdx + 1}</span>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <span className="text-white font-mono font-black text-lg leading-none">{exercise.targetWeight}</span>
                        <span className="text-[10px] text-apex-neon font-mono">КГ</span>
                      </div>
                      <span className="text-apex-text-dim text-[10px] uppercase font-bold mt-1">× {exercise.reps} ПОВТ</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleSet(exercise.id, setIdx)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                      isDone 
                        ? "bg-apex-neon text-black border-apex-neon" 
                        : "bg-apex-card border border-apex-border text-apex-text-dim"
                    )}
                  >
                    <Check size={20} strokeWidth={isDone ? 4 : 2} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
