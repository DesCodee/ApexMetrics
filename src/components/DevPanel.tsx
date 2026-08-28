import { useState, useEffect } from 'react';
import { UserProfile } from '../appEngine';
import { saveUserProfile, auth, deleteUserProfile } from '../firebase';
import { X, Settings2, Trash2, ShieldAlert, Cpu } from 'lucide-react';

export default function DevPanel({ 
    user, 
    onUpdateUser,
    onClose 
}: { 
    user: UserProfile; 
    onUpdateUser: (u: UserProfile | null) => void;
    onClose: () => void;
}) {
    const [forceFallback, setForceFallback] = useState(false);

    useEffect(() => {
        setForceFallback(localStorage.getItem('apex_force_fallback') === 'true');
    }, []);

    const togglePro = async () => {
        if (!auth.currentUser) return;
        const newAccess = user.accessState === 'beta-vip' ? 'free' as const : 'beta-vip' as const;
        const updatedUser = { ...user, accessState: newAccess };
        await saveUserProfile(updatedUser, auth.currentUser.uid);
        onUpdateUser(updatedUser);
    };

    const resetState = async () => {
        if (window.confirm("Полный сброс приложения?")) {
            localStorage.clear();
            if (auth.currentUser) {
                await deleteUserProfile(auth.currentUser.uid);
            }
            onUpdateUser(null);
            onClose();
        }
    };

    const toggleFallback = () => {
        const newVal = !forceFallback;
        setForceFallback(newVal);
        localStorage.setItem('apex_force_fallback', newVal ? 'true' : 'false');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm p-5 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Settings2 className="text-[#D4FF00]" /> Dev Panel</h2>
                    <button onClick={onClose} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={togglePro}
                        className="w-full p-4 rounded-xl border flex items-center justify-between transition-colors bg-neutral-800 border-neutral-700"
                    >
                        <div className="flex items-center gap-3">
                            <ShieldAlert size={20} className={user.accessState === 'beta-vip' ? 'text-[#D4FF00]' : 'text-neutral-500'} />
                            <span className="font-medium text-white">Pro Status</span>
                        </div>
                        <span className="text-xs font-mono bg-black px-2 py-1 rounded text-neutral-400">
                            {user.accessState}
                        </span>
                    </button>

                    <button 
                        onClick={toggleFallback}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-colors ${forceFallback ? 'bg-[#D4FF00]/10 border-[#D4FF00]/30' : 'bg-neutral-800 border-neutral-700'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Cpu size={20} className={forceFallback ? 'text-[#D4FF00]' : 'text-neutral-500'} />
                            <div className="text-left">
                                <div className="font-medium text-white">Force Fallback</div>
                                <div className="text-xs text-neutral-500">Имитация ошибки Gemini</div>
                            </div>
                        </div>
                        <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${forceFallback ? 'bg-[#D4FF00]' : 'bg-neutral-700'}`}>
                            <div className={`w-4 h-4 bg-black rounded-full shadow-sm transform transition-transform ${forceFallback ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    <button 
                        onClick={resetState}
                        className="w-full p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 flex items-center gap-3 justify-center font-bold"
                    >
                        <Trash2 size={20} />
                        Hard Reset App
                    </button>
                </div>
            </div>
        </div>
    );
}
