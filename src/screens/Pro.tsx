import { UserProfile } from '../appEngine';
import { Crown, CheckCircle2, LogOut } from 'lucide-react';
import { deleteUserProfile, auth } from '../firebase';

export default function Pro({ user, onUpdate }: { user: UserProfile, onUpdate: (u: UserProfile | null) => void }) {
  const triggerHaptic = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
  };

  const handleLogout = async () => {
    triggerHaptic();
    if (window.confirm('Вы уверены, что хотите полностью удалить профиль и начать заново? Все данные будут стерты.')) {
        if (auth.currentUser) {
            await deleteUserProfile(auth.currentUser.uid);
        }
        onUpdate(null);
    }
  };

  return (
    <div className="p-5 space-y-6 animate-in fade-in duration-500 max-w-md mx-auto pb-24">
       
       <header className="flex justify-between items-center pt-2">
          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Управление</div>
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-full bg-neutral-900 flex items-center gap-2 text-neutral-400 hover:text-red-400 border border-neutral-800 active:scale-95 transition-all">
             <LogOut size={12} />
             <span className="text-[10px] font-bold uppercase tracking-widest">Сбросить профиль</span>
          </button>
       </header>

       <div className="flex flex-col items-center text-center mt-4">
          <div className="w-16 h-16 rounded-3xl bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center mb-4 text-[#D4FF00]">
             <Crown size={32} />
          </div>
          <h1 className="text-3xl font-serif text-white mb-2">Apex Pro</h1>
          <p className="text-neutral-400 text-sm">Твоя полная система<br/>интеллекта производительности</p>
       </div>

       {/* Pricing Cards */}
       <div className="flex gap-3 mt-8">
          <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-center">
             <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Месяц</div>
             <div className="text-white font-bold text-2xl">299<span className="text-xs text-neutral-500 font-medium">₽/мес</span></div>
          </div>
          
          <div className="flex-[1.5] bg-neutral-900 border border-[#D4FF00] rounded-2xl p-4 relative shadow-[0_0_20px_rgba(212,255,0,0.1)]">
             <div className="absolute -top-3 left-4 bg-[#D4FF00] text-black text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                Экономия 44%
             </div>
             <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1 mt-1">Год</div>
             <div className="text-white font-bold text-2xl">1,990<span className="text-xs text-neutral-500 font-medium">₽/год</span></div>
             <div className="text-[10px] text-neutral-600 mt-1">≈ 166₽ в месяц</div>
          </div>
       </div>

       {/* Features */}
       <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 mt-4">
          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-6">Всё включено</div>
          
          <div className="space-y-4">
             {[
               "ИИ тренер по питанию и еде",
               "Отслеживание нагрузки ЦНС и ВСР",
               "Продвинутый анализ состава тела",
               "Безлимитный логгер приемов пищи",
               "Персональные программы тренировок",
               "Еженедельные PDF-отчеты",
               "Глубокая аналитика качества сна",
               "Приоритетная поддержка 24/7"
             ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className="w-4 h-4 rounded-full bg-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00] shrink-0">
                      <CheckCircle2 size={12} fill="currentColor" className="text-black" />
                   </div>
                   <span className="text-sm text-neutral-300">{feature}</span>
                </div>
             ))}
          </div>
       </div>

       {/* CTA */}
       <div className="mt-8 text-center space-y-4">
          <button 
            className="w-full bg-[#D4FF00] text-black font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(212,255,0,0.3)]"
            onClick={triggerHaptic}
          >
            Начать 3 дня бесплатно
          </button>
          
          <div className="text-[11px] text-neutral-500">
             Затем 1,990₽/год • Отмена в любой момент
          </div>
          
          <div className="flex justify-center items-center gap-2 pt-2">
             <div className="flex text-[#D4FF00]">
                {'★★★★★'.split('').map((s, i) => <span key={i} className="text-lg">{s}</span>)}
             </div>
             <span className="text-xs text-neutral-400 font-medium">4.9 • 2,400+ участников</span>
          </div>
          
          <div className="text-[9px] text-neutral-600 max-w-[250px] mx-auto pt-2">
             Платежи безопасно обрабатываются через Telegram Payments. Отмена в любой момент в настройках Telegram.
          </div>
       </div>
    </div>
  )
}

