import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Zap, Flame, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Tab } from '../types';

interface DashboardProps {
  onStartWorkout: () => void;
  onNavigate: (tab: Tab) => void;
  userName?: string;
}

const mockWeightData = [
  { date: '10 Мар', weight: 75.2 },
  { date: '12 Мар', weight: 75.4 },
  { date: '14 Мар', weight: 75.8 },
  { date: '16 Мар', weight: 76.1 },
  { date: '18 Мар', weight: 76.0 },
  { date: '20 Мар', weight: 76.4 },
  { date: '22 Мар', weight: 76.7 },
];

export function Dashboard({ onStartWorkout, onNavigate, userName = 'Атлет' }: DashboardProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 pt-4 px-4 bg-apex-bg">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase text-white">APEX <span className="text-apex-neon">METRICS</span></h1>
          <p className="text-[10px] font-mono text-apex-text-dim">ID: {userName.toUpperCase()}_2024</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <p className="text-[10px] text-apex-text-dim uppercase">Статус Системы</p>
            <p className="text-[12px] font-bold text-white">ОПТИМАЛЬНО</p>
          </div>
          <div className="w-2 h-2 bg-apex-neon rounded-full shadow-[0_0_8px_var(--color-apex-neon)]"></div>
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Readiness Score */}
        <div className="bg-apex-card border border-apex-border rounded-2xl p-5 relative overflow-hidden col-span-2 border-l-4 border-l-apex-neon">
          <div className="text-[11px] font-mono text-apex-neon uppercase tracking-[2px] mb-3 flex justify-between items-center">
            <span>ГОТОВНОСТЬ</span>
            <span className="text-xs opacity-50">01</span>
          </div>
          
          <div className="flex justify-between items-center relative z-10 mt-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black font-sans leading-none text-white">89<span className="text-2xl text-apex-neon">%</span></span>
              </div>
              <p className="text-xs text-apex-text-dim mt-2 max-w-[80%] leading-relaxed">
                Твой организм готов к новым рекордам сегодня
              </p>
            </div>
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="44" stroke="#222" strokeWidth="6" fill="transparent" />
                <circle cx="48" cy="48" r="44" stroke="#ccff00" strokeWidth="6" fill="transparent" strokeDasharray="276" strokeDashoffset="30" />
              </svg>
              <Activity className="text-apex-neon" size={28} />
            </div>
          </div>
        </div>

        {/* Weight Tracker */}
        <div className="bg-apex-card border border-apex-border rounded-2xl p-5 col-span-2">
          <div className="text-[11px] font-mono text-apex-neon uppercase tracking-[2px] mb-3 flex justify-between items-center">
            <span>ДИНАМИКА ВЕСА</span>
            <span className="text-xs opacity-50">02</span>
          </div>
          
          <div className="flex flex-col h-full justify-between">
            <div className="mb-4">
              <div className="text-[10px] text-apex-text-dim uppercase mb-1">Текущий вес</div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black leading-none text-white">84.2</span>
                <span className="text-xl text-apex-neon font-bold">кг</span>
              </div>
              <div className="text-apex-neon text-[10px] font-mono mt-1">+1.2кг за 7 дней (МАССА)</div>
            </div>
            
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockWeightData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-apex-neon)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-apex-neon)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-apex-text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-apex-text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-apex-card)', borderColor: 'var(--color-apex-border)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: 'var(--color-apex-neon)', fontFamily: 'var(--font-mono)' }}
                    labelStyle={{ color: 'var(--color-apex-text-dim)', fontSize: '12px' }}
                  />
                  <Area 
                    type="step" 
                    dataKey="weight" 
                    stroke="var(--color-apex-neon)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorWeight)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Today's Plan */}
        <div className="bg-apex-card border border-apex-border rounded-2xl p-5 col-span-2">
          <div className="text-[11px] font-mono text-apex-neon uppercase tracking-[2px] mb-3 flex justify-between items-center">
            <span>ТРЕНИРОВКА ДНЯ</span>
            <span className="text-xs opacity-50">03</span>
          </div>
          
          <div className="bg-apex-surface p-4 rounded-xl border border-apex-border flex flex-col items-center justify-center text-center">
            <div className="text-apex-neon mb-2 font-mono text-[10px] uppercase">Гипертрофия Фаза 2</div>
            <div className="text-2xl font-black uppercase text-white tracking-tight mb-2">ГРУДЬ / ПЛЕЧИ</div>
            <button 
              onClick={onStartWorkout}
              className="mt-2 w-full bg-apex-neon text-black font-black uppercase py-3 px-6 rounded-lg text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              СТАРТ ТРЕНИРОВКИ
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
