import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// AI Workout Generation Endpoint
app.post("/api/generateWorkout", async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ error: "Missing profile" });
    }

    const prompt = `You are an elite athletic coach. 
Based on this user profile: 
- Weight: ${profile.weight}kg
- Height: ${profile.height}cm
- Age: ${profile.age}
- Gender: ${profile.gender}
- Goal: ${profile.goal}
- Activity: ${profile.activityLevel}

Generate a 3-day workout program.
IMPORTANT RULES:
1. Provide 5 to 7 exercises per workout.
2. ALL text (titles, days, exercise names) MUST be in Russian language.

Respond ONLY with a valid JSON array of workouts, exactly like this format, nothing else:
[
  {
    "title": "День 1 - Фулбади",
    "day": "День 1",
    "duration": "60 мин",
    "exercises": [
      { "name": "Приседания со штангой", "sets": 3, "reps": "8-10", "rpe": 8 },
      { "name": "Жим лежа", "sets": 3, "reps": "8-10", "rpe": 8 },
      { "name": "Тяга штанги в наклоне", "sets": 3, "reps": "8-10", "rpe": 8 },
      { "name": "Жим гантелей сидя", "sets": 3, "reps": "10-12", "rpe": 8 },
      { "name": "Сгибания рук с гантелями", "sets": 3, "reps": "12-15", "rpe": 9 },
      { "name": "Скручивания на пресс", "sets": 3, "reps": "15-20", "rpe": 8 }
    ]
  },
  ...
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
          responseMimeType: "application/json"
      }
    });

    const resultText = response.text || "[]";
    const workouts = JSON.parse(resultText);
    res.json({ workouts });
  } catch (error) {
    // Fallback if API fails (e.g., rate limits, quota exceeded)
    const fallbackWorkouts = [
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
        "title": "Hypertrophy / Accessories",
        "day": "Day 3",
        "duration": "40 min",
        "exercises": [
          { "name": "Leg Press", "sets": 3, "reps": "10-15", "rpe": 8 },
          { "name": "Incline DB Press", "sets": 3, "reps": "10-12", "rpe": 8 },
          { "name": "Bicep Curls", "sets": 3, "reps": "12-15", "rpe": 9 }
        ]
      }
    ];
    
    console.log("Using fallback workout plan due to API error");
    res.json({ workouts: fallbackWorkouts });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();