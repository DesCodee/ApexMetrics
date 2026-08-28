import { UserProfile } from '../appEngine';
import { Lock, Crown, Info, Bluetooth } from 'lucide-react';

export default function Body({ user }: { user: UserProfile }) {
  // Compute basic metrics based on user
  const weight = user.weight;
  const heightM = user.height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);

  return (
    <div className="p-5 space-y-6 animate-in fade-in duration-500 max-w-md mx-auto pb-24">
       <header className="pt-2">
         <h1 className="text-2xl font-serif text-white">Body Metrics</h1>
       </header>

       {/* Top Metrics */}
       <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-4 flex flex-col justify-between">
             <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-3">Ваш Вес</div>
             <div>
                <div className="text-white font-bold text-2xl">{weight.toFixed(1)} <span className="text-xs text-neutral-500 font-medium">кг</span></div>
             </div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-4 flex flex-col justify-between">
             <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-3">ИМТ</div>
             <div>
                <div className="text-white font-bold text-2xl">{bmi}</div>
                <div className="text-[#D4FF00] text-[10px] font-bold mt-1 uppercase tracking-widest">Текущий</div>
             </div>
          </div>
       </div>

       {/* Smart Scale Sync CTA */}
       <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-white/[0.06] rounded-full flex items-center justify-center mb-3">
             <Bluetooth size={20} className="text-[#D4FF00]" />
          </div>
          <h3 className="text-white font-bold text-sm mb-1">Синхронизация с весами</h3>
          <p className="text-xs text-neutral-400 mb-4 px-2">Подключите умные весы (Garmin, Xiaomi, Apple Health) для автоматического расчета состава тела.</p>
          <button className="bg-[#D4FF00] text-black text-xs font-bold px-5 py-2 rounded-full uppercase tracking-widest active:scale-95 transition-transform">
             Подключить устройство
          </button>
       </div>

       {/* Advanced Metrics (Locked) */}
       <div className="bg-white/[0.03] backdrop-blur-2xl/50 border border-neutral-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
              <div className="text-[10px] text-white font-bold uppercase tracking-widest">Продвинутые метрики</div>
              <Lock size={12} className="text-neutral-500" />
          </div>
          
          <div className="space-y-4 opacity-30 blur-[1px] pointer-events-none pb-12">
             <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">Мышечная масса</div>
                <div className="text-sm text-white font-bold">-- кг</div>
             </div>
             <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">Процент жира</div>
                <div className="text-sm text-white font-bold">-- %</div>
             </div>
             <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">Плотность костей</div>
                <div className="text-sm text-white font-bold">-- г/см³</div>
             </div>
             <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">Метаболический возраст</div>
                <div className="text-sm text-white font-bold">-- лет</div>
             </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
              <button className="w-full bg-white/[0.06]/80 backdrop-blur-md border border-[#D4FF00]/20 text-[#D4FF00] font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xl">
                 <Crown size={16} /> Открыть с Apex Pro
              </button>
          </div>
       </div>

    </div>
  )
}
