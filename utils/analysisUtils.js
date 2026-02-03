import fs from "fs";
import 'dotenv/config';
import { openai } from "./config.js";
import { AnalysisSchema } from "./constants.js";

function extractJSON(text) {
  const cleanText = text.replace(/```json\s*|\s*```/g, '').trim();
  const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
  return jsonMatch ? jsonMatch[0] : cleanText;
}

export async function analyzeScreenshot(filePath) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a JSON extraction assistant. Always respond with valid JSON only, no markdown formatting or explanations."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract appointment data from this Japanese police appointment screenshot. Available appointments will have a green circle showing it is available. While booked or unavailable times will show a red circle or a grey line. Return only a JSON array with this exact structure:

[
  {
    "location": "府中試験場",
    "is29Country": true,
    "date": "xxxx-xx-xx",
    "type": "29の国･地域の方"
  }
]

NOTE THAT THE ABOVE IS JUST AN EXAMPLE. DO NOT INCLUDE IT IN YOUR RESPONSE.
Valid locations: 府中試験場, 鮫洲試験場, 江東試験場
Valid types: "29の国･地域以外の方で、住民票のある方", "29の国･地域以外の方で、住民票のない方", "29の国･地域の方"

If no appointments found, return: []`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${fs.readFileSync(filePath, {
                  encoding: "base64",
                })}`,
              }
            }
          ]
        }
      ],
      temperature: 0,
    });

    const jsonText = extractJSON(response.choices[0].message.content);
    const parsed = AnalysisSchema.safeParse(JSON.parse(jsonText));
    return parsed.success ? parsed.data : [];
  } catch (error) {
    console.error("Analysis failed:", error.message);
    return [];
  }
}