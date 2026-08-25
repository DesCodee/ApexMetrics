import { useState } from 'react';
import { UserProfile } from '../appEngine';
import { Apple, Droplet, Dumbbell, Moon, Brain, Heart, Plus, Minus } from 'lucide-react';
import WorkoutLogger from '../components/WorkoutLogger';

export default function Log({ user }: { user: UserProfile }) {
  const [activeView, setActiveView] = useState<'grid' | 'workout'>('grid');
  const [waterGlasses, setWaterGlasses] = useState(7);
  const maxGlasses = 12; // 3L total (250ml each)

  const triggerHaptic = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  };

  if (activeView === 'workout') {
     return (
        <div className="animate-in slide-in-from-right duration-300">
           <div className="px-5 pt-5 pb-2">
              <button 
                onClick={() => { triggerHaptic(); setActiveView('grid'); }}
                className="text-[#D4FF00] text-sm font-bold uppercase tracking-widest"
              >
                 ← Назад в Дневник
              </button>
           </div>
           <WorkoutLogger user={user} />
        </div>
     );
  }

  return (
    <div className="p-5 space-y-6 animate-in fade-in duration-500 max-w-md mx-auto pb-24">
       <header className="pt-2">
         <h1 className="text-2xl font-serif text-white">Быстрый лог</h1>
       </header>

       {/* Quick Log Grid */}
       <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform" onClick={triggerHaptic}>
             <Apple size={24} className="text-neutral-400" />
             <span className="text-[10px] font-bold text-neutral-300">Еда</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform" onClick={triggerHaptic}>
             <Droplet size={24} className="text-neutral-400" />
             <span className="text-[10px] font-bold text-neutral-300">Вода</span>
          </div>
          <div 
             className="bg-neutral-900 border border-[#D4FF00]/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
             onClick={() => { triggerHaptic(); setActiveView('workout'); }}
          >
             <Dumbbell size={24} className="text-[#D4FF00]" />
             <span className="text-[10px] font-bold text-white">Тренировка</span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform" onClick={triggerHaptic}>
             <Moon size={24} className="text-neutral-400" />
             <span className="text-[10px] font-bold text-neutral-300">Сон</span>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 opacity-50">
             <Brain size={24} className="text-neutral-500" />
             <span className="text-[10px] font-bold text-neutral-500">Тест ЦНС 🔒</span>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 opacity-50">
             <Heart size={24} className="text-neutral-500" />
             <span className="text-[10px] font-bold text-neutral-500">ВСР 🔒</span>
          </div>
       </div>

       {/* Water Tracker */}
       <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Droplet size={14} className="text-blue-400" /> Вода
             </div>
             <div className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">
                {(waterGlasses * 0.25).toFixed(2)} Л / 3.00 Л
             </div>
          </div>
          <div className="flex items-center justify-between gap-2">
             <button 
               className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center active:scale-95 transition-transform"
               onClick={() => { triggerHaptic(); setWaterGlasses(Math.max(0, waterGlasses - 1)); }}
             >
                <Minus size={14} />
             </button>
             
             <div className="flex-1 flex gap-1 justify-center">
                {Array.from({ length: maxGlasses }).map((_, i) => (
                   <div 
                     key={i} 
                     className={`w-4 h-7 rounded-full transition-colors duration-300 ${i < waterGlasses ? 'bg-blue-400' : 'bg-neutral-800'}`} 
                   />
                ))}
             </div>
             
             <button 
               className="w-8 h-8 rounded-full bg-[#D4FF00] text-black flex items-center justify-center active:scale-95 transition-transform"
               onClick={() => { triggerHaptic(); setWaterGlasses(Math.min(maxGlasses, waterGlasses + 1)); }}
             >
                <Plus size={14} />
             </button>
          </div>
          <div className="text-[9px] text-neutral-600 mt-3">{waterGlasses} стаканов • 250 мл каждый</div>
       </div>

       {/* Calories Today */}
       <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5">
          <div className="flex justify-between items-end mb-3">
             <div className="text-sm font-bold text-white">Калории за сегодня</div>
             <div className="text-lg font-bold text-[#D4FF00]">1,040 <span className="text-xs text-neutral-500">/ 2,200</span></div>
          </div>
          <div className="w-full h-2 bg-black rounded-full overflow-hidden flex mb-3">
             <div className="h-full bg-[#D4FF00]" style={{ width: '30%' }} />
             <div className="h-full bg-orange-500" style={{ width: '15%' }} />
          </div>
          <div className="flex gap-4 text-[9px] text-neutral-500 font-bold uppercase tracking-widest">
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#D4FF00]" /> Белки 80г</span>
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-neutral-700" /> Углеводы 131г</span>
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> Жиры 17г</span>
          </div>
       </div>

       {/* Meals Today */}
       <div>
          <div className="flex justify-between items-center mb-3">
             <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Приемы пищи</div>
             <button className="text-[#D4FF00] text-[10px] font-bold uppercase tracking-widest active:scale-95">+ Добавить</button>
          </div>
          
          <div className="space-y-2">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                   <div className="text-white font-semibold text-sm">Овсянка + Банан</div>
                   <div className="text-[10px] text-neutral-500 mt-1 flex gap-2">
                     <span>09:15</span>
                     <span><span className="text-neutral-400">Б</span> 12г</span>
                     <span><span className="text-neutral-400">У</span> 68г</span>
                     <span><span className="text-neutral-400">Ж</span> 6г</span>
                   </div>
                </div>
                <div className="text-[#D4FF00] font-bold text-sm">380</div>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                   <div className="text-white font-semibold text-sm">Куриная грудка + Рис</div>
                   <div className="text-[10px] text-neutral-500 mt-1 flex gap-2">
                     <span>13:00</span>
                     <span><span className="text-neutral-400">Б</span> 48г</span>
                     <span><span className="text-neutral-400">У</span> 55г</span>
                     <span><span className="text-neutral-400">Ж</span> 8г</span>
                   </div>
                </div>
                <div className="text-[#D4FF00] font-bold text-sm">520</div>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                   <div className="text-white font-semibold text-sm">Греческий йогурт</div>
                   <div className="text-[10px] text-neutral-500 mt-1 flex gap-2">
                     <span>16:30</span>
                     <span><span className="text-neutral-400">Б</span> 20г</span>
                     <span><span className="text-neutral-400">У</span> 8г</span>
                     <span><span className="text-neutral-400">Ж</span> 3г</span>
                   </div>
                </div>
                <div className="text-[#D4FF00] font-bold text-sm">140</div>
            </div>
          </div>
       </div>

    </div>
  )
}
