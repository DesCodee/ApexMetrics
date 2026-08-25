import { useEffect, useState } from 'react';
import { ApexEngine, UserProfile, WorkoutLog } from '../appEngine';
import { loadWorkoutLogs, auth } from '../firebase';
import { ChevronRight, Droplet, Moon, Brain, ChevronUp, Crown } from 'lucide-react';

export default function Home({ user, tgUser }: { user: UserProfile, tgUser: any }) {
  const macros = ApexEngine.calculateTDEE(user.weight, user.height, user.age, user.gender, user.activityLevel, user.goal);
  
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    if (auth.currentUser) {
      loadWorkoutLogs(auth.currentUser.uid).then(setWorkouts).catch(console.error);
    }
  }, []);

  // Compute Tonnage from today's completed workouts
  let todayTonnage = 0;
  const todayDateStr = new Date().toDateString();
  workouts.forEach(w => {
    if (w.status === 'completed' && new Date(w.date || w.createdAt).toDateString() === todayDateStr) {
      todayTonnage += ApexEngine.calculateVolumeMetrics(w).currentVolume;
    }
  });

  // Target values
  const targetCalories = macros.calories;
  const targetTonnage = 10000; // Arbitrary weekly/daily target for visual
  
  // Example mock values for the UI
  const consumedCalories = 1040;
  const remainingCalories = targetCalories - consumedCalories;
  
  const calPercent = isNaN(targetCalories) || targetCalories === 0 ? 0 : Math.min(consumedCalories / targetCalories, 1);
  const tonPercent = Math.min(todayTonnage / targetTonnage, 1) || 0.35; // default 35% for visual if 0

  return (
    <div className="p-5 space-y-6 animate-in fade-in duration-500 max-w-md mx-auto pb-24">
      
      {/* Header */}
      <header className="flex justify-between items-start pt-2 border-b border-neutral-900 pb-4">
        <div>
          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">
            ПН • 25 АВГ 2026
          </div>
          <h1 className="text-xl font-serif text-white">
            Доброе утро, {tgUser?.first_name || 'Атлет'}
          </h1>
        </div>
        <div className="flex gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 flex items-center gap-1.5">
            <span className="text-amber-500 text-xs">🔥</span>
            <span className="text-[#D4FF00] font-bold text-xs">14</span>
          </div>
          <div className="w-7 h-7 bg-neutral-800 rounded-full flex items-center justify-center text-xs font-bold text-neutral-400">
            {tgUser?.first_name && tgUser.first_name.length > 0 ? tgUser.first_name[0].toUpperCase() : 'A'}
          </div>
        </div>
      </header>

      {/* Split Circular Progress */}
      <div className="relative flex flex-col items-center py-4">
        <svg width="220" height="220" viewBox="0 0 100 100" className="rotate-90">
           {/* Background tracks */}
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
           {/* Tonnage (Starts from top 50,5 to bottom 50,95 -> length ~141.3) */}
           <path 
             d="M 50,5 A 45,45 0 0,1 50,95" 
             fill="none" 
             stroke="#00E5FF" 
             strokeWidth="6" 
             strokeLinecap="round"
             strokeDasharray="141.3" 
             strokeDashoffset={141.3 * (1 - tonPercent)}
           />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
           <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Ккал</div>
           <div className="text-4xl font-bold text-white tracking-tighter">{consumedCalories}</div>
           <div className="text-[10px] text-neutral-500 font-medium">из {targetCalories} ккал</div>
           <div className="text-[#D4FF00] text-[10px] font-bold mt-1">{remainingCalories} осталось</div>
        </div>
      </div>

      {/* Macros */}
      <div className="flex justify-center gap-8 border-b border-neutral-900 pb-8">
         <div className="text-center">
            <div className="w-8 h-1 bg-[#D4FF00] mx-auto mb-2 rounded-full" />
            <div className="text-[10px] text-neutral-500 font-medium">Белки</div>
            <div className="font-bold text-white text-sm">142г</div>
         </div>
         <div className="text-center">
            <div className="w-8 h-1 bg-blue-400 mx-auto mb-2 rounded-full" />
            <div className="text-[10px] text-neutral-500 font-medium">Углеводы</div>
            <div className="font-bold text-white text-sm">198г</div>
         </div>
         <div className="text-center">
            <div className="w-8 h-1 bg-orange-500 mx-auto mb-2 rounded-full" />
            <div className="text-[10px] text-neutral-500 font-medium">Жиры</div>
            <div className="font-bold text-white text-sm">54г</div>
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
               <div className="text-white font-bold text-lg leading-none mb-2">2.1 л</div>
               <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[70%]" />
               </div>
               <div className="text-[9px] text-neutral-600 mt-1">/ 3 л цель</div>
            </div>
         </div>
         <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between h-24">
            <div className="flex items-center gap-1.5 text-neutral-500">
               <Moon size={12} />
               <span className="text-[9px] uppercase font-bold tracking-widest">Сон</span>
            </div>
            <div>
               <div className="text-white font-bold text-lg leading-none mb-2">7ч 20м</div>
               <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 w-[80%]" />
               </div>
               <div className="text-[9px] text-neutral-600 mt-1">Качество 78%</div>
            </div>
         </div>
         <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between h-24">
            <div className="flex items-center gap-1.5 text-[#D4FF00]">
               <Brain size={12} />
               <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500">ЦНС</span>
            </div>
            <div>
               <div className="text-white font-bold text-lg leading-none mb-2">82%</div>
               <div className="w-full bg-black h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-[#D4FF00] w-[82%]" />
               </div>
               <div className="text-[9px] text-neutral-600 mt-1">Восстановлен</div>
            </div>
         </div>
      </div>

      {/* Steps */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
         <div className="flex justify-between items-center mb-3">
             <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Шаги</div>
             <div className="text-white font-bold text-lg">8,240 <span className="text-xs text-neutral-500 font-medium">/ 10,000</span></div>
         </div>
         <div className="w-full bg-black h-1.5 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-[#D4FF00] w-[82%]" />
         </div>
         <div className="flex justify-between items-center text-[10px] text-neutral-500">
             <span>Ок. 610 ккал сожжено</span>
             <span className="text-[#D4FF00] font-bold">82%</span>
         </div>
      </div>

      {/* Today's Activity */}
      <div className="pt-2">
         <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 px-1">Активность за сегодня</div>
         
         <div className="space-y-2">
            {todayTonnage > 0 && (
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
            )}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                       🍏
                    </div>
                    <div>
                       <div className="text-white font-semibold text-sm">Завтрак</div>
                       <div className="text-[11px] text-neutral-500">09:15 • Овсянка + Банан</div>
                    </div>
                </div>
                <div className="text-[#D4FF00] font-bold text-sm">380 ккал</div>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                       🍗
                    </div>
                    <div>
                       <div className="text-white font-semibold text-sm">Обед</div>
                       <div className="text-[11px] text-neutral-500">13:00 • Курица + Рис</div>
                    </div>
                </div>
                <div className="text-[#D4FF00] font-bold text-sm">520 ккал</div>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                       🥣
                    </div>
                    <div>
                       <div className="text-white font-semibold text-sm">Перекус</div>
                       <div className="text-[11px] text-neutral-500">16:30 • Греческий йогурт</div>
                    </div>
                </div>
                <div className="text-[#D4FF00] font-bold text-sm">140 ккал</div>
            </div>
         </div>
      </div>

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

    </div>
  )
}

