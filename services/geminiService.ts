import { GoogleGenAI } from "@google/genai";
import { NarrativeLayer, Language } from '../types';

const TEXT_MODEL_NAME = 'gemini-2.5-flash';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image'; // Using image model as free alternative to Veo

export const generateDocumentaryNarrative = async (themeContext: string, language: Language): Promise<NarrativeLayer> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const langInstruction = {
      en: "Write the content, title, and historical context in English.",
      de: "Write the content, title, and historical context in German.",
      fa: "Write the content, title, and historical context in Persian (Farsi). ensure the tone is literary and serious."
    }[language];

    const systemInstruction = `
      You are a specialized literary historian for the DAAD Artists-in-Berlin Program.
      Your task is to reveal the "Palimpsest" of Berlin—the layers of history hidden beneath the modern city.
      
      GUIDELINES:
      1.  **Truth**: All historical information must be strictly factual and documented. No fiction.
      2.  **Focus**: Prioritize non-Eurocentric perspectives, women's history, migrant stories, and queer history (LGBTQ+). Avoid the "typical" tourist history.
      3.  **Style**: The narrative text should be literary, evocative, and atmospheric (Brutalist/Noir), but grounded in hard facts.
    `;

    const prompt = `
      Theme: "${themeContext}".
      
      Find a specific, real physical location in Berlin (a building, a street corner, a park, a memorial) connected to this theme.
      The location must have a documented historical significance related to underrepresented voices (women, migrants, artists in exile).
      
      Use Google Maps to verify the location's existence and coordinates.
      
      ${langInstruction}

      IMPORTANT: Return ONLY a valid JSON object. Do not include markdown formatting (like \`\`\`json).
      KEEP THE JSON KEYS IN ENGLISH (title, content, placeName, etc), only translate the VALUES.
      
      JSON Schema:
      {
        "title": "A short, punchy, brutalist title",
        "content": "A 150-word literary narrative describing the history of this spot. Focus on the sensory details and the documented reality.",
        "historicalContext": "One sentence explaining the strict historical fact (e.g., 'In 1982, X happened here').",
        "placeName": "The modern name of the location",
        "latitude": 52.xxx,
        "longitude": 13.xxx,
        "sourceRef": "Name of the archive, book, or historical record this is based on."
      }
    `;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleMaps: {} }],
      }
    });

    let jsonText = response.text || "";
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/^```/, "").replace(/```$/, "").trim();

    if (!jsonText) throw new Error("No text returned from Gemini");

    const data = JSON.parse(jsonText);

    return {
      id: crypto.randomUUID(),
      theme: themeContext,
      title: data.title,
      content: data.content,
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        placeName: data.placeName
      },
      historicalContext: data.historicalContext,
      sourceRef: data.sourceRef
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      id: "error-fallback",
      theme: "Error",
      title: language === 'fa' ? "ارتباط قطع شد" : "CONNECTION SEVERED",
      content: language === 'fa' 
        ? "سیگنال آرشیو ضعیف است. لایه‌های شهر از هم جدا نمی‌شوند."
        : "The signal from the archive is weak. The layers of the city refuse to separate.",
      location: {
        latitude: 52.5200,
        longitude: 13.4050,
        placeName: "Alexanderplatz (Signal Lost)"
      },
      historicalContext: "System Error",
      sourceRef: "System Log"
    };
  }
};

export const generateVisualMemory = async (narrative: NarrativeLayer): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Since we cannot take a literal screenshot of the map component server-side,
  // we instruct the image model to reconstruct the visual "Soul" of that specific coordinate.
  // We ask for a style that mimics a "live event" or archival footage to simulate the video feel.
  
  const visualPrompt = `
    A hyper-realistic, atmospheric, documentary-style photograph of ${narrative.location.placeName}, Berlin.
    
    CONTEXT: ${narrative.historicalContext}
    ATMOSPHERE: ${narrative.content.slice(0, 100)}...
    
    STYLE:
    - Brutalist aesthetic, high contrast black and white or desaturated cold colors.
    - Grainy, like 16mm archival film or surveillance footage.
    - The angle should look like an establishing shot from a documentary or a street-level witness view.
    - NO TEXT overlay.
    - Make it look like a captured memory of the event described.
  `;

  console.log("Generating visual memory with prompt:", visualPrompt);

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL_NAME,
    contents: {
      parts: [
        { text: visualPrompt }
      ],
    },
    // No specific config needed for standard image gen in 2.5-flash-image
  });

  // Extract base64 image
  let base64Image = null;
  
  // Iterate to find image part
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }
  }

  if (!base64Image) {
    throw new Error("Visual reconstruction failed: No image data returned.");
  }

  return `data:image/png;base64,${base64Image}`;
};