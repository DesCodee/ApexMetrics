import React, { useState } from 'react';
import { Target, Activity, ChevronRight, Zap, TrendingUp, Moon } from 'lucide-react';
import { type DbUser } from '../lib/api';
import { calculateCNS, getCNSStatus, calculateMacros } from '../lib/formulas';
import { useLocalStorage } from '../hooks/useLocalStorage';

export function Dashboard({ onStartWorkout, dbUser }: { onStartWorkout: () => void, dbUser: DbUser | null }) {
  const [sleep, setSleep] = useLocalStorage('apex_sleep', 3);
  const [soreness, setSoreness] = useLocalStorage('apex_soreness', 3);
  const [energy, setEnergy] = useLocalStorage('apex_energy', 3);
  const [isCnsModalOpen, setCnsModalOpen] = useState(false);
  
  const cnsScore = calculateCNS(sleep, soreness, energy);
  const cnsStatus = getCNSStatus(cnsScore);
  
  const { surplus, protein } = calculateMacros(dbUser?.weight || 75, dbUser?.goal || 'mass');

  return (
    <div className="p-4 flex flex-col gap-6 pt-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-xl font-bold text-[#CCFF00]">
            {dbUser?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <h1 className="font-bold text-lg">{dbUser?.username || 'Атлет'}</h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#A1A1AA] flex items-center gap-1"><Zap size={12} className="text-orange-400"/> 3 дня стрик</span>
              <span className="bg-[#CCFF00]/10 text-[#CCFF00] px-2 py-0.5 rounded-full uppercase font-bold text-[9px] border border-[#CCFF00]/20">FREE</span>
            </div>
          </div>
        </div>
      </div>

      {/* CNS Readiness Widget */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-3xl rounded-full" />
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-sm text-[#A1A1AA] uppercase tracking-wider font-bold">CNS Readiness</h2>
            <div className={`text-2xl font-black ${cnsStatus.color}`}>{Math.round(cnsScore)}%</div>
          </div>
          <button onClick={() => setCnsModalOpen(true)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-transform">
            <Activity size={18} className="text-[#CCFF00]" />
          </button>
        </div>
        
        {/* Simple Progress Bar */}
        <div className="h-2 w-full bg-black rounded-full overflow-hidden mb-2 border border-white/5">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${cnsScore}%`, 
              backgroundColor: cnsScore > 80 ? '#CCFF00' : cnsScore > 50 ? '#FBBF24' : '#FF3333'
            }}
          />
        </div>
        <p className="text-xs text-[#A1A1AA]">{cnsStatus.label}: {cnsStatus.recommend}</p>

        {/* CNS Modal/Sliders inline for simplicity, expanding on click */}
        {isCnsModalOpen && (
          <div className="mt-4 pt-4 border-t border-[#262626] flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <Slider label="Сон (1-5)" value={sleep} setter={setSleep} icon={<Moon size={14}/>} />
            <Slider label="Крепатура (1-5)" value={soreness} setter={setSoreness} icon={<Activity size={14}/>} />
            <Slider label="Энергия (1-5)" value={energy} setter={setEnergy} icon={<Zap size={14}/>} />
            <button onClick={() => setCnsModalOpen(false)} className="mt-2 text-xs text-[#CCFF00] font-bold uppercase tracking-wider">Сохранить</button>
          </div>
        )}
      </div>

      {/* Main CTA */}
      <button 
        onClick={onStartWorkout}
        className="w-full bg-[#CCFF00] text-black font-black uppercase tracking-widest text-lg rounded-2xl py-5 shadow-[0_0_20px_rgba(204,255,0,0.2)] active:scale-95 transition-all"
      >
        Начать тренировку
      </button>

      {/* Weight & Macros Widget */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA] mb-1">
            <Target size={16} /> <span className="text-xs uppercase font-bold">Вес</span>
          </div>
          <div className="text-xl font-bold">{dbUser?.weight || 75} <span className="text-sm text-[#A1A1AA] font-normal">кг</span></div>
          <div className="text-[10px] text-[#CCFF00] mt-1 flex items-center gap-1"><TrendingUp size={10}/> Цель: +0.3кг/нед</div>
        </div>
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[#A1A1AA] mb-1">
            <Activity size={16} /> <span className="text-xs uppercase font-bold">БЖУ Цель</span>
          </div>
          <div className="text-xl font-bold">{surplus} <span className="text-sm text-[#A1A1AA] font-normal">ккал</span></div>
          <div className="text-[10px] text-white mt-1">Белок: {protein}г</div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, setter, icon }: { label: string, value: number, setter: (v: number) => void, icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[#A1A1AA] mb-2 font-bold uppercase tracking-wider items-center">
        <span className="flex items-center gap-1">{icon} {label}</span>
        <span className="text-white">{value}</span>
      </div>
      <input 
        type="range" min="1" max="5" step="1" 
        value={value} onChange={(e) => setter(Number(e.target.value))}
        className="w-full h-1 bg-black rounded-lg appearance-none cursor-pointer accent-[#CCFF00]"
      />
    </div>
  );
}
