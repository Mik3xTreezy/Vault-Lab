"use client"

import React, { useRef, useEffect, useState } from 'react';
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
  const [iconData, setIconData] = useState<any>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch icon data from URL
  useEffect(() => {
    let isMounted = true;
    
    const fetchIconData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Failed to fetch icon: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setIconData(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn('Failed to load Lordicon:', error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    if (src) {
      fetchIconData();
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  // Animation triggers
  useEffect(() => {
    if (!iconData || !playerRef.current) return;

    if (trigger === 'auto') {
      const timer = setTimeout(() => {
        try {
          playerRef.current?.playFromBeginning();
        } catch (error) {
          console.warn('LordIcon animation error:', error);
        }
      }, delay);
      return () => clearTimeout(timer);
    } else if (trigger === 'loop') {
      const interval = setInterval(() => {
        try {
          playerRef.current?.playFromBeginning();
        } catch (error) {
          console.warn('LordIcon animation error:', error);
        }
      }, delay);
      return () => clearInterval(interval);
    }
  }, [trigger, delay, iconData]);

  const handleClick = () => {
    if (trigger === 'click' && playerRef.current) {
      try {
        playerRef.current.playFromBeginning();
      } catch (error) {
        console.warn('LordIcon animation error:', error);
      }
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover' && playerRef.current) {
      try {
        playerRef.current.playFromBeginning();
      } catch (error) {
        console.warn('LordIcon animation error:', error);
      }
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center bg-slate-800/50 rounded-lg animate-pulse",
          className
        )}
        style={{ width: size, height: size }}
      >
        <div className="w-3 h-3 bg-slate-600 rounded-full" />
      </div>
    );
  }

  // Show error fallback
  if (hasError || !iconData) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center bg-slate-700/50 rounded-lg border border-slate-600",
          className
        )}
        style={{ width: size, height: size }}
      >
        <div className="w-3 h-3 bg-slate-500 rounded-full" />
      </div>
    );
  }

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
        icon={iconData}
        size={size}
        state={state}
        colors={colors}
        colorize={colorize}
        onComplete={onComplete}
        onReady={() => {
          if (onReady) onReady();
        }}
      />
    </div>
  );
} 