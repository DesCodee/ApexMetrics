const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add AdminPanel to imports
code = code.replace(
  "import { Onboarding } from './components/Onboarding';",
  "import { Onboarding } from './components/Onboarding';\nimport { AdminPanel } from './components/AdminPanel';"
);

// 2. Add 'admin' to Tab type
code = code.replace(
  "export type Tab = 'dashboard' | 'workout' | 'analytics' | 'vip';",
  "export type Tab = 'dashboard' | 'workout' | 'analytics' | 'vip' | 'admin';"
);

// 3. Add ShieldCheck to lucide-react imports
code = code.replace(
  "import { Home, Dumbbell, BarChart2, Crown, Loader2 } from 'lucide-react';",
  "import { Home, Dumbbell, BarChart2, Crown, Loader2, ShieldCheck } from 'lucide-react';"
);

// 4. Add state for admin unlocked
code = code.replace(
  "  const [loading, setLoading] = useState(true);",
  "  const [loading, setLoading] = useState(true);\n  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);\n  const [secretTaps, setSecretTaps] = useState(0);"
);

// 5. Secret tap handler
const secretTapLogic = `
  useEffect(() => {
    if (secretTaps >= 5) {
      setIsAdminUnlocked(true);
      triggerHaptic('success');
      setSecretTaps(0);
    }
  }, [secretTaps]);

  const handleSecretTap = () => {
    setSecretTaps(prev => prev + 1);
    setTimeout(() => setSecretTaps(0), 3000); // Reset after 3 seconds
  };
`;

code = code.replace(
  "  const startWorkout = () => {",
  secretTapLogic + "\n  const startWorkout = () => {"
);

// 6. Add admin tab in AnimatePresence
code = code.replace(
  "{activeTab === 'vip' && dbUser && <VipOffer user={dbUser} />}",
  "{activeTab === 'vip' && dbUser && <VipOffer user={dbUser} />}\n            {activeTab === 'admin' && isAdminUnlocked && <AdminPanel />}"
);

// 7. Add admin button in Bottom Nav (if unlocked)
const adminNav = `
            {isAdminUnlocked && (
              <NavItem 
                icon={<ShieldCheck size={24} />} label="Admin" 
                isActive={activeTab === 'admin'} onClick={() => handleTabChange('admin')} 
              />
            )}`;

code = code.replace(
  '<NavItem \n               icon={<Crown size={24} />} label="VIP" \n               isActive={activeTab === \'vip\'} onClick={() => handleTabChange(\'vip\')} \n             />\n          </div>',
  `<NavItem 
               icon={<Crown size={24} />} label="VIP" 
               isActive={activeTab === 'vip'} onClick={() => handleTabChange('vip')} 
             />
             ${adminNav}
          </div>`
);

// 8. Attach handleSecretTap to Home nav item
code = code.replace(
  "isActive={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')}",
  "isActive={activeTab === 'dashboard'} onClick={() => { handleTabChange('dashboard'); handleSecretTap(); }}"
);

fs.writeFileSync('src/App.tsx', code);
