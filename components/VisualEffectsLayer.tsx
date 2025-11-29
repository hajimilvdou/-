
import React from 'react';
import { VisualEffect } from '../types';

interface VisualEffectsLayerProps {
  effect: VisualEffect;
}

export const VisualEffectsLayer: React.FC<VisualEffectsLayerProps> = ({ effect }) => {
  if (effect === VisualEffect.NONE) return null;

  const getEffectContent = () => {
    switch (effect) {
      case VisualEffect.RAIN:
        return (
          <div className="absolute inset-0 pointer-events-none z-30 opacity-50 mix-blend-screen overflow-hidden">
             {/* Simple CSS Rain simulation using gradients or repeating background */}
             <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/zadvorsky/rainyday.js/master/img/water-drops.jpg')] bg-cover opacity-20 animate-pulse"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/20 to-transparent"></div>
          </div>
        );
      case VisualEffect.SNOW:
        return (
          <div className="absolute inset-0 pointer-events-none z-30">
            {/* We could add actual falling particles here, using a simple repeating pattern for now */}
             <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50 animate-pan-left"></div>
          </div>
        );
      case VisualEffect.GLITCH:
        return (
          <div className="absolute inset-0 pointer-events-none z-30 mix-blend-exclusion glitch-effect bg-transparent border-4 border-red-500/20"></div>
        );
      case VisualEffect.FLASH:
        return (
          <div className="absolute inset-0 pointer-events-none z-50 bg-white animate-[fadeOut_1s_ease-out_forwards]"></div>
        );
      case VisualEffect.DARKNESS:
        return (
          <div className="absolute inset-0 pointer-events-none z-30 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-90"></div>
        );
      case VisualEffect.HEALING:
        return (
          <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-t from-green-500/20 to-transparent animate-pulse"></div>
        );
       case VisualEffect.THUNDER:
        return (
          <div className="absolute inset-0 pointer-events-none z-40 bg-white opacity-0 animate-[ping_0.2s_ease-in-out_2]"></div>
        );
       case VisualEffect.EMBERS:
        return (
           <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-t from-orange-600/30 to-transparent mix-blend-screen">
             <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 animate-pan-right"></div>
           </div>
        );
      case VisualEffect.FOG:
        return (
           <div className="absolute inset-0 pointer-events-none z-30 bg-gray-300/10 backdrop-blur-sm animate-pulse"></div>
        );
      default:
        return null;
    }
  };

  return (
    <>
       <style>{`
         @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
       `}</style>
       {getEffectContent()}
    </>
  );
};
