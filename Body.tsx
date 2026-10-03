import { useState, useEffect } from 'react';
import { UserProfile } from '../appEngine';
import { Lock, Crown, Bluetooth, Clock, CheckCircle2, Edit3, X, Save, Flame, Dumbbell, Shield, Activity } from 'lucide-react';
import { tgHaptic } from '../utils/haptics';
import { saveUserProfile, auth, saveWeightLog, loadWeightLogs, WeightLog } from '../firebase';
import WeightChart from '../components/WeightChart';

export default function Body({ 
  user, 
  onNavigate, 
  onUpdateUser 
}: { 
  user: UserProfile, 
  onNavigate?: (tab: string) => void,
  onUpdateUser?: (u: UserProfile) => void 
}) {
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(user.weight ? String(user.weight) : '75');
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      if (auth.currentUser) {
        try {
          const list = await loadWeightLogs(auth.currentUser.uid);
          if (isMounted) {
            if (list.length === 0 && user.weight) {
              const todayStr = new Date().toISOString().split('T')[0];
              const initLog: WeightLog = {
                id: 'w_' + todayStr,
                weight: user.weight,
                date: todayStr,
                timestamp: Date.now()
              };
              setWeightHistory([initLog]);
              saveWeightLog(auth.currentUser.uid, user.weight, todayStr);
            } else {
              setWeightHistory(list);
            }
          }
        } catch (e) {
          console.error('Failed to load weight logs', e);
        }
      } else if (user.weight) {
        const todayStr = new Date().toISOString().split('T')[0];
        setWeightHistory([{ id: 'init', weight: user.weight, date: todayStr, timestamp: Date.now() }]);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [user.weight]);

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
      const todayStr = new Date().toISOString().split('T')[0];
      if (auth.currentUser) {
        await saveUserProfile(updatedUser, auth.currentUser.uid);
        await saveWeightLog(auth.currentUser.uid, updatedUser.weight, todayStr);
      }
      onUpdateUser?.(updatedUser);
      setWeightHistory(prev => {
        const filtered = prev.filter(p => p.date !== todayStr);
        const nextList = [...filtered, { id: 'w_' + todayStr, date: todayStr, weight: updatedUser.weight, timestamp: Date.now() }];
        return nextList.sort((a, b) => a.date.localeCompare(b.date));
      });
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
    <div className="px-6 py-6 space-y-6 animate-in fade-in duration-300 max-w-md mx-auto pb-28">
       <header className="pt-2">
         <h1 className="text-2xl font-light tracking-tight text-white font-sans">Параметры тела</h1>
       </header>

       {/* Top Metrics */}
       <div className="grid grid-cols-2 gap-4">
          <div id="body-weight-card" className="bg-white/[0.02] rounded-2xl p-6 flex flex-col justify-between">
             <div className="flex items-center justify-between text-xs font-normal uppercase tracking-wider text-neutral-400 mb-3">
                <span>Ваш Вес</span>
                <button 
                  type="button"
                  onClick={() => {
                    tgHaptic('light');
                    setWeightInput(String(weight));
                    setIsEditingWeight(!isEditingWeight);
                  }}
                  className="text-neutral-400 hover:text-white transition-colors p-1"
                  title="Изменить вес"
                >
                  <Edit3 size={14} strokeWidth={1.5} />
                </button>
             </div>
             
             {isEditingWeight ? (
                <div className="space-y-3 mt-1">
                   <div className="flex items-center gap-1.5">
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        className="w-full bg-neutral-900 border-0 rounded-xl px-2 py-2 text-white font-light text-xl outline-none text-center focus:ring-1 focus:ring-neutral-700"
                        autoFocus
                      />
                      <span className="text-xs text-neutral-400 font-normal">кг</span>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={handleSaveWeight}
                        disabled={isSavingWeight}
                        className="flex-1 bg-white hover:bg-neutral-200 text-black text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-transform"
                      >
                         <Save size={12} strokeWidth={1.5} /> Сохранить
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsEditingWeight(false)}
                        className="p-2 bg-white/[0.06] text-neutral-400 hover:text-white rounded-xl"
                      >
                         <X size={14} strokeWidth={1.5} />
                      </button>
                   </div>
                </div>
             ) : (
                <div>
                   <div className="text-white font-light tracking-tight text-4xl tabular-nums">
                     {weight.toFixed(1)} <span className="text-xs text-neutral-400 font-normal">кг</span>
                   </div>
                   <div className="text-xs text-neutral-400 mt-2 font-normal">Нажмите для изменения</div>
                </div>
             )}
          </div>

          <div id="body-bmi-card" className="bg-white/[0.02] rounded-2xl p-6 flex flex-col justify-between">
             <div className="text-xs font-normal uppercase tracking-wider text-neutral-400 mb-3">ИМТ (BMI)</div>
             <div>
                <div className="text-white font-light tracking-tight text-4xl tabular-nums">{bmi}</div>
                <div className="inline-block text-xs font-normal px-2.5 py-0.5 rounded-full bg-white/[0.04] text-neutral-300 mt-2 uppercase tracking-wider">
                  {bmiStatus.label}
                </div>
             </div>
          </div>
       </div>

       {/* Weight Progress Line Chart */}
       <WeightChart history={weightHistory} currentWeight={weight} />

       {/* Smart Scale Sync Info */}
       <div className="bg-white/[0.02] rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-neutral-400 mb-3">
             <Bluetooth size={20} strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-2 mb-1">
             <h3 className="text-white font-normal text-sm">Синхронизация с весами</h3>
             <span className="text-[10px] font-normal text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded-full uppercase tracking-wider">
                Скоро
             </span>
          </div>
          <p className="text-xs text-neutral-400 mb-5 px-2 leading-relaxed font-normal">
             Прямая интеграция с умными весами и сервисами (Apple Health, Garmin, Xiaomi) находится в разработке.
          </p>
          <button 
            id="body-connect-scale-btn"
            type="button"
            disabled
            className="w-full bg-white/[0.04] text-neutral-500 text-xs font-normal py-3.5 px-4 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed select-none"
          >
             <Clock size={14} strokeWidth={1.5} />
             В разработке
          </button>
       </div>

       {/* Advanced Biometrics 2x2 Grid */}
       <div className="bg-white/[0.02] rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
              <div className="text-xs text-neutral-300 font-normal uppercase tracking-wider">
                {isVip ? 'Продвинутая биометрия (VIP)' : 'Продвинутая биометрия'}
              </div>
              {isVip ? (
                <CheckCircle2 size={16} strokeWidth={1.5} className="text-emerald-400" />
              ) : (
                <Lock size={14} strokeWidth={1.5} className="text-neutral-400" />
              )}
          </div>
          
          <div className={`grid grid-cols-2 gap-3 ${isVip ? '' : 'opacity-25 blur-[1px] pointer-events-none pb-12'}`}>
             <div className="bg-neutral-900/60 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-neutral-400">
                   <Dumbbell size={14} strokeWidth={1.5} />
                   <span className="text-xs uppercase font-normal tracking-wider">Мышцы</span>
                </div>
                <div className="mt-3">
                   <div className="text-white font-light text-2xl tabular-nums">{isVip ? `${muscleMass} кг` : '-- кг'}</div>
                   <div className="text-xs text-neutral-400 mt-1 font-normal">Сухая масса</div>
                </div>
             </div>

             <div className="bg-neutral-900/60 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-neutral-400">
                   <Flame size={14} strokeWidth={1.5} />
                   <span className="text-xs uppercase font-normal tracking-wider">Жир</span>
                </div>
                <div className="mt-3">
                   <div className="text-white font-light text-2xl tabular-nums">{isVip ? `~${estBodyFat}%` : '-- %'}</div>
                   <div className="text-xs text-neutral-400 mt-1 font-normal">Процент жира</div>
                </div>
             </div>

             <div className="bg-neutral-900/60 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-neutral-400">
                   <Shield size={14} strokeWidth={1.5} />
                   <span className="text-xs uppercase font-normal tracking-wider">Кости</span>
                </div>
                <div className="mt-3">
                   <div className="text-white font-light text-2xl tabular-nums">{isVip ? `${boneDensity} кг` : '-- кг'}</div>
                   <div className="text-xs text-neutral-400 mt-1 font-normal">Костная масса</div>
                </div>
             </div>

             <div className="bg-neutral-900/60 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-neutral-400">
                   <Activity size={14} strokeWidth={1.5} />
                   <span className="text-xs uppercase font-normal tracking-wider">Возраст</span>
                </div>
                <div className="mt-3">
                   <div className="text-white font-light text-2xl tabular-nums">{isVip ? `${metabolicAge} лет` : '-- лет'}</div>
                   <div className="text-xs text-neutral-400 mt-1 font-normal">Метаболический</div>
                </div>
             </div>
          </div>

          {!isVip && (
            <div className="absolute bottom-6 left-6 right-6">
                <button 
                  id="body-unlock-vip-btn"
                  onClick={() => {
                    tgHaptic('medium');
                    onNavigate?.('pro');
                  }}
                  className="w-full bg-white/[0.08] hover:bg-white/[0.12] text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider active:scale-[0.98] transition-transform cursor-pointer"
                >
                   <Crown size={15} strokeWidth={1.5} /> Активировать в разделе VIP
                </button>
            </div>
          )}
       </div>

    </div>
  );
}
