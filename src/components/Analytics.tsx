import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Activity, Dumbbell, AlertTriangle } from 'lucide-react';
import { type DbUser } from '../lib/api';

const mockWeeklyData = [
  { day: 'Пн', tonnage: 4500 },
  { day: 'Вт', tonnage: 0 },
  { day: 'Ср', tonnage: 5200 },
  { day: 'Чт', tonnage: 0 },
  { day: 'Пт', tonnage: 4800 },
  { day: 'Сб', tonnage: 0 },
  { day: 'Вс', tonnage: 6100 },
];

const mockMuscleData = [
  { name: 'Грудь', percent: 85 },
  { name: 'Спина', percent: 92 },
  { name: 'Ноги', percent: 60 },
  { name: 'Руки', percent: 75 },
];

export function Analytics({ user }: { user: DbUser }) {
  // Simulate logic for progressive overload
  const isOverloading = true; // "В фазе активной гипертрофии"

  return (
    <div className="p-4 pt-6 pb-24 flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-black uppercase tracking-wider">Метрики</h1>
        <span className="text-[#A1A1AA] text-xs font-bold uppercase">7 Дней</span>
      </div>

      {/* Progressive Overload Status */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isOverloading ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30' : 'bg-[#FF3333]/10 border-[#FF3333]/30'}`}>
        <div className={`p-2 rounded-full ${isOverloading ? 'bg-[#CCFF00]/20 text-[#CCFF00]' : 'bg-[#FF3333]/20 text-[#FF3333]'}`}>
          {isOverloading ? <TrendingUp size={24} /> : <AlertTriangle size={24} />}
        </div>
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-1">Статус перегрузки</h3>
          <p className={`text-xs ${isOverloading ? 'text-[#CCFF00]' : 'text-[#FF3333]'}`}>
            {isOverloading ? 'В фазе активной гипертрофии (+12% объема)' : 'Плато. Требуется корректировка весов.'}
          </p>
        </div>
      </div>

      {/* Tonnage Chart */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4">
        <h3 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Dumbbell size={16} /> Тоннаж за неделю
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockWeeklyData}>
              <XAxis dataKey="day" stroke="#A1A1AA" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: '#262626' }}
                contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid #262626', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#CCFF00', fontWeight: 'bold' }}
              />
              <Bar dataKey="tonnage" radius={[4, 4, 0, 0]}>
                {mockWeeklyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.tonnage > 5000 ? '#CCFF00' : '#404040'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hypertrophy Index Breakdown */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4">
        <h3 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity size={16} /> Индекс гипертрофии
        </h3>
        <div className="flex flex-col gap-4">
          {mockMuscleData.map((m, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>{m.name}</span>
                <span className={m.percent > 80 ? 'text-[#CCFF00]' : 'text-white'}>{m.percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full" 
                  style={{ width: `${m.percent}%`, backgroundColor: m.percent > 80 ? '#CCFF00' : '#404040' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
