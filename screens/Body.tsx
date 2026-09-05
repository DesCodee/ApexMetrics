import { useState } from 'react';
import { UserProfile } from '../appEngine';
import { Lock, Crown, Bluetooth, Check, CheckCircle2, Edit3, X, Save } from 'lucide-react';
import { tgHaptic } from '../utils/haptics';
import { saveUserProfile, auth } from '../firebase';

export default function Body({ 
  user, 
  onNavigate, 
  onUpdateUser 
}: { 
  user: UserProfile, 
  onNavigate?: (tab: string) => void,
  onUpdateUser?: (u: UserProfile) => void 
}) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(user.weight ? String(user.weight) : '75');
  const [isSavingWeight, setIsSavingWeight] = useState(false);

  // Compute basic metrics based on user
  const weight = user.weight;
  const heightM = user.height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);
  const isPro = user.accessState === 'beta-vip';

  // Pro estimated metrics based on biometric parameters
  const estBodyFat = user.gender === 'M' 
    ? Math.max(8, Math.min(32, Math.round(1.2 * Number(bmi) + 0.23 * user.age - 16.2)))
    : Math.max(14, Math.min(40, Math.round(1.2 * Number(bmi) + 0.23 * user.age - 5.4)));
  const muscleMass = Math.round(weight * (1 - estBodyFat / 100) * 0.85);
  const boneDensity = (weight * 0.045).toFixed(2);
  const metabolicAge = Math.max(18, Math.round(user.age - (Number(bmi) > 25 ? -2 : 3)));

  const handleConnectScale = () => {
    tgHaptic('medium');
    setSyncStatus('syncing');
    setTimeout(() => {
      tgHaptic('success');
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 4000);
    }, 1200);
  };

  const handleSaveWeight = async () => {
    const num = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(num) || num < 30 || num > 300) {
      alert('Пожалуйста, укажите реальный вес в кг (от 30 до 300)');
      return;
    }

    tgHaptic('medium');
    setIsSavingWeight(true);
    const updatedUser: UserProfile = {
      ...user,
      weight: Math.round(num * 10) / 10
    };

    try {
      if (auth.currentUser) {
        await saveUserProfile(updatedUser, auth.currentUser.uid);
      }
      onUpdateUser?.(updatedUser);
      setIsEditingWeight(false);
      tgHaptic('success');
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении веса');
    } finally {
      setIsSavingWeight(false);
    }
  };

  return (
    <div className="p-5 space-y-6 animate-in fade-in duration-500 max-w-md mx-auto pb-24">
       <header className="pt-2">
         <h1 className="text-2xl font-serif text-white">Body Metrics</h1>
       </header>

       {/* Top Metrics */}
       <div className="grid grid-cols-2 gap-3">
          <div id="body-weight-card" className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-4 flex flex-col justify-between">
             <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-2">
                <span>Ваш Вес</span>
                <button 
                  type="button"
                  onClick={() => {
                    tgHaptic('light');
                    setWeightInput(String(weight));
                    setIsEditingWeight(!isEditingWeight);
                  }}
                  className="text-[#D4FF00] hover:text-white transition-colors p-1"
                  title="Изменить вес"
                >
                  <Edit3 size={13} />
                </button>
             </div>
             
             {isEditingWeight ? (
                <div className="space-y-2 mt-1">
                   <div className="flex items-center gap-1.5">
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        className="w-full bg-white/[0.08] border border-[#D4FF00] rounded-xl px-2 py-1.5 text-white font-bold text-lg outline-none text-center"
                        autoFocus
                      />
                      <span className="text-xs text-neutral-400">кг</span>
                   </div>
                   <div className="flex gap-1.5">
                      <button 
                        type="button"
                        onClick={handleSaveWeight}
                        disabled={isSavingWeight}
                        className="flex-1 bg-[#D4FF00] text-black text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-transform"
                      >
                         <Save size={12} /> Сохранить
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsEditingWeight(false)}
                        className="p-1.5 bg-white/[0.06] text-neutral-400 hover:text-white rounded-lg"
                      >
                         <X size={14} />
                      </button>
                   </div>
                </div>
             ) : (
                <div>
                   <div className="text-white font-bold text-2xl">{weight.toFixed(1)} <span className="text-xs text-neutral-500 font-medium">кг</span></div>
                   <div className="text-[10px] text-neutral-500 mt-1">Нажмите для изменения</div>
                </div>
             )}
          </div>

          <div id="body-bmi-card" className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-4 flex flex-col justify-between">
             <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-3">ИМТ</div>
             <div>
                <div className="text-white font-bold text-2xl">{bmi}</div>
                <div className="text-[#D4FF00] text-[10px] font-bold mt-1 uppercase tracking-widest">
                  {Number(bmi) < 18.5 ? 'Дефицит' : Number(bmi) < 25 ? 'Норма' : Number(bmi) < 30 ? 'Плотный' : 'Высокий'}
                </div>
             </div>
          </div>
       </div>

       {/* Smart Scale Sync CTA */}
       <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-white/[0.06] rounded-full flex items-center justify-center mb-3">
             <Bluetooth size={20} className={syncStatus === 'synced' ? 'text-emerald-400' : 'text-[#D4FF00]'} />
          </div>
          <h3 className="text-white font-bold text-sm mb-1">Синхронизация с весами</h3>
          <p className="text-xs text-neutral-400 mb-4 px-2">
            {syncStatus === 'synced' 
              ? 'Устройство синхронизировано (Apple Health / Garmin). Данные обновлены!' 
              : 'Подключите умные весы (Garmin, Xiaomi, Apple Health) для автоматического расчета состава тела.'}
          </p>
          <button 
            id="body-connect-scale-btn"
            onClick={handleConnectScale}
            disabled={syncStatus === 'syncing'}
            className="bg-[#D4FF00] text-black text-xs font-bold px-5 py-2.5 rounded-full uppercase tracking-widest active:scale-95 transition-transform flex items-center gap-2"
          >
             {syncStatus === 'syncing' ? (
               'Синхронизация...'
             ) : syncStatus === 'synced' ? (
               <><Check size={14} /> Подключено</>
             ) : (
               'Подключить устройство'
             )}
          </button>
       </div>

       {/* Advanced Metrics */}
       <div className="bg-white/[0.03] backdrop-blur-2xl/50 border border-neutral-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
              <div className="text-[10px] text-white font-bold uppercase tracking-widest">
                {isPro ? 'Продвинутые метрики (Apex Pro)' : 'Продвинутые метрики'}
              </div>
              {isPro ? (
                <CheckCircle2 size={14} className="text-[#D4FF00]" />
              ) : (
                <Lock size={12} className="text-neutral-500" />
              )}
          </div>
          
          <div className={`space-y-4 ${isPro ? '' : 'opacity-30 blur-[1px] pointer-events-none pb-12'}`}>
             <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">Мышечная масса</div>
                <div className="text-sm text-white font-bold">{isPro ? `${muscleMass} кг` : '-- кг'}</div>
             </div>
             <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">Процент жира</div>
                <div className="text-sm text-white font-bold">{isPro ? `~${estBodyFat}%` : '-- %'}</div>
             </div>
             <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">Костная масса</div>
                <div className="text-sm text-white font-bold">{isPro ? `${boneDensity} кг` : '-- кг'}</div>
             </div>
             <div className="flex justify-between items-center">
                <div className="text-sm text-neutral-400">Метаболический возраст</div>
                <div className="text-sm text-white font-bold">{isPro ? `${metabolicAge} лет` : '-- лет'}</div>
             </div>
          </div>

          {!isPro && (
            <div className="absolute bottom-4 left-4 right-4">
                <button 
                  id="body-unlock-pro-btn"
                  onClick={() => {
                    tgHaptic('medium');
                    onNavigate?.('pro');
                  }}
                  className="w-full bg-white/[0.06]/80 backdrop-blur-md border border-[#D4FF00]/20 text-[#D4FF00] font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xl active:scale-[0.98] transition-transform cursor-pointer"
                >
                   <Crown size={16} /> Открыть с Apex Pro
                </button>
            </div>
          )}
       </div>

    </div>
  );
}
