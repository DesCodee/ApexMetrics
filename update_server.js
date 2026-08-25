const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const parseFoodRoute = `  app.post("/api/gemini/parse-food", async (req, res) => {
    try {
      const { query } = req.body;
      
      const prompt = \`Parse the following food description and return the total macronutrients and calories.
User input: "\${query}"

Output MUST be a JSON object with the following schema:
{
  "cals": number,
  "protein": number,
  "carbs": number,
  "fats": number
}
If the user specifies multiple items, sum them up. Estimate to the best of your ability if precise weights aren't given.\`;

      const config = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cals: { type: Type.INTEGER },
            protein: { type: Type.INTEGER },
            carbs: { type: Type.INTEGER },
            fats: { type: Type.INTEGER }
          },
          required: ["cals", "protein", "carbs", "fats"]
        }
      };

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config
        });
      } catch (err: any) {
        if (err.status === 503 || err.message?.includes("503") || err.message?.includes("UNAVAILABLE")) {
          console.log("3.7-flash unavailable, falling back to 3.1-flash-lite");
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config
          });
        } else {
          throw err;
        }
      }

      if (!response.text) {
        throw new Error("No response from Gemini");
      }

      const macros = JSON.parse(response.text);
      res.json(macros);
    } catch (error: any) {
      console.error("Gemini parse-food error:", error);
      res.status(500).json({ error: error.message || "Failed to parse food" });
    }
  });`;

// We need to replace the old route with the new one.
// Let's use regex to replace it
code = code.replace(/app\.post\("\/api\/gemini\/parse-food"[\s\S]*?(?=\/\/ Vite middleware)/, parseFoodRoute + '\n\n  ');

fs.writeFileSync('server.ts', code);
