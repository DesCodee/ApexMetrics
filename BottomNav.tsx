import { Home, PlusSquare, Activity, Crown } from 'lucide-react';
import { motion } from 'motion/react';

export default function BottomNav({ active, onChange }: any) {
  const tg = (window as any).Telegram?.WebApp;
  
  const handleTab = (id: string) => {
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
    onChange(id);
  }
  
  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/30 backdrop-blur-3xl border-t border-white/[0.08] pb-2 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        <NavItem id="home" icon={Home} label="Главная" active={active} onClick={() => handleTab('home')} />
        <NavItem id="log" icon={PlusSquare} label="Дневник" active={active} onClick={() => handleTab('log')} />
        <NavItem id="body" icon={Activity} label="Тело" active={active} onClick={() => handleTab('body')} />
        <NavItem id="pro" icon={Crown} label="VIP" active={active} onClick={() => handleTab('pro')} />
      </div>
    </div>
  )
}

const NavItem = ({ id, icon: Icon, label, active, onClick }: any) => {
  const isActive = active === id;
  return (
    <button onClick={onClick} className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-black' : 'text-neutral-500 hover:text-neutral-300'} transition-colors`}>
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
  )
}
