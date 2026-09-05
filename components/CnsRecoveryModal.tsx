import { useState, useEffect } from 'react';
import { 
  X, Brain, Moon, Activity, ShieldAlert, Sparkles, CheckCircle2, Circle, 
  Wind, Play, Square, TrendingUp, AlertTriangle, Pill, Utensils, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApexEngine, WorkoutLog } from '../appEngine';
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

  // Quick Check-in state if user wants to recalibrate right inside modal
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

        // Transition phases
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

  const getStatusColor = (status: string) => {
    if (status === 'Optimal') return 'text-[#D4FF00] border-[#D4FF00]/30 bg-[#D4FF00]/10';
    if (status === 'Moderate') return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
    return 'text-red-400 border-red-400/30 bg-red-400/10';
  };

  const getBreathInstruction = () => {
    switch (breathPhase) {
      case 'inhale': return 'Медленный глубокий вдох носом';
      case 'hold1': return 'Задержка дыхания (кислородная сатурация)';
      case 'exhale': return 'Плавный выдох через рот (снятие спазма)';
      case 'hold2': return 'Задержка на выдохе (блуждающий нерв)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-neutral-950/90 border border-white/[0.12] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-3xl">
        
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4FF00]/15 border border-[#D4FF00]/30 flex items-center justify-center text-[#D4FF00]">
              <Brain size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Центр ЦНС</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getStatusColor(currentStatus)}`}>
                  {currentStatus === 'Optimal' ? 'Готов 100%' : currentStatus === 'Moderate' ? 'Умеренно' : 'Истощение'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Биохакинг восстановления & Нервная система</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 p-2 bg-white/[0.02] border-b border-white/[0.06] gap-1">
          <button
            onClick={() => { tgHaptic('light'); setActiveTab('protocol'); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'protocol' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Sparkles size={13} className="text-[#D4FF00]" />
            Протокол
          </button>
          <button
            onClick={() => { tgHaptic('light'); setActiveTab('breathing'); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'breathing' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Wind size={13} className="text-blue-400" />
            Дыхание 4-4
          </button>
          <button
            onClick={() => { tgHaptic('light'); setActiveTab('fatigue'); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'fatigue' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <TrendingUp size={13} className="text-orange-400" />
            ACWR График
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Quick Check Bar */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black text-white">{currentScore}%</div>
              <div>
                <div className="text-xs font-bold text-white">Текущий индекс готовности</div>
                <div className="text-[10px] text-neutral-400">
                  {currentScore >= 80 ? 'Нервная система свежая. Можно жать до отказа.' :
                   currentScore >= 50 ? 'Накапливается усталость. Рекомендуем RPE 7-8.' :
                   'Сильное истощение мотонейронов. Нужен протокол ниже.'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (onRequestCheckIn) {
                  onRequestCheckIn();
                } else {
                  setShowQuickCheck(!showQuickCheck);
                }
              }}
              className="text-[11px] font-bold text-black bg-[#D4FF00] px-3 py-1.5 rounded-xl active:scale-95 transition-transform shrink-0"
            >
              Замерить
            </button>
          </div>

          {/* Quick Check-in Drawer */}
          {showQuickCheck && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/[0.04] border border-[#D4FF00]/30 rounded-2xl p-4 space-y-4"
            >
              <div className="text-xs font-bold text-[#D4FF00] uppercase tracking-wider">Экспресс-калибровка ЦНС</div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400 flex items-center gap-1"><Moon size={12}/> Сон прошлой ночью</span>
                  <span className="text-white font-bold">{sleep} ч</span>
                </div>
                <input type="range" min="0" max="12" step="0.5" value={sleep} onChange={e => setSleep(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400 flex items-center gap-1"><Activity size={12}/> Боль в мышцах / крепатура</span>
                  <span className="text-white font-bold">{soreness} / 10</span>
                </div>
                <input type="range" min="1" max="10" step="1" value={soreness} onChange={e => setSoreness(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400 flex items-center gap-1"><ShieldAlert size={12}/> Ментальный стресс</span>
                  <span className="text-white font-bold">{stress} / 10</span>
                </div>
                <input type="range" min="1" max="10" step="1" value={stress} onChange={e => setStress(Number(e.target.value))} className="w-full accent-[#D4FF00]" />
              </div>

              <button
                onClick={handleQuickRecalculate}
                className="w-full py-2.5 bg-[#D4FF00] text-black font-bold text-xs rounded-xl active:scale-98 transition-transform"
              >
                Обновить индекс ЦНС
              </button>
            </motion.div>
          )}

          {/* TAB 1: PROTOCOL */}
          {activeTab === 'protocol' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-1">
                Пошаговый план на сегодня
              </div>

              {/* Action 1: Carb Reload */}
              <div 
                onClick={() => toggleCheck('carbs')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  checkedItems['carbs'] 
                    ? 'bg-white/[0.02] border-white/[0.04] opacity-60' 
                    : 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                <div className="mt-0.5 text-[#D4FF00]">
                  {checkedItems['carbs'] ? <CheckCircle2 size={18} className="text-[#D4FF00]" /> : <Circle size={18} className="text-neutral-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Utensils size={14} className="text-amber-400" />
                    <span className="text-sm font-bold text-white">Углеводная перезагрузка (+60-80г на ужин)</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Гликоген в печени падает при стрессе ЦНС, вызывая ночной всплеск кортизола. Медленные углеводы (рис, овсянка, гречка) на ночь гасят стресс и запускают глубокий сон.
                  </p>
                </div>
              </div>

              {/* Action 2: Electrolytes */}
              <div 
                onClick={() => toggleCheck('hydration')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  checkedItems['hydration'] 
                    ? 'bg-white/[0.02] border-white/[0.04] opacity-60' 
                    : 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                <div className="mt-0.5 text-[#D4FF00]">
                  {checkedItems['hydration'] ? <CheckCircle2 size={18} className="text-[#D4FF00]" /> : <Circle size={18} className="text-neutral-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={14} className="text-blue-400" />
                    <span className="text-sm font-bold text-white">Водно-солевой баланс (0.5 л минералки)</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Нервный импульс — это натрий-калиевый насос. Добавь щепотку гималайской соли или выпей минеральную воду (Ессентуки/Боржоми) для проводимости нервов.
                  </p>
                </div>
              </div>

              {/* Action 3: Supplements */}
              <div 
                onClick={() => toggleCheck('supps')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  checkedItems['supps'] 
                    ? 'bg-white/[0.02] border-white/[0.04] opacity-60' 
                    : 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                <div className="mt-0.5 text-[#D4FF00]">
                  {checkedItems['supps'] ? <CheckCircle2 size={18} className="text-[#D4FF00]" /> : <Circle size={18} className="text-neutral-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Pill size={14} className="text-purple-400" />
                    <span className="text-sm font-bold text-white">Стек нейро-восстановления</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    • <b>Магний Бисглицинат (400 мг)</b> — активирует тормозные ГАМК-рецепторы мозга.<br/>
                    • <b>L-Теанин (200 мг)</b> — альфа-ритмы расслабления.<br/>
                    • <b>Глицин (3-5 г под язык)</b> — охлаждает ядро мозга перед сном.
                  </p>
                </div>
              </div>

              {/* Action 4: Caffeine Cutoff */}
              <div 
                onClick={() => toggleCheck('caffeine')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  checkedItems['caffeine'] 
                    ? 'bg-white/[0.02] border-white/[0.04] opacity-60' 
                    : 'bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                <div className="mt-0.5 text-[#D4FF00]">
                  {checkedItems['caffeine'] ? <CheckCircle2 size={18} className="text-[#D4FF00]" /> : <Circle size={18} className="text-neutral-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="text-red-400" />
                    <span className="text-sm font-bold text-white">Строгий стоп-кофеин после 14:00</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Период полувыведения кофеина 6–8 часов. Даже если ты засыпаешь от кофе, он полностью разрушает фазу медленного сна (Stage 3/4), в которой восстанавливается ЦНС.
                  </p>
                </div>
              </div>

              {/* Active Recovery Prompt */}
              <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Нужно срочно снять спазм?</div>
                  <div className="text-[11px] text-neutral-400">Запусти 3-минутный дыхательный протокол</div>
                </div>
                <button
                  onClick={() => { tgHaptic('medium'); setActiveTab('breathing'); }}
                  className="bg-blue-500 text-white font-bold text-xs px-3 py-2 rounded-xl active:scale-95 transition-transform"
                >
                  Дышать 4-4
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BREATHING PROTOCOL (BOX BREATHING) */}
          {activeTab === 'breathing' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-6">
              <div className="text-center max-w-xs">
                <h3 className="text-lg font-serif text-white font-bold mb-1">Box Breathing (4-4-4-4)</h3>
                <p className="text-xs text-neutral-400">
                  Техника спецподразделений США и спортивных нейробиологов. Мгновенно стимулирует блуждающий нерв (vagus nerve) и гасит тахикардию.
                </p>
              </div>

              {/* Animated Breath Visualizer */}
              <div className="relative w-56 h-56 flex items-center justify-center">
                {/* Outer Glow */}
                <motion.div 
                  animate={{
                    scale: breathPhase === 'inhale' ? 1.25 : breathPhase === 'hold1' ? 1.25 : breathPhase === 'exhale' ? 0.85 : 0.85,
                    opacity: isBreathing ? 0.4 : 0.1
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-[#D4FF00] filter blur-2xl pointer-events-none"
                />

                {/* Animated Ring */}
                <motion.div
                  animate={{
                    scale: breathPhase === 'inhale' ? 1.15 : breathPhase === 'hold1' ? 1.15 : breathPhase === 'exhale' ? 0.9 : 0.9,
                    borderColor: breathPhase === 'inhale' ? '#D4FF00' : breathPhase === 'hold1' ? '#00E5FF' : breathPhase === 'exhale' ? '#3B82F6' : '#A855F7'
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="w-48 h-48 rounded-full border-4 border-white/20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xl shadow-inner relative z-10"
                >
                  <span className="text-4xl font-black text-white">{isBreathing ? breathCountdown : '4:4'}</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4FF00] mt-1">
                    {isBreathing ? (
                      breathPhase === 'inhale' ? 'Вдох' :
                      breathPhase === 'hold1' ? 'Задержка' :
                      breathPhase === 'exhale' ? 'Выдох' : 'Задержка'
                    ) : 'Готов'}
                  </span>
                  {isBreathing && (
                    <span className="text-[9px] text-neutral-500 mt-1">Цикл #{breathCycles + 1}</span>
                  )}
                </motion.div>
              </div>

              <div className="text-center text-xs text-neutral-300 font-medium h-6">
                {isBreathing ? getBreathInstruction() : 'Нажми "Начать сессию", чтобы перезапустить ЦНС'}
              </div>

              {/* Action Button */}
              {!isBreathing ? (
                <button
                  onClick={handleStartBreathing}
                  className="w-full max-w-xs bg-[#D4FF00] text-black font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-98 shadow-lg shadow-[#D4FF00]/20"
                >
                  <Play size={16} fill="black" />
                  Начать сессию (3 мин)
                </button>
              ) : (
                <button
                  onClick={handleStopBreathing}
                  className="w-full max-w-xs bg-white/[0.08] text-white border border-white/[0.15] font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-98"
                >
                  <Square size={16} fill="white" />
                  Завершить практику
                </button>
              )}
            </div>
          )}

          {/* TAB 3: FATIGUE & ACWR ANALYTICS */}
          {activeTab === 'fatigue' && (
            <div className="space-y-5">
              <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-1">
                Аналитика перетренированности (ACWR)
              </div>

              {/* ACWR Metric Card */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Индекс острой нагрузки</div>
                    <div className="text-2xl font-bold text-white mt-0.5">{acwr.ratio} <span className="text-xs font-normal text-neutral-500">ACWR</span></div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    acwr.zone === 'optimal' ? 'text-[#D4FF00] border-[#D4FF00]/30 bg-[#D4FF00]/10' :
                    acwr.zone === 'moderate' ? 'text-amber-400 border-amber-400/30 bg-amber-400/10' :
                    'text-red-400 border-red-400/30 bg-red-400/10'
                  }`}>
                    {acwr.zone === 'optimal' ? 'Оптимально' : acwr.zone === 'moderate' ? 'Внимание' : 'Опасно'}
                  </span>
                </div>

                {/* Range Bar */}
                <div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden flex">
                    <div className="w-[30%] bg-blue-500/40" title="Недонагрузка <0.8" />
                    <div className="w-[45%] bg-[#D4FF00]" title="Sweet Spot 0.8-1.3" />
                    <div className="w-[15%] bg-amber-500" title="Риск 1.3-1.5" />
                    <div className="w-[10%] bg-red-500" title="Опасность >1.5" />
                  </div>
                  <div className="flex justify-between text-[9px] text-neutral-500 mt-1.5">
                    <span>0.8 (Дефицит)</span>
                    <span className="text-[#D4FF00] font-bold">1.0 - 1.3 (Sweet Spot)</span>
                    <span className="text-red-400">&gt;1.5 (Откат)</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed border-t border-white/[0.06] pt-3">
                  {acwr.label}. При значении выше 1.45 вероятность травмы связок и нервного срыва силовых показателей возрастает на 72%.
                </p>
              </div>

              {/* Volume Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase">Острый объем (7 дней)</div>
                  <div className="text-lg font-bold text-white mt-1">{acwr.acuteTonnage.toLocaleString()} кг</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Тоннаж текущей недели</div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase">Базовый объем (28 дней)</div>
                  <div className="text-lg font-bold text-white mt-1">{acwr.chronicWeeklyAvg.toLocaleString()} кг/нед</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Средненедельная норма</div>
                </div>
              </div>

              {/* Coach Insight */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-xs text-neutral-400 leading-relaxed">
                💡 <b>Совет тренера:</b> Если твой ACWR в зеленой зоне (до 1.3), но тест ЦНС показывает «Истощение», причина утомления лежит не в зале, а в дефиците сна или внешнем бытовом стрессе.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-black/50 backdrop-blur-md flex gap-3">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-bold rounded-xl transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
}
