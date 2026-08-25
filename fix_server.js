const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const parseFoodRoute = `
  app.post("/api/gemini/parse-food", async (req, res) => {
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
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
        }
      });

      if (!response.text) {
        throw new Error("No response from Gemini");
      }

      const macros = JSON.parse(response.text);
      res.json(macros);
    } catch (error: any) {
      console.error("Gemini parse-food error:", error);
      res.status(500).json({ error: error.message || "Failed to parse food" });
    }
  });
`;

code = code.replace(
  '// Vite middleware for development',
  parseFoodRoute + '\n  // Vite middleware for development'
);

fs.writeFileSync('server.ts', code);
