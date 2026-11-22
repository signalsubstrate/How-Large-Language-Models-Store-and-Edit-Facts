import React, { useRef } from 'react';
import { EditingMethodId } from '../../types';
import { METHOD_CONFIGS } from '../../engine/simulationEngine';
import { sound } from '../../engine/audioSynthesizer';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MethodSelectorProps {
  selectedMethod: EditingMethodId;
  onSelectMethod: (method: EditingMethodId) => void;
}

export const MethodSelector: React.FC<MethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const methodKeys: EditingMethodId[] = [
    'direct',
    'scaling',
    'interpolation',
    'rome',
    'memit',
    'knowledge_neurons',
    'gradient',
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      sound.playTick(500);
    }
  };

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2.5 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
          Model Editing Method ({methodKeys.length})
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
            {METHOD_CONFIGS[selectedMethod].category}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/50 transition-colors cursor-pointer"
              title="Scroll tabs left"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/50 transition-colors cursor-pointer"
              title="Scroll tabs right"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Horizontal Scroll / Segmented Control */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {methodKeys.map((key) => {
          const cfg = METHOD_CONFIGS[key];
          const isSelected = selectedMethod === key;

          return (
            <button
              key={key}
              onClick={(e) => {
                sound.playTick(600);
                onSelectMethod(key);
                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }}
              className={`px-3 py-1.5 rounded text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 shadow-xs'
              }`}
            >
              <span>{cfg.shortName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
