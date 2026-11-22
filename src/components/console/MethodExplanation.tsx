import React, { useState } from 'react';
import { EditingMethodId } from '../../types';
import { METHOD_CONFIGS } from '../../engine/simulationEngine';
import { MathFormula } from '../common/MathFormula';
import { sound } from '../../engine/audioSynthesizer';
import { BookOpen, Sparkles, AlertCircle, CheckCircle2, Cpu, ChevronDown, ChevronUp } from 'lucide-react';

interface MethodExplanationProps {
  methodId: EditingMethodId;
}

export const MethodExplanation: React.FC<MethodExplanationProps> = ({ methodId }) => {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const cfg = METHOD_CONFIGS[methodId];

  return (
    <div className="flex flex-col gap-4 p-4 text-slate-800 dark:text-slate-200 transition-colors">
      {/* Title & Citation Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{cfg.name}</h2>
          {/* Beginner / Advanced Toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-xs">
            <button
              onClick={() => {
                sound.playTick(550);
                setIsAdvanced(false);
              }}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                !isAdvanced
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Essential
            </button>
            <button
              onClick={() => {
                sound.playTick(600);
                setIsAdvanced(true);
              }}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                isAdvanced
                  ? 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Advanced
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{cfg.tagline}</p>
        <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 mt-1 font-medium">
          {cfg.academicCitation}
        </div>
      </div>

      {/* Mathematical Formulations (Rendered with KaTeX) */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm">
        <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold block mb-1.5">
          Mathematical Formulation
        </span>
        <div className="flex flex-col gap-3">
          {cfg.equations.map((eq, i) => (
            <div
              key={i}
              className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-slate-100"
            >
              <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 font-semibold block mb-1">
                {eq.title}
              </span>
              <div className="bg-white dark:bg-slate-900/90 p-2 rounded border border-slate-200 dark:border-slate-800 my-1 text-slate-900 dark:text-slate-100 shadow-xs">
                <MathFormula latex={eq.latex} displayMode={true} />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {eq.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Internal Architectural Mechanics */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm">
        <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 mb-2">
          <Cpu className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          What Changes Inside The Model
        </span>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {cfg.internalMechanics}
        </p>

        {isAdvanced && (
          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-900 dark:text-slate-300 font-medium">Qwen Architecture Specifics: </strong>
            {cfg.qwenRelevance}
          </div>
        )}
      </div>

      {/* Key Insights vs Risks & Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Key Insights */}
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
          <span className="text-[11px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Expected Benefits
          </span>
          <ul className="flex flex-col gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
            {cfg.keyInsights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                <span className="text-emerald-500 font-bold">·</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks & Side Effects */}
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
          <span className="text-[11px] font-mono uppercase text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Risks & Side Effects
          </span>
          <ul className="flex flex-col gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
            {cfg.risksAndTradeoffs.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                <span className="text-amber-500 font-bold">·</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
