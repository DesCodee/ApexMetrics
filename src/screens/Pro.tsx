import { useEffect, useState } from 'react';
import { UserProfile } from '../appEngine';
import { Crown, CheckCircle2, LogOut } from 'lucide-react';
import { deleteUserProfile, auth, saveUserProfile, logEvent } from '../firebase';

export default function Pro({ user, onUpdate }: { user: UserProfile, onUpdate: (u: UserProfile | null) => void }) {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    logEvent('paywall_viewed');
  }, []);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' = 'medium') => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
        if (type === 'success') {
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            tg.HapticFeedback.impactOccurred(type as any);
        }
    }
  };

  const handleLogout = async () => {
    triggerHaptic('medium');
    if (window.confirm('Вы уверены, что хотите полностью удалить профиль и начать заново? Все данные будут стерты.')) {
        if (auth.currentUser) {
            await deleteUserProfile(auth.currentUser.uid);
        }
        onUpdate(null);
    }
  };

  const handlePayment = async () => {
    logEvent('paywall_click');
    triggerHaptic('heavy');
    setIsProcessing(true);
    
    // Simulate Telegram Stars Payment Flow
    setTimeout(async () => {
        try {
            if (auth.currentUser) {
                const updatedUser = { ...user, accessState: 'Beta-VIP' as const };
                await saveUserProfile(updatedUser, auth.currentUser.uid);
                onUpdate(updatedUser);
                triggerHaptic('success');
                const tg = (window as any).Telegram?.WebApp;
                if (tg?.showAlert) {
                    tg.showAlert("VIP-доступ активирован! Все AI-фичи открыты.");
                } else {
                    alert("VIP-доступ активирован! Все AI-фичи открыты.");
                }
            }
        } catch(e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    }, 1500);
  };

  if (user.accessState === 'Beta-VIP') {
      return (
          <div className="p-5 space-y-6 animate-in fade-in duration-500 max-w-md mx-auto pb-24 text-center mt-20">
              <div className="w-24 h-24 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center mx-auto mb-6 text-[#D4FF00]">
                 <Crown size={48} />
              </div>
              <h1 className="text-3xl font-serif text-white mb-2">Apex Pro Активен</h1>
              <p className="text-neutral-400 text-sm mb-8">Все функции ИИ, премиальные планы и глубокая аналитика разблокированы.</p>
              
              <button onClick={handleLogout} className="mx-auto px-4 py-2 rounded-full bg-neutral-900 flex items-center gap-2 text-neutral-400 hover:text-red-400 border border-neutral-800 active:scale-95 transition-all">
                 <LogOut size={14} />
                 <span className="text-xs font-bold uppercase tracking-widest">Сбросить профиль</span>
              </button>
          </div>
      );
  }

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
          <div 
             className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-center active:scale-95 transition-transform"
             onClick={handlePayment}
          >
             <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Месяц</div>
             <div className="text-white font-bold text-xl">150 <span className="text-sm">⭐</span><span className="text-xs text-neutral-500 font-medium">/мес</span></div>
             <div className="text-[10px] text-neutral-600 mt-1">≈ $2.99 / мес</div>
          </div>
          
          <div 
             className="flex-[1.5] bg-neutral-900 border border-[#D4FF00] rounded-2xl p-4 relative shadow-[0_0_20px_rgba(212,255,0,0.1)] active:scale-95 transition-transform"
             onClick={handlePayment}
          >
             <div className="absolute -top-3 left-4 bg-[#D4FF00] text-black text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                Экономия 45%
             </div>
             <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1 mt-1">Год</div>
             <div className="text-white font-bold text-2xl">1000 <span className="text-lg">⭐</span><span className="text-xs text-neutral-500 font-medium">/год</span></div>
             <div className="text-[10px] text-neutral-600 mt-1">≈ $19.99 / год</div>
             <div className="text-[#D4FF00] text-[9px] font-bold mt-2 uppercase tracking-tight leading-tight">+ Все будущие VIP-фичи<br/>и AI-обновления включены</div>
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
            className="w-full bg-[#D4FF00] text-black font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(212,255,0,0.3)] disabled:opacity-50"
            onClick={handlePayment}
            disabled={isProcessing}
          >
            {isProcessing ? "Обработка платежа..." : "Начать 3 дня бесплатно"}
          </button>
          
          <div className="text-[11px] text-neutral-500">
             Затем 1000 ⭐/год • Отмена в любой момент
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

