export const Slider = ({ label, value, min, max, step, onChange, displayValue }: any) => (
  <div className="mb-2">
    <div className="flex justify-between items-end mb-3">
      <label className="text-sm font-semibold text-neutral-300">{label}</label>
      <span className="text-xl font-bold text-white tracking-tight">{displayValue || value}</span>
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
    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 ml-1">{label}</label>
    <input 
      type="number" 
      value={value || ''} 
      onChange={e => onChange(Number(e.target.value))} 
      className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-[#D4FF00]/50 transition-colors h-[52px]" 
    />
  </div>
);
