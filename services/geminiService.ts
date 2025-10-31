"use client";
// services/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { CheckIn, User, FeedGoal } from '../types';

// Access the API key using import.meta.env for Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is not set. Please ensure it's in your .env.local file and the app is rebuilt.");
}

const ai = new GoogleGenAI({ apiKey: apiKey! });
const model = 'gemini-2.5-flash';

const safeJsonParse = (jsonString: string) => {
  try {
    // Sanitize the response to remove markdown backticks
    const cleanJsonString = jsonString.replace(/^```json\s*|```\s*$/g, '');
    return JSON.parse(cleanJsonString);
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonString);
    return null;
  }
};

export const generateFocusSuggestions = async (checkInHistory: CheckIn[]): Promise<string[]> => {
  const history = checkInHistory
    .slice(0, 3)
    .map(c => `- Focus: "${c.focus}", Recap: ${c.eveningRecap || 'N/A'}`)
    .join('\n');

  const prompt = `Based on this user's recent history:\n${history}\nSuggest 3 distinct, high-impact focus areas for today. Prioritize themes from their recent 'evening recaps' or goals marked 'Partial' or 'Skipped'.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.OBJECT, properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } } }
    }
  });

  const result = safeJsonParse(response.text);
  return result?.suggestions || [];
};

export const generateGoalSuggestions = async (focus: string): Promise<string[]> => {
  if (!focus) return [];
  const prompt = `Given the user's main focus for today is "${focus}", suggest 3 specific, measurable (SMART) sub-goals to help them achieve this focus.`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.OBJECT, properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } } }
    }
  });

  const result = safeJsonParse(response.text);
  return result?.suggestions || [];
};

export const generateReplySuggestions = async (checkIn: CheckIn, fromUser: User): Promise<string[]> => {
  const recap = checkIn.eveningRecap ? `Their recap was: "${checkIn.eveningRecap}"` : '';
  const prompt = `You are an accountability partner named ${fromUser.name}. Your podmate, ${checkIn.userId}, just posted this update: Focus: "${checkIn.focus}". ${recap}. Write 3 distinct, short, and supportive replies. One should offer empathy for their challenges, one a simple constructive idea, and one should be a direct cheer-on.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.OBJECT, properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } } }
    }
  });

  const result = safeJsonParse(response.text);
  return result?.suggestions || [];
};


export const generateEncouragement = async (user: User, checkIn: CheckIn): Promise<string> => {
  const goalList = checkIn.goals.map(g => `- ${g.text}`).join('\n');
  const prompt = `My podmate ${user.name} just shared their morning intention. Their main focus is: "${checkIn.focus}". Their goals are:\n${goalList}\nWrite a short, encouraging, and supportive comment for them (1-2 sentences). Speak in a friendly, casual tone as if you are their accountability partner. Don't use hashtags.`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  return response.text.trim();
};

export const generateEveningSummary = async (checkIn: CheckIn): Promise<string> => {
  const goalSummary = checkIn.goals.map(g => `- ${g.text} (${g.status})`).join('\n');
  const prompt = `My evening recap for today: Focus: "${checkIn.focus}"\nGoals:\n${goalSummary}\nWrite a very short (1 sentence) constructive and encouraging summary of my evening reflection.`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  return response.text.trim();
};