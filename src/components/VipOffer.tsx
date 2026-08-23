import React from 'react';
import { Crown, Check, X, Shield, Zap, Video } from 'lucide-react';
import { type DbUser } from '../lib/api';

export function VipOffer({ user }: { user: DbUser }) {
  return (
    <div className="p-4 pt-6 pb-24 flex flex-col gap-6">
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
            <h4 className="font-bold text-sm uppercase tracking-wider">AI Форм-Чек</h4>
            <p className="text-xs text-[#A1A1AA] mt-1">Анализ техники упражнений через нейросеть.</p>
          </div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#262626] p-4 rounded-2xl flex gap-4 items-center">
          <div className="text-[#CCFF00]"><Zap size={24} /></div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Макро Калькулятор</h4>
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
          { name: 'AI Макросы', free: false, vip: true },
          { name: 'Анализ Техники', free: false, vip: true },
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

      <button className="w-full bg-[#CCFF00] text-black font-black uppercase tracking-widest text-lg rounded-2xl py-5 mt-4 shadow-[0_0_20px_rgba(204,255,0,0.2)] active:scale-95 transition-transform">
        Разблокировать за $4.99
      </button>
      <p className="text-center text-[10px] text-[#A1A1AA] uppercase tracking-wider">Оплата через Telegram Stars</p>
    </div>
  );
}
