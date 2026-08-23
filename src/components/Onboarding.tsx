import React, { useState } from 'react';
import { Target, Activity, ArrowRight, Dumbbell } from 'lucide-react';
import { completeOnboarding } from '../lib/api';

interface OnboardingProps {
  uid: string;
  onComplete: () => void;
}

export function Onboarding({ uid, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<'mass' | 'cut' | 'tone' | null>(null);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'pro' | null>(null);
  const [weight, setWeight] = useState<string>('75');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!goal || !experience || !weight) return;
    setIsSubmitting(true);
    try {
      await completeOnboarding(uid, {
        goal,
        experience,
        weight: parseFloat(weight) || 75
      });
      onComplete();
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-apex-bg text-white flex flex-col p-6">
      <div className="flex-1 flex flex-col pt-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-wider mb-2 text-apex-neon">
            APEX METRICS
          </h1>
          <p className="text-apex-text-dim text-sm">
            Калибровка нейросети под ваши параметры.
          </p>
        </div>

        {step === 1 && (
          <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target size={20} className="text-apex-neon" /> Главная цель
              </h2>
              <div className="grid gap-3">
                {[
                  { id: 'mass', title: 'Набор массы', desc: 'Увеличить объемы и силу' },
                  { id: 'cut', title: 'Рельеф / Сушка', desc: 'Сжечь жир, сохранить мышцы' },
                  { id: 'tone', title: 'Тонус', desc: 'Поддерживать форму и здоровье' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setGoal(item.id as any)}
                    className={`p-4 rounded-2xl text-left border-2 transition-all ${
                      goal === item.id 
                        ? 'border-apex-neon bg-apex-neon/10' 
                        : 'border-white/5 bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="font-bold text-lg">{item.title}</div>
                    <div className="text-apex-text-dim text-sm mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!goal}
              className="mt-auto w-full py-4 rounded-xl font-bold text-lg bg-apex-neon text-black disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              Продолжить <ArrowRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Activity size={20} className="text-apex-neon" /> Уровень подготовки
              </h2>
              <div className="grid gap-3">
                {[
                  { id: 'beginner', title: 'Новичок', desc: 'Менее 6 месяцев тренировок' },
                  { id: 'intermediate', title: 'Опытный', desc: 'От 6 месяцев до 2 лет' },
                  { id: 'pro', title: 'Про', desc: 'Более 2 лет регулярных тренировок' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setExperience(item.id as any)}
                    className={`p-4 rounded-2xl text-left border-2 transition-all ${
                      experience === item.id 
                        ? 'border-apex-neon bg-apex-neon/10' 
                        : 'border-white/5 bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="font-bold text-lg">{item.title}</div>
                    <div className="text-apex-text-dim text-sm mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Dumbbell size={20} className="text-apex-neon" /> Текущий вес (кг)
              </h2>
              <input 
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-2xl font-bold text-center focus:outline-none focus:border-apex-neon transition-colors"
                placeholder="75"
              />
            </div>

            <button
              onClick={handleComplete}
              disabled={!experience || !weight || isSubmitting}
              className="mt-auto w-full py-4 rounded-xl font-bold text-lg bg-apex-apex text-black disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: '#ccff00' }} // force neon inline just in case
            >
              {isSubmitting ? 'Генерация плана...' : 'Сгенерировать план'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
