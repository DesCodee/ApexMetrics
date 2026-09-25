export const Slider = ({ label, value, min, max, step, onChange, displayValue }: any) => (
  <div className="mb-2">
    <div className="flex justify-between items-end mb-2.5">
      <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">{label}</label>
      <span className="text-base font-bold text-white tracking-tight tabular-nums">{displayValue || value}</span>
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
    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 ml-1">{label}</label>
    <input 
      type="number" 
      value={value || ''} 
      onChange={e => onChange(Number(e.target.value))} 
      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white font-semibold text-base focus:outline-none focus:border-[#D4FF00] focus:ring-1 focus:ring-[#D4FF00]/30 transition-colors h-[52px]" 
    />
  </div>
);
