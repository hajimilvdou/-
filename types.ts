
export enum ScreenState {
  SETUP,
  PLAYING,
  GAME_OVER
}

export enum ScriptLanguage {
  FRENCH = 'French',
  JAPANESE = 'Japanese'
}

export enum NarrativeStructure {
  LINEAR = "线性 (Linear)",
  BRANCHING = "树状复线 (Branching)",
  WEB = "网状叙事 (Web/Rhizome)",
  LOOP = "循环叙事 (Time Loop)",
  PARALLEL = "平行时空 (Parallel)",
  FRAME = "框架式 (Frame Story)",
  EPISODIC = "单元剧 (Episodic)",
  REVERSE = "倒叙 (Reverse Chronology)",
  STREAM = "意识流 (Stream of Consciousness)",
  RASHOMON = "罗生门 (Rashomon Effect)"
}

export enum NarrativeTechnique {
  NONE = "标准 (Standard)",
  NON_LINEAR = "非线性叙事 (Non-linear)",
  NESTED = "嵌套式 (Nested)",
  FOURTH_WALL = "打破第四面墙 (Metafiction)",
  UNRELIABLE = "不可靠叙述者 (Unreliable Narrator)",
  IN_MEDIA_RES = "中间开始 (In Media Res)",
  MULTIPERSPECTIVE = "多视角 (Multiperspective)"
}

export enum CameraMovement {
  STATIC = "STATIC",
  ZOOM_IN = "ZOOM_IN",
  ZOOM_OUT = "ZOOM_OUT",
  PAN_RIGHT = "PAN_RIGHT",
  PAN_LEFT = "PAN_LEFT",
  DUTCH = "DUTCH_ANGLE",
  SHAKE = "SHAKE"
}

export enum VisualEffect {
  NONE = "NONE",
  RAIN = "RAIN",
  SNOW = "SNOW",
  FOG = "FOG",
  GLITCH = "GLITCH",
  FLASH = "FLASH",
  DARKNESS = "DARKNESS",
  HEALING = "HEALING",
  THUNDER = "THUNDER",
  EMBERS = "EMBERS"
}

export interface MemoryState {
  contextWindow: string;    // Current scene details (Short term)
  episodeSummary: string;   // Summary of recent events
  longTermMemory: string;   // Archived key facts
  coreMemory: string;       // Immutable facts about world/chars
  inventory: string[];      // Items held
  relationships: string;    // Character relationship status
  scheduledEvents: string[]; // Director Mode: Future events waiting to happen
}

export interface Character {
  id: string;
  name: string;
  archetype: string; // Jungian Archetype (e.g., The Shadow, The Mentor)
  affection: number; // 0-100
  description: string;
  avatarSeed: string; // For generating consistent images
}

export interface StoryChoice {
  id: string;
  text_cn: string;     // Shown to player (CN)
  logic_hint: string;  // Hint for AI (FR or EN) to maintain continuity
}

export interface StoryNode {
  id: string;
  timestamp: number; // For sorting/tree visualization
  parentId?: string; // Link to previous node
  
  // Visuals
  background_keyword: string; 
  camera_movement: CameraMovement;
  visual_effect: VisualEffect;
  
  character_emotion: string;
  speaker_name: string;
  
  // Logic Layer (Strictly French)
  reasoning_fr: string;
  // Internal Translation (Chinese)
  reasoning_cn_translation: string;
  
  // Script Layer (FR or JP)
  original_script: string;
  script_language: ScriptLanguage;
  
  // Presentation Layer (CN)
  display_text_cn: string;
  
  // Data Updates
  memory_updates: MemoryState;
  characters: Character[]; // Character states in this scene

  // Interaction
  choices: StoryChoice[];
  is_ending: boolean;
}

// Tree Structure for Time Travel
export interface NodeTree {
  nodes: Record<string, StoryNode>;
  currentId: string;
  rootId: string;
}

export type AIProvider = 'gemini' | 'openai_compatible';
export type ImageProvider = 'pollinations' | 'openai_dalle' | 'flux_pro' | 'openai_compatible';

// Separate config for Text/Logic Engine
export interface LLMConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string; 
  modelName: string;
}

// Separate config for Visual Engine
export interface ImageConfig {
  provider: ImageProvider;
  apiKey?: string; // Optional for free providers
  baseUrl?: string; // For self-hosted SD/Flux or OpenAI Proxy
  modelName?: string; // e.g., 'dall-e-3', 'flux-schnell'
}

export interface GameSettings {
  storyBackground: string; 
  characterInfo: string;   
  keyPlotPoints: string;   
  settingType: 'east' | 'west'; 
  narrativeStructure: NarrativeStructure;
  narrativeTechnique: NarrativeTechnique;
  
  // Refactored settings
  llmConfig: LLMConfig;
  imageConfig: ImageConfig;
}

export type InputMode = 'choice' | 'custom';

export interface SaveFile {
  version: string;
  date: string;
  tree: NodeTree;
  settings: GameSettings;
}
