import { useEffect, useState } from 'react';
import { ApexEngine, UserProfile, WorkoutLog, CNSReadiness, formatTonnage } from '../appEngine';
import { Dumbbell, Play, CheckCircle, ChevronLeft, Brain, Activity, Moon, ShieldAlert, Info, Plus, Trash2, Timer, X, RotateCcw, Trophy } from 'lucide-react';
import { loadWorkoutLogs, saveWorkoutLog, auth, logEvent, saveCnsLog } from '../firebase';
import { tgHaptic } from '../utils/haptics';
import CnsRecoveryModal from './CnsRecoveryModal';

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
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Summary States
  const [summaryData, setSummaryData] = useState<any>(null);
  const [restTimer, setRestTimer] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [restTotal, setRestTotal] = useState(60);

  useEffect(() => {
    let interval: any;
    if (restActive && restTimer > 0) {
        interval = setInterval(() => {
            setRestTimer((prev) => {
                if (prev <= 1) {
                    tgHaptic('success');
                    setRestActive(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    } else if (restTimer === 0 && restActive) {
        setRestActive(false);
    }
    return () => clearInterval(interval);
  }, [restActive, restTimer]);

  const startRest = (sec: number) => {
      tgHaptic('light');
      setRestTotal(sec);
      setRestTimer(sec);
      setRestActive(true);
  };
  const stopRest = () => {
      tgHaptic('light');
      setRestActive(false);
      setRestTimer(0);
  };


  const [isLogging, setIsLogging] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for active session recovery
    const cachedSession = localStorage.getItem('apex_active_session');
    const cachedData = localStorage.getItem('apex_session_data');
    if (cachedSession && cachedData) {
      try {
        setActiveSession(JSON.parse(cachedSession));
        setSessionData(JSON.parse(cachedData));
        setViewState('logging');
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    // Manage closing confirmation and local storage sync
    const tg = (window as any).Telegram?.WebApp;
    if (viewState === 'logging' && activeSession) {
      if (tg?.enableClosingConfirmation) tg.enableClosingConfirmation();
      localStorage.setItem('apex_active_session', JSON.stringify(activeSession));
      localStorage.setItem('apex_session_data', JSON.stringify(sessionData));
    } else {
      if (tg?.disableClosingConfirmation) tg.disableClosingConfirmation();
      if (viewState === 'idle' || viewState === 'summary') {
          localStorage.removeItem('apex_active_session');
          localStorage.removeItem('apex_session_data');
      }
    }
    return () => {
      if (tg?.disableClosingConfirmation) tg.disableClosingConfirmation();
    };
  }, [viewState, activeSession, sessionData]);

  const fetchOrGeneratePlans = async () => {
    setLoading(true);
    setError(null);
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    const uid = auth.currentUser.uid;
    
    let loaded = await loadWorkoutLogs(uid);

    if (loaded.length === 0) {
       try {
           const forceFallback = localStorage.getItem('apex_force_fallback') === 'true';
           const res = await fetch('/api/generateWorkout', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ profile: user, forceFallback })
           });
           
           let data;
           if (!res.ok) {
               console.warn('Backend failed, using frontend fallback');
               data = {
                   workouts: [
                      {
                        "title": "Фулбади A",
                        "day": "День 1",
                        "duration": "60 мин",
                        "exercises": [
                          { "name": "Приседания со штангой", "sets": 3, "reps": "8-10", "rpe": 8 },
                          { "name": "Жим штанги лежа", "sets": 3, "reps": "8-10", "rpe": 8 },
                          { "name": "Тяга штанги в наклоне", "sets": 3, "reps": "8-10", "rpe": 8 },
                          { "name": "Выпады с гантелями", "sets": 3, "reps": "10-12", "rpe": 8 },
                          { "name": "Скручивания на пресс", "sets": 3, "reps": "15-20", "rpe": 8 }
                        ]
                      },
                      {
                        "title": "Фулбади B",
                        "day": "День 2",
                        "duration": "60 мин",
                        "exercises": [
                          { "name": "Становая тяга", "sets": 3, "reps": "5-8", "rpe": 8 },
                          { "name": "Армейский жим", "sets": 3, "reps": "8-10", "rpe": 8 },
                          { "name": "Подтягивания", "sets": 3, "reps": "8-12", "rpe": 8 },
                          { "name": "Жим ногами", "sets": 3, "reps": "10-12", "rpe": 8 },
                          { "name": "Планка", "sets": 3, "reps": "60 сек", "rpe": 8 }
                        ]
                      },
                      {
                        "title": "Гипертрофия",
                        "day": "День 3",
                        "duration": "50 мин",
                        "exercises": [
                          { "name": "Жим гантелей под углом", "sets": 3, "reps": "10-12", "rpe": 8 },
                          { "name": "Тяга верхнего блока", "sets": 3, "reps": "10-12", "rpe": 8 },
                          { "name": "Разгибания ног", "sets": 3, "reps": "12-15", "rpe": 9 },
                          { "name": "Сгибания рук со штангой", "sets": 3, "reps": "10-12", "rpe": 9 },
                          { "name": "Разгибания на трицепс", "sets": 3, "reps": "12-15", "rpe": 9 }
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
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  };

  const startCnsCheck = (plan: any) => {
    triggerHaptic();
    setActiveSession(plan);
    setSleepHours(7);
    setSoreness(1);
    setStress(1);
    setViewState('cns_check');
  };

  const startNextCycle = async () => {
    triggerHaptic();
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const resetPlans = plans.map((p: any, index: number) => ({
      ...p,
      status: index === 0 ? 'next' : 'locked',
      updatedAt: Date.now()
    }));
    setPlans(resetPlans);
    for (const p of resetPlans) {
      await saveWorkoutLog(uid, p);
    }
  };

  const calculateCns = async () => {
    triggerHaptic();
    const result = ApexEngine.calculateCNSReadiness(sleepHours, soreness, stress, 0);
    setCnsResult(result);
    setViewState('cns_result');
    logEvent('cns_checked', { score: result.score, status: result.status });
    if (auth.currentUser) {
      await saveCnsLog(auth.currentUser.uid, {
        sleep: sleepHours,
        soreness,
        stress,
        score: result.score,
        status: result.status,
        recommendation: result.recommendation
      });
    }
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

  const addSet = (exerciseIndex: number) => {
    triggerHaptic();
    setSessionData((prev: any) => {
      const currentSets = prev[exerciseIndex] || [];
      const lastSet = currentSets[currentSets.length - 1] || { weight: '', reps: '', rpe: 8 };
      return {
        ...prev,
        [exerciseIndex]: [
          ...currentSets,
          { weight: lastSet.weight || '', reps: lastSet.reps || '', rpe: lastSet.rpe || 8 }
        ]
      };
    });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    triggerHaptic();
    setSessionData((prev: any) => {
      const currentSets = prev[exerciseIndex] || [];
      if (currentSets.length <= 1) return prev;
      return {
        ...prev,
        [exerciseIndex]: currentSets.filter((_: any, idx: number) => idx !== setIndex)
      };
    });
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
    // Clean string input (allow empty, Russian commas)
    if (value === '') {
      setSessionData((prev: any) => {
        const newData = { ...prev };
        newData[exerciseIndex][setIndex][field] = '';
        return newData;
      });
      return;
    }

    const normalized = value.replace(',', '.');
    const numVal = parseFloat(normalized);
    if (isNaN(numVal) || numVal < 0) return;

    let finalValue = normalized;
    if (field === 'weight' && numVal > 500) finalValue = '500';
    if (field === 'reps' && numVal > 100) finalValue = '100';
    if (field === 'rpe' && numVal > 10) finalValue = '10';

    setSessionData((prev: any) => {
      const newData = { ...prev };
      newData[exerciseIndex][setIndex][field] = finalValue;
      return newData;
    });
  };

  const showRpeInfo = () => {
    const tg = (window as any).Telegram?.WebApp;
    const msg = "RPE (Шкала усилий) от 1 до 10:\n\n10 - Отказ (сил нет)\n9 - Запас в 1 повтор\n8 - Запас в 2 повтора\n7 - Запас в 3 повтора\n\nНе доходите до 10 в каждом подходе, чтобы не перегружать нервную систему (ЦНС).";
    if (tg && tg.showAlert) {
      tg.showAlert(msg);
    } else {
      alert(msg);
    }
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

      const currentId = activeSession.id || `workout_${Date.now()}`;
      const workoutLog: WorkoutLog = {
        id: currentId,
        userId: auth.currentUser.uid,
        title: activeSession.title,
        day: activeSession.day,
        duration: activeSession.duration,
        status: 'completed',
        date: new Date().toISOString(),
        exercises: mappedExercises,
        createdAt: activeSession.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      
      await saveWorkoutLog(auth.currentUser.uid, workoutLog);
      
      // Advance next plan if locked
      const updatedPlans = plans.map(p => p.id === currentId ? { ...p, status: 'completed', exercises: mappedExercises } : p);
      const nextLocked = updatedPlans.find(p => p.status === 'locked');
      if (nextLocked) {
        nextLocked.status = 'next';
        await saveWorkoutLog(auth.currentUser.uid, nextLocked);
      }
      setPlans(updatedPlans);

      // Find last previously completed workout for realistic volume comparison
      const previouslyCompleted = plans.filter(p => p.id !== currentId && p.status === 'completed');
      const lastCompleted = previouslyCompleted[previouslyCompleted.length - 1] || null;
      const metrics = ApexEngine.calculateVolumeMetrics(workoutLog, lastCompleted);
      
      setSummaryData({ ...metrics, log: workoutLog });
      
      logEvent('workout_completed', { title: activeSession.title, tonnage: metrics.currentVolume });
      
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
       <div className="p-5 space-y-4 animate-in fade-in duration-300">
         <div className="flex justify-between items-end mb-6">
           <div className="h-8 bg-white/[0.03] backdrop-blur-2xl rounded-lg w-48 animate-pulse"></div>
         </div>
         {[1, 2, 3].map((i) => (
           <div key={i} className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-4 w-full h-32 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-white/[0.06] rounded w-1/3"></div>
              <div className="h-6 bg-white/[0.06] rounded w-2/3"></div>
              <div className="flex gap-2">
                 <div className="h-6 bg-white/[0.06] rounded w-16"></div>
                 <div className="h-6 bg-white/[0.06] rounded w-20"></div>
              </div>
           </div>
         ))}
         <div className="text-center text-neutral-500 text-xs mt-4 animate-pulse">Синхронизация с AI тренером...</div>
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
          <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-white flex items-center gap-2"><Moon size={16} className="text-blue-400"/> Сон</label>
              <span className="text-[#D4FF00] font-bold">{sleepHours} ч</span>
            </div>
            <input type="range" min="0" max="12" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-bold text-white flex items-center gap-2"><Activity size={16} className="text-orange-400"/> Мышечная боль (1-10)</label>
              <span className="text-[#D4FF00] font-bold">{soreness}</span>
            </div>
            <input type="range" min="1" max="10" step="1" value={soreness} onChange={(e) => setSoreness(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
          </div>

          <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5">
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
      <div className="p-5 space-y-6 animate-in zoom-in-95 duration-300 max-w-lg mx-auto pb-24 flex flex-col items-center justify-center min-h-[75vh]">
        <div className="relative w-32 h-32 mb-2">
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
          <h2 className="text-2xl font-serif text-white mb-2">
            {cnsResult.status === 'Optimal' ? 'Готов на 100%' : cnsResult.status === 'Moderate' ? 'Средняя готовность' : 'Истощение ЦНС'}
          </h2>
          <p className="text-neutral-400 text-sm max-w-xs mx-auto leading-relaxed">{cnsResult.recommendation}</p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-2">
          {cnsResult.status !== 'Optimal' && (
            <button 
              onClick={() => {
                triggerHaptic();
                const deloadPlan = ApexEngine.adaptWorkoutForDeload(activeSession);
                setActiveSession(deloadPlan);
                proceedToWorkout();
              }}
              className="w-full bg-[#D4FF00] text-black font-bold text-sm py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(212,255,0,0.3)] flex items-center justify-center gap-2"
            >
              <ShieldAlert size={18} />
              Адаптировать под ЦНС (Smart Deload)
            </button>
          )}

          {cnsResult.status === 'Optimal' && (
            <button 
              onClick={proceedToWorkout}
              className="w-full bg-[#D4FF00] text-black font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(212,255,0,0.3)]"
            >
              Начать тренировку
            </button>
          )}

          <button 
            onClick={() => {
              triggerHaptic();
              setShowRecoveryModal(true);
            }}
            className="w-full bg-white/[0.04] border border-white/[0.1] hover:border-white/[0.2] text-white font-bold text-sm py-3.5 rounded-2xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <Brain size={16} className="text-[#D4FF00]" />
            Протокол восстановления ЦНС
          </button>

          {cnsResult.status !== 'Optimal' && (
            <button 
              onClick={proceedToWorkout}
              className="w-full bg-transparent text-neutral-500 hover:text-neutral-300 font-medium text-xs py-2 transition-colors"
            >
              Тренироваться по плану (Hardcore)
            </button>
          )}

          <button 
            onClick={() => setViewState('idle')}
            className="w-full text-neutral-600 hover:text-neutral-400 text-xs py-1 transition-colors"
          >
            Отложить тренировку на завтра
          </button>
        </div>

        <CnsRecoveryModal 
          isOpen={showRecoveryModal} 
          onClose={() => setShowRecoveryModal(false)} 
          currentScore={cnsResult.score} 
          currentStatus={cnsResult.status} 
          workouts={plans} 
        />
      </div>
    );
  }

  if (viewState === 'logging' && activeSession) {
    return (
      <div className="p-5 space-y-6 animate-in slide-in-from-right duration-300 max-w-lg mx-auto pb-24">
        <button onClick={() => setViewState('idle')} className="flex items-center text-neutral-400 gap-1 mt-2">
          <ChevronLeft size={20} /> Завершить позже
        </button>
        <div>
          <h1 className="text-2xl font-serif text-white">{activeSession.title}</h1>
          {activeSession.isDeload && (
            <div className="mt-3 bg-[#D4FF00]/10 border border-[#D4FF00]/30 rounded-2xl p-3 flex items-center gap-2.5">
              <ShieldAlert size={16} className="text-[#D4FF00] shrink-0" />
              <div className="text-[11px] text-neutral-300 leading-tight">
                <span className="font-bold text-[#D4FF00]">Smart Deload: </span>
                Снижена осевая нагрузка, RPE 6-7, фокус на приток крови без отказа.
              </div>
            </div>
          )}
        </div>
        {/* Floating Rest Timer */}
        {restActive && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#D4FF00] text-black px-4 py-2 rounded-full shadow-lg font-bold flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
                <Timer size={16} />
                <span className="w-12 text-center text-lg">{Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}</span>
                <button onClick={stopRest} className="bg-black/10 rounded-full p-1"><X size={14} /></button>
            </div>
        )}
        
        {/* Rest presets - injected after header */}
        <div className="flex gap-2 my-4">
            <button onClick={() => startRest(60)} className="flex-1 bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-xl py-2 text-xs font-bold text-neutral-400 active:scale-95 transition-transform hover:text-white">60s</button>
            <button onClick={() => startRest(90)} className="flex-1 bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-xl py-2 text-xs font-bold text-neutral-400 active:scale-95 transition-transform hover:text-white">90s</button>
            <button onClick={() => startRest(120)} className="flex-1 bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-xl py-2 text-xs font-bold text-neutral-400 active:scale-95 transition-transform hover:text-white">120s</button>
        </div>

        
        <div className="space-y-8">
          {activeSession.exercises?.map((ex: any, i: number) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-4">
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
                  <div className="flex-1 text-center flex items-center justify-center gap-1 active:scale-95 transition-transform" onClick={showRpeInfo}>
                     RPE <Info size={10} className="text-[#D4FF00]" />
                  </div>
                </div>
                {sessionData[i]?.map((set: any, sIdx: number) => (
                  <div key={sIdx} className="flex gap-2 items-center">
                    <div className="w-8 text-center text-neutral-500 text-sm font-semibold bg-white/[0.06]/50 rounded-lg py-2">{sIdx + 1}</div>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="0"
                      value={set.weight}
                      onChange={(e) => updateSet(i, sIdx, 'weight', e.target.value)}
                      className="flex-1 w-0 bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl rounded-xl py-2 text-center text-white text-sm font-bold outline-none focus:border-[#D4FF00] transition-colors" 
                    />
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="0"
                      value={set.reps}
                      onChange={(e) => updateSet(i, sIdx, 'reps', e.target.value)}
                      className="flex-1 w-0 bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl rounded-xl py-2 text-center text-white text-sm font-bold outline-none focus:border-[#D4FF00] transition-colors" 
                    />
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder={ex.rpe || '8'}
                      value={set.rpe}
                      onChange={(e) => updateSet(i, sIdx, 'rpe', e.target.value)}
                      className={`flex-1 w-0 bg-white/[0.04] border backdrop-blur-xl rounded-xl py-2 text-center text-sm font-bold outline-none transition-colors ${
                        set.rpe === '10' ? 'border-amber-400 text-amber-400 focus:border-amber-400' : 'border-white/[0.06] text-neutral-300 focus:border-[#D4FF00]'
                      }`}
                    />
                    {sessionData[i]?.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeSet(i, sIdx)}
                        className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:text-red-400 transition-colors"
                        title="Удалить подход"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add set button */}
              <button 
                type="button"
                onClick={() => addSet(i)}
                className="mt-3 w-full py-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] rounded-xl flex items-center justify-center gap-1.5 text-xs text-neutral-400 hover:text-[#D4FF00] transition-all"
              >
                <Plus size={13} />
                <span>Добавить подход</span>
              </button>
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
     const formattedTonnage = formatTonnage(summaryData.currentVolume);
     return (
        <div className="p-5 space-y-6 animate-in slide-in-from-bottom-8 duration-500 max-w-lg mx-auto pb-24 flex flex-col items-center justify-center min-h-[80vh] text-center">
           <div className="w-20 h-20 bg-[#D4FF00]/10 rounded-full flex items-center justify-center mb-4 text-[#D4FF00]">
              <CheckCircle size={40} />
           </div>
           
           <h1 className="text-3xl font-serif text-white mb-2">Тренировка завершена!</h1>
           <p className="text-neutral-400 text-sm mb-6">Отличная работа. Твоя статистика обновлена.</p>
           
           <div className="grid grid-cols-2 gap-4 w-full mb-4">
              <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5 text-center">
                 <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Тоннаж</div>
                 <div className="text-2xl font-bold text-white leading-tight">{formattedTonnage.short}</div>
                 {summaryData.currentVolume >= 1000 && (
                    <div className="text-[11px] text-neutral-400 mt-1">{summaryData.currentVolume.toLocaleString('ru-RU')} кг</div>
                 )}
              </div>
              <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5 text-center">
                 <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-2">Прогресс</div>
                 <div className={`text-2xl font-bold leading-tight ${summaryData.percentChange >= 0 ? 'text-[#D4FF00]' : 'text-red-400'}`}>
                    {summaryData.percentChange >= 0 ? '+' : ''}{summaryData.percentChange}%
                 </div>
                 <div className="text-[11px] text-neutral-500 mt-1">к прошлой сессии</div>
              </div>
           </div>

           {summaryData.currentVolume > 20000 && (
              <div className="bg-amber-400/10 border border-amber-400/20 text-amber-200 text-xs rounded-xl p-3.5 text-left mb-6 w-full leading-relaxed">
                 ⚡ <b>Высокий силовой объём:</b> тоннаж рассчитывается как сумма (вес × повторы) по всем подходам. При работе на RPE 10 рекомендуем уделить особое внимание сну и восстановлению ЦНС.
              </div>
           )}

           <button 
             onClick={closeSummary}
             className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-lg hover:bg-neutral-200"
           >
             Готово
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
         {plans.length > 0 && plans.every((p: any) => p.status === 'completed') && (
           <div className="bg-gradient-to-r from-[#D4FF00]/15 via-white/[0.05] to-transparent border border-[#D4FF00]/40 rounded-2xl p-4 text-center space-y-2">
             <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
               <Trophy size={18} className="text-[#D4FF00]" /> Текущий цикл программы завершён!
             </div>
             <div className="text-xs text-neutral-400">
               Отличная работа! Все 3 тренировочных дня закрыты. Вы можете повторить любой день или начать следующий цикл.
             </div>
             <button
               type="button"
               onClick={startNextCycle}
               className="mt-2 w-full bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-bold text-xs py-3 rounded-xl uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_15px_rgba(212,255,0,0.2)]"
             >
               Начать новый цикл (Неделя +1)
             </button>
           </div>
         )}

         {plans.length === 0 && !error ? (
           <div className="text-center p-8 bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl">
              <div className="text-neutral-500 text-sm mb-4">Программа еще не сгенерирована.</div>
           </div>
         ) : plans.map((p: any, i: number) => (
           <div key={p.id || i} className={`p-4 rounded-2xl border transition-all ${p.status === 'completed' ? 'bg-white/[0.03] backdrop-blur-2xl/50 border-neutral-800/50' : p.status === 'next' ? 'bg-[#D4FF00]/5 border-[#D4FF00]/30 shadow-[0_4px_20px_-10px_rgba(212,255,0,0.15)]' : 'bg-white/[0.03] backdrop-blur-2xl border-neutral-800'} flex items-center justify-between`}>
             <div className="flex items-center gap-4">
               <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${p.status === 'completed' ? 'bg-[#D4FF00]/10 text-[#D4FF00]' : p.status === 'next' ? 'bg-[#D4FF00] text-black' : 'bg-white/[0.06] text-neutral-500'}`}>
                 {p.status === 'completed' ? <CheckCircle size={20} /> : <Dumbbell size={20} />}
               </div>
               <div>
                 <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-0.5">Тренировка {i + 1}</div>
                 <div className={`font-semibold text-sm ${p.status === 'locked' ? 'text-neutral-400' : 'text-white'}`}>{p.title}</div>
                 {p.status === 'completed' && <div className="text-[10px] text-[#D4FF00] font-medium mt-0.5">Завершена</div>}
               </div>
             </div>
             {p.status === 'completed' ? (
               <button 
                 type="button"
                 onClick={() => startCnsCheck(p)} 
                 className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-neutral-200 flex items-center gap-1.5 active:scale-95 transition-all border border-white/[0.08]"
                 title="Повторить тренировку"
               >
                 <RotateCcw size={13} className="text-[#D4FF00]" />
                 <span>Повтор</span>
               </button>
             ) : (
               <button 
                 type="button"
                 onClick={() => startCnsCheck(p)} 
                 className="w-10 h-10 rounded-full bg-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00] shrink-0 active:scale-95 transition-transform hover:bg-[#D4FF00]/30"
                 title="Начать"
               >
                 <Play size={16} fill="currentColor" className="ml-1" />
               </button>
             )}
           </div>
         ))}
       </div>
    </div>
  )
}
