const fs = require('fs');
let code = fs.readFileSync('src/components/BottomNav.tsx', 'utf8');

if (!code.includes("import { motion } from 'motion/react';")) {
    code = code.replace("import { Home, PlusSquare, Activity, Crown } from 'lucide-react';",
    "import { Home, PlusSquare, Activity, Crown } from 'lucide-react';\nimport { motion } from 'motion/react';");
    
    const newButton = `
  return (
    <button onClick={onClick} className={\`relative flex flex-col items-center justify-center w-full h-full space-y-1 \${isActive ? 'text-black' : 'text-neutral-500 hover:text-neutral-300'} transition-colors\`}>
      {isActive && (
        <motion.div 
          layoutId="nav-pill"
          className="absolute inset-1 bg-[#D4FF00] rounded-xl -z-10"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="z-10 relative" />
      <span className="text-[10px] font-medium tracking-wide z-10 relative">{label}</span>
    </button>
  )`;
    
    code = code.replace(/return \([\s\S]+?<\/button>\n  \)/m, newButton);
    fs.writeFileSync('src/components/BottomNav.tsx', code);
}
