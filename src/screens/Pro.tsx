import { useEffect, useState } from 'react';
import { UserProfile } from '../appEngine';
import { Crown, CheckCircle2, LogOut, Sparkles, Clock, ArrowUpRight, Zap, Shield, Cpu } from 'lucide-react';
import { deleteUserProfile, auth, saveUserProfile, logEvent } from '../firebase';
import { tgHaptic } from '../utils/haptics';

export default function Pro({ user, onUpdate }: { user: UserProfile, onUpdate: (u: UserProfile | null) => void }) {
  const [isActivating, setIsActivating] = useState(false);
  const isVip = user.accessState === 'beta-vip';

  useEffect(() => {
    logEvent('vip_page_viewed');
  }, []);

  const handleLogout = async () => {
    tgHaptic('medium');
    if (window.confirm('Вы уверены, что хотите сбросить профиль и начать заново? Данные тренировок будут очищены.')) {
        if (auth.currentUser) {
            await deleteUserProfile(auth.currentUser.uid);
        }
        onUpdate(null);
    }
  };

  const handleActivateBetaVip = async () => {
    tgHaptic('heavy');
    setIsActivating(true);
    
    try {
        if (auth.currentUser) {
            const updatedUser = { ...user, accessState: 'beta-vip' as const };
            await saveUserProfile(updatedUser, auth.currentUser.uid);
            onUpdate(updatedUser);
            tgHaptic('success');
            
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.showAlert) {
                tg.showAlert("Ранний VIP-доступ активирован! Все расширенные биометрики и тестовые функции открыты.");
            }
        }
    } catch(e) {
        console.error(e);
    } finally {
        setIsActivating(false);
    }
  };

  const roadmapItems = [
    {
      title: "ИИ-адаптация нагрузок",
      desc: "Автоматический пересчет рабочих весов к следующему подходу на основе RPE и скорости штанги",
      tag: "Тестирование",
      icon: Cpu,
      active: true
    },
    {
      title: "Прямая синхронизация с часами",
      desc: "Синхронизация пульса покоя, сна и ВСР из Apple Health, Whoop и Garmin",
      tag: "В разработке",
      icon: Zap,
      active: false
    },
    {
      title: "Фотосканер питания и БЖУ",
      desc: "Мгновенное распознавание блюд и расчет микроэлементов по фотографии",
      tag: "В разработке",
      icon: Sparkles,
      active: false
    },
    {
      title: "Предиктивный анализ ЦНС",
      desc: "Прогноз утомления нервной системы и риска перетренированности на 7 дней вперед",
      tag: "В планах",
      icon: Shield,
      active: false
    }
  ];

  return (
    <div className="p-5 space-y-6 animate-in fade-in duration-500 max-w-md mx-auto pb-24">
       
       <header className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2">
             <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Раздел VIP</span>
             <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#D4FF00]/10 text-[#D4FF00] border border-[#D4FF00]/20 uppercase">
                В разработке
             </span>
          </div>
          <button 
            type="button"
            onClick={handleLogout} 
            className="px-3 py-1.5 rounded-full bg-white/[0.03] backdrop-blur-2xl flex items-center gap-1.5 text-neutral-400 hover:text-red-400 border border-neutral-800 active:scale-95 transition-all"
            title="Сбросить профиль"
          >
             <LogOut size={12} />
             <span className="text-[10px] font-bold uppercase tracking-widest">Сброс</span>
          </button>
       </header>

       {/* Hero Banner */}
       <div className="flex flex-col items-center text-center mt-2">
          <div className="w-16 h-16 rounded-3xl bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center mb-4 text-[#D4FF00] relative shadow-[0_0_25px_rgba(212,255,0,0.15)]">
             <Crown size={32} />
             <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black border border-[#D4FF00] flex items-center justify-center text-[#D4FF00]">
                <Sparkles size={12} />
             </div>
          </div>
          
          <h1 className="text-3xl font-serif text-white mb-2">Apex VIP</h1>
          <p className="text-neutral-400 text-sm max-w-xs leading-relaxed">
             Закрытый модуль продвинутого анализа тренировок, искусственного интеллекта и биометрии
          </p>
       </div>

       {/* Status Card */}
       {isVip ? (
          <div className="bg-gradient-to-br from-purple-500/15 via-[#D4FF00]/10 to-transparent border border-[#D4FF00]/30 rounded-2xl p-5 text-center space-y-3 shadow-[0_4px_20px_-10px_rgba(212,255,0,0.2)]">
             <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D4FF00] bg-black/40 px-3 py-1 rounded-full border border-[#D4FF00]/30">
                <CheckCircle2 size={13} /> Ранний доступ активен
             </div>
             <div className="text-white font-bold text-base">Вы участник закрытого тестирования</div>
             <p className="text-xs text-neutral-400 leading-relaxed">
                Вам открыты расширенные биометрики тела (состав тканей, костная масса, метаболический возраст) и приоритетный доступ ко всем новым AI-функциям.
             </p>
          </div>
       ) : (
          <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                   <Clock size={14} className="text-[#D4FF00]" /> Статус разработки
                </div>
                <span className="text-[11px] font-bold text-[#D4FF00] bg-[#D4FF00]/10 px-2 py-0.5 rounded-md">
                   v2.0 Beta
                </span>
             </div>
             
             <p className="text-xs text-neutral-300 leading-relaxed">
                Мы готовим крупное обновление экосистемы Apex. На время закрытого тестирования ранний доступ открыт для всех желающих без ограничений.
             </p>

             <button 
                type="button"
                onClick={handleActivateBetaVip}
                disabled={isActivating}
                className="w-full bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-bold text-sm py-3.5 rounded-xl active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(212,255,0,0.25)] flex items-center justify-center gap-2 disabled:opacity-50"
             >
                <Crown size={16} />
                {isActivating ? "Активация..." : "Активировать ранний доступ"}
             </button>
             <div className="text-[10px] text-neutral-500 text-center">
                Доступ открывается бесплатно для участников закрытого бета-теста
             </div>
          </div>
       )}

       {/* Roadmap of features in development */}
       <div className="space-y-3">
          <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest px-1">
             Что создаётся прямо сейчас
          </div>

          {roadmapItems.map((item, i) => {
             const Icon = item.icon;
             return (
                <div 
                   key={i} 
                   className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-2xl p-4 flex gap-3.5 items-start"
                >
                   <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#D4FF00] shrink-0 mt-0.5">
                      <Icon size={17} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                         <h4 className="text-white text-sm font-semibold truncate">{item.title}</h4>
                         <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            item.tag === 'Тестирование' 
                               ? 'bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30' 
                               : 'bg-white/[0.06] text-neutral-400'
                         }`}>
                            {item.tag}
                         </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
                   </div>
                </div>
             );
          })}
       </div>

       {/* Feedback suggestion */}
       <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 text-center space-y-2">
          <div className="text-xs font-semibold text-white">Есть идея для полезной фичи?</div>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
             Мы строим персональный интеллект для атлетов на основе реального опыта тренировок. Все пожелания учитываются в релизе.
          </p>
       </div>

    </div>
  );
}
