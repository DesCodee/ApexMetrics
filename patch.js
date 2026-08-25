const fs = require('fs');

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Add Loader2
code = code.replace(
  "import { Target, Activity, ChevronRight, Zap, TrendingUp, Moon, Droplets, Flame, Clock } from 'lucide-react';",
  "import { Target, Activity, ChevronRight, Zap, TrendingUp, Moon, Droplets, Flame, Clock, Loader2 } from 'lucide-react';"
);

// 2. State
code = code.replace(
  "  const [cals, setCals] = useState(0);\n  \n  const [isCnsModalOpen",
  `  const [cals, setCals] = useState(0);
  const [consumedProtein, setConsumedProtein] = useState(0);
  const [consumedCarbs, setConsumedCarbs] = useState(0);
  const [consumedFats, setConsumedFats] = useState(0);
  const [foodQuery, setFoodQuery] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  
  const [isCnsModalOpen`
);

// 3. useEffect
code = code.replace(
  "          setCals(stats.cals || 0);\n          setWaterMl(stats.waterMl || 0);\n        }",
  `          setCals(stats.cals || 0);
          setWaterMl(stats.waterMl || 0);
          setConsumedProtein(stats.protein || 0);
          setConsumedCarbs(stats.carbs || 0);
          setConsumedFats(stats.fats || 0);
        }`
);

// 4. updateStats
code = code.replace(
  `  const updateStats = (newCals: number, newWater: number) => {
    setCals(newCals);
    setWaterMl(newWater);
    if (dbUser?.uid) {
      saveDailyStats(dbUser.uid, { cals: newCals, waterMl: newWater }).catch(console.error);
    }
  };`,
  `  const updateStats = (newCals: number, newWater: number, newProtein: number = consumedProtein, newCarbs: number = consumedCarbs, newFats: number = consumedFats) => {
    setCals(newCals);
    setWaterMl(newWater);
    setConsumedProtein(newProtein);
    setConsumedCarbs(newCarbs);
    setConsumedFats(newFats);
    if (dbUser?.uid) {
      saveDailyStats(dbUser.uid, { cals: newCals, waterMl: newWater, protein: newProtein, carbs: newCarbs, fats: newFats }).catch(console.error);
    }
  };

  const parseFood = async () => {
    if (!foodQuery) return;
    setIsParsing(true);
    triggerHaptic('medium');
    try {
      const res = await fetch('/api/gemini/parse-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: foodQuery })
      });
      if (res.ok) {
        const data = await res.json();
        updateStats(
          cals + (data.cals || 0), 
          waterMl, 
          consumedProtein + (data.protein || 0),
          consumedCarbs + (data.carbs || 0),
          consumedFats + (data.fats || 0)
        );
        setFoodQuery('');
        setFuelModalOpen(false);
        triggerHaptic('success');
      }
    } catch (e) {
      console.error(e);
      triggerHaptic('error');
    }
    setIsParsing(false);
  };`
);

// 5. Presets modal to AI Modal
code = code.replace(
  `<h3 className="text-xs font-bold uppercase text-[#A1A1AA] mb-3">Пресеты приемов</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addMeal(400)} className="bg-[#1A1A1A] border border-[#262626] p-2 text-xs rounded-lg active:scale-95 text-left"><span className="font-bold text-[#CCFF00]">400 kcal</span><br/><span className="text-[10px] text-[#A1A1AA]">Легкий перекус</span></button>
              <button onClick={() => addMeal(600)} className="bg-[#1A1A1A] border border-[#262626] p-2 text-xs rounded-lg active:scale-95 text-left"><span className="font-bold text-[#CCFF00]">600 kcal</span><br/><span className="text-[10px] text-[#A1A1AA]">Стандартный прием</span></button>
              <button onClick={() => addMeal(800)} className="bg-[#1A1A1A] border border-[#262626] p-2 text-xs rounded-lg active:scale-95 text-left"><span className="font-bold text-[#CCFF00]">800 kcal</span><br/><span className="text-[10px] text-[#A1A1AA]">Плотный обед</span></button>
              <button onClick={() => updateStats(0, waterMl)} className="bg-red-500/10 text-red-400 border border-red-500/20 p-2 text-xs rounded-lg active:scale-95 text-center font-bold">Сбросить</button>
            </div>`,
  `<h3 className="text-xs font-bold uppercase text-[#A1A1AA] mb-3 flex items-center gap-2"><Zap size={14} className="text-[#CCFF00]"/> Умный трекинг питания</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={foodQuery}
                onChange={e => setFoodQuery(e.target.value)}
                placeholder="Съел двойной чизбургер..."
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg p-2 text-xs focus:border-[#CCFF00] outline-none text-white"
                disabled={isParsing}
              />
              <button 
                onClick={parseFood} 
                disabled={isParsing || !foodQuery}
                className="bg-[#CCFF00] text-black px-3 py-2 rounded-lg font-bold text-xs disabled:opacity-50 flex items-center justify-center shrink-0 active:scale-95"
              >
                {isParsing ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
              </button>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={() => updateStats(0, waterMl, 0, 0, 0)} className="text-[10px] text-red-400 font-bold uppercase tracking-wider active:scale-95">Сбросить день</button>
            </div>`
);

// 6. Macros UI
code = code.replace(
  `              <div className="text-xs font-bold text-white">{protein}г</div>
            </div>
            <div className="bg-black border border-[#262626] rounded-lg p-2">
              <div className="text-[9px] text-[#A1A1AA] uppercase font-bold mb-1">Углеводы</div>
              <div className="text-xs font-bold text-white">{carbs}г</div>
            </div>
            <div className="bg-black border border-[#262626] rounded-lg p-2">
              <div className="text-[9px] text-[#A1A1AA] uppercase font-bold mb-1">Жиры</div>
              <div className="text-xs font-bold text-white">{fats}г</div>`,
  `              <div className="text-xs font-bold text-white">{consumedProtein} / {protein}г</div>
            </div>
            <div className="bg-black border border-[#262626] rounded-lg p-2">
              <div className="text-[9px] text-[#A1A1AA] uppercase font-bold mb-1">Углеводы</div>
              <div className="text-xs font-bold text-white">{consumedCarbs} / {carbs}г</div>
            </div>
            <div className="bg-black border border-[#262626] rounded-lg p-2">
              <div className="text-[9px] text-[#A1A1AA] uppercase font-bold mb-1">Жиры</div>
              <div className="text-xs font-bold text-white">{consumedFats} / {fats}г</div>`
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
