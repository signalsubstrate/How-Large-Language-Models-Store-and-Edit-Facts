import React, { useState } from 'react';
import { EditingMethodId, TestPrompt } from '../../types';
import { METHOD_CONFIGS, TEST_PROMPTS } from '../../engine/simulationEngine';
import { sound } from '../../engine/audioSynthesizer';
import { Play, RotateCcw, ArrowRight, GitCompare, Sparkles, AlertCircle, ChevronDown, Check } from 'lucide-react';

interface ExperimentConsoleProps {
  methodId: EditingMethodId;
  editStrength: number;
  onStrengthChange: (val: number) => void;
  editedLayers: number[];
  onReset: () => void;
  onOpenComparison: () => void;
  theme?: 'dark' | 'light';
}

export const ExperimentConsole: React.FC<ExperimentConsoleProps> = ({
  methodId,
  editStrength,
  onStrengthChange,
  editedLayers,
  onReset,
  onOpenComparison,
  theme = 'dark',
}) => {
  const [selectedPromptId, setSelectedPromptId] = useState<string>('target-direct');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const cfg = METHOD_CONFIGS[methodId];

  const activePrompt =
    TEST_PROMPTS.find((p) => p.id === selectedPromptId) || TEST_PROMPTS[0];

  const simResult = activePrompt.generateSimulatedResponse(
    methodId,
    editStrength,
    editedLayers
  );

  return (
    <div className="flex flex-col gap-4 p-4 border-t border-slate-200 dark:border-slate-800 transition-colors">
      {/* Fictional Scenario Header Box */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase text-cyan-700 dark:text-cyan-400 font-semibold tracking-wider">
            Fictional Factual Knowledge Scenario
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Isolated Benchmark Sandbox
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Original Association:</span>
            <span className="text-slate-800 dark:text-slate-300 font-medium">"The capital of Novara is Silver City."</span>
          </div>
          <div className="p-2 bg-cyan-50/60 dark:bg-slate-950 rounded border border-cyan-200 dark:border-cyan-900/40">
            <span className="text-[10px] text-cyan-700 dark:text-cyan-400 uppercase block">Target Association:</span>
            <span className="text-cyan-900 dark:text-cyan-200 font-medium">"The capital of Novara is Azure City."</span>
          </div>
        </div>
      </div>

      {/* Test Prompts Selector Dropdown */}
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between">
          <span>Evaluation Test Prompt</span>
          <span className="text-[10px] text-slate-400 font-normal">Select test probe</span>
        </label>

        {/* Dropdown trigger button */}
        <button
          type="button"
          onClick={() => {
            sound.playTick(500);
            setIsDropdownOpen(!isDropdownOpen);
          }}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left font-mono transition-all cursor-pointer shadow-xs ${
            isDropdownOpen
              ? 'bg-white dark:bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/20'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
              {activePrompt.prompt}
            </span>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-0.5">
              Target: {activePrompt.expectedTarget} &bull; <span className="uppercase text-slate-400">{activePrompt.category}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-cyan-500' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown choices list - auto-collapses on selection */}
        {isDropdownOpen && (
          <div className="flex flex-col gap-1 p-1.5 bg-white dark:bg-slate-900 border border-cyan-500/40 dark:border-cyan-500/30 rounded-lg shadow-lg">
            {TEST_PROMPTS.map((tp) => {
              const isSelected = tp.id === selectedPromptId;
              return (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => {
                    sound.playTick(680);
                    setSelectedPromptId(tp.id);
                    setIsDropdownOpen(false); // Collapses up automatically after choosing!
                  }}
                  className={`p-2 rounded-md text-left text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-500/60 text-cyan-900 dark:text-cyan-200 font-medium'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{tp.prompt}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      Expected: {tp.expectedTarget}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                      {tp.category}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Method Parameter Scrubber / Slider */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-col gap-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>{cfg.sliderLabel}:</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold tabular-nums">
              {editStrength.toFixed(2)} {cfg.sliderUnit}
            </span>
          </label>

          <button
            onClick={() => {
              sound.playTick(500);
              onStrengthChange(cfg.sliderDefault);
            }}
            className="text-[10px] font-mono text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Reset Default ({cfg.sliderDefault})
          </button>
        </div>

        <input
          type="range"
          min={cfg.sliderMin}
          max={cfg.sliderMax}
          step={cfg.sliderStep}
          value={editStrength}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onStrengthChange(v);
          }}
          className="w-full accent-cyan-500 cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>Min: {cfg.sliderMin}</span>
          <span>Nominal: {cfg.sliderDefault}</span>
          <span>Max: {cfg.sliderMax}</span>
        </div>
      </div>

      {/* Before & After Generation Inspector */}
      <div className="flex flex-col gap-2.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm">
        <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold">
          Simulated Model Response Comparison
        </span>

        {/* Before */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
            <span className="uppercase">Pre-Edit Generation (Original Weights W)</span>
            <span>Prob: 88%</span>
          </div>
          <p className="text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
            {activePrompt.simulatedOriginalResponse}
          </p>
        </div>

        {/* After */}
        <div className="p-2.5 bg-cyan-50/50 dark:bg-slate-950 rounded border border-cyan-200 dark:border-cyan-900/60">
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-700 dark:text-cyan-400 mb-1">
            <span className="uppercase font-semibold">
              Post-Edit Generation ({cfg.shortName} · W')
            </span>
            <span>Target Prob: {(simResult.targetProbability * 100).toFixed(1)}%</span>
          </div>
          <p className="text-xs font-mono text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
            {simResult.text}
          </p>

          {/* Token Probabilities Ribbon */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono">
            <span className="text-slate-500">Tokens:</span>
            {simResult.tokens.map((tok, tIdx) => (
              <span
                key={tIdx}
                className={`px-1.5 py-0.5 rounded ${
                  tok.isChanged
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-bold'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
                title={`Probability: ${(tok.prob * 100).toFixed(1)}%`}
              >
                {tok.text} ({(tok.prob * 100).toFixed(0)}%)
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Global Actions: Compare & Reset */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => {
            sound.playTick(700);
            onOpenComparison();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-xs"
        >
          <GitCompare className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Compare Methods Side-by-Side</span>
        </button>

        <button
          onClick={() => {
            sound.playTick(450);
            onReset();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Experiment</span>
        </button>
      </div>
    </div>
  );
};
