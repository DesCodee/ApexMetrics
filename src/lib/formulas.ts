export function calculateSleepDuration(bedtime: string, waketime: string): number {
  if (!bedtime || !waketime) return 0;
  const [bHours, bMins] = bedtime.split(':').map(Number);
  const [wHours, wMins] = waketime.split(':').map(Number);
  
  let bTotal = bHours * 60 + bMins;
  let wTotal = wHours * 60 + wMins;
  
  if (wTotal < bTotal) {
    wTotal += 24 * 60; // Next day
  }
  return Number(((wTotal - bTotal) / 60).toFixed(1));
}

export function calculateCNS(sleep: number, soreness: number, stress: number): number {
  // Sleep Quality (1-5)
  // Soreness (1-5, where 5 is heavy soreness, so we invert it: (6 - soreness))
  // Stress Level (1-5, where 5 is high stress, so we invert it: (6 - stress))
  let score = (((sleep * 0.4) + ((6 - soreness) * 0.3) + ((6 - stress) * 0.3)) / 5) * 100;
  
  // Clamped between 15% and 100%
  return Math.min(Math.max(score, 15), 100);
}

export function getCNSStatus(score: number): { label: string, color: string, recommend: string } {
  if (score > 80) return { 
    label: 'Оптимальное', 
    color: 'text-[#CCFF00]', 
    recommend: 'ЦНС готова к рекордам. Ставь +2.5 кг на базовые упражнения.' 
  };
  if (score >= 50) return { 
    label: 'Умеренное', 
    color: 'text-yellow-400', 
    recommend: 'Работай по плану. Организм справляется с нагрузкой.' 
  };
  return { 
    label: 'Истощение', 
    color: 'text-[#FF3333]', 
    recommend: 'Высокий уровень кортизола. Уменьши объём на 30% или сделай растяжку.' 
  };
}

export function calculateTDEE(weight: number, height: number, age: number, activityLevel: number): number {
  // Mifflin-St Jeor for males
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  return bmr * activityLevel;
}

export function calculateMacros(weight: number, tdee: number, goal: 'hard' | 'lean'): { surplus: number, protein: number, carbs: number, fats: number } {
  const surplusCals = goal === 'hard' ? 500 : 250; // Hard (+0.5kg/week), Lean (+0.25kg/week)
  const totalCals = tdee + surplusCals;
  
  const protein = weight * 2.0;
  const proteinCals = protein * 4;
  
  const carbsCals = totalCals * 0.50; // 50% carbs
  const carbs = carbsCals / 4;
  
  // Remaining for fats (approx 20-30%)
  const fatCals = totalCals - proteinCals - carbsCals;
  const fats = fatCals / 9;
  
  return { 
    surplus: Math.round(totalCals), 
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats)
  };
}

export function calculateTonnage(sets: { weight: number, reps: number, completed: boolean }[]): number {
  return sets.reduce((sum, set) => set.completed ? sum + (set.weight * set.reps) : sum, 0);
}
