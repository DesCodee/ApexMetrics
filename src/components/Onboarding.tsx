import React, { useState } from 'react';
import { Target, Activity, ArrowRight, User, Droplets, Flame, Zap } from 'lucide-react';
import { completeOnboarding } from '../lib/api';
import { calculateTDEE, calculateMacros } from '../lib/formulas';

export function Onboarding({ uid, onComplete }: { uid: string, onComplete: (data: any) => void }) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState<string>('20');
  const [weight, setWeight] = useState<string>('75');
  const [height, setHeight] = useState<string>('180');
  const [activity, setActivity] = useState<number>(1.55);
  const [goal, setGoal] = useState<'hard' | 'lean' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!goal) return;
    setIsSubmitting(true);
    const profile = {
      age: Number(age) || 20,
      weight: Number(weight) || 75,
      height: Number(height) || 180,
      activityLevel: activity,
      goal
    };
    try {
      await completeOnboarding(uid, profile);
      onComplete(profile);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const tdee = calculateTDEE(Number(weight) || 75, Number(height) || 180, Number(age) || 20, activity);
  const macros = goal ? calculateMacros(Number(weight) || 75, tdee, goal) : null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col p-6 overflow-y-auto">
      <div className="flex-1 flex flex-col pt-12 max-w-md mx-auto w-full pb-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] mb-4 border border-[#CCFF00]/20">
            <Zap size={32} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-2 text-[#CCFF00]">
            APEX METRICS
          </h1>
          <p className="text-[#A1A1AA] text-sm">
            Калибровка системы гипертрофии
          </p>
        </div>

        {step === 1 && (
          <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <User size={20} className="text-[#CCFF00]" /> Биометрия
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#A1A1AA] font-bold uppercase mb-1 block">Возраст</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl p-4 text-xl font-bold focus:border-[#CCFF00] outline-none" placeholder="20" />
              </div>
              <div>
                <label className="text-xs text-[#A1A1AA] font-bold uppercase mb-1 block">Вес (кг)</label>
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl p-4 text-xl font-bold focus:border-[#CCFF00] outline-none" placeholder="75" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-[#A1A1AA] font-bold uppercase mb-1 block">Рост (см)</label>
                <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-[#1A1A1A] border border-[#262626] rounded-xl p-4 text-xl font-bold focus:border-[#CCFF00] outline-none" placeholder="180" />
              </div>
            </div>

            <div className="mt-2">
              <label className="text-xs text-[#A1A1AA] font-bold uppercase mb-3 block">Активность</label>
              <div className="grid gap-2">
                {[
                  { val: 1.2, label: 'Сидячая', desc: 'Нет тренировок / Офис' },
                  { val: 1.375, label: 'Слабая', desc: '1-3 тренировки в неделю' },
                  { val: 1.55, label: 'Средняя', desc: '3-5 тренировок в неделю' },
                  { val: 1.725, label: 'Высокая', desc: 'Тяжелые тренировки 6-7 раз' },
                ].map(item => (
                  <button
                    key={item.val}
                    onClick={() => setActivity(item.val)}
                    className={`p-3 rounded-xl text-left border-2 transition-all ${
                      activity === item.val ? 'border-[#CCFF00] bg-[#CCFF00]/10' : 'border-[#262626] bg-[#1A1A1A]'
                    }`}
                  >
                    <div className="font-bold text-sm">{item.label}</div>
                    <div className="text-[#A1A1AA] text-xs mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!age || !weight || !height} className="mt-4 w-full py-4 rounded-xl font-bold text-lg bg-[#CCFF00] text-black disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              Продолжить <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Target size={20} className="text-[#CCFF00]" /> Выбор цели
            </h2>
            <div className="grid gap-3">
              {[
                { id: 'hard', title: 'Жесткий набор', desc: '+0.5 кг в неделю (Максимум силы)', color: 'text-[#FF3333]' },
                { id: 'lean', title: 'Чистая гипертрофия', desc: '+0.25 кг в неделю (Минимум жира)', color: 'text-[#CCFF00]' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setGoal(item.id as any); setStep(3); }}
                  className="p-5 rounded-2xl text-left border-2 border-[#262626] bg-[#1A1A1A] hover:border-white/20 transition-all"
                >
                  <div className={`font-black text-xl uppercase ${item.color}`}>{item.title}</div>
                  <div className="text-[#A1A1AA] text-sm mt-2">{item.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="mt-auto text-[#A1A1AA] text-sm uppercase font-bold py-2">Назад</button>
          </div>
        )}

        {step === 3 && goal && macros && (
          <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-[#CCFF00]">
              <Activity size={20} /> План сформирован
            </h2>
            
            <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-5 shadow-[0_0_20px_rgba(204,255,0,0.05)]">
              <div className="mb-6 border-b border-[#262626] pb-4">
                <div className="text-xs text-[#A1A1AA] font-bold uppercase mb-1 flex items-center gap-1"><Flame size={14}/> Дневная норма ккал</div>
                <div className="text-4xl font-black text-[#CCFF00]">{macros.surplus}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div>
                  <div className="text-[10px] text-[#A1A1AA] uppercase font-bold">Белки</div>
                  <div className="text-lg font-bold">{macros.protein}г</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#A1A1AA] uppercase font-bold">Углеводы</div>
                  <div className="text-lg font-bold">{macros.carbs}г</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#A1A1AA] uppercase font-bold">Жиры</div>
                  <div className="text-lg font-bold">{macros.fats}г</div>
                </div>
              </div>

              <div className="bg-[#0D0D0D] p-4 rounded-xl border border-[#262626]">
                <div className="text-xs text-[#A1A1AA] font-bold uppercase mb-1 flex items-center gap-1"><Droplets size={14}/> Вода</div>
                <div className="text-xl font-bold">3.0 Л</div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="mt-auto w-full py-4 rounded-xl font-black text-lg bg-[#CCFF00] text-black disabled:opacity-50 uppercase tracking-widest shadow-[0_0_20px_rgba(204,255,0,0.2)] active:scale-95 transition-all"
            >
              {isSubmitting ? 'Сохранение...' : 'Начать работу'}
            </button>
            <button onClick={() => setStep(2)} className="text-[#A1A1AA] text-sm uppercase font-bold py-2">Назад</button>
          </div>
        )}
      </div>
    </div>
  );
}
