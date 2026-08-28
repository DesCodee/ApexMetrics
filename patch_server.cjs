const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  '// Telegram Stars Payment Webhooks\napp.post("/api/telegram-webhook"',
  '// END OF generateWorkout catch\n\n// Telegram Stars Payment Webhooks\napp.post("/api/telegram-webhook"'
);

// I need to extract it out
content = `import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

const app = express();
const PORT = 3000;
app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// AI Workout Generation Endpoint
app.post("/api/generateWorkout", async (req, res) => {
  try {
    const { profile, forceFallback } = req.body;
    if (forceFallback) throw new Error("Forced Fallback");

    if (!profile) {
      return res.status(400).json({ error: "Missing profile" });
    }

    const prompt = \`You are an elite athletic coach. Based on this user profile: 
- Weight: \${profile.weight}kg
- Height: \${profile.height}cm
- Age: \${profile.age}
- Gender: \${profile.gender}
- Goal: \${profile.goal}
- Activity: \${profile.activityLevel}

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
]\`;

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
        "title": "Фулбади A (База)",
        "day": "День 1",
        "duration": "45 мин",
        "exercises": [
          { "name": "Приседания", "sets": 3, "reps": "8-10", "rpe": 8 },
          { "name": "Жим штанги лежа", "sets": 3, "reps": "8-10", "rpe": 8 },
          { "name": "Тяга штанги в наклоне", "sets": 3, "reps": "8-10", "rpe": 8 }
        ]
      },
      {
        "title": "Фулбади B (Сила)",
        "day": "День 2",
        "duration": "45 мин",
        "exercises": [
          { "name": "Мертвая тяга", "sets": 3, "reps": "5-8", "rpe": 8 },
          { "name": "Армейский жим", "sets": 3, "reps": "8-10", "rpe": 8 },
          { "name": "Подтягивания", "sets": 3, "reps": "8-12", "rpe": 8 }
        ]
      },
      {
        "title": "Гипертрофия / Подсобка",
        "day": "День 3",
        "duration": "40 мин",
        "exercises": [
          { "name": "Жим ногами", "sets": 3, "reps": "10-15", "rpe": 8 },
          { "name": "Жим гантелей под углом", "sets": 3, "reps": "10-12", "rpe": 8 },
          { "name": "Сгибания на бицепс", "sets": 3, "reps": "12-15", "rpe": 9 }
        ]
      }
    ];
    
    console.log("Using fallback workout plan due to API error");
    res.json({ workouts: fallbackWorkouts });
  }
});

// Telegram Stars Payment Webhooks
app.post("/api/telegram-webhook", async (req, res) => {
  const { pre_checkout_query, message } = req.body;
  
  if (pre_checkout_query) {
    // Answer pre-checkout
    console.log("Answering pre_checkout_query", pre_checkout_query.id);
    return res.json({
      method: "answerPreCheckoutQuery",
      pre_checkout_query_id: pre_checkout_query.id,
      ok: true
    });
  }
  
  if (message && message.successful_payment) {
    console.log("Successful payment received:", message.successful_payment);
    // Find user by telegram ID or payload
    // Assume developer mapped telegram ID to Firebase UID, or payload has UID
    const payload = message.successful_payment.invoice_payload;
    
    try {
       // If payload is user ID
       if (payload) {
         await db.collection("users").doc(payload).update({
           isPro: true,
           accessState: "Beta-VIP",
           proGrantedAt: admin.firestore.FieldValue.serverTimestamp()
         });
         console.log("Upgraded user", payload, "to Pro");
       }
    } catch(e) {
       console.error("Error upgrading user in webhook:", e);
    }
    return res.json({ ok: true });
  }
  
  res.json({ ok: true });
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
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
`

fs.writeFileSync('server.ts', content);
