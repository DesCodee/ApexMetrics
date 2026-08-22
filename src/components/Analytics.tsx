import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { TrendingUp, Scale, Target } from 'lucide-react';

const tonnageData = [
  { day: 'Пн', volume: 4200 },
  { day: 'Вт', volume: 0 },
  { day: 'Ср', volume: 5100 },
  { day: 'Чт', volume: 0 },
  { day: 'Пт', volume: 3800 },
  { day: 'Сб', volume: 6200 },
  { day: 'Вс', volume: 0 },
];

export function Analytics() {
  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 pt-4 px-4 bg-apex-bg">
      <header className="mb-6">
        <h1 className="text-2xl font-black tracking-tighter uppercase text-white">APEX <span className="text-apex-neon">МЕТРИКИ</span></h1>
        <p className="text-[10px] font-mono text-apex-text-dim">СВОДКА ЗА 7 ДНЕЙ</p>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-4">

        {/* Total Tonnage */}
        <div className="bg-apex-card border border-apex-border p-5 rounded-2xl col-span-1 border-t-4 border-t-apex-neon flex flex-col justify-between">
          <div className="text-[10px] text-apex-text-dim uppercase mb-2">Тоннаж</div>
          <div className="text-2xl font-black font-sans text-white leading-none mb-2">19.3<span className="text-sm text-apex-neon ml-1">т</span></div>
          <div className="text-apex-neon text-[10px] font-mono flex items-center gap-1">
            <TrendingUp size={10} /> +2.4т
          </div>
        </div>
        
        {/* Workouts */}
        <div className="bg-apex-card border border-apex-border p-5 rounded-2xl col-span-1 border-t-4 border-t-white flex flex-col justify-between">
          <div className="text-[10px] text-apex-text-dim uppercase mb-2">Тренировки</div>
          <div className="text-2xl font-black font-sans text-white leading-none mb-2">4<span className="text-sm text-apex-text-dim ml-1">/ 5</span></div>
          <div className="text-white text-[10px] font-mono">
            ОПТИМАЛЬНО
          </div>
        </div>

        {/* Volume Chart */}
        <div className="bg-apex-card border border-apex-border rounded-2xl p-5 col-span-2">
          <div className="text-[11px] font-mono text-apex-neon uppercase tracking-[2px] mb-4 flex justify-between items-center">
            <span>ТОННАЖ ПО ДНЯМ (КГ)</span>
            <span className="text-xs opacity-50">04</span>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tonnageData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-apex-text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--color-apex-text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--color-apex-border)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'var(--color-apex-card)', borderColor: 'var(--color-apex-border)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: 'var(--color-apex-neon)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--color-apex-text-dim)', fontSize: '12px' }}
                />
                <Bar 
                  dataKey="volume" 
                  fill="#ffffff" 
                  radius={[4, 4, 0, 0]} 
                  activeBar={{ fill: 'var(--color-apex-neon)' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progression */}
        <div className="bg-apex-card border border-apex-border rounded-2xl p-5 col-span-2">
          <div className="text-[11px] font-mono text-apex-neon uppercase tracking-[2px] mb-4 flex justify-between items-center">
            <span>ЛИДЕРЫ ГИПЕРТРОФИИ</span>
            <span className="text-xs opacity-50">05</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-bold uppercase text-sm">Жим штанги лежа</div>
                <div className="text-apex-text-dim text-[10px] uppercase">Грудь</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-apex-neon font-black">80 кг</div>
                <div className="text-apex-text-dim text-[10px]">+2.5 кг</div>
              </div>
            </div>
            <div className="h-px w-full bg-apex-border" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-bold uppercase text-sm">Приседания</div>
                <div className="text-apex-text-dim text-[10px] uppercase">Квадрицепс</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-apex-neon font-black">110 кг</div>
                <div className="text-apex-text-dim text-[10px]">+5.0 кг</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
