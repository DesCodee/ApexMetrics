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
    <div className="px-6 py-6 space-y-6 animate-in fade-in duration-300 max-w-md mx-auto pb-28">
       
       <header className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2">
             <span className="text-xs text-neutral-400 font-normal uppercase tracking-wider">Раздел VIP</span>
             <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-white/[0.04] text-neutral-400 uppercase tracking-wider">
                Бета
             </span>
          </div>
          <button 
            type="button"
            onClick={handleLogout} 
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-red-500/10 hover:text-red-400 flex items-center gap-1.5 text-neutral-400 text-xs font-normal transition-all"
            title="Сбросить профиль"
          >
             <LogOut size={13} strokeWidth={1.5} />
             <span className="uppercase tracking-wider">Сброс</span>
          </button>
       </header>

       {/* Hero */}
       <div className="flex flex-col items-center text-center mt-2">
          <Crown size={32} strokeWidth={1.5} className="text-white mb-3" />
          <h1 className="text-2xl font-light tracking-tight text-white mb-1.5 font-sans">Apex VIP</h1>
          <p className="text-neutral-400 text-xs font-normal max-w-xs leading-relaxed">
             Закрытый модуль продвинутого анализа тренировок, искусственного интеллекта и биометрии
          </p>
       </div>

       {/* Status Card */}
       {isVip ? (
          <div className="bg-white/[0.02] border border-[#D4FF00]/30 rounded-2xl p-6 text-center space-y-3">
             <div className="inline-flex items-center gap-1.5 text-xs font-normal text-[#D4FF00] uppercase tracking-wider">
                <CheckCircle2 size={14} strokeWidth={1.5} /> Ранний доступ активен
             </div>
             <div className="text-white font-normal text-base">Вы участник закрытого тестирования</div>
             <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                Вам открыты расширенные биометрики тела (состав тканей, костная масса, метаболический возраст) и приоритетный доступ ко всем новым AI-функциям.
             </p>
          </div>
       ) : (
          <div className="bg-white/[0.02] rounded-2xl p-6 space-y-5">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-normal text-white uppercase tracking-wider">
                   <Clock size={14} strokeWidth={1.5} className="text-neutral-400" /> Статус разработки
                </div>
                <span className="text-xs font-normal text-neutral-400 bg-white/[0.04] px-2.5 py-0.5 rounded-full">
                   v2.0 Beta
                </span>
             </div>
             
             <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                Мы готовим крупное обновление экосистемы Apex. На время закрытого тестирования ранний доступ открыт для всех желающих без ограничений.
             </p>

             <button 
                type="button"
                onClick={handleActivateBetaVip}
                disabled={isActivating}
                className="w-full bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium text-sm py-4 px-4 rounded-xl uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-none"
             >
                <Crown size={16} strokeWidth={1.5} />
                {isActivating ? "Активация..." : "Активировать ранний доступ"}
             </button>
             <div className="text-xs text-neutral-500 text-center font-normal">
                Доступ открывается бесплатно для участников закрытого бета-теста
             </div>
          </div>
       )}

       {/* Roadmap of features in development */}
       <div className="space-y-3">
          <div className="text-xs text-neutral-400 font-normal uppercase tracking-wider px-1">
             Что создаётся прямо сейчас
          </div>

          {roadmapItems.map((item, i) => {
             const Icon = item.icon;
             return (
                <div 
                   key={i} 
                   className="bg-white/[0.02] rounded-2xl p-5 flex gap-4 items-start"
                >
                   <Icon size={18} strokeWidth={1.5} className="text-neutral-400 shrink-0 mt-0.5" />
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                         <h4 className="text-white text-sm font-normal truncate">{item.title}</h4>
                         <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-white/[0.04] text-neutral-400 shrink-0">
                            {item.tag}
                         </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed font-normal">{item.desc}</p>
                   </div>
                </div>
             );
          })}
       </div>

       {/* Feedback suggestion */}
       <div className="bg-white/[0.02] rounded-2xl p-5 text-center space-y-2">
          <div className="text-xs font-normal text-white">Есть идея для полезной фичи?</div>
          <p className="text-xs text-neutral-400 leading-relaxed font-normal">
             Мы строим персональный интеллект для атлетов на основе реального опыта тренировок. Все пожелания учитываются в релизе.
          </p>
       </div>

    </div>
  );
}
