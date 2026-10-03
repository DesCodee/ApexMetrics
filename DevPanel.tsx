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

    const toggleVip = async () => {
        if (!auth.currentUser) return;
        const newAccess = user.accessState === 'beta-vip' ? 'free' as const : 'beta-vip' as const;
        const updatedUser = { ...user, accessState: newAccess };
        await saveUserProfile(updatedUser, auth.currentUser.uid);
        onUpdateUser(updatedUser);
    };

    const resetState = async () => {
        if (window.confirm("Полный сброс приложения? Все локальные и облачные данные будут удалены.")) {
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
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#0e0e10] rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-neutral-900">
                <div className="flex justify-between items-center">
                    <h2 className="text-base font-light text-white flex items-center gap-2 font-sans">
                        <Settings2 size={16} strokeWidth={1.5} className="text-[#D4FF00]" /> 
                        Dev Panel
                    </h2>
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="w-8 h-8 flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-neutral-400 hover:text-white transition-colors"
                    >
                        <X size={15} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="space-y-2.5">
                    <button 
                        type="button"
                        onClick={toggleVip}
                        className="w-full p-4 rounded-2xl flex items-center justify-between transition-colors bg-white/[0.02] hover:bg-white/[0.04] text-left cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <ShieldAlert size={16} strokeWidth={1.5} className={user.accessState === 'beta-vip' ? 'text-[#D4FF00]' : 'text-neutral-400'} />
                            <span className="text-xs uppercase font-normal tracking-wider text-white">VIP Status</span>
                        </div>
                        <span className="text-xs font-mono text-[#D4FF00] uppercase tracking-wider font-normal">
                            {user.accessState}
                        </span>
                    </button>

                    <button 
                        type="button"
                        onClick={toggleFallback}
                        className="w-full p-4 rounded-2xl flex items-center justify-between transition-colors bg-white/[0.02] hover:bg-white/[0.04] text-left cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <Cpu size={16} strokeWidth={1.5} className={forceFallback ? 'text-[#D4FF00]' : 'text-neutral-400'} />
                            <div>
                                <div className="text-xs uppercase font-normal tracking-wider text-white">Force Fallback</div>
                                <div className="text-xs text-neutral-400 font-normal mt-0.5">Офлайн-режим генератора</div>
                            </div>
                        </div>
                        <div className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${forceFallback ? 'bg-[#D4FF00]' : 'bg-neutral-800'}`}>
                            <div className={`w-4 h-4 bg-black rounded-full shadow-sm transform transition-transform ${forceFallback ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    <button 
                        type="button"
                        onClick={resetState}
                        className="w-full p-4 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/15 flex items-center gap-2 justify-center text-xs font-normal uppercase tracking-wider transition-colors cursor-pointer"
                    >
                        <Trash2 size={14} strokeWidth={1.5} />
                        Сбросить приложение
                    </button>
                </div>
            </div>
        </div>
    );
}
