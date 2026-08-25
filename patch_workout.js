const fs = require('fs');

let code = fs.readFileSync('src/components/WorkoutTracker.tsx', 'utf8');

const stateCode = `  const [sleep] = useLocalStorage('apex_sleep_quality', 3);
  const [soreness] = useLocalStorage('apex_soreness', 3);
  const [stress] = useLocalStorage('apex_stress', 3);
  const cnsScore = calculateCNS(sleep, soreness, stress);
  const isDeloadMode = cnsScore < 50;
  
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const generateAIPlan = async () => {
    setIsGeneratingPlan(true);
    triggerHaptic('medium');
    try {
      const res = await fetch('/api/gemini/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          goal: user.goal === 'hard' ? 'Жесткий набор (Сила)' : 'Сухая гипертрофия', 
          experience: user.activityLevel && user.activityLevel > 1.5 ? 'Продвинутый' : 'Новичок', 
          weight: user.weight 
        })
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((ex) => ({
          name: ex.name,
          target: ex.target,
          prevSets: Array(ex.defaultSets || 3).fill({ w: 20, r: ex.defaultReps || 10 })
        }));
        loadPreset(formatted);
        triggerHaptic('success');
      }
    } catch (e) {
      console.error(e);
      triggerHaptic('error');
    }
    setIsGeneratingPlan(false);
  };`;

code = code.replace(
  "  const [sleep] = useLocalStorage('apex_sleep_quality', 3);\n  const [soreness] = useLocalStorage('apex_soreness', 3);\n  const [stress] = useLocalStorage('apex_stress', 3);\n  const cnsScore = calculateCNS(sleep, soreness, stress);\n  const isDeloadMode = cnsScore < 50;",
  stateCode
);

const btnCode = `<div className="text-[#CCFF00] font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
          <Zap size={14} /> AI-Генерация (Gemini)
        </div>
        <button 
          onClick={generateAIPlan}
          disabled={isGeneratingPlan}
          className="w-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] font-black uppercase p-4 rounded-2xl mb-6 shadow-[0_0_15px_rgba(204,255,0,0.1)] active:scale-95 flex justify-center items-center gap-2 transition-all disabled:opacity-50"
        >
          {isGeneratingPlan ? "Генерация нейросетью..." : "Сгенерировать План"}
        </button>
        
        <div className="text-white font-bold uppercase tracking-wider text-xs mb-3">Базовые</div>`;

code = code.replace(
  '<div className="text-white font-bold uppercase tracking-wider text-xs mb-3">Базовые</div>',
  btnCode
);

fs.writeFileSync('src/components/WorkoutTracker.tsx', code);
