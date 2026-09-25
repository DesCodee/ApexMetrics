export const Slider = ({ label, value, min, max, step, onChange, displayValue }: any) => (
  <div className="mb-2">
    <div className="flex justify-between items-end mb-2.5">
      <label className="text-xs font-normal text-neutral-400 uppercase tracking-wider">{label}</label>
      <span className="text-base font-light text-white tracking-tight tabular-nums">{displayValue || value}</span>
    </div>
    <input 
      type="range" 
      min={min} max={max} step={step} 
      value={value} 
      onChange={(e) => onChange(parseFloat(e.target.value))} 
      className="w-full"
    />
  </div>
);

export const NumberInput = ({ label, value, onChange }: any) => (
  <div>
    <label className="block text-xs font-normal text-neutral-400 uppercase tracking-wider mb-2 ml-1">{label}</label>
    <input 
      type="number" 
      value={value || ''} 
      onChange={e => onChange(Number(e.target.value))} 
      className="w-full bg-neutral-900/60 border-0 rounded-xl px-4 py-3 text-white font-light text-xl focus:outline-none focus:ring-1 focus:ring-neutral-700 transition-colors h-[52px]" 
    />
  </div>
);
