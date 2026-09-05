export type Gender = 'M' | 'F';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'cut' | 'maintain' | 'bulk';
export type AccessState = 'free' | 'beta-vip';

export interface UserProfile {
    weight: number; // kg
    height: number; // cm
    age: number;
    gender: Gender;
    activityLevel: ActivityLevel;
    goal: Goal;
    accessState: AccessState;
    generatedProgram?: any[];
}

export interface Set {
    reps: number;
    weight: number;
    rpe?: number;
}

export interface Exercise {
    name: string;
    sets: Set[];
}

export interface WorkoutLog {
    id: string;
    date: string; // ISO String
    exercises: Exercise[];
    userId?: string;
    title?: string;
    day?: string;
    duration?: string;
    status?: string;
    createdAt?: number | object;
    updatedAt?: number | object;
}

export interface CNSReadiness {
    score: number; // 0-100%
    status: 'Optimal' | 'Moderate' | 'Fatigued';
    recommendation: string;
}

export interface Macros {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
}

export interface VolumeMetrics {
    currentVolume: number;
    previousVolume: number;
    delta: number;
    percentChange: number;
}

export function formatTonnage(tonnageKg: number): { short: string; full: string; tons: number } {
    const val = Math.max(0, Math.round(Number(tonnageKg) || 0));
    const tons = Math.round((val / 1000) * 10) / 10;
    const formattedKg = val.toLocaleString('ru-RU');
    if (val >= 1000) {
        return {
            short: `${tons.toLocaleString('ru-RU')} т`,
            full: `${tons.toLocaleString('ru-RU')} т (${formattedKg} кг)`,
            tons
        };
    }
    return {
        short: `${formattedKg} кг`,
        full: `${formattedKg} кг`,
        tons
    };
}

export const ApexEngine = {
    /**
     * Calculates CNS Readiness based on 4 key biological/perceived markers.
     * @param sleepHours Hours of sleep (0-12+)
     * @param sorenessLevel Muscle soreness rating 1-10 (1 = none, 10 = extreme)
     * @param stressLevel Perceived life/mental stress 1-10 (1 = low, 10 = high)
     * @param restingHRDeviation Percentage deviation from baseline Resting HR (e.g. +5 for 5% higher)
     */
    calculateCNSReadiness(
        sleepHours: number,
        sorenessLevel: number,
        stressLevel: number,
        restingHRDeviation: number
    ): CNSReadiness {
        // Sleep: max 40 points (8+ hours = 40, <4 = 0)
        const sleepScore = Math.max(0, Math.min(40, (sleepHours - 4) * 10));

        // Soreness: max 20 points (1 = 20, 10 = 0)
        const sorenessScore = Math.max(0, 20 - ((sorenessLevel - 1) * (20 / 9)));

        // Stress: max 20 points (1 = 20, 10 = 0)
        const stressScore = Math.max(0, 20 - ((stressLevel - 1) * (20 / 9)));

        // Resting HR Deviation: max 20 points (<=0% deviation = 20 points, >=10% deviation = 0 points)
        const hrScore = restingHRDeviation <= 0 ? 20 : Math.max(0, 20 - (restingHRDeviation * 2));

        const totalScore = Math.round(sleepScore + sorenessScore + stressScore + hrScore);

        let status: 'Optimal' | 'Moderate' | 'Fatigued';
        let recommendation: string;

        if (totalScore >= 80) {
            status = 'Optimal';
            recommendation = 'Отличное состояние. Зеленый свет для высокой интенсивности (RPE 9-10) и полного объема.';
        } else if (totalScore >= 60) {
            status = 'Moderate';
            recommendation = 'Средняя усталость. Тренируйся по плану, но контролируй интенсивность (не выше RPE 8).';
        } else {
            status = 'Fatigued';
            recommendation = 'Сильное истощение ЦНС. Обязателен день отдыха или легкое восстановительное кардио.';
        }

        return { score: totalScore, status, recommendation };
    },

    /**
     * Calculates TDEE (Total Daily Energy Expenditure) and Macronutrient splits.
     * Uses the Mifflin-St Jeor equation.
     */
    calculateTDEE(
        weight: number,
        height: number,
        age: number,
        gender: Gender,
        activityLevel: ActivityLevel,
        goal: Goal
    ): Macros {
        // 1. Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor
        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        bmr += gender === 'M' ? 5 : -161;

        // 2. Apply Activity Multiplier
        const activityMultipliers: Record<ActivityLevel, number> = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9
        };

        let tdee = bmr * activityMultipliers[activityLevel];

        // 3. Apply Goal Adjustments
        if (goal === 'cut') tdee -= 500;
        if (goal === 'bulk') tdee += 500;

        const calories = Math.round(tdee);

        // 4. Calculate Macros
        // Protein: ~2.2g per kg of bodyweight
        const protein = Math.round(weight * 2.2); 
        // Fat: ~1.0g per kg of bodyweight for hormonal health
        const fat = Math.round(weight * 1.0); 

        const proteinCals = protein * 4;
        const fatCals = fat * 9;
        const remainingCals = calories - (proteinCals + fatCals);
        
        // Carbs: Remainder of calories
        const carbs = Math.max(0, Math.round(remainingCals / 4));

        return { calories, protein, fat, carbs };
    },

    /**
     * Calculates total workout volume (tonnage) and compares it to a previous session.
     */
    calculateVolumeMetrics(currentWorkout: WorkoutLog, previousWorkout?: WorkoutLog | null): VolumeMetrics {
        const calculateTonnage = (log: any) => {
            if (!log || !Array.isArray(log.exercises)) return 0;
            return log.exercises.reduce((acc: number, exercise: any) => {
                if (!exercise) return acc;
                // If exercise.sets is an array of sets with reps and weight
                if (Array.isArray(exercise.sets)) {
                    const exerciseVolume = exercise.sets.reduce((setAcc: number, set: any) => {
                        const weight = Math.max(0, Number(set?.weight) || 0);
                        const reps = Math.max(0, Math.floor(Number(set?.reps) || 0));
                        return setAcc + (reps * weight);
                    }, 0);
                    return acc + exerciseVolume;
                }
                // If exercise.sets is a number (e.g. template plan with sets=3, reps=10, weight=...)
                if (typeof exercise.sets === 'number') {
                    const weight = Math.max(0, Number(exercise.weight) || 0);
                    const reps = Math.max(0, Math.floor(Number(exercise.reps) || 0));
                    return acc + (exercise.sets * reps * weight);
                }
                return acc;
            }, 0);
        };

        const currentVolume = Math.round(calculateTonnage(currentWorkout));
        const previousVolume = previousWorkout ? Math.round(calculateTonnage(previousWorkout)) : 0;

        const delta = currentVolume - previousVolume;
        
        let percentChange = 0;
        if (previousVolume === 0) {
            percentChange = currentVolume > 0 ? 100 : 0;
        } else {
            percentChange = Math.round((delta / previousVolume) * 100);
        }

        return {
            currentVolume,
            previousVolume,
            delta,
            percentChange
        };
    },

    /**
     * Helper to verify beta/VIP access state constraints.
     */
    hasBetaVipAccess(profile: UserProfile): boolean {
        return profile.accessState === 'beta-vip';
    },

    /**
     * Automatically adapts a workout plan into a CNS-protective Smart Deload session.
     * Cuts RPE, reduces sets, and swaps high-axial spinal load movements.
     */
    adaptWorkoutForDeload(workout: any): any {
        if (!workout || !workout.exercises) return workout;

        const substitutions: Record<string, { name: string; note: string }> = {
            'Приседания со штангой': { name: 'Жим ногами (без осевой нагрузки)', note: 'Снижена осевая нагрузка на позвоночник' },
            'Становая тяга': { name: 'Гиперэкстензия / Сгибания ног', note: 'Снято напряжение с поясницы и ЦНС' },
            'Жим штанги лежа': { name: 'Жим гантелей на наклонной скамье', note: 'Меньше стресса для связок и суставов' },
            'Армейский жим': { name: 'Махи гантелями в стороны', note: 'Изоляция плеч вместо тяжелой базы' },
            'Тяга штанги в наклоне': { name: 'Тяга горизонтального блока к поясу', note: 'Стабильная опора, упор на памп' }
        };

        const adaptedExercises = workout.exercises.map((ex: any) => {
            const sub = substitutions[ex.name];
            const newName = sub ? sub.name : ex.name;
            const setsCount = typeof ex.sets === 'number' ? Math.max(2, ex.sets - 1) : 2;

            return {
                ...ex,
                name: newName,
                sets: setsCount,
                rpe: 6.5,
                isDeload: true,
                originalName: ex.name,
                note: sub ? sub.note : 'Разгрузочный подход (RPE 6-7, запас 3-4 повт)'
            };
        });

        return {
            ...workout,
            isDeload: true,
            title: `${workout.title} [Smart Deload]`,
            exercises: adaptedExercises
        };
    },

    /**
     * Calculates Acute:Chronic Workload Ratio (ACWR) to monitor overtraining and CNS fatigue.
     */
    calculateACWR(workouts: any[]) {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        let acuteTonnage = 0;
        let chronicTonnage = 0;

        if (Array.isArray(workouts)) {
            workouts.forEach((w: any) => {
                if (!w) return;
                // Only consider completed workouts with actual logged volume
                if (w.status && w.status !== 'completed') return;

                const dateVal = w.date || w.createdAt;
                let t = now;
                if (typeof dateVal === 'string') {
                    const parsed = new Date(dateVal).getTime();
                    if (!isNaN(parsed)) t = parsed;
                } else if (typeof dateVal === 'number') {
                    t = dateVal;
                } else if (dateVal?.seconds) {
                    t = dateVal.seconds * 1000;
                }

                const diffDays = Math.max(0, (now - t) / dayMs);
                const ton = ApexEngine.calculateVolumeMetrics(w).currentVolume;

                if (diffDays <= 7) {
                    acuteTonnage += ton;
                }
                if (diffDays <= 28) {
                    chronicTonnage += ton;
                }
            });
        }

        const weeklyChronicAvg = Math.max(500, chronicTonnage > 0 ? chronicTonnage / 4 : acuteTonnage || 500);
        const ratio = acuteTonnage === 0 ? 0.85 : parseFloat((acuteTonnage / weeklyChronicAvg).toFixed(2));

        let zone: 'optimal' | 'moderate' | 'high_risk';
        let label: string;

        if (ratio <= 1.25) {
            zone = 'optimal';
            label = 'Оптимальная адаптация (Sweet Spot)';
        } else if (ratio <= 1.45) {
            zone = 'moderate';
            label = 'Повышенная усталость (Риск перегрузки)';
        } else {
            zone = 'high_risk';
            label = 'Опасная зона перетрена (Danger Zone)';
        }

        return {
            acuteTonnage: Math.round(acuteTonnage),
            chronicWeeklyAvg: Math.round(weeklyChronicAvg),
            ratio,
            zone,
            label
        };
    }
};
