
import { GoogleGenAI, Type } from "@google/genai";
import { PlantInfo } from "../types";

// Always use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PLANT_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Common name of the plant" },
    scientificName: { type: Type.STRING, description: "Botanical/Scientific name" },
    description: { type: Type.STRING, description: "A brief, engaging overview of the plant" },
    careGuide: {
      type: Type.OBJECT,
      properties: {
        watering: { type: Type.STRING, description: "Detailed watering instructions" },
        sunlight: { type: Type.STRING, description: "Light requirement details" },
        temperature: { type: Type.STRING, description: "Ideal temperature range" },
        humidity: { type: Type.STRING, description: "Humidity needs" },
        soil: { type: Type.STRING, description: "Soil type recommendation" },
        fertilizer: { type: Type.STRING, description: "Fertilization schedule and type" },
      },
      required: ["watering", "sunlight", "temperature", "humidity", "soil", "fertilizer"],
    },
    toxicity: { type: Type.STRING, description: "Toxicity to pets or humans" },
    commonIssues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of common problems or pests",
    },
  },
  required: ["name", "scientificName", "description", "careGuide", "toxicity", "commonIssues"],
};

export async function analyzePlantImage(base64Data: string, mimeType: string): Promise<PlantInfo | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this plant image. Identify the plant and provide comprehensive care instructions in the specified JSON format.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: PLANT_ANALYSIS_SCHEMA,
      },
    });

    // Access .text property directly as per the guidelines
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as PlantInfo;
  } catch (error) {
    console.error("Error analyzing plant image:", error);
    return null;
  }
}

export async function getPlantAdvice(question: string, plantContext?: PlantInfo): Promise<string> {
  try {
    const systemInstruction = plantContext 
      ? `You are Flora, an expert botanist. The user is asking about their ${plantContext.name} (${plantContext.scientificName}). Provide concise, helpful gardening advice.`
      : "You are Flora, an expert botanist. Provide concise, helpful gardening advice.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: question,
      config: {
        systemInstruction,
      },
    });

    // Access .text property directly as per the guidelines
    return response.text || "I'm sorry, I couldn't process that question.";
  } catch (error) {
    console.error("Error getting plant advice:", error);
    return "I encountered an error while thinking. Please try again.";
  }
}
