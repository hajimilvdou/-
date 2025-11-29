
import React, { useState } from 'react';
import { ScreenState, GameSettings, StoryNode, InputMode, MemoryState, NodeTree, SaveFile } from './types';
import { initializeGame, advanceStory, updateRuntimeSettings } from './services/geminiService';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';

function App() {
  const [screenState, setScreenState] = useState<ScreenState>(ScreenState.SETUP);
  const [nodeTree, setNodeTree] = useState<NodeTree>({ nodes: {}, currentId: '', rootId: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [manualMemoryOverride, setManualMemoryOverride] = useState<MemoryState | undefined>(undefined);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);

  const updateTree = (newNode: StoryNode) => {
    setNodeTree(prev => {
      const updatedNodes = { ...prev.nodes, [newNode.id]: newNode };
      // If it's the first node, set as root
      const rootId = prev.rootId || newNode.id;
      return {
        nodes: updatedNodes,
        currentId: newNode.id,
        rootId
      };
    });
  };

  const handleStartGame = async (settings: GameSettings) => {
    setIsLoading(true);
    setGameSettings(settings);
    try {
      const startNode = await initializeGame(settings);
      updateTree(startNode);
      setScreenState(ScreenState.PLAYING);
    } catch (error) {
      alert("Failed to start game. Please check configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoice = async (input: string, type: InputMode) => {
    setIsLoading(true);
    try {
      // Pass the overridden memory if it exists, otherwise the service uses internal state
      const nextNode = await advanceStory(input, type, manualMemoryOverride, nodeTree.currentId);
      updateTree(nextNode);
      // Reset override after a successful turn
      setManualMemoryOverride(undefined);
    } catch (error) {
      alert("Failed to load next scene. Check API connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMemory = (newMemory: MemoryState) => {
    setManualMemoryOverride(newMemory);
    // Also update the current node in the tree conceptually for the Inspector, 
    // although strictly this changes history.
    if (nodeTree.currentId && nodeTree.nodes[nodeTree.currentId]) {
      const updatedNode = { 
        ...nodeTree.nodes[nodeTree.currentId],
        memory_updates: newMemory
      };
      setNodeTree(prev => ({
        ...prev,
        nodes: { ...prev.nodes, [nodeTree.currentId]: updatedNode }
      }));
    }
  };

  const handleUpdateNode = (updatedNode: StoryNode) => {
      // God Mode: Direct node edit
      if (nodeTree.currentId && nodeTree.nodes[nodeTree.currentId]) {
          setNodeTree(prev => ({
              ...prev,
              nodes: { ...prev.nodes, [updatedNode.id]: updatedNode }
          }));
          // If memory was changed in the node edit, update override too
          setManualMemoryOverride(updatedNode.memory_updates);
      }
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setGameSettings(newSettings);
    // Important: Update the service instance so the next prompt uses these new settings
    updateRuntimeSettings(newSettings);
  };

  const handleTimeTravel = (nodeId: string) => {
    if (nodeTree.nodes[nodeId]) {
      setNodeTree(prev => ({
        ...prev,
        currentId: nodeId
      }));
      // Important: We should ideally reset the 'manualMemoryOverride' to undefined 
      // or set it to the memory state of that past node to ensure continuity.
      setManualMemoryOverride(nodeTree.nodes[nodeId].memory_updates);
    }
  };

  const handleSave = () => {
    if (!gameSettings) return;
    const saveFile: SaveFile = {
      version: "1.0",
      date: new Date().toISOString(),
      tree: nodeTree,
      settings: gameSettings
    };
    const blob = new Blob([JSON.stringify(saveFile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumiere_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="antialiased text-gray-900">
      {screenState === ScreenState.SETUP && (
        <SetupScreen onStart={handleStartGame} isLoading={isLoading} />
      )}
      
      {screenState === ScreenState.PLAYING && nodeTree.currentId && gameSettings && (
        <GameScreen 
          node={nodeTree.nodes[nodeTree.currentId]} 
          nodeTree={nodeTree}
          settings={gameSettings}
          onChoice={handleChoice} 
          isLoading={isLoading} 
          onUpdateMemory={handleUpdateMemory}
          onUpdateNode={handleUpdateNode}
          onUpdateSettings={handleUpdateSettings}
          onTimeTravel={handleTimeTravel}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default App;
