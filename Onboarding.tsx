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

  const handleBack = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    if (step > 1) setStep(step - 1);
  };

  const handleNext = async () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    
    if (step < 3) {
        setStep(step + 1);
    } else {
      setIsAnalyzing(true);
      // Simulate brief analysis for UX, but rely on WorkoutLogger for actual AI generation
      setTimeout(() => {
         const profile = { 
            weight: Math.max(35, Math.min(250, Number(weight) || 75)), 
            height: Math.max(120, Math.min(230, Number(height) || 178)), 
            age: Math.max(14, Math.min(100, Number(age) || 25)), 
            gender, 
            activityLevel: activity, 
            goal, 
            accessState: 'free' as AccessState 
         };
         onComplete(profile);
      }, 1500);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center animate-in fade-in duration-500">
        <div className="relative w-16 h-16 mb-8">
          <div className="absolute inset-0 border-2 border-neutral-800 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-light tracking-tight text-white mb-2">ИИ анализирует...</h2>
        <p className="text-xs text-neutral-400 font-normal leading-relaxed max-w-xs">
            Генерируем тренировочную программу и рассчитываем КБЖУ под твои параметры
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-between">
      <div className="flex-1 flex flex-col justify-center max-w-md w-full">
        <div className="mb-10 text-center animate-in slide-in-from-top-4">
           <div className="text-3xl font-light tracking-tight text-white mb-1 uppercase">apex</div>
           <div className="text-xs text-neutral-400 uppercase tracking-widest font-normal">
               {tgUser?.first_name ? `Добро пожаловать, ${tgUser.first_name}` : 'Персональная настройка'}
           </div>
        </div>

        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300" key={step}>
          {step === 1 && (
            <>
              <h2 className="text-2xl font-light tracking-tight text-center text-white mb-2">Базовые параметры</h2>
              <div>
                <label className="block text-xs font-normal text-neutral-400 uppercase tracking-wider mb-2 ml-1">Пол</label>
                <div className="flex bg-white/[0.03] rounded-2xl p-1 h-[52px]">
                  {(['M', 'F'] as const).map(g => (
                    <button 
                      key={g} onClick={() => setGender(g)}
                      className={`flex-1 text-sm font-normal rounded-xl transition-all ${gender === g ? 'bg-white text-black font-medium' : 'text-neutral-400 hover:text-white'}`}
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
              <h2 className="text-2xl font-light tracking-tight text-center text-white mb-2">Физиология</h2>
              <NumberInput label="Вес (кг)" value={weight} onChange={setWeight} />
              <NumberInput label="Рост (см)" value={height} onChange={setHeight} />
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-2xl font-light tracking-tight text-center text-white mb-2">Цели и Активность</h2>
              <div>
                <label className="block text-xs font-normal text-neutral-400 uppercase tracking-wider mb-2 ml-1">Главная Цель</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cut', label: 'Сушка' },
                    { id: 'maintain', label: 'Баланс' },
                    { id: 'bulk', label: 'Масса' }
                  ].map(g => (
                    <button 
                      key={g.id} onClick={() => setGoal(g.id as Goal)}
                      className={`py-3.5 rounded-xl text-sm font-normal transition-all ${goal === g.id ? 'bg-white text-black font-medium' : 'bg-white/[0.03] text-neutral-400 hover:text-white'}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-normal text-neutral-400 uppercase tracking-wider mb-2 ml-1 mt-2">Активность</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sedentary', label: 'Сидячая' },
                    { id: 'light', label: 'Легкая' },
                    { id: 'moderate', label: 'Средняя' },
                    { id: 'active', label: 'Высокая' },
                  ].map(act => (
                    <button 
                      key={act.id} onClick={() => setActivity(act.id as ActivityLevel)}
                      className={`py-3.5 rounded-xl text-sm font-normal transition-all ${activity === act.id ? 'bg-white text-black font-medium' : 'bg-white/[0.03] text-neutral-400 hover:text-white'}`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 mt-8">
          {step > 1 && (
            <button 
              type="button"
              onClick={handleBack}
              className="py-4 px-5 rounded-xl bg-white/[0.04] text-neutral-400 hover:text-white font-normal text-sm active:scale-95 transition-all"
            >
              ← Назад
            </button>
          )}
          <button 
            type="button"
            onClick={handleNext}
            className="flex-1 bg-[#D4FF00] hover:bg-[#c4ed00] text-black font-medium text-sm py-4 px-4 rounded-xl active:scale-[0.98] transition-transform uppercase tracking-wider shadow-none"
          >
            {step < 3 ? 'Далее' : 'Создать программу'}
          </button>
        </div>
        
        <div className="flex justify-center gap-2 mt-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-1.5 h-1.5 rounded-full transition-colors ${s === step ? 'bg-[#D4FF00]' : 'bg-neutral-800'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
