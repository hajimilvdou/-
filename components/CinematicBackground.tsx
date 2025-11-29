
import React, { useState, useEffect } from 'react';
import { CameraMovement } from '../types';
import { generateImageUrl } from '../services/modelRegistry';

interface CinematicBackgroundProps {
  keyword: string;
  movement: CameraMovement;
  isLoading: boolean;
  imageConfig?: any; // Receive Image Config
}

export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({ keyword, movement, isLoading, imageConfig }) => {
  const [currentImage, setCurrentImage] = useState('');
  const [nextImage, setNextImage] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (keyword) {
      const fetchUrl = async () => {
         const config = imageConfig || { provider: 'pollinations' };
         const url = await generateImageUrl(
             config, 
             keyword, 
             1920, 
             1080
         );
         
         if (url) {
           const img = new Image();
           img.src = url;
           img.onload = () => {
             setNextImage(url);
             setIsTransitioning(true);
           };
         }
      };
      fetchUrl();
    }
  }, [keyword, imageConfig]);

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setCurrentImage(nextImage);
        setIsTransitioning(false);
      }, 1000); // Crossfade duration
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, nextImage]);

  // Determine Animation Class
  const getAnimationClass = (mov: CameraMovement) => {
    switch (mov) {
      case CameraMovement.ZOOM_IN: return 'animate-zoom-in';
      case CameraMovement.ZOOM_OUT: return 'animate-zoom-out';
      case CameraMovement.PAN_RIGHT: return 'animate-pan-right';
      case CameraMovement.PAN_LEFT: return 'animate-pan-left';
      case CameraMovement.SHAKE: return 'animate-shake';
      case CameraMovement.DUTCH: return 'rotate-2 scale-110 transition-transform duration-[20s]'; 
      default: return '';
    }
  };

  const animClass = getAnimationClass(movement);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${animClass}`}
        style={{ backgroundImage: `url(${currentImage})`, opacity: 1 }}
      />
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${animClass}`}
        style={{ backgroundImage: `url(${nextImage})`, opacity: isTransitioning ? 1 : 0 }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-500 z-10"></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 z-20 pointer-events-none"></div>
    </div>
  );
};
