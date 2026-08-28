const fs = require('fs');
let code = fs.readFileSync('src/screens/Home.tsx', 'utf8');

// Use motion/react for container animation
if (!code.includes("import { motion } from 'motion/react';")) {
    code = code.replace("import { ChevronRight, Droplet, Moon, Brain, ChevronUp, Crown } from 'lucide-react';",
    "import { ChevronRight, Droplet, Moon, Brain, ChevronUp, Crown, CheckCircle } from 'lucide-react';\nimport { motion } from 'motion/react';");
}

// Check if we already wrapped it
if (!code.includes("<motion.div")) {
    code = code.replace('return (',
    `return (
    <motion.div 
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.3 }}
       className="p-5 space-y-6 max-w-lg mx-auto"
    >`);
    
    // Replace the trailing `</div>` with `</motion.div>` in the main return, we have to find it carefully.
    code = code.replace(/<div className="p-5 space-y-6 pb-24 max-w-lg mx-auto">/g, ""); 
    code = code.replace(/<\/div>\n  \)$/m, "</motion.div>\n  )");
    // It's safer to just replace the outermost div. Let me do it via a more specific regex or just string replacement.
    // The outermost div in Home.tsx: `<div className="p-5 space-y-6 pb-24 max-w-lg mx-auto">`
    code = code.replace('<div className="p-5 space-y-6 pb-24 max-w-lg mx-auto">', '');
    const lastDivIndex = code.lastIndexOf('</div>');
    if (lastDivIndex !== -1) {
       code = code.slice(0, lastDivIndex) + '</motion.div>' + code.slice(lastDivIndex + 6);
    }
}

// Add Empty state for "Today's Activity" if no workouts at all.
const emptyState = `
      {/* Empty State */}
      {todayTonnage === 0 && history.length === 0 && (
         <div className="pt-2">
            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-3 px-1">Активность</div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-neutral-700 mb-4">
                    <CheckCircle size={32} />
                </div>
                <div className="text-white font-bold mb-1">Нет тренировок</div>
                <div className="text-xs text-neutral-500 max-w-[200px]">Открой дневник и начни свою первую сессию, чтобы здесь появилась статистика.</div>
            </div>
         </div>
      )}
`;

if (!code.includes("Нет тренировок")) {
    code = code.replace("{/* Today's Activity */}", emptyState + "\n      {/* Today's Activity */}");
}

fs.writeFileSync('src/screens/Home.tsx', code);
