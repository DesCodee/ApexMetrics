export function calculateCNS(sleep: number, soreness: number, energy: number): number {
  // Sleep Quality (1-5)
  // Soreness (1-5, where 5 is heavy soreness, so we invert it: (6 - soreness))
  // Energy Level (1-5)
  // Formula: ((Sleep * 0.4) + ((6-Soreness)*0.3) + (Energy*0.3)) / 5 * 100
  let score = (((sleep * 0.4) + ((6 - soreness) * 0.3) + (energy * 0.3)) / 5) * 100;
  
  // Clamped between 15% and 100%
  return Math.min(Math.max(score, 15), 100);
}

export function getCNSStatus(score: number): { label: string, color: string, recommend: string } {
  if (score > 80) return { label: 'Оптимальное', color: 'text-[#CCFF00]', recommend: 'Рекомендуется тяжелая гипертрофия' };
  if (score >= 50) return { label: 'Умеренное', color: 'text-yellow-400', recommend: 'Рекомендуется поддерживать объем' };
  return { label: 'Истощение', color: 'text-[#FF3333]', recommend: 'Рекомендуется разгрузка (Deload)' };
}

export function calculateMacros(weight: number, goal: string): { tdee: number, surplus: number, protein: number } {
  // Simple estimation: TDEE = weight * 24 * 1.55 (active)
  const tdee = weight * 24 * 1.55;
  const surplus = goal === 'mass' ? tdee + 300 : goal === 'cut' ? tdee - 300 : tdee;
  const protein = weight * 2.0; // 2g per kg
  return { tdee: Math.round(tdee), surplus: Math.round(surplus), protein: Math.round(protein) };
}

export function calculateTonnage(sets: { weight: number, reps: number, completed: boolean }[]): number {
  return sets.reduce((sum, set) => set.completed ? sum + (set.weight * set.reps) : sum, 0);
}
