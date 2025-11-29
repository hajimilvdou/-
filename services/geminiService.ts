
import { Type, Schema } from "@google/genai";
import { GameSettings, StoryNode, MemoryState } from "../types";
import { generateStoryNode } from "./modelRegistry";

// --- Schema Definitions (Shared) ---
const memorySchemaObject = {
  type: Type.OBJECT,
  properties: {
    contextWindow: { type: Type.STRING, description: "Current scene immediate context." },
    episodeSummary: { type: Type.STRING, description: "Summary of the current plot arc." },
    longTermMemory: { type: Type.STRING, description: "Archived important past events." },
    coreMemory: { type: Type.STRING, description: "Immutable facts about world and characters." },
    inventory: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of items." },
    relationships: { type: Type.STRING, description: "General relationship status text." },
    scheduledEvents: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Director Mode: List of future events waiting to be triggered." }
  },
  required: ["contextWindow", "episodeSummary", "longTermMemory", "coreMemory", "inventory", "relationships", "scheduledEvents"]
};

const characterSchemaObject = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    archetype: { type: Type.STRING, description: "Jungian Archetype (e.g., The Hero, The Shadow, The Anima, The Trickster)." },
    affection: { type: Type.NUMBER, description: "Affection/Trust score from 0 to 100 based on recent interactions." },
    description: { type: Type.STRING, description: "Visual description for AI Image Generation (appearance, clothing, mood)." },
    avatarSeed: { type: Type.STRING, description: "A consistent string seed for generating the character's portrait." }
  },
  required: ["id", "name", "archetype", "affection", "description", "avatarSeed"]
};

const storyResponseProperties = {
  id: { type: Type.STRING, description: "Unique UUID for this narrative node." },
  reasoning_fr: {
    type: Type.STRING,
    description: "LOGIQUE INTERNE: Analysez l'intrigue, la psychologie et les ramifications. DOIT ÊTRE EN FRANÇAIS."
  },
  reasoning_cn_translation: {
    type: Type.STRING,
    description: "Internal annotation: Chinese translation of the reasoning_fr."
  },
  script_language: {
    type: Type.STRING,
    enum: ["French", "Japanese"],
    description: "Select language based on setting context."
  },
  original_script: {
    type: Type.STRING,
    description: "Raw dialogue/narration in script_language (FR/JP)."
  },
  display_text_cn: {
    type: Type.STRING,
    description: "FINAL OUTPUT: Literary SIMPLIFIED CHINESE translation for the visual novel interface. MUST BE CHINESE."
  },
  speaker_name: {
    type: Type.STRING,
    description: "Character name (in Chinese)."
  },
  background_keyword: {
    type: Type.STRING,
    description: "High-detail English prompt for Pollinations.ai (e.g., 'cinematic shot of ruined castle, volumetric fog, 8k, unreal engine 5 render')."
  },
  camera_movement: {
    type: Type.STRING,
    enum: ["STATIC", "ZOOM_IN", "ZOOM_OUT", "PAN_RIGHT", "PAN_LEFT", "DUTCH_ANGLE", "SHAKE"],
    description: "Cinematic camera direction based on emotional intensity."
  },
  visual_effect: {
    type: Type.STRING,
    enum: ["NONE", "RAIN", "SNOW", "FOG", "GLITCH", "FLASH", "DARKNESS", "HEALING", "THUNDER", "EMBERS"],
    description: "Environmental or emotional particle effect overlay."
  },
  character_emotion: {
    type: Type.STRING,
    description: "Emoji or short phrase describing character emotion."
  },
  characters: {
    type: Type.ARRAY,
    items: characterSchemaObject,
    description: "Update state for MAJOR characters present in the scene."
  },
  memory_updates: {
    ...memorySchemaObject,
    description: "Updated state of the game memory. CRITICAL: You MUST remove 'scheduledEvents' from the list once they have naturally occurred in the story."
  },
  choices: {
    type: Type.ARRAY,
    description: "Provide exactly 3 distinct branches.",
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        text_cn: { type: Type.STRING, description: "Choice text in Simplified Chinese." },
        logic_hint: { type: Type.STRING, description: "Hidden plot direction tag." }
      },
      required: ["id", "text_cn", "logic_hint"]
    }
  },
  is_ending: {
    type: Type.BOOLEAN
  }
};

const storyResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: storyResponseProperties,
  required: [
    "id",
    "reasoning_fr",
    "reasoning_cn_translation",
    "script_language",
    "original_script",
    "display_text_cn",
    "speaker_name",
    "background_keyword",
    "camera_movement",
    "visual_effect",
    "characters",
    "memory_updates",
    "choices",
    "is_ending"
  ]
};

// --- State Management ---

let currentSettings: GameSettings | null = null;
let currentMemoryState: MemoryState | null = null;

const initialMemory: MemoryState = {
  contextWindow: "Start of story.",
  episodeSummary: "",
  longTermMemory: "",
  coreMemory: "",
  inventory: [],
  relationships: "None established.",
  scheduledEvents: []
};

// --- Helper: Construct System Prompt ---

const constructSystemPrompt = (settings: GameSettings) => {
  return `
    RÔLE : Vous êtes "Lumière", un moteur de roman visuel sophistiqué, Directeur de la Photographie et Superviseur VFX.
    
    PARAMÈTRES LITTÉRAIRES :
    - Structure Narrative : ${settings.narrativeStructure}
    - Technique Narrative : ${settings.narrativeTechnique}
    
    RÈGLES STRICTES DE LANGUE :
    1. **LOGIQUE** : Réfléchissez en **FRANÇAIS**. (reasoning_fr)
    2. **SCRIPT** : Texte brut en **${settings.settingType === 'east' ? 'JAPONAIS' : 'FRANÇAIS'}**. (original_script)
    3. **INTERFACE** : Traduction littéraire en **CHINOIS SIMPLIFIÉ**. (display_text_cn)

    MODE RÉALISATEUR (DIRECTOR MODE / SCHEDULED EVENTS) :
    - Consultez la liste 'currentMemory.scheduledEvents'.
    - Si cette liste contient des événements, votre OBJECTIF PRIORITAIRE est de les intégrer de manière ORGANIQUE et FLUIDE dans la narration.
    - Ne forcez pas l'événement s'il brise totalement la cohérence, mais orientez subtilement l'intrigue vers celui-ci (foreshadowing).
    - **CRITIQUE** : Une fois qu'un événement de la liste s'est produit ou a été intégré dans la scène actuelle, VOUS DEVEZ LE SUPPRIMER de la liste 'scheduledEvents' dans l'objet 'memory_updates'.

    DIRECTION CINÉMATOGRAPHIQUE & VFX :
    - Agissez comme un réalisateur de film.
    - **background_keyword** : Générez un prompt ANGLAIS détaillé pour un générateur d'images AI (Pollinations). Incluez le style, l'éclairage, l'atmosphère (ex: "cinematic shot of ruined castle, volumetric fog, 8k, unreal engine 5 render").
    - **camera_movement** : Choisissez le mouvement de caméra qui correspond à l'émotion (ex: ZOOM_IN pour la tension, SHAKE pour le choc).
    - **visual_effect** : Choisissez un effet visuel (ex: RAIN, GLITCH, EMBERS) si la scène le justifie.

    SYSTÈME DE PERSONNAGES (JUNGIAN) & MÉMOIRE (RAG) :
    - Assignez Archétypes Jungiens et score d'Affection.
    - Gérez 'memory_updates' avec précision.
    
    CONTEXTE INITIAL :
    - Monde : ${settings.storyBackground}
    - Personnages : ${settings.characterInfo}
    - Intrigue : ${settings.keyPlotPoints}

    INSTRUCTION :
    - Commencez l'histoire si c'est le début.
    - Générez toujours une réponse au format JSON strict correspondant au schéma fourni.
  `;
};

// --- Public API ---

export const updateRuntimeSettings = (newSettings: GameSettings) => {
  currentSettings = newSettings;
  console.log("Runtime settings updated:", newSettings);
};

export const initializeGame = async (settings: GameSettings): Promise<StoryNode> => {
  currentSettings = settings;
  const apiKey = settings.llmConfig.apiKey || process.env.API_KEY;
  
  // NOTE: We allow empty key if using a proxy with no auth, but usually warn.
  if (!apiKey && settings.llmConfig.provider !== 'openai_compatible') {
     console.warn("API Key is missing for native provider.");
  }

  // Initialize Core Memory
  initialMemory.coreMemory = `Background: ${settings.storyBackground}\nCharacters: ${settings.characterInfo}\nKey Points: ${settings.keyPlotPoints}`;
  
  const prompt = "Initialisez le moteur narratif avec une ouverture cinématographique. Renvoyez uniquement du JSON.";
  const systemInstruction = constructSystemPrompt(settings);

  try {
    const node = await generateStoryNode(
      settings.llmConfig,
      systemInstruction,
      { instruction: prompt, currentMemory: initialMemory },
      storyResponseSchema
    );
    node.timestamp = Date.now();
    currentMemoryState = node.memory_updates;
    return node;
  } catch (error) {
    console.error("Narrative Engine Initialization Error:", error);
    throw error;
  }
};

export const advanceStory = async (
  input: string, 
  type: 'choice' | 'custom', 
  overriddenMemory?: MemoryState,
  previousNodeId?: string
): Promise<StoryNode> => {
  if (!currentSettings) throw new Error("Game not initialized.");

  const memoryToUse = overriddenMemory || currentMemoryState || initialMemory;
  
  let userContent = "";
  if (type === 'choice') {
    userContent = `Le joueur a choisi : "${input}".`;
  } else {
    userContent = `COMMANDE DIRECTEUR (Prompt Utilisateur) : "${input}".`;
  }

  const contextUpdate = `
    RAPPEL PARAMÈTRES ACTUELS:
    - Monde: ${currentSettings.storyBackground}
    - Personnages: ${currentSettings.characterInfo}
    - Intrigue Clé: ${currentSettings.keyPlotPoints}
  `;

  const systemInstruction = constructSystemPrompt(currentSettings);
  
  const payload = {
    userAction: userContent,
    instruction: "Continuez l'histoire. Mettez à jour la cinématographie. Intégrez les événements prévus (scheduledEvents) si possible et supprimez-les une fois réalisés.",
    contextUpdate: contextUpdate, 
    currentMemory: memoryToUse,
    previousNodeId: previousNodeId
  };

  try {
    const node = await generateStoryNode(
      currentSettings.llmConfig,
      systemInstruction,
      payload,
      storyResponseSchema
    );
    node.timestamp = Date.now();
    node.parentId = previousNodeId;
    currentMemoryState = node.memory_updates;
    return node;
  } catch (error) {
    console.error("Narrative Engine Advance Error:", error);
    throw error;
  }
};
