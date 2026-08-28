const fs = require('fs');
let code = fs.readFileSync('src/components/WorkoutLogger.tsx', 'utf8');

// Add haptics import
if (!code.includes("tgHaptic")) {
    code = code.replace("import { loadWorkoutLogs, saveWorkoutLog, auth, logEvent } from '../firebase';",
    "import { loadWorkoutLogs, saveWorkoutLog, auth, logEvent } from '../firebase';\nimport { tgHaptic } from '../utils/haptics';\nimport { Timer, X } from 'lucide-react';");
}

// Add state for timer
if (!code.includes("restTimer")) {
    code = code.replace("const [summaryData, setSummaryData] = useState<any>(null);",
    "const [summaryData, setSummaryData] = useState<any>(null);\n  const [restTimer, setRestTimer] = useState(0);\n  const [restActive, setRestActive] = useState(false);\n  const [restTotal, setRestTotal] = useState(60);\n\n  useEffect(() => {\n    let interval: any;\n    if (restActive && restTimer > 0) {\n        interval = setInterval(() => {\n            setRestTimer((prev) => {\n                if (prev <= 1) {\n                    tgHaptic('success');\n                    setRestActive(false);\n                    return 0;\n                }\n                return prev - 1;\n            });\n        }, 1000);\n    } else if (restTimer === 0 && restActive) {\n        setRestActive(false);\n    }\n    return () => clearInterval(interval);\n  }, [restActive, restTimer]);\n\n  const startRest = (sec: number) => {\n      tgHaptic('light');\n      setRestTotal(sec);\n      setRestTimer(sec);\n      setRestActive(true);\n  };\n  const stopRest = () => {\n      tgHaptic('light');\n      setRestActive(false);\n      setRestTimer(0);\n  };\n");
}

// Update updateSet to trigger haptic
if (!code.includes("tgHaptic('light')")) {
    code = code.replace("const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: string) => {",
    "const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: string) => {\n      tgHaptic('light');");
}

// Check where to inject the rest timer UI. It should be inside the viewState === 'logging'
const timerUI = `
        {/* Floating Rest Timer */}
        {restActive && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#D4FF00] text-black px-4 py-2 rounded-full shadow-lg font-bold flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
                <Timer size={16} />
                <span className="w-12 text-center text-lg">{Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}</span>
                <button onClick={stopRest} className="bg-black/10 rounded-full p-1"><X size={14} /></button>
            </div>
        )}
        
        {/* Rest presets - injected after header */}
        <div className="flex gap-2 my-4">
            <button onClick={() => startRest(60)} className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl py-2 text-xs font-bold text-neutral-400 active:scale-95 transition-transform hover:text-white">60s</button>
            <button onClick={() => startRest(90)} className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl py-2 text-xs font-bold text-neutral-400 active:scale-95 transition-transform hover:text-white">90s</button>
            <button onClick={() => startRest(120)} className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl py-2 text-xs font-bold text-neutral-400 active:scale-95 transition-transform hover:text-white">120s</button>
        </div>
`;

if (!code.includes("Floating Rest Timer")) {
    code = code.replace('<h1 className="text-2xl font-serif text-white">{activeSession.title}</h1>',
    '<h1 className="text-2xl font-serif text-white">{activeSession.title}</h1>' + timerUI);
}

fs.writeFileSync('src/components/WorkoutLogger.tsx', code);
