import { useEffect, useState } from 'react';
import { UserProfile, WorkoutLog } from '../appEngine';
import { Dumbbell, Play, CheckCircle, ChevronLeft } from 'lucide-react';
import { loadWorkoutLogs, saveWorkoutLog, auth } from '../firebase';

export default function Workouts({ user }: { user: UserProfile }) {
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [sessionData, setSessionData] = useState<any>({});
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
       // Generate from AI
       try {
           const res = await fetch('/api/generateWorkout', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ profile: user })
           });
           
           if (!res.ok) {
               throw new Error('Failed to generate program');
           }
           
           const data = await res.json();
           
           loaded = data.workouts.map((w: any, index: number) => ({
                id: `workout_${Date.now()}_${index}`,
                userId: uid,
                title: w.title,
                day: w.day,
                duration: w.duration,
                status: index === 0 ? 'next' : 'locked',
                exercises: w.exercises.map((e: any, i: number) => ({
                    id: `ex_${i}`,
                    name: e.name,
                    sets: e.sets,
                    reps: e.reps,
                    rpe: 8
                })),
                createdAt: Date.now(),
                updatedAt: Date.now()
           }));

           // Save to DB
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

  const startSession = (plan: any) => {
    setActiveSession(plan);
    const initialData: any = {};
    plan.exercises?.forEach((ex: any, i: number) => {
      initialData[i] = Array.from({ length: typeof ex.sets === 'number' ? ex.sets : 3 }).map(() => ({ weight: '', reps: '', rpe: ex.rpe || 8 }));
    });
    setSessionData(initialData);
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
    setIsLogging(true);
    
    try {
      const workoutLog: WorkoutLog = {
        id: Date.now().toString(),
        userId: auth.currentUser.uid,
        title: activeSession.title,
        day: activeSession.day,
        duration: activeSession.duration,
        status: 'completed',
        date: new Date().toISOString(),
        exercises: activeSession.exercises.map((ex: any, i: number) => ({
          name: ex.name,
          sets: sessionData[i].map((s: any) => ({
            weight: Number(s.weight) || 0,
            reps: Number(s.reps) || 0,
            rpe: Number(s.rpe) || ex.rpe
          }))
        })),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await saveWorkoutLog(auth.currentUser.uid, workoutLog);
      setActiveSession(null);
      // reload plans to reflect completion
      const updatedPlans = await loadWorkoutLogs(auth.currentUser.uid);
      setPlans(updatedPlans);
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении тренировки');
    } finally {
      setIsLogging(false);
    }
  };

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
         <div className="w-8 h-8 border-4 border-[#D4FF00] border-t-transparent rounded-full animate-spin"></div>
         <div className="text-neutral-400 text-sm animate-pulse">Синхронизация с ИИ...</div>
       </div>
     );
  }

  if (activeSession) {
    return (
      <div className="p-5 space-y-6 animate-in slide-in-from-right duration-300 max-w-lg mx-auto pb-24">
        <button onClick={() => setActiveSession(null)} className="flex items-center text-neutral-400 gap-1 mt-2">
          <ChevronLeft size={20} /> Назад
        </button>
        <h1 className="text-2xl font-serif text-white">{activeSession.day}</h1>
        
        <div className="space-y-8">
          {activeSession.exercises?.map((ex: any, i: number) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <div className="font-semibold text-sm text-white mb-1">{ex.name}</div>
              <div className="text-xs text-neutral-500 mb-4">Цель: {ex.sets} подходов • {ex.reps} повторений • RPE {ex.rpe}</div>
              
              <div className="space-y-3">
                <div className="flex text-xs font-semibold text-neutral-500 uppercase tracking-widest px-2">
                  <div className="w-8">#</div>
                  <div className="flex-1 text-center">Вес (кг)</div>
                  <div className="flex-1 text-center">Повт</div>
                </div>
                {sessionData[i]?.map((set: any, sIdx: number) => (
                  <div key={sIdx} className="flex gap-2 items-center">
                    <div className="w-8 text-center text-neutral-500 text-sm font-semibold">{sIdx + 1}</div>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={set.weight}
                      onChange={(e) => updateSet(i, sIdx, 'weight', e.target.value)}
                      className="flex-1 bg-black border border-neutral-800 rounded-xl py-2 px-3 text-center text-white outline-none focus:border-[#D4FF00]" 
                    />
                    <input 
                      type="number" 
                      placeholder="0"
                      value={set.reps}
                      onChange={(e) => updateSet(i, sIdx, 'reps', e.target.value)}
                      className="flex-1 bg-black border border-neutral-800 rounded-xl py-2 px-3 text-center text-white outline-none focus:border-[#D4FF00]" 
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
          className="w-full bg-[#D4FF00] text-black font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(212,255,0,0.3)] disabled:opacity-50"
        >
          {isLogging ? 'Сохранение...' : 'Завершить тренировку'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6 animate-in fade-in duration-500 max-w-lg mx-auto">
       <header className="pt-2">
         <h1 className="text-2xl font-serif text-white">Программа</h1>
         <p className="text-[#D4FF00] text-xs mt-1.5 font-medium flex items-center gap-2 uppercase tracking-widest">
           <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse shadow-[0_0_8px_rgba(212,255,0,0.8)]"></span>
           Сгенерировано ИИ
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
           <div key={p.id || i} className={`p-4 rounded-2xl border transition-all ${p.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' : p.status === 'next' ? 'bg-[#D4FF00]/5 border-[#D4FF00]/30 shadow-[0_4px_20px_-10px_rgba(212,255,0,0.15)]' : 'bg-neutral-900 border-neutral-800'} flex items-center justify-between`}>
             <div className="flex items-center gap-4">
               <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${p.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : p.status === 'next' ? 'bg-[#D4FF00] text-black' : 'bg-neutral-800 text-neutral-500'}`}>
                 {p.status === 'completed' ? <CheckCircle size={20} /> : <Dumbbell size={20} />}
               </div>
               <div>
                 <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-0.5">Тренировка {i + 1}</div>
                 <div className={`font-semibold text-sm ${p.status === 'locked' ? 'text-neutral-400' : 'text-white'}`}>{p.title}</div>
               </div>
             </div>
             {p.status !== 'completed' && (
               <button onClick={() => startSession(p)} className="w-10 h-10 rounded-full bg-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00] shrink-0 active:scale-95 transition-transform">
                 <Play size={16} fill="currentColor" className="ml-1" />
               </button>
             )}
           </div>
         ))}
       </div>
    </div>
  )
}
