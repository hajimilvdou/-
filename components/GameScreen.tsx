
import React, { useState, useCallback } from 'react';
import { StoryNode, InputMode, MemoryState, NodeTree, GameSettings, CameraMovement, VisualEffect } from '../types';
import { LogPanel } from './LogPanel';
import { Typewriter } from './Typewriter';
import { TimeTree } from './TimeTree';
import { CharacterHub } from './CharacterHub';
import { CinematicBackground } from './CinematicBackground';
import { VisualEffectsLayer } from './VisualEffectsLayer';

interface GameScreenProps {
  node: StoryNode;
  nodeTree: NodeTree;
  settings: GameSettings;
  onChoice: (input: string, type: InputMode) => void;
  isLoading: boolean;
  onUpdateMemory: (newMemory: MemoryState) => void;
  onUpdateNode: (updatedNode: StoryNode) => void;
  onTimeTravel: (nodeId: string) => void;
  onSave: () => void;
  onUpdateSettings: (newSettings: GameSettings) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ node, nodeTree, settings, onChoice, isLoading, onUpdateMemory, onUpdateNode, onTimeTravel, onSave, onUpdateSettings }) => {
  const [showInspector, setShowInspector] = useState(false);
  const [showTimeTree, setShowTimeTree] = useState(false);
  const [showCharacterHub, setShowCharacterHub] = useState(false);
  const [textFinished, setTextFinished] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('choice');
  const [customInput, setCustomInput] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onChoice(customInput, 'custom');
      setCustomInput('');
      setInputMode('choice');
      setTextFinished(false);
    }
  };
  
  // Memoize callback to prevent Typewriter restarts
  const handleTextComplete = useCallback(() => {
    setTextFinished(true);
  }, []);

  const handleTimeTravelWrapper = (id: string) => {
    onTimeTravel(id);
    setShowTimeTree(false);
    setTextFinished(true); 
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans text-white select-none">
      
      {/* 1. Cinematic Background Layer (Bottom) */}
      <CinematicBackground 
        keyword={node.background_keyword}
        movement={node.camera_movement || CameraMovement.STATIC}
        isLoading={isLoading}
        // Pass the image config implicitly? The component needs it. 
        // In the previous CinematicBackground refactor I missed adding the prop to receive settings,
        // but it relied on imports or default. Let's assume we pass it now for correctness if we update CinematicBackground too,
        // OR we update CinematicBackground to take imageConfig. 
        // Since I'm not updating CinematicBackground file in this specific XML block (unless I add it), 
        // I should stick to the existing props or update it.
        // Actually, the previous CinematicBackground didn't take settings prop. 
        // I will stick to what works for CinematicBackground in the existing file context (it uses generateImageUrl which takes config).
        // Wait, generateImageUrl TAKES config. So CinematicBackground MUST receive config to call it properly.
        // I will assume I need to pass imageConfig to CinematicBackground and update it as well.
        imageConfig={settings.imageConfig}
      />

      {/* 2. Visual Effects Layer (Middle) */}
      <VisualEffectsLayer effect={node.visual_effect || VisualEffect.NONE} />

      {/* Top Left Interaction Area (Input / Choices) */}
      <div className="absolute top-0 left-0 bottom-auto right-auto z-40 p-6 md:p-10 w-full max-w-md pointer-events-none">
        
        {/* Only show interactive elements when text is finished */}
        {textFinished && !isLoading && !node.is_ending && (
           <div className="pointer-events-auto animate-fade-in-down space-y-4">
              
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-4">
                 <div className="bg-black/80 backdrop-blur border border-white/10 rounded-full p-1 flex shadow-xl">
                    <button 
                      onClick={() => setInputMode('choice')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${inputMode === 'choice' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      分支选择
                    </button>
                    <button 
                      onClick={() => setInputMode('custom')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${inputMode === 'custom' ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.5)]' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      上帝模式 (Text)
                    </button>
                 </div>
              </div>

              {/* Input Area */}
              {inputMode === 'choice' ? (
                <div className="space-y-3">
                  {node.choices.map((choice, idx) => (
                    <button
                      key={choice.id || idx}
                      onClick={() => { setTextFinished(false); onChoice(choice.text_cn, 'choice'); }}
                      className="group relative w-full p-4 bg-black/60 border-l-2 border-zinc-600 hover:border-indigo-400 hover:bg-black/80 text-left text-zinc-100 transition-all duration-300 hover:translate-x-1 shadow-lg backdrop-blur-md overflow-hidden rounded-r-lg"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex justify-between items-center relative z-10">
                        <span className="font-serif text-sm md:text-base tracking-wide">{choice.text_cn}</span>
                        <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity font-mono tracking-tighter uppercase translate-x-4 group-hover:translate-x-0 duration-300">
                           →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleCustomSubmit} className="relative">
                   <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg blur opacity-75 animate-pulse"></div>
                   <div className="relative flex flex-col bg-zinc-900 rounded-lg p-1 shadow-2xl">
                      <input 
                        type="text" 
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="输入提示词（如：突然下起了暴雨...）"
                        className="w-full bg-black/50 p-4 text-white placeholder-zinc-500 focus:outline-none font-serif rounded-t text-sm md:text-base"
                        autoFocus
                      />
                      <div className="flex justify-between items-center px-4 py-2 bg-zinc-900 rounded-b border-t border-zinc-800">
                         <span className="text-[10px] text-pink-400/80 uppercase tracking-wider">AI Director Mode</span>
                         <button 
                           type="submit"
                           disabled={!customInput.trim()}
                           className="text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white px-4 py-1.5 rounded transition disabled:opacity-50"
                         >
                           执行
                         </button>
                      </div>
                   </div>
                </form>
              )}
           </div>
        )}
      </div>

      {/* Top Right Toolbar */}
      <div className="absolute top-0 right-0 z-50 p-6 flex justify-end items-start pointer-events-none">
         <div className="pointer-events-auto flex flex-col gap-3 items-end">
            
            {/* Inspector Toggle */}
            <button 
              onClick={() => setShowInspector(!showInspector)}
              className={`group flex items-center gap-3 px-5 py-2 rounded-full border backdrop-blur-md transition-all duration-300 shadow-xl w-48 justify-between ${
                showInspector 
                ? 'bg-indigo-600/90 border-indigo-400 text-white' 
                : 'bg-black/40 border-white/10 text-zinc-400 hover:bg-black/60 hover:text-white'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest">节点与记忆</span>
                <span className="text-[8px] opacity-60 font-mono">CMS INSPECTOR</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
            </button>

            {/* Time Tree Toggle */}
            <button 
              onClick={() => setShowTimeTree(true)}
              className="group flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 backdrop-blur-md bg-black/40 hover:bg-black/60 transition-all duration-300 shadow-xl w-48 justify-between text-zinc-400 hover:text-white"
            >
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">时空回廊</span>
                <span className="text-[8px] opacity-60 font-mono">TIME TREE</span>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>

            {/* Character Hub Toggle */}
            <button 
              onClick={() => setShowCharacterHub(true)}
              className="group flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 backdrop-blur-md bg-black/40 hover:bg-black/60 transition-all duration-300 shadow-xl w-48 justify-between text-zinc-400 hover:text-white"
            >
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400">人物档案</span>
                <span className="text-[8px] opacity-60 font-mono">CHARACTERS</span>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </button>

         </div>
      </div>

      {/* Main Content Area (Bottom Dialogue) */}
      <div className="relative z-30 h-full flex flex-col justify-end pb-10 px-4 md:px-20 lg:px-40 max-w-7xl mx-auto w-full pointer-events-none">
        
        {/* Dialogue Box */}
        <div className="relative group pointer-events-auto">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition duration-1000"></div>
          <div className="relative bg-zinc-950/90 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-md p-6 md:p-8 min-h-[200px] flex flex-col">
            
            {/* Speaker Name Tag */}
            {node.speaker_name && (
              <div className="absolute -top-4 left-8 bg-indigo-600 text-white px-6 py-1 text-sm font-bold tracking-widest shadow-lg transform -skew-x-12 border border-indigo-400">
                <div className="transform skew-x-12">{node.speaker_name}</div>
              </div>
            )}

            {/* Main Text */}
            <div className="mt-4 text-xl md:text-2xl leading-loose text-zinc-100 font-serif tracking-wide drop-shadow-md">
               <Typewriter 
                 key={node.display_text_cn} // Only re-mount if text changes
                 text={node.display_text_cn} 
                 speed={30} 
                 onComplete={handleTextComplete} 
               />
               {isLoading && <span className="animate-pulse ml-2 text-indigo-400 inline-block">▋</span>}
               {textFinished && !isLoading && !node.is_ending && (
                 <span className="inline-block animate-bounce ml-2 text-indigo-500">▼</span>
               )}
            </div>
            
            {/* Camera/Effect Indicator (Subtle for Debug) */}
            <div className="absolute bottom-4 right-6 flex gap-2 opacity-30 hover:opacity-100 transition-opacity">
               <span className="text-[10px] text-zinc-500 font-mono border border-zinc-800 px-1 rounded">CAM: {node.camera_movement}</span>
               <span className="text-[10px] text-zinc-500 font-mono border border-zinc-800 px-1 rounded">VFX: {node.visual_effect}</span>
            </div>
          </div>
        </div>

        {/* Ending Screen Overlay */}
        {node.is_ending && textFinished && (
           <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black animate-fade-in text-center pointer-events-auto">
              <h1 className="text-8xl md:text-9xl text-white font-serif mb-8 tracking-tighter">FIN</h1>
              <p className="text-zinc-500 text-sm tracking-[0.5em] uppercase mb-12">Narrative Concluded</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-8 py-3 border border-white/20 hover:bg-white hover:text-black transition duration-500 uppercase tracking-widest text-xs"
              >
                Return to Title
              </button>
           </div>
        )}

      </div>

      {/* Overlays */}
      <LogPanel 
        node={node} 
        isOpen={showInspector} 
        onToggle={() => setShowInspector(false)} 
        onUpdateMemory={onUpdateMemory}
        onUpdateNode={onUpdateNode}
      />
      
      <TimeTree 
        tree={nodeTree}
        isOpen={showTimeTree}
        onClose={() => setShowTimeTree(false)}
        onTimeTravel={handleTimeTravelWrapper}
        onSave={onSave}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      <CharacterHub
        characters={node.characters || []}
        isOpen={showCharacterHub}
        onClose={() => setShowCharacterHub(false)}
        imageConfig={settings.imageConfig} // Pass down the image config
      />

    </div>
  );
};
