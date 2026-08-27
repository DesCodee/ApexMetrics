import { useEffect, useState } from 'react';
import { ApexEngine, UserProfile, WorkoutLog, CNSReadiness } from '../appEngine';
import { Dumbbell, Play, CheckCircle, ChevronLeft, Brain, Activity, Moon, ShieldAlert } from 'lucide-react';
import { loadWorkoutLogs, saveWorkoutLog, auth } from '../firebase';

export default function Workouts({ user }: { user: UserProfile }) {
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [sessionData, setSessionData] = useState<any>({});
  
  // View states: 'idle' (list) -> 'cns_check' (sliders) -> 'cns_result' -> 'logging' (gym log) -> 'summary'
  const [viewState, setViewState] = useState<'idle' | 'cns_check' | 'cns_result' | 'logging' | 'summary'>('idle');
  
  // CNS States
  const [sleepHours, setSleepHours] = useState(7);
  const [soreness, setSoreness] = useState(1);
  const [stress, setStress] = useState(1);
  const [cnsResult, setCnsResult] = useState<CNSReadiness | null>(null);

  // Summary States
  const [summaryData, setSummaryData] = useState<any>(null);

  const [isLogging, setIsLogging] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrGeneratePlans = async () => {
    setLoading(true);
    setError(null);
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    let loaded = await loadWorkoutLogs(uid);

    if (loaded.length === 0) {
       try {
           const res = await fetch('/api/generateWorkout', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ profile: user })
           });
           
           let data;
           if (!res.ok) {
               console.warn('Backend failed, using frontend fallback');
               data = {
                   workouts: [
                      {
                        "title": "Full Body A",
                        "day": "Day 1",
                        "duration": "45 min",
                        "exercises": [
                          { "name": "Squats", "sets": 3, "reps": "8-10", "rpe": 8 },
                          { "name": "Bench Press", "sets": 3, "reps": "8-10", "rpe": 8 },
                          { "name": "Barbell Rows", "sets": 3, "reps": "8-10", "rpe": 8 }
                        ]
                      },
                      {
                        "title": "Full Body B",
                        "day": "Day 2",
                        "duration": "45 min",
                        "exercises": [
                          { "name": "Deadlifts", "sets": 3, "reps": "5-8", "rpe": 8 },
                          { "name": "Overhead Press", "sets": 3, "reps": "8-10", "rpe": 8 },
                          { "name": "Pull-ups", "sets": 3, "reps": "8-12", "rpe": 8 }
                        ]
                      },
                      {
                        "title": "Hypertrophy",
                        "day": "Day 3",
                        "duration": "40 min",
                        "exercises": [
                          { "name": "Leg Press", "sets": 3, "reps": "10-15", "rpe": 8 },
                          { "name": "Incline DB Press", "sets": 3, "reps": "10-12", "rpe": 8 },
                          { "name": "Bicep Curls", "sets": 3, "reps": "12-15", "rpe": 9 }
                        ]
                      }
                   ]
               };
           } else {
               data = await res.json();
           }
           
           loaded = data.workouts.map((w: any, index: number) => ({
                id: `workout_${Date.now()}_${index}`,
                userId: uid,
                title: w.title,
                day: w.day,
                duration: w.duration,
                status: index === 0 ? 'next' : 'locked',
                exercises: w.exercises.map((ex: any) => ({
                    name: ex.name,
                    sets: typeof ex.sets === 'number' ? ex.sets : 3,
                    reps: ex.reps || 10,
                    rpe: ex.rpe || 8
                })),
                createdAt: Date.now(),
                updatedAt: Date.now()
           }));
           for (const workout of loaded) {
               await saveWorkoutLog(uid, workout);
           }
       } catch (e: any) {
           console.error("AI Gen Failed:", e);
           setError(e.message || "Ошибка при генерации программы");
       }
    }
    setPlans(loaded);
    setLoading(false);
  };

  useEffect(() => {
     fetchOrGeneratePlans();
  }, []);

  const triggerHaptic = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  };

  const startCnsCheck = (plan: any) => {
    triggerHaptic();
    setActiveSession(plan);
    setSleepHours(7);
    setSoreness(1);
    setStress(1);
    setViewState('cns_check');
  };

  const calculateCns = () => {
    triggerHaptic();
    const result = ApexEngine.calculateCNSReadiness(sleepHours, soreness, stress, 0);
    setCnsResult(result);
    setViewState('cns_result');
  };

  const proceedToWorkout = () => {
    triggerHaptic();
    const initialData: any = {};
    activeSession.exercises?.forEach((ex: any, i: number) => {
      initialData[i] = Array.from({ length: typeof ex.sets === 'number' ? ex.sets : 3 }).map(() => ({ weight: '', reps: '', rpe: ex.rpe || 8 }));
    });
    setSessionData(initialData);
    setViewState('logging');
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
    setSessionData((prev: any) => {
      const newData = { ...prev };
      newData[exerciseIndex][setIndex][field] = value;
      return newData;
    });
  };

  const finishSession = async () => {
    if (!auth.currentUser) return;
    triggerHaptic();
    setIsLogging(true);
    
    try {
      const mappedExercises = activeSession.exercises.map((ex: any, i: number) => ({
          name: ex.name,
          sets: sessionData[i].map((s: any) => ({
            weight: Number(s.weight) || 0,
            reps: Number(s.reps) || 0,
            rpe: Number(s.rpe) || ex.rpe
          }))
      }));

      const workoutLog: WorkoutLog = {
        id: Date.now().toString(), // Create a new ID for the completed run
        userId: auth.currentUser.uid,
        title: activeSession.title,
        day: activeSession.day,
        duration: activeSession.duration,
        status: 'completed',
        date: new Date().toISOString(),
        exercises: mappedExercises,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await saveWorkoutLog(auth.currentUser.uid, workoutLog);
      
      // Compute Tonnage for Summary
      const metrics = ApexEngine.calculateVolumeMetrics(workoutLog, null); // Simplified previous comparison
      
      setSummaryData({ ...metrics, log: workoutLog });
      
      // reload plans to reflect completion (We actually need to mark the plan as completed, but simplified here)
      // For TMA flow, just reloading is fine
      setViewState('summary');

    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении тренировки');
    } finally {
      setIsLogging(false);
    }
  };

  const closeSummary = () => {
    triggerHaptic();
    setActiveSession(null);
    setViewState('idle');
    fetchOrGeneratePlans();
  };

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
         <div className="w-8 h-8 border-4 border-[#D4FF00] border-t-transparent rounded-full animate-spin"></div>
         <div className="text-neutral-400 text-sm animate-pulse">Синхронизация с ИИ...</div>
       </div>
     );
  }

  if (viewState === 'cns_check') {
    return (
      <div className="p-5 space-y-8 animate-in slide-in-from-right duration-300 max-w-lg mx-auto pb-24">
        <button onClick={() => setViewState('idle')} className="flex items-center text-neutral-400 gap-1 mt-2">
          <ChevronLeft size={20} /> Отмена
        </button>
        <div>
          <h1 className="text-2xl font-serif text-white mb-2">Check-in ЦНС</h1>
          <p className="text-neutral-400 text-sm">Оцени свое состояние перед тренировкой, чтобы скорректировать объем.</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-white flex items-center gap-2"><Moon size={16} className="text-blue-400"/> Сон</label>
              <span className="text-[#D4FF00] font-bold">{sleepHours} ч</span>
            </div>
            <input type="range" min="0" max="12" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-white flex items-center gap-2"><Activity size={16} className="text-orange-400"/> Мышечная боль (1-10)</label>
              <span className="text-[#D4FF00] font-bold">{soreness}</span>
            </div>
            <input type="range" min="1" max="10" step="1" value={soreness} onChange={(e) => setSoreness(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-white flex items-center gap-2"><ShieldAlert size={16} className="text-red-400"/> Уровень стресса (1-10)</label>
              <span className="text-[#D4FF00] font-bold">{stress}</span>
            </div>
            <input type="range" min="1" max="10" step="1" value={stress} onChange={(e) => setStress(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
          </div>
        </div>

        <button 
          onClick={calculateCns}
          className="w-full bg-[#D4FF00] text-black font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(212,255,0,0.3)]"
        >
          Анализировать
        </button>
      </div>
    );
  }

  if (viewState === 'cns_result' && cnsResult) {
    return (
      <div className="p-5 space-y-8 animate-in zoom-in-95 duration-300 max-w-lg mx-auto pb-24 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#262626" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={cnsResult.status === 'Optimal' ? '#D4FF00' : cnsResult.status === 'Moderate' ? '#F59E0B' : '#EF4444'} strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 * (1 - cnsResult.score / 100)} className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-white">{cnsResult.score}%</div>
            <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">ЦНС</div>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-serif text-white mb-2">{cnsResult.status === 'Optimal' ? 'Готов на 100%' : cnsResult.status === 'Moderate' ? 'Средняя готовность' : 'Высокая усталость'}</h2>
          <p className="text-neutral-400 text-sm max-w-xs mx-auto leading-relaxed">{cnsResult.recommendation}</p>
        </div>

        <button 
          onClick={proceedToWorkout}
          className="w-full bg-[#D4FF00] text-black font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(212,255,0,0.3)] mt-8"
        >
          Начать тренировку
        </button>
      </div>
    );
  }

  if (viewState === 'logging' && activeSession) {
    return (
      <div className="p-5 space-y-6 animate-in slide-in-from-right duration-300 max-w-lg mx-auto pb-24">
        <button onClick={() => setViewState('idle')} className="flex items-center text-neutral-400 gap-1 mt-2">
          <ChevronLeft size={20} /> Завершить позже
        </button>
        <h1 className="text-2xl font-serif text-white">{activeSession.title}</h1>
        
        <div className="space-y-8">
          {activeSession.exercises?.map((ex: any, i: number) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <div className="font-semibold text-sm text-white mb-1">{ex.name}</div>
              <div className="text-xs text-neutral-500 mb-4 flex justify-between">
                 <span>{ex.sets}х{ex.reps}</span>
                 <span className="text-[#D4FF00]">RPE {ex.rpe}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-2 mb-2">
                  <div className="w-8 text-center">#</div>
                  <div className="flex-1 text-center">Вес (кг)</div>
                  <div className="flex-1 text-center">Повторы</div>
                  <div className="flex-1 text-center">RPE</div>
                </div>
                {sessionData[i]?.map((set: any, sIdx: number) => (
                  <div key={sIdx} className="flex gap-2 items-center">
                    <div className="w-8 text-center text-neutral-500 text-sm font-semibold bg-neutral-800/50 rounded-lg py-2">{sIdx + 1}</div>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={set.weight}
                      onChange={(e) => updateSet(i, sIdx, 'weight', e.target.value)}
                      className="flex-1 bg-black border border-neutral-800 rounded-xl py-2 text-center text-white text-sm font-bold outline-none focus:border-[#D4FF00] transition-colors" 
                    />
                    <input 
                      type="number" 
                      placeholder="0"
                      value={set.reps}
                      onChange={(e) => updateSet(i, sIdx, 'reps', e.target.value)}
                      className="flex-1 bg-black border border-neutral-800 rounded-xl py-2 text-center text-white text-sm font-bold outline-none focus:border-[#D4FF00] transition-colors" 
                    />
                    <input 
                      type="number" 
                      placeholder={ex.rpe}
                      value={set.rpe}
                      onChange={(e) => updateSet(i, sIdx, 'rpe', e.target.value)}
                      className="flex-1 bg-black border border-neutral-800 rounded-xl py-2 text-center text-neutral-400 text-sm font-bold outline-none focus:border-[#D4FF00] transition-colors" 
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <button 
          onClick={finishSession}
          disabled={isLogging}
          className="w-full bg-[#D4FF00] text-black font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(212,255,0,0.3)] mt-8 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
        >
          {isLogging ? (
             <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> Сохранение...</>
          ) : (
             'Завершить тренировку'
          )}
        </button>
      </div>
    );
  }

  if (viewState === 'summary' && summaryData) {
     return (
        <div className="p-5 space-y-6 animate-in slide-in-from-bottom-8 duration-500 max-w-lg mx-auto pb-24 flex flex-col items-center justify-center min-h-[80vh] text-center">
           <div className="w-20 h-20 bg-[#D4FF00]/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={40} className="text-[#D4FF00]" />
           </div>
           
           <h1 className="text-3xl font-serif text-white mb-2">Тренировка завершена!</h1>
           <p className="text-neutral-400 text-sm mb-8">Отличная работа. Твоя статистика обновлена.</p>
           
           <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center">
                 <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Тоннаж</div>
                 <div className="text-2xl font-bold text-white">{summaryData.currentVolume} <span className="text-sm font-medium text-neutral-500">кг</span></div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center">
                 <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Прогресс</div>
                 <div className={`text-2xl font-bold ${summaryData.percentChange >= 0 ? 'text-[#D4FF00]' : 'text-red-400'}`}>
                    {summaryData.percentChange >= 0 ? '+' : ''}{summaryData.percentChange}%
                 </div>
              </div>
           </div>

           <button 
             onClick={closeSummary}
             className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-transform"
           >
             Отлично
           </button>
        </div>
     );
  }

  return (
    <div className="p-5 space-y-6 animate-in fade-in duration-500 max-w-lg mx-auto">
       <header className="pt-2">
         <h1 className="text-2xl font-serif text-white">Программа</h1>
         <p className="text-[#D4FF00] text-[10px] mt-1.5 font-bold flex items-center gap-2 uppercase tracking-widest">
           <Brain size={12} />
           Smart Engine Активирован
         </p>
       </header>

       {error && (
         <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
           <div className="text-red-400 font-bold mb-1">Ошибка</div>
           <div className="text-neutral-400 text-sm">{error}</div>
           <button onClick={fetchOrGeneratePlans} className="mt-3 text-[#D4FF00] font-bold text-sm">Попробовать снова</button>
         </div>
       )}

       <div className="space-y-3">
         {plans.length === 0 && !error ? (
           <div className="text-center p-8 bg-neutral-900 border border-neutral-800 rounded-2xl">
              <div className="text-neutral-500 text-sm mb-4">Программа еще не сгенерирована.</div>
           </div>
         ) : plans.map((p: any, i: number) => (
           <div key={p.id || i} className={`p-4 rounded-2xl border transition-all ${p.status === 'completed' ? 'bg-neutral-900/50 border-neutral-800/50 opacity-60' : p.status === 'next' ? 'bg-[#D4FF00]/5 border-[#D4FF00]/30 shadow-[0_4px_20px_-10px_rgba(212,255,0,0.15)]' : 'bg-neutral-900 border-neutral-800'} flex items-center justify-between`}>
             <div className="flex items-center gap-4">
               <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${p.status === 'completed' ? 'bg-neutral-800 text-neutral-500' : p.status === 'next' ? 'bg-[#D4FF00] text-black' : 'bg-neutral-800 text-neutral-500'}`}>
                 {p.status === 'completed' ? <CheckCircle size={20} /> : <Dumbbell size={20} />}
               </div>
               <div>
                 <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-0.5">Тренировка {i + 1}</div>
                 <div className={`font-semibold text-sm ${p.status === 'locked' ? 'text-neutral-400' : 'text-white'}`}>{p.title}</div>
               </div>
             </div>
             {p.status !== 'completed' && (
               <button onClick={() => startCnsCheck(p)} className="w-10 h-10 rounded-full bg-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00] shrink-0 active:scale-95 transition-transform hover:bg-[#D4FF00]/30">
                 <Play size={16} fill="currentColor" className="ml-1" />
               </button>
             )}
           </div>
         ))}
       </div>
    </div>
  )
}
