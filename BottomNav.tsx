import { Home, PlusSquare, Activity, Crown } from 'lucide-react';

export default function BottomNav({ active, onChange }: any) {
  const tg = (window as any).Telegram?.WebApp;
  
  const handleTab = (id: string) => {
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
    onChange(id);
  }
  
  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/95 border-t border-neutral-900 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
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
    <button 
      onClick={onClick} 
      className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
        isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
      }`}
    >
      <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
      <span className="text-[10px] font-normal tracking-tight">{label}</span>
      {isActive && (
        <span className="w-1 h-1 rounded-full bg-[#D4FF00] absolute bottom-1" />
      )}
    </button>
  )
}
