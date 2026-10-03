import { useState, useEffect } from 'react';
import { WorkoutLog, ApexEngine, formatTonnage } from '../appEngine';
import { loadWorkoutLogs, auth } from '../firebase';
import { 
  History, Calendar, Dumbbell, TrendingUp, TrendingDown, Minus, 
  ChevronDown, ChevronUp, Clock, ArrowLeft, Sparkles, CheckCircle2 
} from 'lucide-react';
import { tgHaptic } from '../utils/haptics';

interface WorkoutHistoryProps {
  onBack: () => void;
  onStartWorkout?: () => void;
}

export default function WorkoutHistory({ onBack, onStartWorkout }: WorkoutHistoryProps) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      if (auth.currentUser) {
        try {
          const list = await loadWorkoutLogs(auth.currentUser.uid);
          if (isMounted) {
            setWorkouts(list || []);
          }
        } catch (e) {
          console.error('Failed to load workout history', e);
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const getWorkoutTimestamp = (w: any): number => {
    if (w.createdAt) {
      if (typeof w.createdAt === 'number') return w.createdAt;
      if (typeof w.createdAt?.toMillis === 'function') return w.createdAt.toMillis();
      if (typeof w.createdAt?.seconds === 'number') return w.createdAt.seconds * 1000;
    }
    if (w.date) {
      const parsed = new Date(w.date).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (w.updatedAt) {
      if (typeof w.updatedAt === 'number') return w.updatedAt;
      if (typeof w.updatedAt?.toMillis === 'function') return w.updatedAt.toMillis();
      if (typeof w.updatedAt?.seconds === 'number') return w.updatedAt.seconds * 1000;
    }
    return 0;
  };

  // Filter only completed workouts
  const completedWorkouts = workouts.filter((w: any) => w.status === 'completed');

  // Sort from newest to oldest
  const sortedWorkouts = [...completedWorkouts].sort((a, b) => {
    return getWorkoutTimestamp(b) - getWorkoutTimestamp(a);
  });

  const normalizeType = (w: any): string => {
    return (w.title || w.day || 'Тренировка').trim().toLowerCase();
  };

  const formatDate = (w: any): string => {
    const ts = getWorkoutTimestamp(w);
    if (!ts) {
      if (w.date && typeof w.date === 'string') {
        return w.date.split('T')[0];
      }
      return 'Недавняя тренировка';
    }
    const d = new Date(ts);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (w: any): string => {
    const ts = getWorkoutTimestamp(w);
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleExpand = (id: string) => {
    tgHaptic('light');
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-md mx-auto animate-in fade-in duration-300 pb-28">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button 
          onClick={() => { tgHaptic('light'); onBack(); }}
          className="text-[#D4FF00] text-sm font-medium uppercase tracking-widest hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Назад в Дневник
        </button>

        <span className="text-xs text-neutral-400 font-normal uppercase tracking-wider tabular-nums">
          {sortedWorkouts.length} {sortedWorkouts.length === 1 ? 'сессия' : (sortedWorkouts.length > 1 && sortedWorkouts.length < 5 ? 'сессии' : 'сессий')}
        </span>
      </div>

      {/* Screen Title */}
      <header className="space-y-1">
        <h1 className="text-2xl font-light tracking-tight text-white font-sans flex items-center gap-2.5">
          <History size={24} strokeWidth={1.5} className="text-[#D4FF00]" />
          История тренировок
        </h1>
        <p className="text-xs text-neutral-400 font-normal">
          Хронология выполненных тренировок, суммарный тоннаж и прогресс объема
        </p>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="bg-white/[0.02] rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#D4FF00]/20 border-t-[#D4FF00] animate-spin" />
          <span className="text-xs text-neutral-400 font-normal uppercase tracking-wider">
            Загрузка истории...
          </span>
        </div>
      )}

      {/* Empty State */}
      {!loading && sortedWorkouts.length === 0 && (
        <div className="bg-white/[0.02] rounded-2xl p-8 flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-neutral-400 mb-1">
            <Dumbbell size={26} strokeWidth={1.5} />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="text-base font-normal text-white">
              Пока нет завершённых тренировок
            </h3>
            <p className="text-xs text-neutral-400 font-normal leading-relaxed max-w-xs">
              Завершите свою первую тренировку в логгере, и здесь появится полная история с расчётом тоннажа и сравнением с предыдущими сессиями того же типа.
            </p>
          </div>

          {onStartWorkout && (
            <button
              onClick={() => { tgHaptic('medium'); onStartWorkout(); }}
              className="mt-2 bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium text-xs py-3 px-5 rounded-xl uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Dumbbell size={15} />
              Начать тренировку
            </button>
          )}
        </div>
      )}

      {/* Workouts List */}
      {!loading && sortedWorkouts.length > 0 && (
        <div className="space-y-3">
          {sortedWorkouts.map((workout: WorkoutLog, index: number) => {
            // Find the chronologically preceding workout of the same type
            const currentType = normalizeType(workout);
            const prevWorkoutOfSameType = sortedWorkouts
              .slice(index + 1)
              .find(w => normalizeType(w) === currentType);

            // Use the existing calculation logic without inventing a new formula
            const metrics = ApexEngine.calculateVolumeMetrics(workout, prevWorkoutOfSameType);
            const tonnageInfo = formatTonnage(metrics.currentVolume);
            const isExpanded = expandedId === workout.id;
            const timeStr = formatTime(workout);

            return (
              <div 
                key={workout.id || `hist_${index}`}
                className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-5 transition-all space-y-4"
              >
                {/* Header: Title, Day & Date */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white tracking-tight">
                        {workout.title || workout.day || 'Тренировка'}
                      </span>
                      {workout.day && workout.title && (
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 px-2 py-0.5 rounded-full bg-white/[0.04]">
                          {workout.day}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-400 font-normal">
                      <Calendar size={12} strokeWidth={1.5} />
                      <span>{formatDate(workout)}</span>
                      {timeStr && <span>• {timeStr}</span>}
                      {workout.duration && <span>• {workout.duration}</span>}
                    </div>
                  </div>

                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 size={15} strokeWidth={2} />
                  </div>
                </div>

                {/* Metrics Row: Tonnage & Comparison to Previous Session of Same Type */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/[0.04]">
                  {/* Total Tonnage */}
                  <div className="bg-white/[0.02] rounded-xl p-3 space-y-1">
                    <div className="text-[10px] text-neutral-400 font-normal uppercase tracking-wider">
                      Суммарный тоннаж
                    </div>
                    <div className="text-base font-light text-white tracking-tight tabular-nums">
                      {tonnageInfo.short}
                    </div>
                    {metrics.currentVolume >= 1000 && (
                      <div className="text-[10px] text-neutral-400 tabular-nums">
                        {metrics.currentVolume.toLocaleString('ru-RU')} кг
                      </div>
                    )}
                  </div>

                  {/* Comparison with Previous Workout of Same Type */}
                  <div className="bg-white/[0.02] rounded-xl p-3 space-y-1">
                    <div className="text-[10px] text-neutral-400 font-normal uppercase tracking-wider flex items-center gap-1">
                      <span>Сравнение (%)</span>
                    </div>

                    {prevWorkoutOfSameType ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {metrics.percentChange > 0 ? (
                            <span className="text-base font-light text-[#D4FF00] flex items-center gap-1 tabular-nums">
                              <TrendingUp size={15} strokeWidth={2} />
                              +{metrics.percentChange}%
                            </span>
                          ) : metrics.percentChange < 0 ? (
                            <span className="text-base font-light text-rose-400 flex items-center gap-1 tabular-nums">
                              <TrendingDown size={15} strokeWidth={2} />
                              {metrics.percentChange}%
                            </span>
                          ) : (
                            <span className="text-base font-light text-neutral-400 flex items-center gap-1 tabular-nums">
                              <Minus size={15} strokeWidth={2} />
                              0%
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate" title={`vs ${formatDate(prevWorkoutOfSameType)}`}>
                          к прошлой {prevWorkoutOfSameType.title || 'сессии'}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="text-xs font-normal text-neutral-400 flex items-center gap-1 pt-1">
                          <Sparkles size={12} className="text-[#D4FF00]" />
                          Базовая
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          Первая этого типа
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expandable Exercise Breakdown */}
                {Array.isArray(workout.exercises) && workout.exercises.length > 0 && (
                  <div>
                    <button
                      onClick={() => toggleExpand(workout.id)}
                      className="w-full flex items-center justify-between text-xs text-neutral-400 hover:text-white pt-1 transition-colors cursor-pointer"
                    >
                      <span className="font-normal uppercase tracking-wider text-[10px]">
                        Упражнения ({workout.exercises.length})
                      </span>
                      <span className="flex items-center gap-1 text-[11px]">
                        {isExpanded ? 'Скрыть' : 'Детали'}
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-2.5 animate-in fade-in duration-200">
                        {workout.exercises.map((ex: any, exIdx: number) => {
                          const setsList = Array.isArray(ex.sets) ? ex.sets : [];
                          const exVolume = setsList.reduce((acc: number, s: any) => {
                            return acc + ((Number(s.weight) || 0) * (Number(s.reps) || 0));
                          }, 0);

                          return (
                            <div 
                              key={exIdx} 
                              className="bg-neutral-900/50 rounded-xl p-2.5 text-xs space-y-1.5"
                            >
                              <div className="flex justify-between items-center text-white">
                                <span className="font-normal">{ex.name}</span>
                                {exVolume > 0 && (
                                  <span className="text-[10px] text-neutral-400 tabular-nums">
                                    {exVolume.toLocaleString('ru-RU')} кг
                                  </span>
                                )}
                              </div>

                              {setsList.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {setsList.map((s: any, sIdx: number) => (
                                    <span 
                                      key={sIdx}
                                      className="text-[10px] bg-white/[0.04] px-2 py-0.5 rounded text-neutral-300 tabular-nums"
                                    >
                                      {s.weight > 0 ? `${s.weight} кг × ` : ''}{s.reps} повт.
                                      {s.rpe ? ` @${s.rpe}` : ''}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[10px] text-neutral-400">
                                  {typeof ex.sets === 'number' ? `${ex.sets} подх. × ${ex.reps || 10}` : 'Выполнено'}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
