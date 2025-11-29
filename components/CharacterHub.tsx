
import React, { useEffect, useState } from 'react';
import { Character } from '../types';
import { generateImageUrl } from '../services/modelRegistry';
import { GameSettings } from '../types';

// We need access to settings to know which provider to use. 
// Ideally passed via props or context. Since App.tsx has settings, we can't easily access global settings here without prop drilling.
// However, geminiService has 'currentSettings'. But modelRegistry is stateless.
// Let's modify CharacterHub to fetch the settings or assume a default? 
// Actually, App.tsx doesn't pass settings to CharacterHub in the current code.
// We should update CharacterHub to accept settings or use the `updateRuntimeSettings` exported settings?
// But `geminiService` exports `currentSettings`? No, it's local.
// Let's assume for now we use Pollinations as a fallback if settings are missing, 
// OR better: Update CharacterHub usage in GameScreen to pass down settings.
// I will update GameScreen first to pass settings to CharacterHub.

interface CharacterHubProps {
  characters: Character[];
  isOpen: boolean;
  onClose: () => void;
  // New prop to access image config
  imageConfig?: any; 
}

const CharacterCard: React.FC<{ char: Character, imageConfig?: any }> = ({ char, imageConfig }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchAvatar = async () => {
      setLoading(true);
      try {
        // If we have specific image config, use it. Otherwise default to pollinations.
        // We construct a config object on the fly if not provided.
        const config = imageConfig || { provider: 'pollinations' };
        
        const prompt = `portrait of ${char.name}, ${char.description}, ${char.archetype} archetype, anime style, highly detailed, 8k`;
        const url = await generateImageUrl(
          config,
          prompt,
          512,
          512,
          char.avatarSeed
        );
        
        if (active) {
          setImageUrl(url);
          setLoading(false);
        }
      } catch (e) {
        console.error("Avatar load failed", e);
        if (active) setLoading(false);
      }
    };

    fetchAvatar();
    return () => { active = false; };
  }, [char, imageConfig]);

  return (
    <div className="relative bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800/50 group hover:border-zinc-600 transition-all">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
      <div className="p-5 flex gap-5">
          <div className="shrink-0 relative">
            <div className="w-24 h-24 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800 shadow-inner group-hover:scale-105 transition-transform duration-500">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                   <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <img 
                  src={imageUrl} 
                  alt={char.name}
                  loading="lazy"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-indigo-900 text-indigo-200 text-[9px] px-2 py-0.5 rounded border border-indigo-700 shadow uppercase tracking-wider font-bold z-10">
              {char.archetype}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-zinc-100 font-serif truncate">{char.name}</h3>
                <span className={`text-xs font-mono font-bold ${char.affection > 75 ? 'text-pink-500' : char.affection > 50 ? 'text-purple-400' : 'text-zinc-500'}`}>
                  {char.affection}%
                </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-3 italic">
              "{char.description}"
            </p>
            <div className="mt-3 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-1000 ease-out"
                style={{ width: `${char.affection}%` }}
              ></div>
            </div>
          </div>
      </div>
    </div>
  );
};

export const CharacterHub: React.FC<CharacterHubProps> = ({ characters, isOpen, onClose, imageConfig }) => {
  const uniqueCharacters = Array.from(new Map(characters.map(c => [c.name, c])).values());

  return (
    <div 
      className={`fixed inset-0 z-[110] transition-opacity duration-300 pointer-events-none ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        className={`absolute inset-y-0 left-0 w-full md:w-[480px] bg-black/95 backdrop-blur-xl border-r border-zinc-800 shadow-2xl transform transition-transform duration-500 pointer-events-auto p-6 overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
          <div>
             <h2 className="text-xl font-bold text-white tracking-widest uppercase font-serif">人物档案</h2>
             <span className="text-[10px] text-pink-500 uppercase tracking-[0.2em]">Visual Interface: Active</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        {uniqueCharacters.length === 0 ? (
          <div className="text-zinc-500 text-center italic mt-20">暂无角色数据录入</div>
        ) : (
          <div className="space-y-8">
            {uniqueCharacters.map((char) => (
              <CharacterCard key={char.id || char.name} char={char} imageConfig={imageConfig} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
