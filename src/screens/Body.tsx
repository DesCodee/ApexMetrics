import { UserProfile } from '../appEngine';
import { Lock, Crown } from 'lucide-react';

export default function Body({ user }: { user: UserProfile }) {
  // Compute basic metrics based on user
  const weight = user.weight;
  const heightM = user.height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);
  const bodyFat = user.gender === 'M' ? 16.2 : 24.5; // mocked or calculated
  
  return (
    <div className="p-5 space-y-6 animate-in fade-in duration-500 max-w-md mx-auto pb-24">
       <header className="pt-2">
         <h1 className="text-2xl font-serif text-white">Body Metrics</h1>
       </header>

       {/* Top Metrics */}
       <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between">
             <div className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 mb-2">Вес</div>
             <div>
                <div className="text-white font-bold text-xl">{weight.toFixed(1)} <span className="text-xs text-neutral-500 font-medium">кг</span></div>
                <div className="text-[#D4FF00] text-[10px] font-bold mt-1">-1.2 кг</div>
             </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between">
             <div className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 mb-2">ИМТ</div>
             <div>
                <div className="text-white font-bold text-xl">{bmi}</div>
                <div className="text-[#D4FF00] text-[10px] font-bold mt-1">Норма</div>
             </div>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between">
             <div className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 mb-2">Жир</div>
             <div>
                <div className="text-white font-bold text-xl">{bodyFat} <span className="text-xs text-neutral-500 font-medium">%</span></div>
                <div className="text-[#D4FF00] text-[10px] font-bold mt-1">-0.4%</div>
             </div>
          </div>
       </div>

       {/* Weight Trend (Mock Graph) */}
       <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-6">
              <div className="text-[10px] text-white font-bold uppercase tracking-widest">Тенденция веса</div>
              <div className="text-[#D4FF00] text-[10px] font-bold uppercase tracking-widest">7 Дней</div>
          </div>
          {/* Mock Graph using SVG */}
          <div className="relative h-24 w-full">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D4FF00" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#D4FF00" stopOpacity="0" />
                      </linearGradient>
                  </defs>
                  <path d="M 0,10 Q 15,20 30,15 T 60,25 T 100,35 L 100,40 L 0,40 Z" fill="url(#grad)" />
                  <path d="M 0,10 Q 15,20 30,15 T 60,25 T 100,35" fill="none" stroke="#D4FF00" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-[8px] text-neutral-600 mt-2">
                 <span>19/8</span>
                 <span>20/8</span>
                 <span>21/8</span>
                 <span>22/8</span>
                 <span>23/8</span>
                 <span>24/8</span>
                 <span>25/8</span>
              </div>
          </div>
       </div>

       {/* Body Composition */}
       <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="text-[10px] text-white font-bold uppercase tracking-widest mb-4">Состав тела</div>
          
          <div className="space-y-3">
             <div className="flex items-center gap-3">
                <div className="w-12 text-[10px] text-neutral-400">Мышцы</div>
                <div className="flex-1 bg-black h-1.5 rounded-full overflow-hidden">
                   <div className="h-full bg-[#D4FF00] w-[77.3%]" />
                </div>
                <div className="w-10 text-right text-[10px] text-white font-bold">77.3%</div>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-12 text-[10px] text-neutral-400">Жир</div>
                <div className="flex-1 bg-black h-1.5 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 w-[16.2%]" />
                </div>
                <div className="w-10 text-right text-[10px] text-white font-bold">16.2%</div>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-12 text-[10px] text-neutral-400">Кости</div>
                <div className="flex-1 bg-black h-1.5 rounded-full overflow-hidden">
                   <div className="h-full bg-purple-400 w-[3.8%]" />
                </div>
                <div className="w-10 text-right text-[10px] text-white font-bold">3.8%</div>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-12 text-[10px] text-neutral-400">Вода</div>
                <div className="flex-1 bg-black h-1.5 rounded-full overflow-hidden">
                   <div className="h-full bg-cyan-400 w-[2.7%]" />
                </div>
                <div className="w-10 text-right text-[10px] text-white font-bold">2.7%</div>
             </div>
          </div>
       </div>

       {/* Advanced Metrics (Locked) */}
       <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
              <div className="text-[10px] text-white font-bold uppercase tracking-widest">Продвинутые метрики</div>
              <Lock size={12} className="text-neutral-500" />
          </div>
          
          <div className="space-y-4 opacity-30 blur-[1px] pointer-events-none pb-12">
             <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">Мышечная масса</div>
                <div className="text-sm text-white font-bold">63.4 кг</div>
             </div>
             <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">Индекс висцерального жира</div>
                <div className="text-sm text-white font-bold">Уровень 4</div>
             </div>
             <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">Плотность костей</div>
                <div className="text-sm text-white font-bold">1.34 г/см³</div>
             </div>
             <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">Метаболический возраст</div>
                <div className="text-sm text-white font-bold">21 год</div>
             </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
              <button className="w-full bg-neutral-800/80 backdrop-blur-md border border-[#D4FF00]/20 text-[#D4FF00] font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xl">
                 <Crown size={16} /> Открыть с Apex Pro
              </button>
          </div>
       </div>

    </div>
  )
}

