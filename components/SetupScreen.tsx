
import React, { useState } from 'react';
import { GameSettings, NarrativeStructure, NarrativeTechnique, LLMConfig, ImageConfig, AIProvider, ImageProvider } from '../types';

interface SetupScreenProps {
  onStart: (settings: GameSettings) => void;
  isLoading: boolean;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, isLoading }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Default Initial State
  const [settings, setSettings] = useState<GameSettings>({
    storyBackground: '2050年的新巴黎，霓虹灯与旧石建筑交织。雨夜连绵不绝。',
    characterInfo: '主角：一位失忆的侦探。配角：神秘的AI少女"Lumière"。',
    keyPlotPoints: '发现一张加密芯片；被财团追杀；寻找记忆的真相。',
    settingType: 'west',
    narrativeStructure: NarrativeStructure.BRANCHING,
    narrativeTechnique: NarrativeTechnique.NONE,
    
    // NARRATIVE INTERFACE (Brain)
    llmConfig: {
      provider: 'gemini',
      apiKey: '', 
      modelName: 'gemini-2.5-flash',
      baseUrl: ''
    },
    
    // VISUAL INTERFACE (Eye)
    imageConfig: {
      provider: 'pollinations',
      apiKey: '',
      baseUrl: '',
      modelName: ''
    }
  });

  const handleChange = (field: keyof GameSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLLMChange = (field: keyof LLMConfig, value: string) => {
    setSettings(prev => ({
      ...prev,
      llmConfig: { ...prev.llmConfig, [field]: value }
    }));
  };

  const handleImageChange = (field: keyof ImageConfig, value: string) => {
    setSettings(prev => ({
      ...prev,
      imageConfig: { ...prev.imageConfig, [field]: value }
    }));
  };

  // Helper for LLM Presets
  const applyLLMPreset = (type: 'gemini-flash' | 'gemini-pro' | 'gpt-4o' | 'deepseek') => {
    switch (type) {
      case 'gemini-flash':
        handleLLMChange('provider', 'gemini');
        handleLLMChange('modelName', 'gemini-2.5-flash');
        handleLLMChange('baseUrl', '');
        break;
      case 'gemini-pro':
        handleLLMChange('provider', 'gemini');
        handleLLMChange('modelName', 'gemini-1.5-pro');
        handleLLMChange('baseUrl', '');
        break;
      case 'gpt-4o':
        handleLLMChange('provider', 'openai_compatible');
        handleLLMChange('modelName', 'gpt-4o');
        handleLLMChange('baseUrl', 'https://api.openai.com/v1');
        break;
      case 'deepseek':
        handleLLMChange('provider', 'openai_compatible');
        handleLLMChange('modelName', 'deepseek-chat');
        handleLLMChange('baseUrl', 'https://api.deepseek.com');
        break;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 font-serif relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/engine/1920/1080')] bg-cover bg-center opacity-20 blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-zinc-900/80 to-black"></div>

      <div className="relative z-10 w-full max-w-6xl p-6 md:p-8 overflow-y-auto max-h-screen flex flex-col lg:flex-row gap-8">
        
        {/* LEFT: Story Config */}
        <div className="flex-[2] space-y-6">
          <div className="mb-4 space-y-2">
            <h1 className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 font-sans">
              Lumière
            </h1>
            <p className="text-sm tracking-[0.5em] text-zinc-500 uppercase">可视化叙事引擎 v3.0</p>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl space-y-4">
            
             {/* Setting Type */}
            <div className="grid grid-cols-2 gap-4">
               <button 
                 onClick={() => setSettings(s => ({...s, settingType: 'west'}))}
                 className={`p-4 rounded-xl border text-center transition-all ${settings.settingType === 'west' ? 'bg-indigo-900/40 border-indigo-500 text-indigo-200' : 'border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
               >
                 <span className="block text-2xl mb-1">🏰</span>
                 <span className="text-xs font-bold uppercase tracking-wider">欧风 / West (FR)</span>
               </button>
               <button 
                 onClick={() => setSettings(s => ({...s, settingType: 'east'}))}
                 className={`p-4 rounded-xl border text-center transition-all ${settings.settingType === 'east' ? 'bg-pink-900/40 border-pink-500 text-pink-200' : 'border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
               >
                 <span className="block text-2xl mb-1">⛩️</span>
                 <span className="text-xs font-bold uppercase tracking-wider">和风 / East (JP)</span>
               </button>
            </div>

            {/* Structure & Technique */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">叙事结构</label>
                <select 
                  value={settings.narrativeStructure}
                  onChange={(e) => handleChange('narrativeStructure', e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-700 rounded-lg p-2 text-xs outline-none text-zinc-200"
                >
                  {Object.values(NarrativeStructure).map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">高级技法</label>
                <select 
                  value={settings.narrativeTechnique}
                  onChange={(e) => handleChange('narrativeTechnique', e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-700 rounded-lg p-2 text-xs outline-none text-zinc-200"
                >
                  {Object.values(NarrativeTechnique).map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Context Inputs */}
            <div className="space-y-4 pt-2">
               <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">世界观背景 (World)</label>
                <textarea 
                  value={settings.storyBackground}
                  onChange={(e) => handleChange('storyBackground', e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-700 rounded p-3 text-sm h-20 resize-none focus:border-indigo-500 outline-none"
                />
               </div>
               <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">主要角色 (Characters)</label>
                <textarea 
                  value={settings.characterInfo}
                  onChange={(e) => handleChange('characterInfo', e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-700 rounded p-3 text-sm h-20 resize-none focus:border-indigo-500 outline-none"
                />
               </div>
               <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase">关键剧情点 (Plot Points)</label>
                <textarea 
                  value={settings.keyPlotPoints}
                  onChange={(e) => handleChange('keyPlotPoints', e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-700 rounded p-3 text-sm h-20 resize-none focus:border-indigo-500 outline-none"
                />
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Engine Interfaces */}
        <div className="flex-1 w-full lg:w-96 flex flex-col gap-6">
          
          {/* 1. NARRATIVE ENGINE CONFIG */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider flex items-center gap-2">
                   <span>🧠</span> 叙事引擎接口 (Narrative)
                </h3>
             </div>
             
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 mb-2">
                   <button onClick={() => applyLLMPreset('gemini-pro')} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded text-zinc-300 border border-zinc-700">Gemini Pro 1.5</button>
                   <button onClick={() => applyLLMPreset('gpt-4o')} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded text-zinc-300 border border-zinc-700">GPT-4o</button>
                   <button onClick={() => applyLLMPreset('gemini-flash')} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded text-zinc-300 border border-zinc-700">Flash 2.5</button>
                   <button onClick={() => applyLLMPreset('deepseek')} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded text-zinc-300 border border-zinc-700">DeepSeek</button>
                </div>

                <div className="space-y-2">
                   <div>
                      <label className="text-[9px] uppercase text-zinc-500 block mb-1">Provider Type</label>
                      <select 
                        value={settings.llmConfig.provider}
                        onChange={(e) => handleLLMChange('provider', e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded p-1.5 text-xs outline-none"
                      >
                        <option value="gemini">Google Gemini (Native)</option>
                        <option value="openai_compatible">OpenAI Compatible (Standard)</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-[9px] uppercase text-zinc-500 block mb-1">Model Name</label>
                      <input 
                        type="text" 
                        value={settings.llmConfig.modelName}
                        onChange={(e) => handleLLMChange('modelName', e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded p-1.5 text-xs outline-none font-mono text-blue-300"
                      />
                   </div>
                   {settings.llmConfig.provider === 'openai_compatible' && (
                     <div>
                        <label className="text-[9px] uppercase text-zinc-500 block mb-1">Base URL</label>
                        <input 
                          type="text" 
                          value={settings.llmConfig.baseUrl}
                          onChange={(e) => handleLLMChange('baseUrl', e.target.value)}
                          className="w-full bg-black border border-zinc-700 rounded p-1.5 text-xs outline-none font-mono"
                        />
                     </div>
                   )}
                   <div>
                      <label className="text-[9px] uppercase text-zinc-500 block mb-1">API Key</label>
                      <input 
                        type="password" 
                        value={settings.llmConfig.apiKey}
                        onChange={(e) => handleLLMChange('apiKey', e.target.value)}
                        placeholder="Env Var Default"
                        className="w-full bg-black border border-zinc-700 rounded p-1.5 text-xs outline-none font-mono"
                      />
                   </div>
                </div>
             </div>
          </div>

          {/* 2. VISUAL ENGINE CONFIG */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-pink-200 uppercase tracking-wider flex items-center gap-2">
                   <span>👁️</span> 视觉渲染接口 (Visual)
                </h3>
             </div>
             
             <div className="space-y-4">
                <div className="space-y-2">
                   <div>
                      <label className="text-[9px] uppercase text-zinc-500 block mb-1">Provider Type</label>
                      <select 
                        value={settings.imageConfig.provider}
                        onChange={(e) => handleImageChange('provider', e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded p-1.5 text-xs outline-none"
                      >
                        <option value="pollinations">Pollinations.ai (Free/Fast)</option>
                        <option value="openai_dalle">DALL-E 3 (OpenAI Standard)</option>
                        <option value="openai_compatible">OpenAI Compatible (Custom URL)</option>
                      </select>
                   </div>
                   
                   {settings.imageConfig.provider !== 'pollinations' && (
                     <>
                        <div>
                           <label className="text-[9px] uppercase text-zinc-500 block mb-1">API Key</label>
                           <input 
                             type="password" 
                             value={settings.imageConfig.apiKey || ''}
                             onChange={(e) => handleImageChange('apiKey', e.target.value)}
                             className="w-full bg-black border border-zinc-700 rounded p-1.5 text-xs outline-none font-mono"
                           />
                        </div>
                        {settings.imageConfig.provider === 'openai_compatible' && (
                          <div>
                             <label className="text-[9px] uppercase text-zinc-500 block mb-1">Base URL</label>
                             <input 
                               type="text" 
                               placeholder="https://api.example.com/v1"
                               value={settings.imageConfig.baseUrl || ''}
                               onChange={(e) => handleImageChange('baseUrl', e.target.value)}
                               className="w-full bg-black border border-zinc-700 rounded p-1.5 text-xs outline-none font-mono"
                             />
                          </div>
                        )}
                        <div>
                           <label className="text-[9px] uppercase text-zinc-500 block mb-1">Model Name</label>
                           <input 
                             type="text" 
                             placeholder={settings.imageConfig.provider === 'openai_dalle' ? "dall-e-3" : "flux-schnell"}
                             value={settings.imageConfig.modelName || ''}
                             onChange={(e) => handleImageChange('modelName', e.target.value)}
                             className="w-full bg-black border border-zinc-700 rounded p-1.5 text-xs outline-none font-mono"
                           />
                        </div>
                     </>
                   )}
                </div>

                <div className="bg-pink-900/20 border border-pink-500/20 p-2 rounded text-[9px] text-pink-300 leading-tight">
                   <strong>提示:</strong> Pollinations 适合快速无限流生成。OpenAI Compatible 支持所有遵循 /images/generations 格式的接口（如自建 SD/Flux）。
                </div>
             </div>
          </div>

          <div className="flex-1"></div>

          <button 
            onClick={() => onStart(settings)}
            disabled={isLoading}
            className={`group w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all duration-500 relative overflow-hidden shadow-2xl ${
              isLoading ? 'bg-zinc-800 cursor-not-allowed' : 'bg-white text-black hover:scale-[1.02]'
            }`}
          >
             <span className="relative z-10 flex items-center justify-center gap-2">
               {isLoading ? (
                 <>
                   <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                 </>
               ) : (
                 <>启动 Narrative Engine</>
               )}
             </span>
             {!isLoading && <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 to-pink-400/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>}
          </button>
        </div>

      </div>
    </div>
  );
};
