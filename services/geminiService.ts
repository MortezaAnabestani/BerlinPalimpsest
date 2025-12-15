import { GoogleGenAI } from "@google/genai";
import { NarrativeLayer, Language, GhostPersona } from '../types';

const TEXT_MODEL_NAME = 'gemini-2.5-flash';
// Upgraded to Pro Image model for higher reliability and quality
const IMAGE_MODEL_NAME = 'gemini-3-pro-image-preview';

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

    // Validate coordinates to prevent Leaflet crashing with NaN
    const lat = parseFloat(String(data.latitude));
    const lng = parseFloat(String(data.longitude));

    if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Invalid coordinates returned from AI");
    }

    return {
      id: crypto.randomUUID(),
      theme: themeContext,
      title: data.title,
      content: data.content,
      location: {
        latitude: lat,
        longitude: lng,
        placeName: data.placeName || "Unknown Location"
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
        latitude: 52.520008,
        longitude: 13.404954,
        placeName: "Berlin (Signal Lost)"
      },
      historicalContext: "System Error",
      sourceRef: "System Log"
    };
  }
};

export const generateVisualMemory = async (narrative: NarrativeLayer): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Simplified and direct prompt for better adherence
  const visualPrompt = `
    Generate a photorealistic, top-down satellite-view image of:
    ${narrative.location.placeName}, Berlin.
    
    Scene Description:
    ${narrative.content}
    
    Visual Style:
    - Surveillance photography aesthetic.
    - Grainy, high-contrast black and white (or sepia).
    - Bird's eye view looking straight down.
    - Historical atmosphere matching the context: ${narrative.historicalContext}.
    - Include details like crowds, police barriers, or specific architectural elements mentioned.
  `;

  console.log("Generating visual memory with prompt:", visualPrompt);

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL_NAME,
    contents: {
      parts: [
        { text: visualPrompt }
      ],
    },
    config: {
        imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
        }
    }
  });

  // Extract base64 image
  let base64Image = null;
  
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }
  }

  if (!base64Image) {
    // Attempt to extract text refusal for debugging/feedback
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
    console.warn("Visual generation failed. Model response:", textPart);
    
    if (textPart) {
        throw new Error(`Visual blocked by protocol: ${textPart.substring(0, 50)}...`);
    }
    throw new Error("Visual reconstruction failed: No image data returned.");
  }

  return `data:image/png;base64,${base64Image}`;
};

export const generateGhostSignal = async (narrative: NarrativeLayer, language: Language, imageBase64: string): Promise<GhostPersona | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const langInstruction = {
      en: "Write in English.",
      de: "Write in German.",
      fa: "Write in Persian (Farsi)."
  }[language];

  // Pass the generated image back to the model for analysis (Multimodal)
  const prompt = `
    Analyze this image. It is a historical reconstruction of: "${narrative.content}".
    
    Task: Identify ONE distinct human figure in this image that looks important or emotional.
    
    1. **Coordinates**: Estimate their position in percentage (0-100) for X and Y axis. 
       - X=0 is left, X=100 is right.
       - Y=0 is top, Y=100 is bottom.
    2. **Persona**: Create a very short inner monologue for this person.
    
    ${langInstruction}
    
    Return ONLY a JSON object:
    {
      "role": "The person's role (e.g., Student, Police, Worker)",
      "monologue": "Very short thought (10 words max).",
      "x": 45,
      "y": 60
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_NAME, // Flash supports multimodal input
      contents: {
        parts: [
          {
             inlineData: {
               mimeType: "image/png",
               data: imageBase64.split(',')[1] // Remove data:image/png;base64, prefix
             }
          },
          { text: prompt }
        ]
      },
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as GhostPersona;
  } catch (e) {
    console.warn("Failed to generate ghost signal", e);
    // Fallback if image analysis fails
    return {
        role: "Unknown Signal",
        monologue: "...",
        x: 50,
        y: 50
    };
  }
};