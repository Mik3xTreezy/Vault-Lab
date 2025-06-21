"use client"

import React, { useRef, useEffect } from 'react';
import { Player } from '@lordicon/react';
import { cn } from '@/lib/utils';

interface LordIconProps {
  src: string;
  size?: number;
  state?: string;
  colors?: string;
  colorize?: string;
  trigger?: 'hover' | 'click' | 'loop' | 'auto' | 'none';
  delay?: number;
  className?: string;
  onComplete?: () => void;
  onReady?: () => void;
}

export function LordIcon({
  src,
  size = 96,
  state,
  colors,
  colorize,
  trigger = 'auto',
  delay = 1000,
  className,
  onComplete,
  onReady,
}: LordIconProps) {
  const playerRef = useRef<Player>(null);

  useEffect(() => {
    if (trigger === 'auto') {
      const timer = setTimeout(() => {
        playerRef.current?.playFromBeginning();
      }, delay);
      return () => clearTimeout(timer);
    } else if (trigger === 'loop') {
      const interval = setInterval(() => {
        playerRef.current?.playFromBeginning();
      }, delay);
      return () => clearInterval(interval);
    }
  }, [trigger, delay]);

  const handleClick = () => {
    if (trigger === 'click') {
      playerRef.current?.playFromBeginning();
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      playerRef.current?.playFromBeginning();
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        trigger === 'click' && "cursor-pointer",
        trigger === 'hover' && "hover:scale-105 transition-transform duration-200",
        className
      )}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      style={{ width: size, height: size }}
    >
      <Player
        ref={playerRef}
        icon={src}
        size={size}
        state={state}
        colors={colors}
        colorize={colorize}
        onComplete={onComplete}
        onReady={onReady}
      />
    </div>
  );
} 