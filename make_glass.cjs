const fs = require('fs');

const files = [
    'src/screens/Home.tsx',
    'src/screens/Log.tsx',
    'src/screens/Body.tsx',
    'src/screens/Pro.tsx',
    'src/components/WorkoutLogger.tsx',
    'src/components/DevPanel.tsx',
    'src/components/BottomNav.tsx',
    'src/App.tsx'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');

    // BottomNav needs extreme blur
    if (file === 'src/components/BottomNav.tsx') {
        code = code.replace(/bg-black\/90 backdrop-blur-md border-t border-neutral-900/g, 'bg-black/30 backdrop-blur-3xl border-t border-white/[0.08]');
    }

    // App shell
    if (file === 'src/App.tsx') {
        code = code.replace('bg-black text-white', 'bg-transparent text-white');
        
        // Add ambient background behind routes
        if (!code.includes('nav-pill')) { // just a check
            const ambientBg = `
        {/* Ambient Liquid Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
           <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#D4FF00]/10 rounded-full mix-blend-screen filter blur-[80px] animate-pulse" style={{ animationDuration: '8s' }} />
           <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>
        <div className="flex-1 relative">`;
            code = code.replace('<div className="flex-1 relative">', ambientBg);
        }
    }

    // Standard glass panels
    const glassPanel = 'bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]';
    code = code.replace(/bg-neutral-900 border border-neutral-800/g, glassPanel);
    
    // Fallback for neutral-900 without border
    code = code.replace(/bg-neutral-900/g, 'bg-white/[0.03] backdrop-blur-2xl');
    
    // Inputs and smaller chips
    const glassInput = 'bg-white/[0.04] border border-white/[0.06] backdrop-blur-xl';
    code = code.replace(/bg-black border border-neutral-800/g, glassInput);
    
    // Inner elements that used neutral-800
    code = code.replace(/bg-neutral-800/g, 'bg-white/[0.06]');

    fs.writeFileSync(file, code);
});
console.log('Glass applied!');
