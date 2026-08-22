import React, { useEffect } from 'react';
import { Crown, Zap, Shield, MessageCircle } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

export function VipOffer() {
  const { showMainButton, hideMainButton, triggerHaptic } = useTelegram();

  useEffect(() => {
    showMainButton('КУПИТЬ VIP ЗА 990₽', () => {
      triggerHaptic('heavy');
      window.Telegram?.WebApp?.showAlert('Инициализация оплаты через Telegram Stars / ЮKassa...');
    });

    return () => hideMainButton();
  }, [showMainButton, hideMainButton, triggerHaptic]);

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 px-4 pt-4 bg-apex-bg">
      <header className="mb-6">
        <h1 className="text-2xl font-black tracking-tighter uppercase text-white">APEX <span className="text-apex-neon">VIP</span></h1>
        <p className="text-[10px] font-mono text-apex-text-dim">СИСТЕМНЫЙ АПГРЕЙД</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {/* Main Hero Card */}
        <div className="bg-apex-neon text-black rounded-2xl p-6 relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-2 right-4 text-[10px] font-mono opacity-50 uppercase tracking-[2px]">ПРО</div>
          <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mb-4 mt-2">
            <Crown size={32} className="text-apex-neon" />
          </div>
          
          <h2 className="text-2xl font-black leading-tight uppercase mb-2 tracking-tighter">Взломай свой генетический предел</h2>
          <p className="text-sm font-bold leading-tight opacity-80">
            ИИ-анализ, индивидуальный план и личное сопровождение.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-3">
          <FeatureCard 
            icon={<Zap size={20} className="text-black" />}
            title="Индивидуальная программа"
            desc="Адаптивный план под силовые показатели"
          />
          <FeatureCard 
            icon={<MessageCircle size={20} className="text-black" />}
            title="Закрытый чат"
            desc="Доступ к комьюнити с тренером"
          />
          <FeatureCard 
            icon={<Shield size={20} className="text-black" />}
            title="ИИ Разбор Техники"
            desc="Корректировка техники нейросетью"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-apex-card border border-apex-border rounded-xl p-4 flex gap-4 text-left items-center">
      <div className="w-10 h-10 shrink-0 rounded-lg bg-apex-neon flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-white text-sm uppercase mb-1">{title}</h3>
        <p className="text-xs text-apex-text-dim font-mono">{desc}</p>
      </div>
    </div>
  );
}
