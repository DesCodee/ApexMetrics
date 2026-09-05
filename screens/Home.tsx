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
       className="p-5 space-y-6 max-w-lg mx-auto"
    >
      
      {/* Header */}
      <header className="flex justify-between items-start pt-2 border-b border-neutral-900 pb-4">
        <div>
          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">
            СВОДКА • СЕГОДНЯ
          </div>
          <h1 className="text-xl font-serif text-white">
            Доброе утро, {tgUser?.first_name || 'Атлет'}
          </h1>
        </div>
        <div className="flex gap-2">
          <div className="w-7 h-7 bg-white/[0.06] rounded-full flex items-center justify-center text-xs font-bold text-neutral-400">
            {tgUser?.first_name && tgUser.first_name.length > 0 ? tgUser.first_name[0].toUpperCase() : 'A'}
          </div>
        </div>
      </header>

      {/* Split Circular Progress */}
      <div className="relative flex flex-col items-center py-4">
        <svg width="220" height="220" viewBox="0 0 100 100" className="rotate-90">
           {/* Left Half (Calories) */}
           <path d="M 50,5 A 45,45 0 0,0 50,95" fill="none" stroke="#1A1A1A" strokeWidth="6" />
           {/* Right Half (Tonnage) */}
           <path d="M 50,5 A 45,45 0 0,1 50,95" fill="none" stroke="#1A1A1A" strokeWidth="6" />
           
           {/* Foreground tracks */}
           {/* Calories (Starts from bottom 50,95 to top 50,5 -> length ~141.3) */}
           <path 
             d="M 50,95 A 45,45 0 0,1 50,5" 
             fill="none" 
             stroke="#D4FF00" 
             strokeWidth="6" 
             strokeLinecap="round"
             strokeDasharray="141.3" 
             strokeDashoffset={141.3 * (1 - calPercent)} 
           />
           {/* Tonnage (Starts from bottom 50,95 to top 50,5 on right side) */}
           <path 
             d="M 50,95 A 45,45 0 0,0 50,5" 
             fill="none" 
             stroke="#00E5FF" 
             strokeWidth="6" 
             strokeLinecap="round"
             strokeDasharray="141.3" 
             strokeDashoffset={141.3 * (1 - tonPercent)} 
           />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Калории</div>
           <div className="text-3xl font-bold text-white leading-none">{consumedCalories}</div>
           <div className="text-xs text-[#D4FF00] font-medium mt-1">/ {targetCalories} ккал</div>
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-2 justify-center gap-8 border-b border-neutral-900 pb-8">
         <div className="text-center">
            <div className="w-8 h-1 bg-[#D4FF00] mx-auto mb-2 rounded-full" />
            <div className="text-[10px] text-neutral-500 font-medium">Белки</div>
            <div className="font-bold text-white text-sm">{protein}г</div>
         </div>
         <div className="text-center">
            <div className="w-8 h-1 bg-blue-400 mx-auto mb-2 rounded-full" />
            <div className="text-[10px] text-neutral-500 font-medium">Углеводы</div>
            <div className="font-bold text-white text-sm">{carbs}г</div>
         </div>
         <div className="text-center">
            <div className="w-8 h-1 bg-orange-500 mx-auto mb-2 rounded-full" />
            <div className="text-[10px] text-neutral-500 font-medium">Жиры</div>
            <div className="font-bold text-white text-sm">{fats}г</div>
         </div>
      </div>

      {/* Mini Cards */}
      <div className="grid grid-cols-3 gap-3">
         <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-3 flex flex-col justify-between h-24">
            <div className="flex items-center gap-1.5 text-neutral-500">
               <Droplet size={12} />
               <span className="text-[9px] uppercase font-bold tracking-widest">Вода</span>
            </div>
            <div>
               <div className="text-white font-bold text-lg leading-none mb-2">{(waterGlasses * 0.25).toFixed(1)} л</div>
               <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${Math.min((waterGlasses * 0.25) / 3, 1) * 100}%`}} />
               </div>
               <div className="text-[9px] text-neutral-600 mt-1">/ 3 л цель</div>
            </div>
         </div>

         {/* Sleep Card */}
         <div 
           onClick={() => setShowCnsModal(true)}
           className="bg-white/[0.03] border border-white/[0.08] hover:border-purple-500/30 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-3 flex flex-col justify-between h-24 cursor-pointer transition-all active:scale-95"
         >
            <div className="flex items-center justify-between text-neutral-500">
               <div className="flex items-center gap-1.5">
                  <Moon size={12} className="text-purple-400" />
                  <span className="text-[9px] uppercase font-bold tracking-widest">Сон</span>
               </div>
               {dailyStats.sleepHours ? <span className="text-[9px] text-purple-400 font-bold">OK</span> : null}
            </div>
            <div>
               <div className="text-white font-bold text-lg leading-none mb-2">
                  {dailyStats.sleepHours ? `${dailyStats.sleepHours} ч` : '--'}
               </div>
               <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-400 transition-all duration-500" 
                    style={{ width: `${Math.min(((Number(dailyStats.sleepHours) || 0) / 8), 1) * 100}%` }} 
                  />
               </div>
               <div className="text-[9px] text-neutral-500 mt-1">
                  {dailyStats.sleepHours ? '/ 8 ч норма' : 'Замерить'}
               </div>
            </div>
         </div>

         {/* CNS Card */}
         <div 
           onClick={() => setShowCnsModal(true)}
           className={`bg-white/[0.03] border backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-3 flex flex-col justify-between h-24 cursor-pointer transition-all active:scale-95 ${
              dailyStats.cnsStatus === 'Optimal' ? 'border-[#D4FF00]/40 hover:border-[#D4FF00]' :
              dailyStats.cnsStatus === 'Moderate' ? 'border-amber-400/40 hover:border-amber-400' :
              dailyStats.cnsStatus === 'Fatigued' ? 'border-red-400/40 hover:border-red-400' :
              'border-white/[0.08] hover:border-[#D4FF00]/30'
           }`}
         >
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-1.5 text-[#D4FF00]">
                  <Brain size={12} className={
                     dailyStats.cnsStatus === 'Fatigued' ? 'text-red-400' :
                     dailyStats.cnsStatus === 'Moderate' ? 'text-amber-400' : 'text-[#D4FF00]'
                  } />
                  <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-400">ЦНС</span>
               </div>
               {dailyStats.cnsStatus && (
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                     dailyStats.cnsStatus === 'Optimal' ? 'bg-[#D4FF00]' :
                     dailyStats.cnsStatus === 'Moderate' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
               )}
            </div>
            <div>
               <div className="text-white font-bold text-lg leading-none mb-2">
                  {dailyStats.cnsScore ? `${dailyStats.cnsScore}%` : 'Тест'}
               </div>
               <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                  <div 
                     className={`h-full transition-all duration-500 ${
                        dailyStats.cnsStatus === 'Fatigued' ? 'bg-red-400' :
                        dailyStats.cnsStatus === 'Moderate' ? 'bg-amber-400' : 'bg-[#D4FF00]'
                     }`} 
                     style={{ width: `${dailyStats.cnsScore || 0}%` }} 
                  />
               </div>
               <div className="text-[9px] text-neutral-400 mt-1 font-medium truncate">
                  {dailyStats.cnsStatus === 'Optimal' ? 'Готовность' :
                   dailyStats.cnsStatus === 'Moderate' ? 'Умеренно' :
                   dailyStats.cnsStatus === 'Fatigued' ? 'Истощение' : 'Замерить >'}
               </div>
            </div>
         </div>
      </div>

      {/* CNS Fatigue Alert Banner if fatigued or moderate */}
      {dailyStats.cnsStatus && dailyStats.cnsStatus !== 'Optimal' && (
         <div 
           onClick={() => setShowCnsModal(true)}
           className="cursor-pointer bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-red-500/30 hover:border-red-500/50 rounded-2xl p-4 flex items-center justify-between transition-all"
         >
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <ShieldAlert size={18} />
               </div>
               <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                     Истощение ЦНС ({dailyStats.cnsScore}%)
                     <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold uppercase">Smart Deload</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                     Нажмите для протокола реанимации (сон, дыхание, стек)
                  </div>
               </div>
            </div>
            <ChevronRight size={16} className="text-neutral-500 shrink-0" />
         </div>
      )}

      {/* Steps */}
      <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-4">
         <div className="flex justify-between items-center mb-3">
             <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Шаги</div>
             <div className="text-white font-bold text-lg">{steps} <span className="text-xs text-neutral-500 font-medium">/ 10,000</span></div>
         </div>
         <div className="w-full bg-black h-1.5 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-[#D4FF00] transition-all duration-500" style={{ width: `${stepPercent}%` }} />
         </div>
         <div className="flex justify-between items-center text-[10px] text-neutral-500">
             <span>Ок. {Math.round(steps * 0.04)} ккал сожжено</span>
             <span className="text-[#D4FF00] font-bold">{Math.round(stepPercent)}%</span>
         </div>
      </div>

      
      {/* Empty State: No workouts generated yet */}
      {todayTonnage === 0 && workouts.length === 0 && (
         <div className="pt-2">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 px-1">Активность</div>
            <div 
              id="home-empty-workouts-card"
              onClick={() => onNavigate?.('log')}
              className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.98] transition-transform hover:border-neutral-700"
            >
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-[#D4FF00] mb-4">
                    <CheckCircle size={32} />
                </div>
                <div className="text-white font-bold mb-1">Нет тренировок</div>
                <div className="text-xs text-neutral-400 max-w-[220px]">Открой дневник и начни свою первую сессию, чтобы здесь появилась статистика.</div>
                <div className="text-[#D4FF00] text-xs font-bold mt-3 flex items-center gap-1">Открыть дневник →</div>
            </div>
         </div>
      )}

      {/* Next Scheduled Workout: Plan ready, not yet trained today */}
      {todayTonnage === 0 && workouts.length > 0 && (
         <div className="pt-2">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 px-1">План на сегодня</div>
            <div 
              id="home-next-workout-card"
              onClick={() => onNavigate?.('log')}
              className="bg-white/[0.03] border border-[#D4FF00]/30 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform hover:border-[#D4FF00]/50"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D4FF00]/10 text-[#D4FF00] flex items-center justify-center font-bold">
                       <Dumbbell size={18} />
                    </div>
                    <div>
                       <div className="text-white font-semibold text-sm">{nextWorkout?.title || 'Следующая тренировка'}</div>
                       <div className="text-xs text-neutral-400">{nextWorkout?.day || 'День 1'} • {nextWorkout?.duration || '60 мин'}</div>
                    </div>
                </div>
                <div className="text-[#D4FF00] font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                   Начать →
                </div>
            </div>
         </div>
      )}

      {/* Today's Activity: Completed workout with tonnage */}
      {todayTonnage > 0 && (
         <div className="pt-2">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 px-1">Активность за сегодня</div>
            
            <div className="space-y-2">
               <div 
                 id="home-today-tonnage-card"
                 onClick={() => onNavigate?.('log')}
                 className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
               >
                   <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-[#00E5FF]">
                          <ChevronUp size={16} />
                       </div>
                       <div>
                          <div className="text-white font-semibold text-sm">Тренировка ({tonnageDisplay.full})</div>
                          <div className="text-xs text-neutral-500">Тоннаж за сессию</div>
                       </div>
                   </div>
                   <div className="text-[#00E5FF] font-bold text-sm">Завершено</div>
               </div>
            </div>
         </div>
      )}

      {/* VIP Status Banner */}
      <div 
        id="home-pro-upgrade-banner"
        onClick={() => onNavigate?.('pro')}
        className={`bg-gradient-to-r ${user.accessState === 'beta-vip' ? 'from-purple-500/15 via-[#D4FF00]/10 to-black border-purple-500/30' : 'from-[#D4FF00]/10 to-black border-[#D4FF00]/20'} border rounded-2xl p-4 flex justify-between items-center mt-6 cursor-pointer active:scale-[0.98] transition-transform`}
      >
         <div className="flex gap-3 items-center">
            <div className={`w-8 h-8 rounded-full ${user.accessState === 'beta-vip' ? 'bg-purple-500/20 text-purple-300' : 'bg-[#D4FF00]/20 text-[#D4FF00]'} flex items-center justify-center`}>
               <Crown size={14} />
            </div>
            <div>
               <div className="text-white font-semibold text-sm">
                 {user.accessState === 'beta-vip' ? 'Apex VIP • Доступ открыт' : 'Apex VIP • Раздел в разработке'}
               </div>
               <div className="text-[10px] text-neutral-400 mt-0.5">
                 {user.accessState === 'beta-vip' ? 'Все экспериментальные фичи активны' : 'Ранний доступ • ИИ тренер • Экспериментальные функции'}
               </div>
            </div>
         </div>
         <ChevronRight size={16} className={user.accessState === 'beta-vip' ? 'text-purple-400' : 'text-[#D4FF00]'} />
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