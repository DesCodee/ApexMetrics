import { useState, useEffect } from 'react';
import { 
  X, Brain, Moon, Activity, ShieldAlert, Sparkles, CheckCircle2, Circle, 
  Wind, Play, Square, TrendingUp, AlertTriangle, Pill, Utensils, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApexEngine } from '../appEngine';
import { tgHaptic } from '../utils/haptics';
import { saveCnsLog, auth } from '../firebase';

interface CnsRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore?: number;
  currentStatus?: string;
  workouts?: any[];
  onCnsUpdated?: (newScore: number, newStatus: string) => void;
  onRequestCheckIn?: () => void;
}

export default function CnsRecoveryModal({
  isOpen,
  onClose,
  currentScore = 75,
  currentStatus = 'Optimal',
  workouts = [],
  onCnsUpdated,
  onRequestCheckIn
}: CnsRecoveryModalProps) {
  const [activeTab, setActiveTab] = useState<'protocol' | 'breathing' | 'fatigue'>('protocol');

  // Box Breathing State (4-4-4-4)
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [breathCountdown, setBreathCountdown] = useState(4);
  const [breathCycles, setBreathCycles] = useState(0);

  // Quick Check-in state
  const [showQuickCheck, setShowQuickCheck] = useState(false);
  const [sleep, setSleep] = useState(7.5);
  const [soreness, setSoreness] = useState(2);
  const [stress, setStress] = useState(2);

  // Daily Checklist Persistence (local)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('apex_cns_checklist_' + new Date().toISOString().split('T')[0]);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCheck = (id: string) => {
    tgHaptic('light');
    setCheckedItems(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('apex_cns_checklist_' + new Date().toISOString().split('T')[0], JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Box Breathing Cycle Logic
  useEffect(() => {
    if (!isBreathing) return;

    const timer = setInterval(() => {
      setBreathCountdown(prev => {
        if (prev > 1) return prev - 1;

        if (breathPhase === 'inhale') {
          tgHaptic('medium');
          setBreathPhase('hold1');
          return 4;
        } else if (breathPhase === 'hold1') {
          tgHaptic('light');
          setBreathPhase('exhale');
          return 4;
        } else if (breathPhase === 'exhale') {
          tgHaptic('medium');
          setBreathPhase('hold2');
          return 4;
        } else {
          tgHaptic('success');
          setBreathCycles(c => c + 1);
          setBreathPhase('inhale');
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBreathing, breathPhase]);

  const handleStartBreathing = () => {
    tgHaptic('success');
    setIsBreathing(true);
    setBreathPhase('inhale');
    setBreathCountdown(4);
  };

  const handleStopBreathing = () => {
    tgHaptic('light');
    setIsBreathing(false);
  };

  const handleQuickRecalculate = async () => {
    tgHaptic('success');
    const result = ApexEngine.calculateCNSReadiness(sleep, soreness, stress, 0);
    if (auth.currentUser) {
      await saveCnsLog(auth.currentUser.uid, {
        sleep,
        soreness,
        stress,
        score: result.score,
        status: result.status,
        recommendation: result.recommendation
      });
    }
    if (onCnsUpdated) {
      onCnsUpdated(result.score, result.status);
    }
    setShowQuickCheck(false);
  };

  if (!isOpen) return null;

  const acwr = ApexEngine.calculateACWR(workouts || []);

  const getBreathInstruction = () => {
    switch (breathPhase) {
      case 'inhale': return 'Медленный глубокий вдох носом';
      case 'hold1': return 'Задержка дыхания (кислородная сатурация)';
      case 'exhale': return 'Плавный выдох через рот (снятие спазма)';
      case 'hold2': return 'Задержка на выдохе (блуждающий нерв)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-[#0d0d0f] rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-5 border-b border-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center text-white">
              <Brain size={18} strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-light text-white tracking-tight font-sans">Центр ЦНС</h2>
                <span className={`text-xs font-normal uppercase tracking-wider ${
                  currentStatus === 'Optimal' ? 'text-[#D4FF00]' :
                  currentStatus === 'Moderate' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  • {currentStatus === 'Optimal' ? 'Готов 100%' : currentStatus === 'Moderate' ? 'Умеренно' : 'Истощение'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-normal">Восстановление нервной системы</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 p-1.5 bg-white/[0.02] border-b border-neutral-900 gap-1">
          <button
            type="button"
            onClick={() => { tgHaptic('light'); setActiveTab('protocol'); }}
            className={`py-2 text-xs font-normal rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'protocol' ? 'bg-white/[0.06] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles size={13} strokeWidth={1.5} className="text-[#D4FF00]" />
            <span>Протокол</span>
          </button>
          <button
            type="button"
            onClick={() => { tgHaptic('light'); setActiveTab('breathing'); }}
            className={`py-2 text-xs font-normal rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'breathing' ? 'bg-white/[0.06] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Wind size={13} strokeWidth={1.5} className="text-neutral-300" />
            <span>Дыхание 4-4</span>
          </button>
          <button
            type="button"
            onClick={() => { tgHaptic('light'); setActiveTab('fatigue'); }}
            className={`py-2 text-xs font-normal rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'fatigue' ? 'bg-white/[0.06] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <TrendingUp size={13} strokeWidth={1.5} className="text-neutral-300" />
            <span>ACWR Нагрузка</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Quick Check Bar */}
          <div className="bg-white/[0.02] rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="text-3xl font-light text-white tracking-tight tabular-nums">{currentScore}%</div>
              <div>
                <div className="text-xs font-normal text-white uppercase tracking-wider">Индекс готовности</div>
                <div className="text-xs text-neutral-400 mt-0.5 leading-relaxed font-normal">
                  {currentScore >= 80 ? 'Нервная система свежая. Можно жать до отказа.' :
                   currentScore >= 50 ? 'Накапливается усталость. Рекомендуем RPE 7-8.' :
                   'Истощение мотонейронов. Рекомендуем разгрузку.'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onRequestCheckIn) {
                  onRequestCheckIn();
                } else {
                  setShowQuickCheck(!showQuickCheck);
                }
              }}
              className="text-xs font-medium text-black bg-[#D4FF00] hover:bg-[#c4ed00] px-3.5 py-2 rounded-xl uppercase tracking-wider active:scale-95 transition-all shrink-0 cursor-pointer shadow-none"
            >
              Замерить
            </button>
          </div>

          {/* Quick Check-in Drawer */}
          <AnimatePresence>
            {showQuickCheck && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/[0.02] rounded-2xl p-5 space-y-4"
              >
                <div className="text-xs font-normal text-neutral-400 uppercase tracking-wider">Экспресс-калибровка ЦНС</div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-400 flex items-center gap-1 font-normal"><Moon size={13} strokeWidth={1.5}/> Сон прошлой ночью</span>
                    <span className="text-white font-light tabular-nums">{sleep} ч</span>
                  </div>
                  <input type="range" min="0" max="12" step="0.5" value={sleep} onChange={e => setSleep(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-400 flex items-center gap-1 font-normal"><Activity size={13} strokeWidth={1.5}/> Боль в мышцах</span>
                    <span className="text-white font-light tabular-nums">{soreness} / 10</span>
                  </div>
                  <input type="range" min="1" max="10" step="1" value={soreness} onChange={e => setSoreness(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-400 flex items-center gap-1 font-normal"><ShieldAlert size={13} strokeWidth={1.5}/> Ментальный стресс</span>
                    <span className="text-white font-light tabular-nums">{stress} / 10</span>
                  </div>
                  <input type="range" min="1" max="10" step="1" value={stress} onChange={e => setStress(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
                </div>

                <button
                  type="button"
                  onClick={handleQuickRecalculate}
                  className="w-full py-3.5 bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium text-xs rounded-xl uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer shadow-none"
                >
                  Обновить индекс ЦНС
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 1: PROTOCOL */}
          {activeTab === 'protocol' && (
            <div className="space-y-3">
              <div className="text-xs font-normal text-neutral-400 uppercase tracking-wider px-1">
                Пошаговый план восстановления
              </div>

              {/* Action 1: Carb Reload */}
              <div 
                onClick={() => toggleCheck('carbs')}
                className={`p-5 rounded-2xl transition-all cursor-pointer flex items-start gap-3.5 ${
                  checkedItems['carbs'] 
                    ? 'bg-white/[0.01] opacity-50' 
                    : 'bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="mt-0.5 text-[#D4FF00] shrink-0">
                  {checkedItems['carbs'] ? <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#D4FF00]" /> : <Circle size={18} strokeWidth={1.5} className="text-neutral-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Utensils size={14} strokeWidth={1.5} className="text-amber-400" />
                    <span className="text-sm font-normal text-white">Углеводная перезагрузка (+60-80г на ужин)</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                    Гликоген в печени падает при стрессе ЦНС, вызывая ночной всплеск кортизола. Медленные углеводы (рис, овсянка, гречка) на ночь гасят стресс и запускают глубокий сон.
                  </p>
                </div>
              </div>

              {/* Action 2: Electrolytes */}
              <div 
                onClick={() => toggleCheck('hydration')}
                className={`p-5 rounded-2xl transition-all cursor-pointer flex items-start gap-3.5 ${
                  checkedItems['hydration'] 
                    ? 'bg-white/[0.01] opacity-50' 
                    : 'bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="mt-0.5 text-[#D4FF00] shrink-0">
                  {checkedItems['hydration'] ? <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#D4FF00]" /> : <Circle size={18} strokeWidth={1.5} className="text-neutral-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={14} strokeWidth={1.5} className="text-blue-400" />
                    <span className="text-sm font-normal text-white">Водно-солевой баланс (0.5 л минералки)</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                    Нервный импульс — это натрий-калиевый насос. Добавь щепотку гималайской соли или выпей минеральную воду (Ессентуки/Боржоми) для проводимости нервов.
                  </p>
                </div>
              </div>

              {/* Action 3: Supplements */}
              <div 
                onClick={() => toggleCheck('supps')}
                className={`p-5 rounded-2xl transition-all cursor-pointer flex items-start gap-3.5 ${
                  checkedItems['supps'] 
                    ? 'bg-white/[0.01] opacity-50' 
                    : 'bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="mt-0.5 text-[#D4FF00] shrink-0">
                  {checkedItems['supps'] ? <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#D4FF00]" /> : <Circle size={18} strokeWidth={1.5} className="text-neutral-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Pill size={14} strokeWidth={1.5} className="text-purple-400" />
                    <span className="text-sm font-normal text-white">Стек нейро-восстановления</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                    • <b>Магний Бисглицинат (400 мг)</b> — активирует тормозные ГАМК-рецепторы мозга.<br/>
                    • <b>L-Теанин (200 мг)</b> — стимулирует альфа-ритмы расслабления.<br/>
                    • <b>Глицин (3-5 г под язык)</b> — охлаждает ядро мозга перед сном.
                  </p>
                </div>
              </div>

              {/* Action 4: Caffeine Cutoff */}
              <div 
                onClick={() => toggleCheck('caffeine')}
                className={`p-5 rounded-2xl transition-all cursor-pointer flex items-start gap-3.5 ${
                  checkedItems['caffeine'] 
                    ? 'bg-white/[0.01] opacity-50' 
                    : 'bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="mt-0.5 text-[#D4FF00] shrink-0">
                  {checkedItems['caffeine'] ? <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#D4FF00]" /> : <Circle size={18} strokeWidth={1.5} className="text-neutral-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} strokeWidth={1.5} className="text-amber-400" />
                    <span className="text-sm font-normal text-white">Стоп-кофеин после 14:00</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                    Период полувыведения кофеина 6–8 часов. Даже если ты засыпаешь от кофе, он полностью разрушает фазу медленного сна (Stage 3/4), в которой восстанавливается ЦНС.
                  </p>
                </div>
              </div>

              {/* Quick Breathe Action */}
              <div className="bg-white/[0.02] rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-normal text-white">Срочно снять спазм и гипертонус?</div>
                  <div className="text-xs text-neutral-400 mt-0.5 font-normal">3-минутная дыхательная сессия</div>
                </div>
                <button
                  type="button"
                  onClick={() => { tgHaptic('medium'); setActiveTab('breathing'); }}
                  className="bg-white/[0.06] hover:bg-white/[0.1] text-white font-normal text-xs px-3.5 py-2 rounded-xl active:scale-95 transition-all"
                >
                  Дышать 4-4
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BREATHING PROTOCOL (BOX BREATHING) */}
          {activeTab === 'breathing' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-6">
              <div className="text-center max-w-xs">
                <h3 className="text-lg font-light tracking-tight text-white mb-1 font-sans">Box Breathing (4-4-4-4)</h3>
                <p className="text-xs text-neutral-400 font-normal leading-relaxed">
                  Техника стимуляции блуждающего нерва (vagus nerve). Снижает пульс покоя и выравнивает тонус вегетативной нервной системы.
                </p>
              </div>

              {/* Animated Breath Visualizer */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Subtle ambient aura */}
                <motion.div 
                  animate={{
                    scale: breathPhase === 'inhale' ? 1.2 : breathPhase === 'hold1' ? 1.2 : breathPhase === 'exhale' ? 0.9 : 0.9,
                    opacity: isBreathing ? 0.15 : 0.04
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-[#D4FF00] filter blur-xl pointer-events-none"
                />

                {/* Minimal Ring */}
                <motion.div
                  animate={{
                    scale: breathPhase === 'inhale' ? 1.1 : breathPhase === 'hold1' ? 1.1 : breathPhase === 'exhale' ? 0.92 : 0.92,
                    borderColor: breathPhase === 'inhale' ? '#D4FF00' : breathPhase === 'hold1' ? '#FFFFFF' : breathPhase === 'exhale' ? '#A3A3A3' : '#525252'
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="w-40 h-40 rounded-full border-2 border-white/20 flex flex-col items-center justify-center bg-white/[0.02] relative z-10"
                >
                  <span className="text-5xl font-light text-white tabular-nums">{isBreathing ? breathCountdown : '4:4'}</span>
                  <span className="text-xs font-normal uppercase tracking-widest text-[#D4FF00] mt-1">
                    {isBreathing ? (
                      breathPhase === 'inhale' ? 'Вдох' :
                      breathPhase === 'hold1' ? 'Задержка' :
                      breathPhase === 'exhale' ? 'Выдох' : 'Задержка'
                    ) : 'Готов'}
                  </span>
                  {isBreathing && (
                    <span className="text-xs text-neutral-500 mt-1 tabular-nums font-normal">Цикл #{breathCycles + 1}</span>
                  )}
                </motion.div>
              </div>

              <div className="text-center text-xs text-neutral-400 font-normal h-5">
                {isBreathing ? getBreathInstruction() : 'Нажмите кнопку для запуска дыхательного протокола'}
              </div>

              {/* Action Button */}
              {!isBreathing ? (
                <button
                  type="button"
                  onClick={handleStartBreathing}
                  className="w-full max-w-xs bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium text-xs py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 active:scale-98 uppercase tracking-wider cursor-pointer shadow-none"
                >
                  <Play size={14} fill="black" />
                  <span>Начать сессию (3 мин)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopBreathing}
                  className="w-full max-w-xs bg-white/[0.06] hover:bg-white/[0.1] text-white font-normal text-xs py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 active:scale-98 uppercase tracking-wider cursor-pointer"
                >
                  <Square size={14} fill="white" />
                  <span>Завершить практику</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 3: FATIGUE & ACWR ANALYTICS */}
          {activeTab === 'fatigue' && (
            <div className="space-y-4">
              <div className="text-xs font-normal text-neutral-400 uppercase tracking-wider px-1">
                Аналитика перетренированности (ACWR)
              </div>

              {/* ACWR Metric Card */}
              <div className="bg-white/[0.02] rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-neutral-400 uppercase font-normal tracking-wider">Индекс острой нагрузки</div>
                    <div className="text-3xl font-light text-white mt-1 tabular-nums">
                      {acwr.ratio} <span className="text-xs font-normal text-neutral-400">ACWR</span>
                    </div>
                  </div>
                  <span className={`text-xs font-normal uppercase tracking-wider ${
                    acwr.zone === 'optimal' ? 'text-[#D4FF00]' :
                    acwr.zone === 'moderate' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    • {acwr.zone === 'optimal' ? 'Оптимально' : acwr.zone === 'moderate' ? 'Внимание' : 'Опасно'}
                  </span>
                </div>

                {/* Range Bar */}
                <div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden flex">
                    <div className="w-[30%] bg-blue-500/50" title="Недонагрузка <0.8" />
                    <div className="w-[45%] bg-[#D4FF00]" title="Sweet Spot 0.8-1.3" />
                    <div className="w-[15%] bg-amber-500" title="Риск 1.3-1.5" />
                    <div className="w-[10%] bg-red-500" title="Опасность >1.5" />
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500 mt-2 font-normal">
                    <span>0.8 (Дефицит)</span>
                    <span className="text-[#D4FF00] font-normal">0.8 - 1.3 (Sweet Spot)</span>
                    <span className="text-red-400">&gt;1.5 (Откат)</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed border-t border-neutral-900 pt-3 font-normal">
                  {acwr.label}. При значении выше 1.45 вероятность травмы связок и нервного срыва силовых показателей возрастает на 72%.
                </p>
              </div>

              {/* Volume Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.02] rounded-2xl p-5">
                  <div className="text-xs text-neutral-400 font-normal uppercase tracking-wider">Острый объем (7 дн)</div>
                  <div className="text-2xl font-light text-white mt-1 tabular-nums">{acwr.acuteTonnage.toLocaleString()} кг</div>
                  <div className="text-xs text-neutral-500 mt-0.5 font-normal">Тоннаж текущей недели</div>
                </div>
                <div className="bg-white/[0.02] rounded-2xl p-5">
                  <div className="text-xs text-neutral-400 font-normal uppercase tracking-wider">Базовый объем (28 дн)</div>
                  <div className="text-2xl font-light text-white mt-1 tabular-nums">{acwr.chronicWeeklyAvg.toLocaleString()} кг/н</div>
                  <div className="text-xs text-neutral-500 mt-0.5 font-normal">Средненедельная норма</div>
                </div>
              </div>

              {/* Coach Insight */}
              <div className="bg-white/[0.02] rounded-2xl p-5 text-xs text-neutral-400 leading-relaxed font-normal">
                Совет тренера: если твой ACWR в зеленой зоне (до 1.3), но тест ЦНС показывает «Истощение», причина утомления лежит не в зале, а в дефиците сна или внешнем бытовом стрессе.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-900 bg-neutral-950 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white text-xs font-normal uppercase tracking-wider rounded-xl transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
}
