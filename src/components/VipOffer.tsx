import React, { useState } from 'react';
import { Crown, Check, X, Shield, Zap, Video } from 'lucide-react';
import { type DbUser, upgradeToVip } from '../lib/api';
import { useTelegram } from '../hooks/useTelegram';
import { motion, AnimatePresence } from 'motion/react';

export function VipOffer({ user }: { user: DbUser }) {
  const { webApp, triggerHaptic } = useTelegram();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBuy = async () => {
    if (user.isVip) return;
    
    triggerHaptic('medium');
    setIsProcessing(true);

    const mockInvoiceUrl = 'https://t.me/$mOck_1nVo1c3_U2L'; // Mock Telegram invoice URL

    if (webApp?.openInvoice) {
      // Logic for real Telegram Stars
      // Actually we mock the callback since the invoice isn't real
      webApp.openInvoice(mockInvoiceUrl, async (status: string) => {
        if (status === 'paid' || status === 'pending') {
          await completeUpgrade();
        } else {
          setIsProcessing(false);
          triggerHaptic('error');
        }
      });
      
      // Fallback for demo in dev environment (auto success after 1.5s)
      setTimeout(async () => {
        if (isProcessing) {
          await completeUpgrade();
        }
      }, 1500);
      
    } else {
      // Development mode
      setTimeout(async () => {
        await completeUpgrade();
      }, 1500);
    }
  };

  const completeUpgrade = async () => {
    try {
      await upgradeToVip(user.uid);
      setShowSuccess(true);
      triggerHaptic('heavy');
      setTimeout(() => triggerHaptic('heavy'), 200);
      setTimeout(() => triggerHaptic('heavy'), 400);
      setIsProcessing(false);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  if (user.isVip && !showSuccess) {
    return (
      <div className="p-4 pt-12 flex flex-col items-center justify-center h-full gap-4 text-center mt-20">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#CCFF00]/20 text-[#CCFF00] shadow-[0_0_40px_rgba(204,255,0,0.3)] border border-[#CCFF00]/50 mb-4">
          <Crown size={48} />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-wider">APEX <span className="text-[#CCFF00]">VIP</span></h1>
        <p className="text-[#A1A1AA] text-sm max-w-[250px]">VIP-статус активирован. Вы используете все возможности платформы.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6 pb-24 flex flex-col gap-6 relative">
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-[#CCFF00]/10 blur-3xl rounded-full animate-pulse" />
            <div className="text-center relative z-10 px-4">
              <motion.div 
                initial={{ y: 20 }}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-block text-[#CCFF00] mb-6 drop-shadow-[0_0_20px_rgba(204,255,0,0.8)]"
              >
                <Crown size={80} />
              </motion.div>
              <h1 className="text-4xl font-black uppercase text-white mb-2 drop-shadow-[0_0_15px_rgba(204,255,0,0.8)]">VIP UNLOCKED</h1>
              <p className="text-[#A1A1AA] text-sm mt-4 uppercase tracking-wider mb-8">Все функции разблокированы</p>
              <button 
                onClick={() => setShowSuccess(false)}
                className="bg-[#CCFF00] text-black px-8 py-3 rounded-xl font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(204,255,0,0.4)]"
              >
                Начать тренировку
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] mb-4 border border-[#CCFF00]/20 shadow-[0_0_30px_rgba(204,255,0,0.15)]">
          <Crown size={32} />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-wider mb-2">APEX <span className="text-[#CCFF00]">VIP</span></h1>
        <p className="text-[#A1A1AA] text-sm px-4">Разблокируй полный потенциал гипертрофии и персональный AI-трекинг.</p>
      </div>

      {/* Feature Teasers */}
      <div className="grid gap-3">
        <div className="bg-[#1A1A1A] border border-[#262626] p-4 rounded-2xl flex gap-4 items-center">
          <div className="text-[#CCFF00]"><Video size={24} /></div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Кастомные тренировки</h4>
            <p className="text-xs text-[#A1A1AA] mt-1">Создавай свои пресеты из базы упражнений.</p>
          </div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#262626] p-4 rounded-2xl flex gap-4 items-center">
          <div className="text-[#CCFF00]"><Zap size={24} /></div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider">AI Макро Калькулятор</h4>
            <p className="text-xs text-[#A1A1AA] mt-1">Ежедневная корректировка профицита (TDEE).</p>
          </div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#262626] p-4 rounded-2xl flex gap-4 items-center">
          <div className="text-[#CCFF00]"><Shield size={24} /></div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider">1-on-1 Менторство</h4>
            <p className="text-xs text-[#A1A1AA] mt-1">Прямая связь с профи-тренером.</p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl overflow-hidden mt-2">
        <div className="grid grid-cols-[1fr_60px_60px] text-xs font-bold uppercase tracking-wider border-b border-[#262626] bg-black/50">
          <div className="p-3 pl-4">Функция</div>
          <div className="p-3 text-center text-[#A1A1AA]">FREE</div>
          <div className="p-3 text-center text-[#CCFF00] bg-[#CCFF00]/5">VIP</div>
        </div>
        
        {[
          { name: 'Трекинг Тоннажа', free: true, vip: true },
          { name: 'CNS Readiness', free: true, vip: true },
          { name: 'Кастомные Программы', free: false, vip: true },
          { name: 'AI Макросы', free: false, vip: true },
          { name: 'Чат с Тренером', free: false, vip: true },
        ].map((feat, i) => (
          <div key={i} className="grid grid-cols-[1fr_60px_60px] text-sm border-b border-[#262626] last:border-0 items-center">
            <div className="p-3 pl-4 text-[#A1A1AA]">{feat.name}</div>
            <div className="p-3 flex justify-center text-[#262626]">
              {feat.free ? <Check size={16} className="text-white" /> : <X size={16} />}
            </div>
            <div className="p-3 flex justify-center bg-[#CCFF00]/5">
              {feat.vip ? <Check size={16} className="text-[#CCFF00]" /> : <X size={16} />}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={handleBuy}
        disabled={isProcessing}
        className="w-full bg-[#CCFF00] text-black font-black uppercase tracking-widest text-lg rounded-2xl py-5 mt-4 shadow-[0_0_20px_rgba(204,255,0,0.2)] active:scale-95 transition-transform disabled:opacity-50"
      >
        {isProcessing ? 'Обработка...' : 'Купить за 500 ⭐'}
      </button>
      <p className="text-center text-[10px] text-[#A1A1AA] uppercase tracking-wider">Оплата через Telegram Stars</p>
    </div>
  );
}
