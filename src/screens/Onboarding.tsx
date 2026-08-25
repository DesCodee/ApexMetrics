import { useState } from 'react';
import { ActivityLevel, Gender, Goal, UserProfile, AccessState } from '../appEngine';
import { NumberInput } from '../components/UI';

export default function Onboarding({ onComplete, tgUser }: { onComplete: (user: UserProfile) => void, tgUser: any }) {
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<Gender>('M');
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(80);
  const [height, setHeight] = useState(180);
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleNext = async () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    
    if (step < 3) {
        setStep(step + 1);
    } else {
      setIsAnalyzing(true);
      // Simulate brief analysis for UX, but rely on WorkoutLogger for actual AI generation
      setTimeout(() => {
         const profile = { weight, height, age, gender, activityLevel: activity, goal, accessState: 'free' as AccessState };
         onComplete(profile);
      }, 1500);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-[#D4FF00]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#D4FF00] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-3xl">🤖</div>
        </div>
        <h2 className="text-2xl font-serif text-[#D4FF00] mb-3">ИИ анализирует...</h2>
        <p className="text-neutral-400 font-medium leading-relaxed max-w-xs">
            Генерируем тренировочную программу и рассчитываем КБЖУ под твои параметры
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      <div className="flex-1 flex flex-col justify-center max-w-md w-full">
        <div className="mb-10 text-center animate-in slide-in-from-top-4">
           <div className="text-4xl font-serif text-[#D4FF00] mb-2 leading-none">apex</div>
           <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
               {tgUser?.first_name ? `Добро пожаловать, ${tgUser.first_name}` : 'Персональная настройка'}
           </div>
        </div>

        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300" key={step}>
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-center mb-6">Базовые параметры</h2>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 ml-1">Пол</label>
                <div className="flex bg-neutral-900 border border-neutral-800 rounded-2xl p-1 h-[56px]">
                  {(['M', 'F'] as const).map(g => (
                    <button 
                      key={g} onClick={() => setGender(g)}
                      className={`flex-1 text-sm font-semibold rounded-xl transition-all ${gender === g ? 'bg-white text-black shadow-md' : 'text-neutral-500'}`}
                    >
                      {g === 'M' ? 'Мужской' : 'Женский'}
                    </button>
                  ))}
                </div>
              </div>
              <NumberInput label="Возраст (лет)" value={age} onChange={setAge} />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-center mb-6">Физиология</h2>
              <NumberInput label="Вес (кг)" value={weight} onChange={setWeight} />
              <NumberInput label="Рост (см)" value={height} onChange={setHeight} />
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-center mb-6">Цели и Активность</h2>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 ml-1">Главная Цель</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cut', label: 'Сушка' },
                    { id: 'maintain', label: 'Баланс' },
                    { id: 'bulk', label: 'Масса' }
                  ].map(g => (
                    <button 
                      key={g.id} onClick={() => setGoal(g.id as Goal)}
                      className={`py-3.5 rounded-2xl text-sm font-semibold transition-all border ${goal === g.id ? 'bg-[#D4FF00]/10 border-[#D4FF00]/50 text-[#D4FF00]' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 ml-1 mt-4">Активность</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sedentary', label: 'Сидячая' },
                    { id: 'light', label: 'Легкая' },
                    { id: 'moderate', label: 'Средняя' },
                    { id: 'active', label: 'Высокая' },
                  ].map(act => (
                    <button 
                      key={act.id} onClick={() => setActivity(act.id as ActivityLevel)}
                      className={`py-3.5 rounded-2xl text-sm font-semibold transition-all border ${activity === act.id ? 'bg-[#D4FF00]/10 border-[#D4FF00]/50 text-[#D4FF00]' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button 
          onClick={handleNext}
          className="mt-10 w-full bg-[#D4FF00] text-black font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(212,255,0,0.3)]"
        >
          {step < 3 ? 'Далее' : 'Создать программу'}
        </button>
        
        <div className="flex justify-center gap-2 mt-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-2 h-2 rounded-full transition-colors ${s === step ? 'bg-[#D4FF00]' : 'bg-neutral-800'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
