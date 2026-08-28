import { useEffect, useState } from 'react';
import { ApexEngine, UserProfile, WorkoutLog } from '../appEngine';
import { loadWorkoutLogs, loadDailyStats, auth } from '../firebase';
import { ChevronRight, Droplet, Moon, Brain, ChevronUp, Crown, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home({ user, tgUser }: { user: UserProfile, tgUser: any }) {
  const macros = ApexEngine.calculateTDEE(user.weight, user.height, user.age, user.gender, user.activityLevel, user.goal);
  
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [dailyStats, setDailyStats] = useState<any>({});
  
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
  workouts.forEach(w => {
    if (w.status === 'completed' && new Date(w.date || w.createdAt).toDateString() === todayDateObjStr) {
      todayTonnage += ApexEngine.calculateVolumeMetrics(w).currentVolume;
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
  const tonPercent = Math.min(todayTonnage / targetTonnage, 1) || 0.05; // Base amount for visual
  const stepPercent = Math.min(steps / targetSteps, 1) * 100;

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
          <div className="w-7 h-7 bg-neutral-800 rounded-full flex items-center justify-center text-xs font-bold text-neutral-400">
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
         <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between h-24">
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

         <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between h-24 opacity-50">
            <div className="flex items-center gap-1.5 text-neutral-500">
               <Moon size={12} />
               <span className="text-[9px] uppercase font-bold tracking-widest">Сон</span>
            </div>
            <div>
               <div className="text-white font-bold text-lg leading-none mb-2">--</div>
               <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 w-[0%]" />
               </div>
               <div className="text-[9px] text-neutral-600 mt-1">Нет данных</div>
            </div>
         </div>

         <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between h-24 opacity-50">
            <div className="flex items-center gap-1.5 text-[#D4FF00]">
               <Brain size={12} />
               <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500">ЦНС</span>
            </div>
            <div>
               <div className="text-white font-bold text-lg leading-none mb-2">--</div>
               <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-[#D4FF00] w-[0%]" />
               </div>
               <div className="text-[9px] text-neutral-600 mt-1">Нет данных</div>
            </div>
         </div>
      </div>

      {/* Steps */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
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

      
      {/* Empty State */}
      {todayTonnage === 0 && history.length === 0 && (
         <div className="pt-2">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 px-1">Активность</div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-neutral-700 mb-4">
                    <CheckCircle size={32} />
                </div>
                <div className="text-white font-bold mb-1">Нет тренировок</div>
                <div className="text-xs text-neutral-500 max-w-[200px]">Открой дневник и начни свою первую сессию, чтобы здесь появилась статистика.</div>
            </div>
         </div>
      )}

      {/* Today's Activity */}
      {todayTonnage > 0 && (
         <div className="pt-2">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 px-1">Активность за сегодня</div>
            
            <div className="space-y-2">
               <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                          <ChevronUp size={16} />
                       </div>
                       <div>
                          <div className="text-white font-semibold text-sm">Тренировка ({todayTonnage} кг)</div>
                          <div className="text-xs text-neutral-500">Тоннаж за сессию</div>
                       </div>
                   </div>
                   <div className="text-[#00E5FF] font-bold text-sm">Завершено</div>
               </div>
            </div>
         </div>
      )}

      {/* Upgrade Banner */}
      <div className="bg-gradient-to-r from-[#D4FF00]/10 to-black border border-[#D4FF00]/20 rounded-2xl p-4 flex justify-between items-center mt-6">
         <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00]">
               <Crown size={14} />
            </div>
            <div>
               <div className="text-white font-semibold text-sm">Перейти на Apex Pro</div>
               <div className="text-[10px] text-neutral-400 mt-0.5">ИИ тренер • ВСР • глубокая аналитика</div>
            </div>
         </div>
         <ChevronRight size={16} className="text-[#D4FF00]" />
      </div>
    </motion.div>
  );
}