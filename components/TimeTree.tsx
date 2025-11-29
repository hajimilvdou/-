
import React, { useRef, useEffect, useState } from 'react';
import { NodeTree, StoryNode, GameSettings } from '../types';

interface TimeTreeProps {
  tree: NodeTree;
  isOpen: boolean;
  onClose: () => void;
  onTimeTravel: (nodeId: string) => void;
  onSave: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
}

interface VisualNode {
  id: string;
  x: number;
  y: number;
  data: StoryNode;
  children: string[];
}

export const TimeTree: React.FC<TimeTreeProps> = ({ tree, isOpen, onClose, onTimeTravel, onSave, settings, onUpdateSettings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // World Editor State
  const [showWorldEditor, setShowWorldEditor] = useState(false);
  const [tempSettings, setTempSettings] = useState<GameSettings>(settings);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Update temp settings when prop changes (if not editing)
  useEffect(() => {
    if (!showWorldEditor) {
      setTempSettings(settings);
    }
  }, [settings, showWorldEditor]);

  // --- Layout Logic (Same as before) ---
  const calculateLayout = (): { nodes: VisualNode[], maxX: number, maxY: number } => {
    const visualNodes: Record<string, VisualNode> = {};
    const levels: Record<number, string[]> = {};
    
    const assignDepth = (id: string, depth: number) => {
      if (!tree.nodes[id]) return;
      if (!levels[depth]) levels[depth] = [];
      if (!levels[depth].includes(id)) levels[depth].push(id);
      
      const node = tree.nodes[id];
      const children = Object.values(tree.nodes).filter(n => n.parentId === id).map(n => n.id);
      
      visualNodes[id] = {
        id,
        x: depth * 250,
        y: 0,
        data: node,
        children
      };

      children.forEach(childId => assignDepth(childId, depth + 1));
    };

    if (tree.rootId) {
      assignDepth(tree.rootId, 0);
    }

    let maxY = 0;
    Object.keys(levels).forEach(d => {
      const depth = parseInt(d);
      const nodesInLevel = levels[depth];
      nodesInLevel.forEach((nodeId, index) => {
        visualNodes[nodeId].y = (index - nodesInLevel.length / 2) * 150 + 300;
        maxY = Math.max(maxY, visualNodes[nodeId].y);
      });
    });

    return { nodes: Object.values(visualNodes), maxX: Object.keys(levels).length * 250, maxY };
  };

  const { nodes, maxX, maxY } = calculateLayout();

  useEffect(() => {
    if (isOpen) {
      setOffset({ x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 300 });
      setScale(0.8);
      setHoveredNodeId(null);
    }
  }, [isOpen]);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const newScale = Math.max(0.1, Math.min(3, scale - e.deltaY * 0.001));
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setHasMoved(true);
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!hasMoved) {
      onTimeTravel(nodeId);
    }
  };

  // --- World Editor Logic ---

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          // Loose validation: check if it has at least one key field or is a SaveFile
          let newSettings = { ...tempSettings };
          
          if (json.settings) {
            // It's a full save file
            newSettings = { ...newSettings, ...json.settings };
          } else if (json.storyBackground || json.characterInfo) {
            // It's a partial settings file
            newSettings = { ...newSettings, ...json };
          } else {
             alert("无法识别的 JSON 格式。请确保包含 storyBackground 或 characterInfo 等字段。");
             return;
          }
          setTempSettings(newSettings);
          alert("世界观配置已导入！请点击保存以应用。");
        } catch (err) {
          alert("JSON 解析失败。");
        }
      };
      reader.readAsText(file);
    } else {
      alert("请拖拽 .json 文件。");
    }
  };

  const saveSettings = () => {
    onUpdateSettings(tempSettings);
    setShowWorldEditor(false);
    alert("世界观已更新。后续生成的剧情将应用新的设定。");
  };

  const exportWorldSettings = () => {
     const blob = new Blob([JSON.stringify(tempSettings, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `world_settings_${Date.now()}.json`;
     a.click();
     URL.revokeObjectURL(url);
  };

  return (
    <div 
      className={`fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl transition-opacity duration-300 overflow-hidden font-sans ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-10">
         <div className="pointer-events-auto flex flex-col gap-2">
            <div>
              <h1 className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-bold uppercase tracking-widest font-serif">时空回廊</h1>
              <p className="text-[10px] text-cyan-700 tracking-[1em] uppercase mt-1">Space-Time Corridor</p>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={onSave} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-4 py-2 rounded text-xs uppercase tracking-wider transition">
                 导出完整存档 (Export Save)
              </button>
              <button 
                onClick={() => setShowWorldEditor(true)} 
                className="bg-indigo-900/50 hover:bg-indigo-800/80 border border-indigo-500/50 text-indigo-200 px-4 py-2 rounded text-xs uppercase tracking-wider transition flex items-center gap-2"
              >
                 <span>🌍</span> 世界观管理 (World Manager)
              </button>
            </div>
         </div>
         <button onClick={onClose} className="pointer-events-auto text-zinc-500 hover:text-white p-2 border border-zinc-800 rounded-full hover:bg-zinc-800 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
         </button>
      </div>

      <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
        <div className="text-[10px] text-zinc-600 font-mono">
           NODES: {Object.keys(tree.nodes).length} | BRANCHES: ACTIVE | SCALE: {scale.toFixed(2)}x
        </div>
        <div className="text-[10px] text-zinc-600 font-mono mt-1">
           World Setting: {settings.settingType === 'east' ? 'East/JP' : 'West/FR'} | {settings.narrativeStructure}
        </div>
      </div>

      {/* World Editor Modal Overlay */}
      {showWorldEditor && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur flex justify-center items-center p-6">
           <div 
             className={`w-full max-w-2xl bg-zinc-900 border-2 ${isDraggingFile ? 'border-dashed border-green-500 bg-zinc-900/90' : 'border-zinc-700'} rounded-xl shadow-2xl flex flex-col max-h-full overflow-hidden transition-colors duration-300`}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
           >
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                 <div>
                   <h3 className="text-white font-bold uppercase tracking-wider">🌍 世界观配置编辑器</h3>
                   <p className="text-[10px] text-zinc-500">拖拽 .json 文件到此处可直接导入配置</p>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={exportWorldSettings} className="text-xs text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1 rounded">导出配置</button>
                   <button onClick={() => setShowWorldEditor(false)} className="text-zinc-500 hover:text-white px-2">✕</button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {isDraggingFile ? (
                    <div className="flex items-center justify-center h-48 border-2 border-dashed border-zinc-600 rounded-lg bg-zinc-800/50">
                       <p className="text-green-400 font-bold text-lg animate-pulse">释放文件以导入 (Drop JSON here)</p>
                    </div>
                 ) : (
                    <>
                       <div>
                         <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">世界观背景 (Story Background)</label>
                         <textarea 
                           className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-sm text-zinc-300 focus:border-indigo-500 outline-none h-24"
                           value={tempSettings.storyBackground}
                           onChange={(e) => setTempSettings(prev => ({ ...prev, storyBackground: e.target.value }))}
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">角色信息 (Characters)</label>
                         <textarea 
                           className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-sm text-zinc-300 focus:border-pink-500 outline-none h-24"
                           value={tempSettings.characterInfo}
                           onChange={(e) => setTempSettings(prev => ({ ...prev, characterInfo: e.target.value }))}
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-zinc-400 mb-1 uppercase">关键剧情点 (Key Plot Points)</label>
                         <textarea 
                           className="w-full bg-black/50 border border-zinc-700 rounded p-3 text-sm text-zinc-300 focus:border-cyan-500 outline-none h-24"
                           value={tempSettings.keyPlotPoints}
                           onChange={(e) => setTempSettings(prev => ({ ...prev, keyPlotPoints: e.target.value }))}
                         />
                       </div>
                    </>
                 )}
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3">
                 <button 
                   onClick={() => setShowWorldEditor(false)}
                   className="px-4 py-2 rounded text-zinc-400 hover:text-white text-xs uppercase font-bold"
                 >
                   取消 (Cancel)
                 </button>
                 <button 
                   onClick={saveSettings}
                   className="px-6 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase font-bold tracking-widest shadow-lg"
                 >
                   保存并应用 (Save & Apply)
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Hover Preview Panel */}
      <div className={`absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 transition-all duration-300 ${hoveredNodeId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
         {hoveredNodeId && tree.nodes[hoveredNodeId] && (
            <div className="bg-black/80 backdrop-blur-md border border-zinc-700 p-5 rounded-2xl shadow-2xl max-w-xl w-[90vw] pointer-events-none">
                <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                    <span className="text-[10px] text-cyan-400 font-mono">ID: {tree.nodes[hoveredNodeId].id.slice(0, 8)}...</span>
                    {tree.nodes[hoveredNodeId].speaker_name && (
                       <span className="text-xs font-bold bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                          {tree.nodes[hoveredNodeId].speaker_name}
                       </span>
                    )}
                </div>
                <p className="text-sm md:text-base text-zinc-200 font-serif leading-relaxed line-clamp-4">
                   {tree.nodes[hoveredNodeId].display_text_cn}
                </p>
                <div className="mt-3 pt-2 border-t border-white/5 flex gap-2 flex-wrap">
                   {tree.nodes[hoveredNodeId].choices.map((c, i) => (
                      <span key={i} className="text-[10px] text-zinc-500 border border-zinc-800 px-2 py-1 rounded bg-zinc-900/50">
                        ↪ {c.text_cn.slice(0, 10)}...
                      </span>
                   ))}
                </div>
                <div className="mt-3 text-[10px] text-center text-cyan-500/70 uppercase tracking-widest font-bold">
                   点击节点跳转至此时刻 (Click Node to Travel)
                </div>
            </div>
         )}
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="w-full h-full cursor-move bg-[radial-gradient(circle_at_center,#1a1a1a_1px,transparent_1px)] bg-[length:40px_40px]"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
           className="origin-top-left transition-transform duration-75 ease-linear"
           style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        >
           {/* Connections (SVG) */}
           <svg className="absolute top-0 left-0 overflow-visible" style={{ width: maxX + 500, height: maxY + 1000 }}>
              <defs>
                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              {nodes.map(node => 
                 node.children.map(childId => {
                   const childNode = nodes.find(n => n.id === childId);
                   if (!childNode) return null;
                   
                   // Curved path
                   const pathData = `M ${node.x + 200} ${node.y + 40} C ${node.x + 225} ${node.y + 40}, ${childNode.x - 25} ${childNode.y + 40}, ${childNode.x} ${childNode.y + 40}`;

                   return (
                     <path 
                       key={`${node.id}-${childId}`}
                       d={pathData}
                       stroke="url(#line-gradient)"
                       strokeWidth="2"
                       fill="none"
                       className="animate-draw"
                     />
                   );
                 })
              )}
           </svg>

           {/* Nodes (HTML) */}
           {nodes.map(node => (
             <div 
               key={node.id}
               onClick={(e) => handleNodeClick(e, node.id)}
               onMouseEnter={() => setHoveredNodeId(node.id)}
               onMouseLeave={() => setHoveredNodeId(null)}
               className={`absolute w-[200px] bg-zinc-900 border transition-all duration-300 cursor-pointer group hover:scale-110 hover:z-50 rounded-lg overflow-hidden flex flex-col shadow-lg ${
                 tree.currentId === node.id 
                   ? 'border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.4)] z-40' 
                   : 'border-zinc-800 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] opacity-80 hover:opacity-100'
               }`}
               style={{ left: node.x, top: node.y }}
             >
                <div className={`h-1 w-full ${tree.currentId === node.id ? 'bg-pink-500' : 'bg-cyan-600'}`}></div>
                <div className="p-3">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-zinc-500 font-mono">#{node.id.slice(0,4)}</span>
                      {tree.currentId === node.id && <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse"></span>}
                   </div>
                   <div className="text-xs text-zinc-300 line-clamp-2 font-serif mb-2 h-8 leading-tight">
                      {node.data.display_text_cn}
                   </div>
                   <div className="flex gap-1 flex-wrap">
                      {node.data.choices.map((c, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${tree.currentId === node.id ? 'bg-pink-500/50' : 'bg-zinc-700'}`}></div>
                      ))}
                   </div>
                </div>
                
                {/* Visual Feedback Overlay */}
                <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
             </div>
           ))}

        </div>
      </div>
    </div>
  );
};
