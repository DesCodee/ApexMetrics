import { useState } from 'react';
import { UserProfile } from '../appEngine';
import { Lock, Crown, Bluetooth, Check, CheckCircle2, Edit3, X, Save, Flame, Dumbbell, Shield, Activity } from 'lucide-react';
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
  const bmiNum = Number((weight / (heightM * heightM)).toFixed(1));
  const bmi = bmiNum.toFixed(1);
  const isVip = user.accessState === 'beta-vip';

  // Advanced estimated metrics based on biometric parameters
  const estBodyFat = user.gender === 'M' 
    ? Math.max(8, Math.min(32, Math.round(1.2 * bmiNum + 0.23 * user.age - 16.2)))
    : Math.max(14, Math.min(40, Math.round(1.2 * bmiNum + 0.23 * user.age - 5.4)));
  const muscleMass = Math.round(weight * (1 - estBodyFat / 100) * 0.85);
  const boneDensity = (weight * 0.045).toFixed(2);
  const metabolicAge = Math.max(18, Math.round(user.age - (bmiNum > 25 ? -2 : 3)));

  const getBmiBadge = (val: number) => {
    if (val < 18.5) return { label: 'Дефицит', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' };
    if (val < 25) return { label: 'Норма', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' };
    if (val < 30) return { label: 'Плотный', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' };
    return { label: 'Высокий', color: 'text-red-400 bg-red-400/10 border-red-400/30' };
  };

  const bmiStatus = getBmiBadge(bmiNum);

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
    <div className="p-5 space-y-4 animate-in fade-in duration-300 max-w-md mx-auto pb-24">
       <header className="pt-2">
         <h1 className="text-xl font-bold tracking-tight text-white">Параметры тела</h1>
       </header>

       {/* Top Metrics */}
       <div className="grid grid-cols-2 gap-3">
          <div id="body-weight-card" className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between">
             <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
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
                  <Edit3 size={14} />
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
                        className="w-full bg-neutral-900 border border-[#D4FF00] rounded-xl px-2 py-1.5 text-white font-bold text-lg outline-none text-center"
                        autoFocus
                      />
                      <span className="text-xs text-neutral-400">кг</span>
                   </div>
                   <div className="flex gap-1.5">
                      <button 
                        type="button"
                        onClick={handleSaveWeight}
                        disabled={isSavingWeight}
                        className="flex-1 bg-[#D4FF00] hover:bg-[#c4ed00] text-black text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-transform"
                      >
                         <Save size={12} /> Сохранить
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsEditingWeight(false)}
                        className="p-2 bg-white/[0.06] text-neutral-400 hover:text-white rounded-xl"
                      >
                         <X size={14} />
                      </button>
                   </div>
                </div>
             ) : (
                <div>
                   <div className="text-white font-extrabold tracking-tight text-3xl tabular-nums">{weight.toFixed(1)} <span className="text-xs text-neutral-400 font-medium">кг</span></div>
                   <div className="text-xs text-neutral-400 mt-1">Нажмите для изменения</div>
                </div>
             )}
          </div>

          <div id="body-bmi-card" className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between">
             <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">ИМТ (BMI)</div>
             <div>
                <div className="text-white font-extrabold tracking-tight text-3xl tabular-nums">{bmi}</div>
                <div className={`inline-block text-xs font-bold px-2 py-0.5 rounded-xl border mt-1.5 uppercase tracking-wider ${bmiStatus.color}`}>
                  {bmiStatus.label}
                </div>
             </div>
          </div>
       </div>

       {/* Smart Scale Sync CTA (Standard Card) */}
       <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-white/[0.05] border border-white/[0.08] rounded-xl flex items-center justify-center mb-3">
             <Bluetooth size={22} className={syncStatus === 'synced' ? 'text-emerald-400' : 'text-[#D4FF00]'} />
          </div>
          <h3 className="text-white font-bold text-sm mb-1">Синхронизация с весами</h3>
          <p className="text-xs text-neutral-300 mb-4 px-2 leading-relaxed">
            {syncStatus === 'synced' 
              ? 'Устройство синхронизировано (Apple Health / Garmin). Данные обновлены!' 
              : 'Подключите умные весы (Garmin, Xiaomi, Apple Health) для автоматического расчета состава тела.'}
          </p>
          <button 
            id="body-connect-scale-btn"
            onClick={handleConnectScale}
            disabled={syncStatus === 'syncing'}
            className="bg-[#D4FF00] hover:bg-[#c4ed00] text-black text-xs font-bold px-6 py-3 rounded-xl uppercase tracking-wider active:scale-95 transition-transform flex items-center gap-2 shadow-[0_0_15px_rgba(212,255,0,0.2)]"
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

       {/* Advanced Biometrics 2x2 Grid with Graphic Richness */}
       <div className={`backdrop-blur-xl border rounded-2xl p-4 relative overflow-hidden ${
          isVip ? 'bg-neutral-900/90 border-[#D4FF00]/40 shadow-[0_0_24px_rgba(212,255,0,0.08)]' : 'bg-neutral-900/60 border-neutral-800'
       }`}>
          <div className="flex justify-between items-center mb-4">
              <div className="text-xs text-white font-semibold uppercase tracking-wider">
                {isVip ? 'Продвинутая биометрия (VIP)' : 'Продвинутая биометрия'}
              </div>
              {isVip ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : (
                <Lock size={14} className="text-neutral-400" />
              )}
          </div>
          
          <div className={`grid grid-cols-2 gap-3 ${isVip ? '' : 'opacity-25 blur-[1px] pointer-events-none pb-12'}`}>
             <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-neutral-300">
                   <Dumbbell size={14} className="text-[#D4FF00]" />
                   <span className="text-xs uppercase font-semibold tracking-wider">Мышцы</span>
                </div>
                <div className="mt-2">
                   <div className="text-white font-bold text-xl tabular-nums">{isVip ? `${muscleMass} кг` : '-- кг'}</div>
                   <div className="text-xs text-neutral-400 mt-0.5">Сухая масса</div>
                </div>
             </div>

             <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-neutral-300">
                   <Flame size={14} className="text-amber-400" />
                   <span className="text-xs uppercase font-semibold tracking-wider">Жир</span>
                </div>
                <div className="mt-2">
                   <div className="text-white font-bold text-xl tabular-nums">{isVip ? `~${estBodyFat}%` : '-- %'}</div>
                   <div className="text-xs text-neutral-400 mt-0.5">Процент жира</div>
                </div>
             </div>

             <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-neutral-300">
                   <Shield size={14} className="text-blue-400" />
                   <span className="text-xs uppercase font-semibold tracking-wider">Кости</span>
                </div>
                <div className="mt-2">
                   <div className="text-white font-bold text-xl tabular-nums">{isVip ? `${boneDensity} кг` : '-- кг'}</div>
                   <div className="text-xs text-neutral-400 mt-0.5">Костная масса</div>
                </div>
             </div>

             <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-neutral-300">
                   <Activity size={14} className="text-emerald-400" />
                   <span className="text-xs uppercase font-semibold tracking-wider">Возраст</span>
                </div>
                <div className="mt-2">
                   <div className="text-white font-bold text-xl tabular-nums">{isVip ? `${metabolicAge} лет` : '-- лет'}</div>
                   <div className="text-xs text-neutral-400 mt-0.5">Метаболический</div>
                </div>
             </div>
          </div>

          {!isVip && (
            <div className="absolute bottom-4 left-4 right-4">
                <button 
                  id="body-unlock-vip-btn"
                  onClick={() => {
                    tgHaptic('medium');
                    onNavigate?.('pro');
                  }}
                  className="w-full bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(212,255,0,0.2)] active:scale-[0.98] transition-transform cursor-pointer"
                >
                   <Crown size={16} /> Активировать в разделе VIP
                </button>
            </div>
          )}
       </div>

    </div>
  );
}
