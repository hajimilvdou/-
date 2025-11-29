
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { LLMConfig, ImageConfig, StoryNode } from "../types";

/**
 * MODEL INTERFACE SUGGESTIONS
 * 
 * 1. Narrative Engine (LLM):
 *    - Gemini 1.5 Pro: Recommended for Long-term memory (Context Window > 1M tokens).
 *    - GPT-4o: Recommended for strict logic adherence and complex instruction following.
 *    - DeepSeek-V3: High performance/cost ratio for creative writing.
 * 
 * 2. Visual Engine (Image):
 *    - Pollinations.ai: Free, fast, good for anime/artistic styles. No Key needed.
 *    - DALL-E 3: High prompt adherence, better realism.
 *    - FLUX.1 (via API): State-of-the-art open model, cinematic quality.
 */

// --- LLM INTERFACE ---

export const generateStoryNode = async (
  config: LLMConfig,
  systemInstruction: string,
  userPayload: any,
  schema: Schema
): Promise<StoryNode> => {
  
  const prompt = JSON.stringify(userPayload);

  // --- GOOGLE GEMINI NATIVE ---
  if (config.provider === 'gemini') {
    const aiOptions: any = { apiKey: config.apiKey || process.env.API_KEY };
    if (config.baseUrl) aiOptions.baseUrl = config.baseUrl;
    
    const ai = new GoogleGenAI(aiOptions);
    const chatSession = ai.chats.create({
      model: config.modelName,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 1.0, 
      },
    });

    const result = await chatSession.sendMessage({ message: prompt });
    return JSON.parse(result.text) as StoryNode;
  } 
  
  // --- OPENAI COMPATIBLE (GPT-4, DeepSeek, Claude via Proxy) ---
  else {
    const baseUrl = (config.baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
    const apiKey = config.apiKey || process.env.API_KEY || "";
    
    const messages = [
      { role: "system", content: systemInstruction + "\n\nCRITICAL: OUTPUT MUST BE VALID JSON MATCHING THE SCHEMA." },
      { role: "user", content: prompt }
    ];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 1.0
      })
    });

    if (!response.ok) {
       const err = await response.text();
       throw new Error(`LLM API Error (${config.provider}): ${err}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as StoryNode;
  }
};

// --- VISUAL INTERFACE ---

export const generateImageUrl = async (
  config: ImageConfig,
  prompt: string,
  width: number = 1920,
  height: number = 1080,
  seed: string | number = Math.floor(Math.random() * 1000)
): Promise<string> => {

  const cleanPrompt = encodeURIComponent(prompt);

  // --- POLLINATIONS (Free, Hybrid) ---
  if (config.provider === 'pollinations') {
    return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;
  }

  // --- OPENAI COMPATIBLE / DALL-E 3 ---
  if (config.provider === 'openai_dalle' || config.provider === 'openai_compatible') {
     // Normalize Base URL: remove trailing slash
     let baseUrl = (config.baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
     
     const apiKey = config.apiKey || process.env.API_KEY || "";
     const model = config.modelName || (config.provider === 'openai_dalle' ? "dall-e-3" : "dall-e-3");

     try {
       const response = await fetch(`${baseUrl}/images/generations`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           "Authorization": `Bearer ${apiKey}`
         },
         body: JSON.stringify({
           model: model,
           prompt: prompt,
           n: 1,
           size: "1024x1024", // Standard OpenAI size. Custom sizes might fail on official API but work on others.
           response_format: "url" // We prefer URL, but will check b64_json as fallback
         })
       });

       if (!response.ok) {
         const err = await response.text();
         console.error("Image Generation Error:", err);
         throw new Error(`Image API Error: ${err}`);
       }

       const data = await response.json();
       
       // Handle standard URL response
       if (data.data && data.data[0]?.url) {
         return data.data[0].url;
       }
       
       // Handle Base64 response (Common in local/custom OpenAI-compatible APIs that don't host files)
       if (data.data && data.data[0]?.b64_json) {
         return `data:image/png;base64,${data.data[0].b64_json}`;
       }

       throw new Error("No image URL or Base64 data found in response");

     } catch (e) {
       console.error("Failed to generate image via API, falling back to Pollinations placeholder.", e);
       // Fallback to avoid breaking UI
       return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;
     }
  }

  return "";
};
