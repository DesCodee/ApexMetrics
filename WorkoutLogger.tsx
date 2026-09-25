import { useEffect, useState } from 'react';
import { ApexEngine, UserProfile, WorkoutLog, CNSReadiness, formatTonnage } from '../appEngine';
import { Dumbbell, Play, CheckCircle, ChevronLeft, Brain, Activity, Moon, ShieldAlert, Info, Plus, Trash2, Timer, X, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { loadWorkoutLogs, saveWorkoutLog, auth, logEvent, saveCnsLog } from '../firebase';
import { tgHaptic } from '../utils/haptics';
import CnsRecoveryModal from './CnsRecoveryModal';

export default function Workouts({ user }: { user: UserProfile }) {
  // Resilient draft loader for 0ms lag & no race conditions
  const initialDraft = (() => {
    try {
      const cachedSession = localStorage.getItem('apex_active_session');
      const cachedData = localStorage.getItem('apex_session_data');
      const cachedStart = localStorage.getItem('apex_session_start_time');
      if (cachedSession || cachedData || cachedStart) {
        const parsedStart = cachedStart ? parseInt(cachedStart, 10) : 0;
        const now = Date.now();
        const isFresh = parsedStart > 0 && (now - parsedStart < 12 * 60 * 60 * 1000) && (parsedStart <= now + 60000);
        if (isFresh && cachedSession && cachedData) {
          const session = JSON.parse(cachedSession);
          const data = JSON.parse(cachedData);
          if (session && typeof data === 'object' && Object.keys(data).length > 0) {
            return { session, data, startTime: parsedStart };
          }
        }
        // Cleanup expired (>=12h) or corrupt draft immediately
        localStorage.removeItem('apex_active_session');
        localStorage.removeItem('apex_session_data');
        localStorage.removeItem('apex_session_start_time');
        localStorage.removeItem('apex_rest_target_ts');
        localStorage.removeItem('apex_rest_total');
      }
    } catch {}
    return null;
  })();

  const [activeSession, setActiveSession] = useState<any | null>(() => initialDraft?.session || null);
  const [sessionData, setSessionData] = useState<any>(() => initialDraft?.data || {});
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(() => initialDraft?.startTime || null);
  const [recoveredNotice, setRecoveredNotice] = useState<boolean>(() => Boolean(initialDraft));
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  
  // View states: 'idle' (list) -> 'cns_check' (sliders) -> 'cns_result' -> 'logging' (gym log) -> 'summary'
  const [viewState, setViewState] = useState<'idle' | 'cns_check' | 'cns_result' | 'logging' | 'summary'>(() => initialDraft ? 'logging' : 'idle');
  
  // Auto-hide recovered notification
  useEffect(() => {
    if (recoveredNotice) {
      const t = setTimeout(() => setRecoveredNotice(false), 5000);
      return () => clearTimeout(t);
    }
  }, [recoveredNotice]);
  
  // CNS States
  const [sleepHours, setSleepHours] = useState(7);
  const [soreness, setSoreness] = useState(1);
  const [stress, setStress] = useState(1);
  const [cnsResult, setCnsResult] = useState<CNSReadiness | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Summary States
  const [summaryData, setSummaryData] = useState<any>(null);
  
  // Resilient Rest Timer using absolute target timestamp
  const [restTimer, setRestTimer] = useState(0);
  const [restTargetTs, setRestTargetTs] = useState<number | null>(null);
  const [restActive, setRestActive] = useState(false);
  const [restTotal, setRestTotal] = useState(60);

  // Initialize and restore timer from localStorage if app was backgrounded
  useEffect(() => {
    try {
      const savedTarget = localStorage.getItem('apex_rest_target_ts');
      const savedTotal = localStorage.getItem('apex_rest_total');
      if (savedTarget) {
        const target = parseInt(savedTarget, 10);
        const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
        if (remaining > 0) {
          setRestTargetTs(target);
          setRestTimer(remaining);
          setRestTotal(savedTotal ? parseInt(savedTotal, 10) : remaining);
          setRestActive(true);
        } else {
          // Rest finished while app was backgrounded/minimized
          tgHaptic('success');
          localStorage.removeItem('apex_rest_target_ts');
          localStorage.removeItem('apex_rest_total');
        }
      }
    } catch {}
  }, []);

  // Timer loop driven by real timestamps (handles app minimization safely)
  useEffect(() => {
    if (!restActive || !restTargetTs) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((restTargetTs - Date.now()) / 1000));
      setRestTimer(remaining);

      if (remaining <= 0) {
        tgHaptic('success');
        setRestActive(false);
        setRestTargetTs(null);
        localStorage.removeItem('apex_rest_target_ts');
        localStorage.removeItem('apex_rest_total');
      }
    };

    tick();
    const interval = setInterval(tick, 500);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [restActive, restTargetTs]);

  const startRest = (sec: number) => {
      tgHaptic('light');
      const target = Date.now() + sec * 1000;
      setRestTotal(sec);
      setRestTimer(sec);
      setRestTargetTs(target);
      setRestActive(true);
      try {
        localStorage.setItem('apex_rest_target_ts', String(target));
        localStorage.setItem('apex_rest_total', String(sec));
      } catch {}
  };

  const stopRest = () => {
      tgHaptic('light');
      setRestActive(false);
      setRestTimer(0);
      setRestTargetTs(null);
      try {
        localStorage.removeItem('apex_rest_target_ts');
        localStorage.removeItem('apex_rest_total');
      } catch {}
  };


  const [isLogging, setIsLogging] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronous workout draft helper
  const syncWorkoutDraft = (session: any, data: any, startTime?: number) => {
    try {
      if (session && data) {
        localStorage.setItem('apex_active_session', JSON.stringify(session));
        localStorage.setItem('apex_session_data', JSON.stringify(data));
        if (startTime) {
          localStorage.setItem('apex_session_start_time', String(startTime));
        }
      }
    } catch (e) {
      console.warn('Draft save error', e);
    }
  };

  const clearWorkoutDraft = () => {
    try {
      localStorage.removeItem('apex_active_session');
      localStorage.removeItem('apex_session_data');
      localStorage.removeItem('apex_session_start_time');
      localStorage.removeItem('apex_rest_target_ts');
      localStorage.removeItem('apex_rest_total');
    } catch {}
  };

  useEffect(() => {
    // Manage closing confirmation and local storage sync
    const tg = (window as any).Telegram?.WebApp;
    if (viewState === 'logging' && activeSession) {
      if (tg?.enableClosingConfirmation) tg.enableClosingConfirmation();
      syncWorkoutDraft(activeSession, sessionData, sessionStartTime || Date.now());
    } else {
      if (tg?.disableClosingConfirmation) tg.disableClosingConfirmation();
      if (viewState === 'idle' || viewState === 'summary') {
        clearWorkoutDraft();
      }
    }
    return () => {
      if (tg?.disableClosingConfirmation) tg.disableClosingConfirmation();
    };
  }, [viewState, activeSession, sessionData, sessionStartTime]);

  const [regenerating, setRegenerating] = useState(false);

  const fetchOrGeneratePlans = async (force = false) => {
    setLoading(true);
    setError(null);
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    const uid = auth.currentUser.uid;
    
    let loaded = force ? [] : await loadWorkoutLogs(uid);

    if (loaded.length === 0) {
       const fallbackData = {
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

       try {
           const forceFallback = localStorage.getItem('apex_force_fallback') === 'true';
           const controller = new AbortController();
           const timeoutId = setTimeout(() => controller.abort(), 7000);
           
           let data = fallbackData;
           try {
             const res = await fetch('/api/generateWorkout', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ profile: user, forceFallback }),
                 signal: controller.signal
             });
             clearTimeout(timeoutId);
             
             if (!res.ok) {
                 setOfflineNotice('Использую офлайн-режим генерации');
                 setTimeout(() => setOfflineNotice(null), 4500);
                 data = fallbackData;
             } else {
                 const json = await res.json();
                 data = json.workouts && json.workouts.length > 0 ? json : fallbackData;
                 if (json.source === 'fallback') {
                   setOfflineNotice('Использую офлайн-режим генерации');
                   setTimeout(() => setOfflineNotice(null), 4500);
                 }
             }
           } catch (fetchErr: any) {
             clearTimeout(timeoutId);
             setOfflineNotice('Использую офлайн-режим генерации');
             setTimeout(() => setOfflineNotice(null), 4500);
             data = fallbackData;
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

  const forceRegeneratePlans = async () => {
    if (!auth.currentUser || regenerating) return;
    tgHaptic('medium');
    setRegenerating(true);
    const uid = auth.currentUser.uid;
    try {
      localStorage.removeItem(`apex_workouts_${uid}`);
      setPlans([]);
      await fetchOrGeneratePlans(true);
      tgHaptic('success');
    } catch {
      tgHaptic('warning');
    } finally {
      setRegenerating(false);
    }
  };

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
      const setsCount = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : 3);
      initialData[i] = Array.from({ length: setsCount }).map((_, sIdx) => {
        const prevWeight = Array.isArray(ex.sets) && ex.sets[sIdx]?.weight !== undefined ? String(ex.sets[sIdx].weight) : '';
        const prevReps = Array.isArray(ex.sets) && ex.sets[sIdx]?.reps !== undefined ? String(ex.sets[sIdx].reps) : (typeof ex.reps === 'number' ? String(ex.reps) : '');
        return { 
          weight: prevWeight, 
          reps: prevReps, 
          rpe: Array.isArray(ex.sets) && ex.sets[sIdx]?.rpe ? ex.sets[sIdx].rpe : (ex.rpe || 8),
          completed: false
        };
      });
    });
    const now = Date.now();
    setSessionData(initialData);
    setSessionStartTime(now);
    setViewState('logging');
    syncWorkoutDraft(activeSession, initialData, now);
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    setSessionData((prev: any) => {
      const currentSets = prev[exerciseIndex] || [];
      const updated = currentSets.map((s: any, idx: number) => {
        if (idx === setIndex) {
          const nextState = !s.completed;
          if (nextState) {
            tgHaptic('medium');
            // Auto start rest timer on completing set
            startRest(90);
          } else {
            tgHaptic('light');
          }
          return { ...s, completed: nextState };
        }
        return s;
      });
      const nextData = { ...prev, [exerciseIndex]: updated };
      syncWorkoutDraft(activeSession, nextData, sessionStartTime || Date.now());
      return nextData;
    });
  };

  const [expandedSetKey, setExpandedSetKey] = useState<string | null>(null);

  const toggleExpandSet = (exIdx: number, setIdx: number) => {
    tgHaptic('light');
    const key = `${exIdx}-${setIdx}`;
    setExpandedSetKey(prev => prev === key ? null : key);
  };

  const addSet = (exerciseIndex: number) => {
    triggerHaptic();
    setSessionData((prev: any) => {
      const currentSets = prev[exerciseIndex] || [];
      const lastSet = currentSets[currentSets.length - 1] || { weight: '', reps: '', rpe: 8 };
      const nextData = {
        ...prev,
        [exerciseIndex]: [
          ...currentSets,
          { weight: lastSet.weight || '', reps: lastSet.reps || '', rpe: lastSet.rpe || 8, completed: false }
        ]
      };
      syncWorkoutDraft(activeSession, nextData, sessionStartTime || Date.now());
      return nextData;
    });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    triggerHaptic();
    setSessionData((prev: any) => {
      const currentSets = prev[exerciseIndex] || [];
      if (currentSets.length <= 1) return prev;
      const nextData = {
        ...prev,
        [exerciseIndex]: currentSets.filter((_: any, idx: number) => idx !== setIndex)
      };
      syncWorkoutDraft(activeSession, nextData, sessionStartTime || Date.now());
      return nextData;
    });
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
    // Clean string input (allow empty, Russian commas)
    if (value === '') {
      setSessionData((prev: any) => {
        const newData = { ...prev };
        newData[exerciseIndex][setIndex][field] = '';
        syncWorkoutDraft(activeSession, newData, sessionStartTime || Date.now());
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
      syncWorkoutDraft(activeSession, newData, sessionStartTime || Date.now());
      return newData;
    });
  };

  const cancelSessionDraft = () => {
    tgHaptic('warning');
    if (confirm('Отменить текущую тренировку и удалить черновик?')) {
      clearWorkoutDraft();
      setActiveSession(null);
      setSessionData({});
      setSessionStartTime(null);
      setViewState('idle');
    }
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
          reps: ex.reps || '10',
          rpe: ex.rpe || 8,
          sets: sessionData[i].map((s: any) => ({
            weight: Number(s.weight) || 0,
            reps: Number(s.reps) || 0,
            rpe: Number(s.rpe) || ex.rpe || 8
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
          <div className="text-center text-neutral-400 text-xs mt-4 animate-pulse">Синхронизация с AI тренером...</div>
       </div>
     );
  }

  if (viewState === 'cns_check') {
    return (
      <div className="px-6 py-6 space-y-6 animate-in slide-in-from-right duration-300 max-w-lg mx-auto pb-28">
        <button onClick={() => setViewState('idle')} className="flex items-center text-neutral-400 hover:text-white gap-1 text-xs font-normal">
          <ChevronLeft size={16} strokeWidth={1.5} /> Назад
        </button>
        <div>
          <h1 className="text-2xl font-light tracking-tight text-white mb-1.5 font-sans">Check-in ЦНС</h1>
          <p className="text-neutral-400 text-xs font-normal leading-relaxed">Оцени свое состояние перед тренировкой, чтобы скорректировать объем и избежать перетренированности.</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white/[0.02] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-normal text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Moon size={15} strokeWidth={1.5} /> Сон
              </label>
              <span className="text-white font-light text-base tabular-nums">{sleepHours} ч</span>
            </div>
            <input type="range" min="0" max="12" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
          </div>

          <div className="bg-white/[0.02] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-normal text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Activity size={15} strokeWidth={1.5} /> Мышечная боль (1-10)
              </label>
              <span className="text-white font-light text-base tabular-nums">{soreness}</span>
            </div>
            <input type="range" min="1" max="10" step="1" value={soreness} onChange={(e) => setSoreness(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
          </div>

          <div className="bg-white/[0.02] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-normal text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={15} strokeWidth={1.5} /> Уровень стресса (1-10)
              </label>
              <span className="text-white font-light text-base tabular-nums">{stress}</span>
            </div>
            <input type="range" min="1" max="10" step="1" value={stress} onChange={(e) => setStress(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
          </div>
        </div>

        <button 
          onClick={calculateCns}
          className="w-full bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium text-sm py-4 px-4 rounded-xl uppercase tracking-wider active:scale-[0.98] transition-transform shadow-none"
        >
          Анализировать состояние
        </button>
      </div>
    );
  }

  if (viewState === 'cns_result' && cnsResult) {
    return (
      <div className="px-6 py-6 space-y-6 animate-in zoom-in-95 duration-300 max-w-lg mx-auto pb-28 flex flex-col items-center justify-center min-h-[75vh]">
        <div className="relative w-32 h-32 mb-2">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1F1F1F" strokeWidth="3" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={cnsResult.status === 'Optimal' ? '#10B981' : cnsResult.status === 'Moderate' ? '#F59E0B' : '#EF4444'} strokeWidth="3" strokeDasharray="283" strokeDashoffset={283 * (1 - cnsResult.score / 100)} className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-light tracking-tight text-white tabular-nums">{cnsResult.score}%</div>
            <div className="text-xs text-neutral-400 uppercase font-normal tracking-wider">ЦНС</div>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-light tracking-tight text-white mb-1.5 font-sans">
            {cnsResult.status === 'Optimal' ? 'Готов на 100%' : cnsResult.status === 'Moderate' ? 'Средняя готовность' : 'Истощение ЦНС'}
          </h2>
          <p className="text-neutral-400 text-xs font-normal max-w-xs mx-auto leading-relaxed">{cnsResult.recommendation}</p>
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
              className="w-full bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium text-sm py-4 px-4 rounded-xl active:scale-[0.98] transition-transform uppercase tracking-wider shadow-none flex items-center justify-center gap-2"
            >
              <ShieldAlert size={18} strokeWidth={1.5} />
              Адаптировать под ЦНС (Smart Deload)
            </button>
          )}

          {cnsResult.status === 'Optimal' && (
            <button 
              onClick={proceedToWorkout}
              className="w-full bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium text-sm py-4 px-4 rounded-xl active:scale-[0.98] transition-transform uppercase tracking-wider shadow-none"
            >
              Начать тренировку
            </button>
          )}

          <button 
            onClick={() => {
              triggerHaptic();
              setShowRecoveryModal(true);
            }}
            className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-white font-normal text-sm py-4 px-4 rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <Brain size={16} strokeWidth={1.5} className="text-neutral-400" />
            Протокол восстановления ЦНС
          </button>

          {cnsResult.status !== 'Optimal' && (
            <button 
              onClick={proceedToWorkout}
              className="w-full bg-transparent text-neutral-400 hover:text-white font-normal text-xs py-2 transition-colors"
            >
              Тренироваться по плану (Hardcore)
            </button>
          )}

          <button 
            onClick={() => setViewState('idle')}
            className="w-full text-neutral-500 hover:text-neutral-300 text-xs py-1 transition-colors"
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
      <div className="px-6 py-6 space-y-6 animate-in slide-in-from-right duration-300 max-w-lg mx-auto pb-28">
        {/* Recovery and offline alerts */}
        {recoveredNotice && (
          <div className="bg-white/[0.03] rounded-xl p-3 flex items-center justify-between animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-xs text-neutral-300 font-normal">
              <CheckCircle size={15} strokeWidth={1.5} className="text-emerald-400" />
              <span>Прогресс тренировки восстановлен</span>
            </div>
            <button 
              onClick={() => setRecoveredNotice(false)} 
              className="text-neutral-400 hover:text-white text-xs px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {offlineNotice && (
          <div className="bg-white/[0.03] rounded-xl p-3 flex items-center gap-2 text-xs text-neutral-400 font-normal animate-in fade-in duration-300">
            <Info size={15} strokeWidth={1.5} className="shrink-0" />
            <span>{offlineNotice}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <button onClick={() => setViewState('idle')} className="flex items-center text-neutral-400 hover:text-white gap-1 text-xs font-normal">
            <ChevronLeft size={16} strokeWidth={1.5} /> Назад к списку
          </button>
          <button 
            type="button"
            onClick={cancelSessionDraft} 
            className="text-neutral-400 hover:text-red-400 text-xs px-3 py-1.5 rounded-xl bg-white/[0.04] active:scale-95 transition-all"
          >
            Сбросить черновик
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-light tracking-tight text-white font-sans">{activeSession.title}</h1>
          {activeSession.isDeload && (
            <div className="mt-2.5 bg-white/[0.03] rounded-2xl p-4 flex items-center gap-3">
              <ShieldAlert size={16} strokeWidth={1.5} className="text-amber-400 shrink-0" />
              <div className="text-xs text-neutral-400 leading-relaxed font-normal">
                <span className="text-white font-medium">Smart Deload: </span>
                Снижена осевая нагрузка, RPE 6-7, фокус на приток крови без отказа.
              </div>
            </div>
          )}
        </div>

        {/* Floating Rest Timer */}
        {restActive && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-neutral-900 text-white border border-neutral-800 px-5 py-2.5 rounded-xl font-mono text-sm flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
                <Timer size={16} strokeWidth={1.5} className="text-[#D4FF00]" />
                <span className="w-14 text-center tracking-wider tabular-nums">{Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}</span>
                <button onClick={stopRest} className="bg-white/[0.06] hover:bg-white/[0.12] rounded-lg p-1 transition-colors"><X size={13} strokeWidth={1.5} /></button>
            </div>
        )}
        
        {/* Rest presets */}
        <div className="flex gap-2">
            <button onClick={() => startRest(60)} className="flex-1 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl py-2 text-xs font-normal text-neutral-400 active:scale-95 transition-transform hover:text-white">60s</button>
            <button onClick={() => startRest(90)} className="flex-1 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl py-2 text-xs font-normal text-neutral-400 active:scale-95 transition-transform hover:text-white">90s</button>
            <button onClick={() => startRest(120)} className="flex-1 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl py-2 text-xs font-normal text-neutral-400 active:scale-95 transition-transform hover:text-white">120s</button>
        </div>

        {/* Exercises */}
        <div className="space-y-6">
          {activeSession.exercises?.map((ex: any, i: number) => (
            <div key={i} className="bg-white/[0.02] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-baseline">
                <div className="font-normal text-base text-white">{ex.name}</div>
                <div className="text-xs text-neutral-400 flex gap-2">
                   <span>{typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : 3)} × {typeof ex.reps === 'string' || typeof ex.reps === 'number' ? ex.reps : '10'}</span>
                   <span>RPE {ex.rpe || 8}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex text-xs font-normal text-neutral-400 uppercase tracking-wider px-2 mb-1 items-center">
                  <div className="w-8 text-center">#</div>
                  <div className="flex-1 text-center">Вес (кг)</div>
                  <div className="flex-1 text-center">Повторы</div>
                  <div className="w-9 text-center">✓</div>
                </div>

                {sessionData[i]?.map((set: any, sIdx: number) => {
                  const setKey = `${i}-${sIdx}`;
                  const isExpanded = expandedSetKey === setKey;

                  return (
                    <div key={sIdx} className="space-y-1.5">
                      <div 
                        className={`flex gap-2 items-center p-1.5 rounded-xl transition-all ${
                          set.completed ? 'bg-white/[0.04]' : 'bg-neutral-900/50'
                        }`}
                      >
                        {/* Set button - tap to toggle RPE & Delete drawer */}
                        <button
                          type="button"
                          onClick={() => toggleExpandSet(i, sIdx)}
                          className={`w-8 h-9 text-xs font-normal rounded-xl flex items-center justify-center transition-all ${
                            set.completed 
                              ? 'text-white bg-white/[0.08]' 
                              : isExpanded 
                                ? 'text-white bg-white/[0.12]' 
                                : 'text-neutral-400 bg-white/[0.03] hover:text-white'
                          }`}
                          title="Настройки подхода (RPE, удалить)"
                        >
                          {sIdx + 1}
                        </button>

                        <input 
                          type="text" 
                          inputMode="decimal"
                          placeholder="0"
                          value={set.weight}
                          onChange={(e) => updateSet(i, sIdx, 'weight', e.target.value)}
                          className="flex-1 w-0 bg-neutral-900/60 border-0 rounded-xl py-2 px-1 text-center text-white text-base font-light outline-none focus:ring-1 focus:ring-neutral-700 transition-colors" 
                        />

                        <input 
                          type="text" 
                          inputMode="numeric"
                          placeholder="0"
                          value={set.reps}
                          onChange={(e) => updateSet(i, sIdx, 'reps', e.target.value)}
                          className="flex-1 w-0 bg-neutral-900/60 border-0 rounded-xl py-2 px-1 text-center text-white text-base font-light outline-none focus:ring-1 focus:ring-neutral-700 transition-colors" 
                        />

                        {/* Completion Checkmark Button */}
                        <button
                          type="button"
                          onClick={() => toggleSetComplete(i, sIdx)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            set.completed 
                              ? 'bg-white text-black' 
                              : 'bg-white/[0.04] text-neutral-400 hover:text-white'
                          }`}
                          title={set.completed ? "Подход выполнен" : "Отметить подход"}
                        >
                          <CheckCircle size={17} strokeWidth={1.5} />
                        </button>
                      </div>

                      {/* Expandable sub-row for RPE & Delete */}
                      {isExpanded && (
                        <div className="bg-neutral-900/80 rounded-xl p-3 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-normal text-neutral-400">RPE:</span>
                            <div className="flex gap-1">
                              {[7, 8, 9, 10].map(rpeVal => (
                                <button
                                  key={rpeVal}
                                  type="button"
                                  onClick={() => updateSet(i, sIdx, 'rpe', String(rpeVal))}
                                  className={`w-7 h-7 text-xs font-normal rounded-xl transition-all ${
                                    Number(set.rpe) === rpeVal 
                                      ? 'bg-white text-black font-medium'
                                      : 'bg-white/[0.04] text-neutral-400 hover:text-white'
                                  }`}
                                >
                                  {rpeVal}
                                </button>
                              ))}
                            </div>
                            <button type="button" onClick={showRpeInfo} className="text-neutral-400 hover:text-white p-1">
                              <Info size={13} strokeWidth={1.5} />
                            </button>
                          </div>

                          {sessionData[i]?.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeSet(i, sIdx)}
                              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-red-500/10 text-neutral-400 hover:text-red-400 text-xs font-normal flex items-center gap-1 transition-all"
                              title="Удалить подход"
                            >
                              <Trash2 size={13} strokeWidth={1.5} />
                              <span>Удалить</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add set button */}
              <button 
                type="button" 
                onClick={() => addSet(i)}
                className="mt-3.5 w-full py-2.5 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl flex items-center justify-center gap-1.5 text-xs font-normal text-neutral-400 hover:text-white transition-all"
              >
                <Plus size={14} strokeWidth={1.5} />
                <span>Добавить подход</span>
              </button>
            </div>
          ))}
        </div>
        
        {/* Primary Action Button */}
        <button 
          onClick={finishSession}
          disabled={isLogging}
          className="w-full bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium text-sm py-4 px-4 rounded-xl uppercase tracking-wider active:scale-[0.98] transition-transform shadow-none mt-6 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
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
        <div className="px-6 py-6 space-y-6 animate-in slide-in-from-bottom-8 duration-500 max-w-lg mx-auto pb-28 flex flex-col items-center justify-center min-h-[80vh] text-center">
           <CheckCircle size={36} strokeWidth={1.5} className="text-white mb-2" />
           
           <h1 className="text-2xl font-light tracking-tight text-white mb-1 font-sans">Тренировка завершена!</h1>
           <p className="text-neutral-400 text-xs font-normal mb-6">Отличная работа. Твоя статистика обновлена.</p>
           
           <div className="grid grid-cols-2 gap-4 w-full mb-2">
              <div className="bg-white/[0.02] rounded-2xl p-6 text-center">
                 <div className="text-xs text-neutral-400 font-normal uppercase tracking-wider mb-2">Тоннаж</div>
                 <div className="text-3xl font-light text-white leading-tight tabular-nums">{formattedTonnage.short}</div>
                 {summaryData.currentVolume >= 1000 && (
                    <div className="text-xs text-neutral-400 mt-1.5 tabular-nums font-normal">{summaryData.currentVolume.toLocaleString('ru-RU')} кг</div>
                 )}
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-6 text-center">
                 <div className="text-xs text-neutral-400 font-normal uppercase tracking-wider mb-2">Прогресс</div>
                 <div className="text-3xl font-light leading-tight tabular-nums text-white">
                    {summaryData.percentChange >= 0 ? '+' : ''}{summaryData.percentChange}%
                 </div>
                 <div className="text-xs text-neutral-400 mt-1.5 font-normal">к прошлой сессии</div>
              </div>
           </div>

           {summaryData.currentVolume > 20000 && (
              <div className="bg-white/[0.03] text-neutral-400 text-xs rounded-xl p-4 text-left mb-4 w-full leading-relaxed font-normal">
                 ⚡ <b className="text-white font-medium">Высокий силовой объём:</b> тоннаж рассчитывается как сумма (вес × повторы) по всем подходам. При работе на RPE 10 рекомендуем уделить особое внимание сну и восстановлению ЦНС.
              </div>
           )}

           <button 
             onClick={closeSummary}
             className="w-full bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium text-sm py-4 px-4 rounded-xl active:scale-[0.98] transition-transform uppercase tracking-wider shadow-none"
           >
             Готово
           </button>
        </div>
     );
  }

  return (
    <div className="px-6 py-6 space-y-6 animate-in fade-in duration-500 max-w-lg mx-auto pb-28">
       <header className="pt-2 flex justify-between items-center">
         <div>
           <h1 className="text-2xl font-light tracking-tight text-white font-sans">Программа</h1>
           <p className="text-neutral-400 text-xs mt-1 font-normal flex items-center gap-1.5 uppercase tracking-wider">
             <Brain size={12} strokeWidth={1.5} />
             Smart Engine
           </p>
         </div>
         <button
           type="button"
           onClick={forceRegeneratePlans}
           disabled={regenerating}
           className="px-3 py-1.5 rounded-xl bg-white/[0.04] text-xs font-normal text-neutral-400 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
           title="Перегенерировать программу тренировок через ИИ"
         >
           <Sparkles size={13} strokeWidth={1.5} className={regenerating ? "animate-spin" : ""} />
           <span>{regenerating ? "Генерация..." : "Обновить AI"}</span>
         </button>
       </header>

       {error && (
         <div className="bg-white/[0.02] rounded-2xl p-6 text-center">
           <div className="text-neutral-300 font-medium mb-1">Ошибка</div>
           <div className="text-neutral-400 text-xs">{error}</div>
           <button onClick={() => fetchOrGeneratePlans()} className="mt-3 text-white font-normal text-xs underline">Попробовать снова</button>
         </div>
       )}

       <div className="space-y-3">
         {plans.length > 0 && plans.every((p: any) => p.status === 'completed') && (
           <div className="bg-white/[0.02] border border-[#D4FF00]/30 rounded-2xl p-6 text-center space-y-3">
             <div className="text-sm font-normal text-white flex items-center justify-center gap-2">
               <Trophy size={18} strokeWidth={1.5} className="text-[#D4FF00]" /> Текущий цикл программы завершён!
             </div>
             <div className="text-xs text-neutral-400 font-normal leading-relaxed">
               Отличная работа! Все 3 тренировочных дня закрыты. Вы можете повторить любой день или начать следующий цикл.
             </div>
             <button
               type="button"
               onClick={startNextCycle}
               className="mt-2 w-full bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium text-xs py-3.5 rounded-xl uppercase tracking-wider active:scale-95 transition-all shadow-none"
             >
               Начать новый цикл (Неделя +1)
             </button>
           </div>
         )}

         {plans.length === 0 && !error ? (
           <div className="text-center p-8 bg-white/[0.02] rounded-2xl">
              <div className="text-neutral-400 text-xs font-normal mb-4">Программа еще не сгенерирована.</div>
           </div>
         ) : plans.map((p: any, i: number) => (
           <div 
             key={p.id || i} 
             className={`p-5 rounded-2xl transition-all ${
               p.status === 'next' 
                 ? 'bg-white/[0.02] border border-[#D4FF00]/30' 
                 : 'bg-white/[0.02]'
             } flex items-center justify-between`}
           >
             <div className="flex items-center gap-3.5">
               <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/[0.04] text-neutral-400">
                 {p.status === 'completed' ? <CheckCircle size={18} strokeWidth={1.5} /> : <Dumbbell size={18} strokeWidth={1.5} />}
               </div>
               <div>
                 <div className="text-xs text-neutral-400 font-normal uppercase tracking-wider mb-0.5">Тренировка {i + 1}</div>
                 <div className={`font-normal text-sm ${p.status === 'locked' ? 'text-neutral-500' : 'text-white'}`}>{p.title}</div>
                 {p.status === 'completed' && <div className="text-xs text-neutral-400 font-normal mt-0.5">Завершена</div>}
               </div>
             </div>
             {p.status === 'completed' ? (
               <button 
                 type="button"
                 onClick={() => startCnsCheck(p)} 
                 className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-normal text-neutral-300 flex items-center gap-1.5 active:scale-95 transition-all"
                 title="Повторить тренировку"
               >
                 <RotateCcw size={13} strokeWidth={1.5} />
                 <span>Повтор</span>
               </button>
             ) : (
               <button 
                 type="button"
                 onClick={() => startCnsCheck(p)} 
                 className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-transform ${
                   p.status === 'next' ? 'bg-[#D4FF00] text-black' : 'bg-white/[0.06] text-white hover:bg-white/[0.12]'
                 }`}
                 title="Начать"
               >
                 <Play size={15} strokeWidth={1.5} className="ml-0.5" />
               </button>
             )}
           </div>
         ))}
       </div>
    </div>
  )
}
