import { useEffect, useState } from 'react';
import { ApexEngine, UserProfile, WorkoutLog, formatTonnage } from '../appEngine';
import { loadWorkoutLogs, loadDailyStats, auth } from '../firebase';
import { ChevronRight, Droplet, Moon, Brain, ChevronUp, Crown, CheckCircle, ShieldAlert, Sparkles, Dumbbell } from 'lucide-react';
import { motion } from 'motion/react';
import CnsRecoveryModal from '../components/CnsRecoveryModal';

export default function Home({ user, tgUser, onNavigate }: { user: UserProfile, tgUser: any, onNavigate?: (tab: string) => void }) {
  const macros = ApexEngine.calculateTDEE(user.weight, user.height, user.age, user.gender, user.activityLevel, user.goal);
  
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [dailyStats, setDailyStats] = useState<any>({});
  const [showCnsModal, setShowCnsModal] = useState(false);
  
  const todayDateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (auth.currentUser) {
      loadWorkoutLogs(auth.currentUser.uid).then(setWorkouts).catch(console.error);
      loadDailyStats(auth.currentUser.uid, todayDateStr).then(stats => setDailyStats(stats || {})).catch(console.error);
    }
  }, [todayDateStr]);

  // Compute Tonnage from today's completed workouts
  let todayTonnage = 0;
  const todayDateObjStr = new Date().toDateString();
  workouts.forEach((w: any) => {
    if (w.status === 'completed') {
      const dateVal = w.date || w.createdAt;
      let workoutDateStr = '';
      if (typeof dateVal === 'string') {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) workoutDateStr = d.toDateString();
      } else if (typeof dateVal === 'number') {
        workoutDateStr = new Date(dateVal).toDateString();
      } else if (dateVal?.seconds) {
        workoutDateStr = new Date(dateVal.seconds * 1000).toDateString();
      }
      if (workoutDateStr === todayDateObjStr) {
        todayTonnage += ApexEngine.calculateVolumeMetrics(w).currentVolume;
      }
    }
  });

  const protein = Number(dailyStats.protein) || 0;
  const carbs = Number(dailyStats.carbs) || 0;
  const fats = Number(dailyStats.fats) || 0;
  const steps = Number(dailyStats.steps) || 0;
  const waterGlasses = Number(dailyStats.waterGlasses) || 0;

  const consumedCalories = (protein * 4) + (carbs * 4) + (fats * 9);
  
  // Target values
  const targetCalories = macros.calories;
  const targetTonnage = 10000; 
  const targetSteps = 10000;
  
  const calPercent = isNaN(targetCalories) || targetCalories === 0 ? 0 : Math.min(consumedCalories / targetCalories, 1);
  const tonPercent = todayTonnage > 0 ? Math.min(todayTonnage / targetTonnage, 1) : 0;
  const stepPercent = Math.min(steps / targetSteps, 1) * 100;
  const tonnageDisplay = formatTonnage(todayTonnage);
  const nextWorkout = workouts.find((w: any) => w.status === 'next') || workouts.find((w: any) => w.status !== 'completed') || workouts[0];

  return (
    <motion.div 
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.3 }}
       className="px-6 py-6 space-y-6 max-w-lg mx-auto pb-28"
    >
      
      {/* Header */}
      <header className="flex justify-between items-center pt-2">
        <div>
          <div className="text-xs text-neutral-400 font-normal uppercase tracking-widest mb-1">
            Сводка • Сегодня
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white font-sans">
            Доброе утро, {tgUser?.first_name || 'Атлет'}
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-normal text-neutral-400">
          {tgUser?.first_name && tgUser.first_name.length > 0 ? tgUser.first_name[0].toUpperCase() : 'A'}
        </div>
      </header>

      {/* Split Circular Progress (Primary Metric Card) */}
      <div className="bg-white/[0.02] rounded-2xl p-6 relative flex flex-col items-center">
        <svg width="200" height="200" viewBox="0 0 100 100" className="rotate-90">
           {/* Left Half (Calories) */}
           <path d="M 50,5 A 45,45 0 0,0 50,95" fill="none" stroke="#1F1F1F" strokeWidth="2.5" />
           {/* Right Half (Tonnage) */}
           <path d="M 50,5 A 45,45 0 0,1 50,95" fill="none" stroke="#1F1F1F" strokeWidth="2.5" />
           
           {/* Foreground tracks */}
           <path 
             d="M 50,95 A 45,45 0 0,1 50,5" 
             fill="none" 
             stroke="#D4FF00" 
             strokeWidth="2.5" 
             strokeLinecap="round" 
             strokeDasharray="141.3" 
             strokeDashoffset={141.3 * (1 - calPercent)} 
           />
           <path 
             d="M 50,95 A 45,45 0 0,0 50,5" 
             fill="none" 
             stroke="#FFFFFF" 
             strokeWidth="2.5" 
             strokeLinecap="round" 
             strokeDasharray="141.3" 
             strokeDashoffset={141.3 * (1 - tonPercent)} 
           />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <div className="text-xs text-neutral-400 font-normal uppercase tracking-wider mb-1">Калории</div>
           <div className="text-4xl font-light tracking-tight text-white leading-none tabular-nums">{consumedCalories}</div>
           <div className="text-xs text-neutral-400 font-normal mt-1.5 tabular-nums">/ {targetCalories} ккал</div>
        </div>
      </div>

      {/* Macros (Clean Card) */}
      <div className="bg-white/[0.02] rounded-2xl p-5 grid grid-cols-3 gap-3">
         <div className="text-center">
            <div className="w-6 h-[2px] bg-neutral-600 mx-auto mb-2 rounded-full" />
            <div className="text-xs text-neutral-400 font-normal">Белки</div>
            <div className="font-normal text-white text-base tabular-nums mt-0.5">{protein}г</div>
         </div>
         <div className="text-center">
            <div className="w-6 h-[2px] bg-neutral-600 mx-auto mb-2 rounded-full" />
            <div className="text-xs text-neutral-400 font-normal">Углеводы</div>
            <div className="font-normal text-white text-base tabular-nums mt-0.5">{carbs}г</div>
         </div>
         <div className="text-center">
            <div className="w-6 h-[2px] bg-neutral-600 mx-auto mb-2 rounded-full" />
            <div className="text-xs text-neutral-400 font-normal">Жиры</div>
            <div className="font-normal text-white text-base tabular-nums mt-0.5">{fats}г</div>
         </div>
      </div>

      {/* Mini Cards: 3 columns */}
      <div className="grid grid-cols-3 gap-3">
         {/* Water Card */}
         <div className="bg-white/[0.02] rounded-2xl p-4 flex flex-col justify-between h-32">
            <div className="flex items-center gap-1.5 text-neutral-400">
               <Droplet size={14} strokeWidth={1.5} />
               <span className="text-xs uppercase font-normal tracking-wider">Вода</span>
            </div>
            <div>
               <div className="text-white font-light text-xl leading-none mb-2 tabular-nums">{(waterGlasses * 0.25).toFixed(1)} л</div>
               <div className="w-full bg-neutral-900 h-[2px] rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-300 transition-all duration-500" style={{width: `${Math.min((waterGlasses * 0.25) / 3, 1) * 100}%`}} />
               </div>
               <div className="text-xs text-neutral-400 mt-1.5 font-normal">/ 3 л</div>
            </div>
         </div>

         {/* Sleep Card */}
         <div 
           onClick={() => setShowCnsModal(true)}
           className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-4 flex flex-col justify-between h-32 cursor-pointer transition-all active:scale-95"
         >
            <div className="flex items-center justify-between text-neutral-400">
               <div className="flex items-center gap-1.5">
                  <Moon size={14} strokeWidth={1.5} />
                  <span className="text-xs uppercase font-normal tracking-wider">Сон</span>
               </div>
               {dailyStats.sleepHours ? <span className="text-xs text-neutral-400 font-normal">OK</span> : null}
            </div>
            <div>
               <div className="text-white font-light text-xl leading-none mb-2 tabular-nums">
                  {dailyStats.sleepHours ? `${dailyStats.sleepHours} ч` : '--'}
               </div>
               <div className="w-full bg-neutral-900 h-[2px] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-neutral-300 transition-all duration-500" 
                    style={{ width: `${Math.min(((Number(dailyStats.sleepHours) || 0) / 8), 1) * 100}%` }} 
                  />
               </div>
               <div className="text-xs text-neutral-400 mt-1.5 font-normal">
                  {dailyStats.sleepHours ? '/ 8 ч' : 'Замерить'}
               </div>
            </div>
         </div>

         {/* CNS Card */}
         <div 
           onClick={() => setShowCnsModal(true)}
           className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-4 flex flex-col justify-between h-32 cursor-pointer transition-all active:scale-95"
         >
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-1.5 text-neutral-400">
                  <Brain size={14} strokeWidth={1.5} />
                  <span className="text-xs uppercase font-normal tracking-wider">ЦНС</span>
               </div>
               {dailyStats.cnsStatus && (
                  <span className={`w-1.5 h-1.5 rounded-full ${
                     dailyStats.cnsStatus === 'Optimal' ? 'bg-emerald-400' :
                     dailyStats.cnsStatus === 'Moderate' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
               )}
            </div>
            <div>
               <div className="text-white font-light text-xl leading-none mb-2 tabular-nums">
                  {dailyStats.cnsScore ? `${dailyStats.cnsScore}%` : '--'}
               </div>
               <div className="w-full bg-neutral-900 h-[2px] rounded-full overflow-hidden">
                  <div 
                     className="h-full bg-neutral-300 transition-all duration-500" 
                     style={{ width: `${dailyStats.cnsScore || 0}%` }} 
                  />
               </div>
               <div className="text-xs text-neutral-400 mt-1.5 font-normal truncate">
                  {dailyStats.cnsStatus === 'Optimal' ? 'Готовность' :
                   dailyStats.cnsStatus === 'Moderate' ? 'Умеренно' :
                   dailyStats.cnsStatus === 'Fatigued' ? 'Истощение' : 'Замерить'}
               </div>
            </div>
         </div>
      </div>

      {/* CNS Fatigue Alert Banner if fatigued or moderate */}
      {dailyStats.cnsStatus && dailyStats.cnsStatus !== 'Optimal' && (
         <div 
           onClick={() => setShowCnsModal(true)}
           className="cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-5 flex items-center justify-between transition-all"
         >
            <div className="flex items-center gap-3">
               <ShieldAlert size={18} strokeWidth={1.5} className="text-amber-400 shrink-0" />
               <div>
                  <div className="text-sm font-normal text-white flex items-center gap-2">
                     Истощение ЦНС ({dailyStats.cnsScore}%)
                     <span className="text-xs text-neutral-400 font-normal">Smart Deload</span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5 font-normal">
                     Нажмите для протокола реанимации
                  </div>
               </div>
            </div>
            <ChevronRight size={16} strokeWidth={1.5} className="text-neutral-400 shrink-0" />
         </div>
      )}

      {/* Steps Card */}
      <div className="bg-white/[0.02] rounded-2xl p-6">
         <div className="flex justify-between items-center mb-3">
             <div className="text-xs text-neutral-400 font-normal uppercase tracking-wider">Шаги</div>
             <div className="text-white font-light text-base tabular-nums">{steps} <span className="text-xs text-neutral-400 font-normal">/ 10,000</span></div>
         </div>
         <div className="w-full bg-neutral-900 h-[2px] rounded-full overflow-hidden mb-3">
            <div className="h-full bg-neutral-300 transition-all duration-500" style={{ width: `${stepPercent}%` }} />
         </div>
         <div className="flex justify-between items-center text-xs text-neutral-400 font-normal">
             <span>Ок. {Math.round(steps * 0.04)} ккал сожжено</span>
             <span className="text-neutral-300 tabular-nums">{Math.round(stepPercent)}%</span>
         </div>
      </div>

      {/* Empty State: No workouts generated yet */}
      {todayTonnage === 0 && workouts.length === 0 && (
         <div>
            <div className="text-xs text-neutral-400 font-normal uppercase tracking-wider mb-3 px-1">Активность</div>
            <div 
              id="home-empty-workouts-card"
              onClick={() => onNavigate?.('log')}
              className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.98] transition-transform"
            >
                <CheckCircle size={22} strokeWidth={1.5} className="text-neutral-400 mb-2" />
                <div className="text-white font-normal text-base mb-1">Нет тренировок</div>
                <div className="text-xs text-neutral-400 max-w-[240px]">Открой дневник и начни свою первую сессию, чтобы здесь появилась статистика.</div>
                <div className="text-neutral-300 text-xs font-normal mt-3">Открыть дневник →</div>
            </div>
         </div>
      )}

      {/* Next Scheduled Workout: Single Accent Card */}
      {todayTonnage === 0 && workouts.length > 0 && (
         <div>
            <div className="text-xs text-neutral-400 font-normal uppercase tracking-wider mb-3 px-1">План на сегодня</div>
            <div 
              id="home-next-workout-card"
              onClick={() => onNavigate?.('log')}
              className="bg-white/[0.02] border border-[#D4FF00]/30 rounded-2xl p-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
            >
                <div className="flex items-center gap-3.5">
                    <Dumbbell size={18} strokeWidth={1.5} className="text-neutral-300" />
                    <div>
                       <div className="text-white font-normal text-sm">{nextWorkout?.title || 'Следующая тренировка'}</div>
                       <div className="text-xs text-neutral-400 mt-0.5">{nextWorkout?.day || 'День 1'} • {nextWorkout?.duration || '60 мин'}</div>
                    </div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium text-xs uppercase tracking-wider flex items-center gap-1">
                   Начать →
                </div>
            </div>
         </div>
      )}

      {/* Today's Activity: Completed workout with tonnage */}
      {todayTonnage > 0 && (
         <div>
            <div className="text-xs text-neutral-400 font-normal uppercase tracking-wider mb-3 px-1">Активность за сегодня</div>
            
            <div 
              id="home-today-tonnage-card"
              onClick={() => onNavigate?.('log')}
              className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
            >
                <div className="flex items-center gap-3.5">
                    <ChevronUp size={18} strokeWidth={1.5} className="text-neutral-400" />
                    <div>
                       <div className="text-white font-normal text-sm">Тренировка ({tonnageDisplay.full})</div>
                       <div className="text-xs text-neutral-400 mt-0.5">Тоннаж за сессию</div>
                    </div>
                </div>
                <div className="text-white font-normal text-xs uppercase tracking-wider">Завершено</div>
            </div>
         </div>
      )}

      {/* VIP Status Banner */}
      <div 
        id="home-vip-upgrade-banner"
        onClick={() => onNavigate?.('pro')}
        className="bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-5 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform"
      >
         <div className="flex gap-3.5 items-center">
            <Crown size={18} strokeWidth={1.5} className="text-neutral-400" />
            <div>
               <div className="text-white font-normal text-sm">
                 {user.accessState === 'beta-vip' ? 'Apex VIP • Доступ открыт' : 'Apex VIP • Раздел в разработке'}
               </div>
               <div className="text-xs text-neutral-400 mt-0.5 font-normal">
                 {user.accessState === 'beta-vip' ? 'Все экспериментальные фичи активны' : 'Ранний доступ • ИИ тренер • Экспериментальные функции'}
               </div>
            </div>
         </div>
         <ChevronRight size={16} strokeWidth={1.5} className="text-neutral-400" />
      </div>

      {/* CNS Recovery & Analytics Modal */}
      <CnsRecoveryModal 
        isOpen={showCnsModal}
        onClose={() => setShowCnsModal(false)}
        currentScore={dailyStats.cnsScore || 75}
        currentStatus={dailyStats.cnsStatus || 'Optimal'}
        workouts={workouts}
        onCnsUpdated={(newScore, newStatus) => {
          setDailyStats((prev: any) => ({
            ...prev,
            cnsScore: newScore,
            cnsStatus: newStatus
          }));
        }}
      />
    </motion.div>
  );
}