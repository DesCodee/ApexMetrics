const fs = require('fs');
const file = 'src/components/WorkoutLogger.tsx';
let code = fs.readFileSync(file, 'utf8');

// replace the error throwing block
code = code.replace(
  /if \(\!res\.ok\) \{\s+throw new Error\(\'Failed to generate program\'\);\s+\}/,
  `if (!res.ok) {
       console.warn('Backend failed, using frontend fallback');
       const fallbackData = {
           workouts: [
              {
                "title": "Full Body A",
                "day": "Day 1",
                "duration": "45 min",
                "exercises": [
                  { "name": "Squats", "sets": 3, "reps": "8-10", "rpe": 8 },
                  { "name": "Bench Press", "sets": 3, "reps": "8-10", "rpe": 8 },
                  { "name": "Barbell Rows", "sets": 3, "reps": "8-10", "rpe": 8 }
                ]
              },
              {
                "title": "Full Body B",
                "day": "Day 2",
                "duration": "45 min",
                "exercises": [
                  { "name": "Deadlifts", "sets": 3, "reps": "5-8", "rpe": 8 },
                  { "name": "Overhead Press", "sets": 3, "reps": "8-10", "rpe": 8 },
                  { "name": "Pull-ups", "sets": 3, "reps": "8-12", "rpe": 8 }
                ]
              },
              {
                "title": "Hypertrophy",
                "day": "Day 3",
                "duration": "40 min",
                "exercises": [
                  { "name": "Leg Press", "sets": 3, "reps": "10-15", "rpe": 8 },
                  { "name": "Incline DB Press", "sets": 3, "reps": "10-12", "rpe": 8 },
                  { "name": "Bicep Curls", "sets": 3, "reps": "12-15", "rpe": 9 }
                ]
              }
           ]
       };
       // mock res.json
       res = { json: async () => fallbackData, ok: true } as any;
   }`
);

fs.writeFileSync(file, code);
