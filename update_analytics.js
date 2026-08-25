const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Activity, Dumbbell, AlertTriangle, Zap, Loader2 } from 'lucide-react';
import { type DbUser, getWorkoutHistory } from '../lib/api';

export function Analytics({ user }: { user: DbUser }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    getWorkoutHistory(user.uid).then(data => {
      setHistory(data);
      setLoading(false);
    }).catch(console.error);
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <Loader2 className="animate-spin text-[#CCFF00] mb-4" size={32} />
        <p className="text-[#A1A1AA] text-sm uppercase tracking-wider font-bold">Сбор данных...</p>
      </div>
    );
  }

  // Calculate last 7 days tonnage
  const weeklyData = [];
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let thisWeekTonnage = 0;
  let lastWeekTonnage = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayStr = days[d.getDay()];
    
    // Find sessions for this day
    const daySessions = history.filter(h => {
      const hd = new Date(h.date);
      return hd.getDate() === d.getDate() && hd.getMonth() === d.getMonth() && hd.getFullYear() === d.getFullYear();
    });
    const tonnage = daySessions.reduce((acc, curr) => acc + (curr.totalTonnage || 0), 0);
    thisWeekTonnage += tonnage;
    weeklyData.push({ day: dayStr, tonnage, fullDate: d });
  }

  // Calculate previous week tonnage for overload status
  for (let i = 13; i >= 7; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const daySessions = history.filter(h => {
      const hd = new Date(h.date);
      return hd.getDate() === d.getDate() && hd.getMonth() === d.getMonth() && hd.getFullYear() === d.getFullYear();
    });
    lastWeekTonnage += daySessions.reduce((acc, curr) => acc + (curr.totalTonnage || 0), 0);
  }

  const isOverloading = thisWeekTonnage >= lastWeekTonnage;
  const overloadPercent = lastWeekTonnage === 0 ? 100 : Math.round(((thisWeekTonnage - lastWeekTonnage) / lastWeekTonnage) * 100);

  // Muscle Volume Calculation (Last 30 days)
  const muscleVolumes: Record<string, number> = {};
  history.forEach(h => {
    const d = new Date(h.date);
    if ((today.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 30) {
      h.exercises?.forEach((ex: any) => {
        let t = ex.target || 'Другое';
        // Normalize targets
        if (t === 'Бицепс' || t === 'Трицепс') t = 'Руки';
        if (!muscleVolumes[t]) muscleVolumes[t] = 0;
        ex.sets?.forEach((s: any) => {
          if (s.completed) muscleVolumes[t] += (s.weight || 0) * (s.reps || 0);
        });
      });
    }
  });

  let maxVol = 0;
  Object.values(muscleVolumes).forEach(v => {
    if (v > maxVol) maxVol = v;
  });

  const muscleData = Object.keys(muscleVolumes).map(name => ({
    name,
    percent: maxVol === 0 ? 0 : Math.round((muscleVolumes[name] / maxVol) * 100)
  })).sort((a, b) => b.percent - a.percent);

  if (muscleData.length === 0) {
    muscleData.push(
      { name: 'Грудь', percent: 0 },
      { name: 'Спина', percent: 0 },
      { name: 'Ноги', percent: 0 },
      { name: 'Руки', percent: 0 },
      { name: 'Пресс', percent: 0 }
    );
  }

  return (
    <div className="p-4 pt-6 pb-24 flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-black uppercase tracking-wider">Метрики</h1>
        <span className="text-[#A1A1AA] text-xs font-bold uppercase">Обзор</span>
      </div>

      {/* Hypertrophy Index Breakdown */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4">
        <h3 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity size={16} /> Индекс гипертрофии (30 дней)
        </h3>
        <div className="flex flex-col gap-4">
          {muscleData.map((m, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>{m.name}</span>
                <span className={m.percent > 80 ? 'text-[#CCFF00]' : 'text-white'}>{m.percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ width: \`\${m.percent}%\`, backgroundColor: m.percent > 80 ? '#CCFF00' : '#404040' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progressive Overload Status */}
      <div className={\`p-4 rounded-2xl border flex items-start gap-3 mt-2 \${isOverloading ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30 shadow-[0_0_20px_rgba(204,255,0,0.05)]' : 'bg-[#FF3333]/10 border-[#FF3333]/30'}\`}>
        <div className={\`p-2 rounded-full \${isOverloading ? 'bg-[#CCFF00]/20 text-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.4)]' : 'bg-[#FF3333]/20 text-[#FF3333]'}\`}>
          {isOverloading ? <TrendingUp size={24} /> : <AlertTriangle size={24} />}
        </div>
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-1 text-white">Статус перегрузки</h3>
          <p className={\`text-xs font-bold \${isOverloading ? 'text-[#CCFF00]' : 'text-[#FF3333]'}\`}>
            {isOverloading 
              ? \`В фазе активной гипертрофии (+\${overloadPercent}% объема к прошлой неделе)\` 
              : \`Плато (\${overloadPercent}% объема). Требуется корректировка весов.\`}
          </p>
        </div>
      </div>

      {/* Tonnage Chart */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-4 shadow-lg">
        <h3 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Dumbbell size={16} className="text-[#CCFF00]" /> Тоннаж за 7 дней
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" stroke="#A1A1AA" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: '#262626' }}
                contentStyle={{ backgroundColor: '#0D0D0D', border: '1px solid #262626', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#CCFF00', fontWeight: 'bold' }}
                formatter={(value: number) => [\`\${value} кг\`, 'Тоннаж']}
              />
              <Bar dataKey="tonnage" radius={[4, 4, 0, 0]}>
                {weeklyData.map((entry, index) => (
                  <Cell key={\`cell-\${index}\`} fill={entry.tonnage > 0 ? '#CCFF00' : '#333333'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/Analytics.tsx', code);
