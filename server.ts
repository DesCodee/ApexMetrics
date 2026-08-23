import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/gemini/generate-workout", async (req, res) => {
    try {
      const { goal, experience, weight } = req.body;

      let prompt = `Create a custom workout plan for a user with the following profile:
Goal: ${goal}
Experience level: ${experience}
Weight: ${weight}kg

Generate exactly 3-5 exercises.
Output MUST be a JSON array of objects with the following schema:
[
  {
    "id": "string (1, 2, 3...)",
    "name": "string (exercise name in Russian)",
    "target": "string (target muscle group in Russian)",
    "defaultSets": number,
    "defaultReps": number
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                target: { type: Type.STRING },
                defaultSets: { type: Type.INTEGER },
                defaultReps: { type: Type.INTEGER }
              },
              required: ["id", "name", "target", "defaultSets", "defaultReps"]
            }
          }
        }
      });

      if (!response.text) {
        throw new Error("No response from Gemini");
      }

      const exercises = JSON.parse(response.text);
      res.json({ exercises });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate workout plan" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
