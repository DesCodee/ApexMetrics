import { useState } from 'react';
import { WeightLog } from '../firebase';
import { TrendingDown, TrendingUp, Minus, Calendar, LineChart } from 'lucide-react';
import { tgHaptic } from '../utils/haptics';

interface WeightChartProps {
  history: WeightLog[];
  currentWeight: number;
}

export default function WeightChart({ history, currentWeight }: WeightChartProps) {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  // Prepare and sort data chronologically
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));

  // If no history exists yet, construct a single baseline entry from current weight
  const points = sorted.length > 0 
    ? sorted 
    : currentWeight > 0 
      ? [{ id: 'baseline', weight: currentWeight, date: new Date().toISOString().split('T')[0], timestamp: Date.now() }] 
      : [];

  const formatShortDate = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
    return dStr;
  };

  if (points.length === 0) {
    return (
      <div className="bg-white/[0.02] rounded-2xl p-6 text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-neutral-400 mx-auto mb-2">
          <LineChart size={20} strokeWidth={1.5} />
        </div>
        <div className="text-sm font-normal text-white">Динамика веса</div>
        <p className="text-xs text-neutral-400 font-normal">
          Сохраните свой вес, чтобы построить график изменений
        </p>
      </div>
    );
  }

  const firstWeight = points[0].weight;
  const latestWeight = points[points.length - 1].weight;
  const delta = Number((latestWeight - firstWeight).toFixed(1));

  // SVG Chart Geometry
  const width = 320;
  const height = 110;
  const paddingLeft = 24;
  const paddingRight = 24;
  const paddingTop = 16;
  const paddingBottom = 24;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const weights = points.map(p => p.weight);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);

  const range = rawMax - rawMin;
  const buffer = range === 0 ? 1.5 : Math.max(0.6, range * 0.2);
  const minDomain = rawMin - buffer;
  const maxDomain = rawMax + buffer;

  const coords = points.map((p, idx) => {
    const x = points.length > 1 
      ? paddingLeft + (idx / (points.length - 1)) * graphWidth 
      : paddingLeft + graphWidth / 2;
    const y = paddingTop + graphHeight - ((p.weight - minDomain) / (maxDomain - minDomain)) * graphHeight;
    return { x, y, weight: p.weight, date: p.date };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = points.length > 1
    ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - paddingBottom} L ${coords[0].x.toFixed(1)} ${height - paddingBottom} Z`
    : '';

  const activeIndex = selectedPointIndex !== null ? selectedPointIndex : coords.length - 1;
  const activeCoord = coords[activeIndex] || coords[coords.length - 1];

  return (
    <div className="bg-white/[0.02] rounded-2xl p-5 space-y-3">
      {/* Header with Title and Trend Delta */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-normal uppercase tracking-wider text-neutral-400">
            <LineChart size={13} strokeWidth={1.5} className="text-[#D4FF00]" />
            <span>Динамика веса</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-light text-white tracking-tight tabular-nums">
              {activeCoord.weight.toFixed(1)} <span className="text-xs text-neutral-400 font-normal">кг</span>
            </span>
            <span className="text-[11px] text-neutral-400 font-normal">
              {formatShortDate(activeCoord.date)}
            </span>
          </div>
        </div>

        {points.length > 1 ? (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs font-medium tabular-nums">
              {delta > 0 ? (
                <span className="text-neutral-300 flex items-center gap-0.5">
                  <TrendingUp size={13} strokeWidth={2} className="text-amber-400" />
                  +{delta} кг
                </span>
              ) : delta < 0 ? (
                <span className="text-[#D4FF00] flex items-center gap-0.5">
                  <TrendingDown size={13} strokeWidth={2} />
                  {delta} кг
                </span>
              ) : (
                <span className="text-neutral-400 flex items-center gap-0.5">
                  <Minus size={13} strokeWidth={2} />
                  0.0 кг
                </span>
              )}
            </div>
            <div className="text-[10px] text-neutral-500 font-normal">
              за {points.length} {points.length === 2 || points.length === 3 || points.length === 4 ? 'записи' : 'записей'}
            </div>
          </div>
        ) : (
          <span className="text-[10px] text-neutral-400 font-normal px-2.5 py-1 rounded-full bg-white/[0.04]">
            1-е взвешивание
          </span>
        )}
      </div>

      {/* Linear Chart SVG */}
      <div className="relative w-full pt-1">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-28 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4FF00" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#D4FF00" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Subtle Grid reference lines */}
          <line 
            x1={paddingLeft} 
            y1={paddingTop + graphHeight * 0.25} 
            x2={width - paddingRight} 
            y2={paddingTop + graphHeight * 0.25} 
            stroke="rgba(255,255,255,0.04)" 
            strokeDasharray="2 3"
          />
          <line 
            x1={paddingLeft} 
            y1={paddingTop + graphHeight * 0.75} 
            x2={width - paddingRight} 
            y2={paddingTop + graphHeight * 0.75} 
            stroke="rgba(255,255,255,0.04)" 
            strokeDasharray="2 3"
          />

          {/* Area Fill */}
          {points.length > 1 && (
            <path 
              d={areaPath} 
              fill="url(#weightAreaGrad)" 
            />
          )}

          {/* Stroke Line */}
          {points.length > 1 && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="#D4FF00" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Active coordinate vertical indicator */}
          {points.length > 1 && activeCoord && (
            <line 
              x1={activeCoord.x} 
              y1={paddingTop} 
              x2={activeCoord.x} 
              y2={height - paddingBottom} 
              stroke="rgba(212,255,0,0.3)" 
              strokeDasharray="2 2"
            />
          )}

          {/* Data Points */}
          {coords.map((c, i) => {
            const isSelected = i === activeIndex;
            return (
              <g 
                key={i} 
                className="cursor-pointer"
                onClick={() => {
                  tgHaptic('light');
                  setSelectedPointIndex(i);
                }}
              >
                {/* Invisible larger hit target for easy touch interaction */}
                <circle cx={c.x} cy={c.y} r="12" fill="transparent" />

                {/* Point ring */}
                <circle 
                  cx={c.x} 
                  cy={c.y} 
                  r={isSelected ? "4.5" : "3"} 
                  fill="#0D0D0D" 
                  stroke={isSelected ? "#D4FF00" : "rgba(212,255,0,0.7)"} 
                  strokeWidth={isSelected ? "2.5" : "1.5"} 
                />
              </g>
            );
          })}

          {/* X Axis Date Labels */}
          {coords.length === 1 ? (
            <text 
              x={coords[0].x} 
              y={height - 6} 
              textAnchor="middle" 
              fill="#737373" 
              fontSize="9"
              fontFamily="sans-serif"
            >
              {formatShortDate(coords[0].date)}
            </text>
          ) : (
            <>
              <text 
                x={coords[0].x} 
                y={height - 6} 
                textAnchor="start" 
                fill="#737373" 
                fontSize="9"
                fontFamily="sans-serif"
              >
                {formatShortDate(coords[0].date)}
              </text>

              {coords.length >= 4 && (
                <text 
                  x={coords[Math.floor(coords.length / 2)].x} 
                  y={height - 6} 
                  textAnchor="middle" 
                  fill="#525252" 
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  {formatShortDate(coords[Math.floor(coords.length / 2)].date)}
                </text>
              )}

              <text 
                x={coords[coords.length - 1].x} 
                y={height - 6} 
                textAnchor="end" 
                fill="#737373" 
                fontSize="9"
                fontFamily="sans-serif"
              >
                {formatShortDate(coords[coords.length - 1].date)}
              </text>
            </>
          )}
        </svg>
      </div>

      {points.length === 1 && (
        <div className="text-[11px] text-neutral-500 text-center font-normal pt-1">
          Добавьте второе взвешивание, чтобы увидеть линию динамики
        </div>
      )}
    </div>
  );
}
