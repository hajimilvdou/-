
import React, { useState, useEffect } from 'react';
import { StoryNode, ScriptLanguage, MemoryState } from '../types';

interface LogPanelProps {
  node: StoryNode;
  isOpen: boolean;
  onToggle: () => void;
  onUpdateMemory: (newMemory: MemoryState) => void;
  onUpdateNode: (updatedNode: StoryNode) => void;
}

export const LogPanel: React.FC<LogPanelProps> = ({ node, isOpen, onToggle, onUpdateMemory, onUpdateNode }) => {
  const [activeTab, setActiveTab] = useState<'node' | 'memory'>('node');
  const [localMemory, setLocalMemory] = useState<MemoryState>(node.memory_updates);
  const [localNode, setLocalNode] = useState<StoryNode>(node);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  
  // Director Mode State
  const [newEvent, setNewEvent] = useState('');
  const [isEditingNode, setIsEditingNode] = useState(false);

  // Sync state when props change (if not editing)
  useEffect(() => {
    if (!isEditingNode) {
        setLocalMemory(node.memory_updates);
        setLocalNode(node);
    }
  }, [node, isEditingNode]);

  const handleMemoryChange = (field: keyof MemoryState, value: string | string[]) => {
    const updated = { ...localMemory, [field]: value };
    setLocalMemory(updated);
    onUpdateMemory(updated); // Propagate up to App state immediately
  };

  const handleNodeEdit = (field: keyof StoryNode, value: any) => {
      setIsEditingNode(true);
      setLocalNode(prev => ({ ...prev, [field]: value }));
  };

  const saveNodeChanges = () => {
      onUpdateNode(localNode);
      setIsEditingNode(false);
      alert("节点数据已更新 (Node Data Updated)");
  };

  const handleGlobalReplace = () => {
    if (!findText) return;
    const regex = new RegExp(findText, 'g');
    
    const updated: MemoryState = {
      contextWindow: localMemory.contextWindow.replace(regex, replaceText),
      episodeSummary: localMemory.episodeSummary.replace(regex, replaceText),
      longTermMemory: localMemory.longTermMemory.replace(regex, replaceText),
      coreMemory: localMemory.coreMemory.replace(regex, replaceText),
      inventory: localMemory.inventory.map(i => i.replace(regex, replaceText)),
      relationships: localMemory.relationships.replace(regex, replaceText),
      scheduledEvents: (localMemory.scheduledEvents || []).map(e => e.replace(regex, replaceText))
    };

    setLocalMemory(updated);
    onUpdateMemory(updated);
    alert(`上帝模式：已将所有记忆中的 "${findText}" 替换为 "${replaceText}"。`);
  };

  const addScheduledEvent = () => {
    if (!newEvent.trim()) return;
    const currentEvents = localMemory.scheduledEvents || [];
    handleMemoryChange('scheduledEvents', [...currentEvents, newEvent]);
    setNewEvent('');
  };

  const removeScheduledEvent = (index: number) => {
    const currentEvents = localMemory.scheduledEvents || [];
    const updatedEvents = currentEvents.filter((_, i) => i !== index);
    handleMemoryChange('scheduledEvents', updatedEvents);
  };

  return (
    <div 
      className={`fixed top-0 right-0 h-full bg-zinc-950 border-l border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] transform transition-transform duration-300 ease-out z-[100] w-full md:w-[700px] flex flex-col font-sans ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="h-16 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <h2 className="text-zinc-100 font-bold tracking-widest uppercase text-xs">可视化叙事引擎 CMS</h2>
           </div>
           
           {/* Tabs */}
           <div className="flex gap-1 bg-black/50 p-1 rounded-lg">
             <button 
               onClick={() => setActiveTab('node')}
               className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${activeTab === 'node' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               节点检视器 (Node)
             </button>
             <button 
               onClick={() => setActiveTab('memory')}
               className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${activeTab === 'memory' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
             >
               记忆核心 (RAG)
             </button>
           </div>
        </div>

        <button onClick={onToggle} className="text-zinc-500 hover:text-white transition p-2 hover:bg-zinc-800 rounded">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0a] relative scrollbar-thin scrollbar-thumb-zinc-800">
        
        {/* Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        <div className="p-8 space-y-8 relative z-10">

          {activeTab === 'node' ? (
            /* NODE INSPECTOR TAB - NOW EDITABLE */
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">上帝模式：实时剧本修改</span>
                  {isEditingNode && (
                      <button onClick={saveNodeChanges} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold animate-pulse">
                          保存变更 (Save)
                      </button>
                  )}
              </div>

              {/* Logic Node (French) */}
              <div className="bg-zinc-900 border-l-4 border-blue-600 rounded-r shadow-lg overflow-hidden">
                <div className="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">逻辑演算 (法语核心)</span>
                    <span className="text-[10px] text-zinc-600 font-mono">NODE_LOGIC</span>
                </div>
                <div className="p-2">
                    <textarea 
                       className="w-full bg-transparent text-zinc-300 font-serif italic leading-relaxed text-sm outline-none resize-none min-h-[100px]"
                       value={localNode.reasoning_fr}
                       onChange={(e) => handleNodeEdit('reasoning_fr', e.target.value)}
                    />
                </div>
                {/* Internal Translation */}
                <div className="bg-blue-900/10 px-4 py-3 border-t border-zinc-800/50">
                    <span className="block text-[9px] text-blue-500/50 uppercase mb-1">内部标注 (中文翻译)</span>
                    <textarea 
                       className="w-full bg-transparent text-zinc-400 text-xs leading-relaxed outline-none resize-none"
                       value={localNode.reasoning_cn_translation}
                       onChange={(e) => handleNodeEdit('reasoning_cn_translation', e.target.value)}
                    />
                </div>
              </div>

              {/* Script Node (Source) */}
              <div className="bg-zinc-900 border-l-4 border-pink-600 rounded-r shadow-lg">
                <div className="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">剧本原文 ({localNode.script_language})</span>
                    <span className="text-[10px] text-zinc-600 font-mono">NODE_SCRIPT</span>
                </div>
                <div className="p-2">
                    <textarea 
                        className={`w-full bg-transparent text-sm text-zinc-200 leading-relaxed outline-none resize-none min-h-[80px] ${localNode.script_language === ScriptLanguage.JAPANESE ? 'font-script-jp' : 'font-serif'}`}
                        value={localNode.original_script}
                        onChange={(e) => handleNodeEdit('original_script', e.target.value)}
                    />
                </div>
              </div>

              {/* Output Node (CN) */}
              <div className="bg-zinc-900 border-l-4 border-indigo-600 rounded-r shadow-lg relative">
                <div className="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">最终渲染 (中文)</span>
                    <span className="text-[10px] text-zinc-600 font-mono">NODE_RENDER</span>
                </div>
                <div className="p-2">
                     <textarea 
                        className="w-full bg-transparent text-base text-white leading-relaxed font-serif outline-none resize-none min-h-[120px]"
                        value={localNode.display_text_cn}
                        onChange={(e) => handleNodeEdit('display_text_cn', e.target.value)}
                    />
                </div>
                {/* Tags */}
                <div className="px-4 py-2 bg-black/20 flex gap-2 border-t border-zinc-800">
                    <input 
                      className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 w-1/2 outline-none"
                      value={localNode.background_keyword}
                      onChange={(e) => handleNodeEdit('background_keyword', e.target.value)}
                    />
                    <input 
                      className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 w-1/2 outline-none"
                      value={localNode.character_emotion}
                      onChange={(e) => handleNodeEdit('character_emotion', e.target.value)}
                    />
                </div>
              </div>

              {/* Branches Visualization */}
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest text-center mb-4">当前分支 (Branches)</div>
                <div className="grid grid-cols-1 gap-3">
                  {localNode.choices.map((choice, i) => (
                    <div key={i} className="flex items-center gap-3 opacity-80 hover:opacity-100 transition">
                        <div className="w-2 h-2 rounded-full border border-zinc-500"></div>
                        <div className="h-px bg-zinc-700 w-8"></div>
                        <div className="flex-1 bg-zinc-900 border border-zinc-800 p-3 rounded text-xs text-zinc-300 font-mono">
                          <span className="text-green-500 mr-2">[{choice.logic_hint}]</span>
                          {choice.text_cn}
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* MEMORY CORE TAB */
            <div className="space-y-6 animate-fade-in">
              
              {/* God Mode Tools */}
              <div className="bg-zinc-900/50 border border-zinc-700 p-4 rounded-lg">
                <h3 className="text-xs font-bold text-pink-500 uppercase tracking-widest mb-3">上帝模式：全局重写</h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="查找..." 
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-white flex-1"
                  />
                  <input 
                    type="text" 
                    placeholder="替换为..." 
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    className="bg-black border border-zinc-700 rounded px-2 py-1 text-xs text-white flex-1"
                  />
                  <button 
                    onClick={handleGlobalReplace}
                    className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-1 rounded text-xs font-bold"
                  >
                    执行
                  </button>
                </div>
              </div>

               {/* Director Mode: Scheduled Events */}
               <div className="bg-zinc-900 border-l-4 border-orange-600 rounded-r shadow-lg">
                 <div className="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                        <span>🎬</span> 导演手记 / 预设事件队列 (Scheduled Events)
                    </span>
                 </div>
                 <div className="p-4">
                    <div className="text-[9px] text-orange-400/60 mb-2 italic">
                       * AI会自动尝试将队列中的事件自然融入接下来的剧情中。事件发生后会自动移除。
                    </div>
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        value={newEvent}
                        onChange={(e) => setNewEvent(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addScheduledEvent()}
                        placeholder="添加伏笔或预定事件 (如：下一章必须遇到反派)..."
                        className="flex-1 bg-black/50 border border-zinc-800 text-zinc-300 text-xs p-2 rounded focus:border-orange-500 outline-none placeholder-zinc-600"
                      />
                      <button 
                        onClick={addScheduledEvent}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                      >
                        添加
                      </button>
                    </div>
                    
                    {(!localMemory.scheduledEvents || localMemory.scheduledEvents.length === 0) && (
                      <p className="text-[10px] text-zinc-600 italic">当前无预设事件，AI将自由发挥。</p>
                    )}

                    <ul className="space-y-2">
                      {(localMemory.scheduledEvents || []).map((event, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-zinc-950/50 border border-zinc-800 p-2 rounded text-xs text-zinc-300 group hover:border-orange-500/50 transition-colors">
                           <span><span className="text-orange-500 mr-2 font-mono">#{idx + 1}</span> {event}</span>
                           <button onClick={() => removeScheduledEvent(idx)} className="text-zinc-600 hover:text-red-500 px-2">
                             ✕
                           </button>
                        </li>
                      ))}
                    </ul>
                 </div>
              </div>

              {/* Context Window (Active) */}
              <MemorySection 
                type="context"
                title="当前情境 (Context Window)"
                value={localMemory.contextWindow}
                onChange={(v) => handleMemoryChange('contextWindow', v)}
                rows={4}
              />
              
              {/* Episode Summary (Narrative) */}
              <MemorySection 
                type="summary"
                title="剧情摘要 (Episode Summary)"
                value={localMemory.episodeSummary}
                onChange={(v) => handleMemoryChange('episodeSummary', v)}
                rows={3}
              />

              {/* Long Term Memory (Archive) */}
              <MemorySection 
                type="longterm"
                title="长期记忆 (Archive)"
                value={localMemory.longTermMemory}
                onChange={(v) => handleMemoryChange('longTermMemory', v)}
                rows={4}
              />

              {/* Core Memory (Immutable) */}
              <MemorySection 
                type="core"
                title="核心记忆 (Immutable Facts)"
                value={localMemory.coreMemory}
                onChange={(v) => handleMemoryChange('coreMemory', v)}
                rows={4}
              />

              {/* Relationships */}
              <MemorySection 
                type="relationships"
                title="人物关系 (Relationships)"
                value={localMemory.relationships}
                onChange={(v) => handleMemoryChange('relationships', v)}
                rows={3}
              />

              {/* Inventory (Array) */}
              <div className="bg-zinc-900 border-l-4 border-yellow-600 rounded-r shadow-lg">
                 <div className="bg-zinc-800/50 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                        <span>🎒</span> 物品清单 (Inventory)
                    </span>
                 </div>
                 <div className="p-4">
                    <textarea 
                      value={localMemory.inventory.join(', ')}
                      onChange={(e) => handleMemoryChange('inventory', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full bg-black/50 border border-zinc-800 text-zinc-300 text-xs font-mono p-3 rounded focus:border-yellow-500 outline-none"
                      rows={2}
                    />
                    <div className="text-[9px] text-zinc-600 mt-1">* 多个物品请用逗号分隔</div>
                 </div>
              </div>

            </div>
          )}

        </div>
      </div>
      
      {/* Footer Status */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-[10px] text-zinc-600 font-mono flex justify-between shrink-0">
        <span>节点ID: {node.id || 'GEN_NODE_001'}</span>
        <span>记忆体大小: {JSON.stringify(localMemory).length} bytes</span>
      </div>
    </div>
  );
};

// Helper component for memory sections with enhanced visualization
const MemorySection: React.FC<{
  type: 'context' | 'summary' | 'longterm' | 'core' | 'relationships';
  title: string;
  value: string;
  onChange: (val: string) => void;
  rows: number;
}> = ({ type, title, value, onChange, rows }) => {
  
  const styles = {
    context: {
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-950/20',
      textColor: 'text-blue-200',
      titleColor: 'text-blue-400',
      font: 'font-mono text-xs',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
      ), // Brain
      desc: "短期活跃记忆 (Short-term)"
    },
    summary: {
      borderColor: 'border-emerald-500',
      bgColor: 'bg-emerald-950/20',
      textColor: 'text-emerald-100',
      titleColor: 'text-emerald-400',
      font: 'font-serif italic text-sm tracking-wide',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
      ), // Book
      desc: "当前章节摘要 (Episode)"
    },
    longterm: {
      borderColor: 'border-purple-500',
      bgColor: 'bg-purple-950/20',
      textColor: 'text-purple-200',
      titleColor: 'text-purple-400',
      font: 'font-sans text-xs',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
      ), // Archive
      desc: "长期归档 (Long-term)"
    },
    core: {
      borderColor: 'border-red-600',
      bgColor: 'bg-red-950/20',
      textColor: 'text-red-100',
      titleColor: 'text-red-500',
      font: 'font-sans font-bold text-xs',
      icon: (
         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
      ), // Lock/Core
      desc: "核心事实 (Immutable)"
    },
    relationships: {
      borderColor: 'border-pink-500',
      bgColor: 'bg-pink-950/20',
      textColor: 'text-pink-200',
      titleColor: 'text-pink-400',
      font: 'font-sans text-xs',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
      ), // Heart
      desc: "人物关系网 (Social)"
    }
  };

  const style = styles[type];

  return (
    <div className={`group border-l-4 rounded-r-lg shadow-lg overflow-hidden transition-all duration-300 ${style.borderColor} ${style.bgColor}`}>
       <div className={`px-4 py-2 border-b border-white/5 flex justify-between items-center bg-black/20`}>
          <div className="flex items-center gap-2">
             <span className={`${style.titleColor}`}>{style.icon}</span>
             <span className={`text-[10px] font-bold uppercase tracking-wider ${style.titleColor}`}>{title}</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono hidden group-hover:inline-block">{style.desc}</span>
       </div>
       <div className="p-0">
          <textarea 
             value={value}
             onChange={(e) => onChange(e.target.value)}
             className={`w-full bg-transparent p-4 border-none outline-none resize-none placeholder-white/20 ${style.textColor} ${style.font}`}
             rows={rows}
             spellCheck={false}
          />
       </div>
       <div className="h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent w-full"></div>
    </div>
  );
};
