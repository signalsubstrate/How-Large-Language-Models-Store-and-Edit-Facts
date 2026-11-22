import React, { useState } from 'react';
import { ActiveViewMode } from '../types';
import { sound } from '../engine/audioSynthesizer';
import { Sparkles, Volume2, VolumeX, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeView: ActiveViewMode;
  onSelectView: (view: ActiveViewMode) => void;
  onOpenTutorial: () => void;
  onOpenReferences: () => void;
  onOpenComparison: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  onOpenTutorial,
  onOpenReferences,
  onOpenComparison,
  theme,
  onToggleTheme,
}) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  const toggleSound = () => {
    sound.isMuted = !sound.isMuted;
    setIsMuted(sound.isMuted);
    if (!sound.isMuted) sound.playTick(880);
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 px-6 flex items-center justify-between gap-8 shrink-0 z-30 select-none transition-colors">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            sound.playTick(600);
          }}
          className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
          <span>QwenEdit Laboratory</span>
        </a>
        <span className="hidden sm:inline-block text-[11px] font-mono text-slate-500 dark:text-slate-500 border-l border-slate-200 dark:border-slate-800 pl-3">
          Interactive LLM Model Editing
        </span>
      </div>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
        <button
          onClick={() => {
            sound.playTick(650);
            onSelectView('matrix2d');
          }}
          className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'matrix2d'
              ? 'text-cyan-600 dark:text-cyan-300 font-semibold underline underline-offset-4 decoration-cyan-500'
              : ''
          }`}
        >
          2D Parameter Matrix
        </button>



        <button
          onClick={() => {
            sound.playTick(690);
            onSelectView('activations');
          }}
          className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'activations'
              ? 'text-cyan-600 dark:text-cyan-300 font-semibold underline underline-offset-4 decoration-cyan-500'
              : ''
          }`}
        >
          Activation Circuits
        </button>

        <button
          onClick={() => {
            sound.playTick(720);
            onOpenComparison();
          }}
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
        >
          Compare Methods
        </button>

        <button
          onClick={() => {
            sound.playTick(740);
            onOpenReferences();
          }}
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
        >
          Academic Literature
        </button>
      </nav>

      {/* Zone 3: 1 primary action (+ theme and audio toggles) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Light / Dark Mode Toggle */}
        <button
          onClick={() => {
            sound.playTick(750);
            onToggleTheme();
          }}
          className="p-1.5 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Audio Synthesizer Mute Toggle */}
        <button
          onClick={toggleSound}
          className="p-1.5 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          title={isMuted ? 'Unmute Audio Synthesizer' : 'Mute Audio Synthesizer'}
          aria-label={isMuted ? 'Unmute Audio Synthesizer' : 'Mute Audio Synthesizer'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
        </button>

        {/* Primary Action Button */}
        <button
          onClick={() => {
            sound.playTick(800);
            onOpenTutorial();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-white dark:text-slate-950 bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-400 dark:hover:bg-cyan-300 rounded transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Guided Tour</span>
        </button>
      </div>
    </header>
  );
};
