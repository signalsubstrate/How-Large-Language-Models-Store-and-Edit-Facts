import React, { useState } from 'react';
import { EditingMethodId, SubmoduleType } from '../../types';
import { calculateFrobeniusNorm, MINI_QWEN_SPEC } from '../../engine/modelArchitecture';
import { sound } from '../../engine/audioSynthesizer';
import { Sliders, RefreshCw, ZoomIn, Info } from 'lucide-react';

interface MatrixView2DProps {
  originalMatrix: number[][];
  currentMatrix: number[][];
  submodule: SubmoduleType;
  layerIndex: number;
  selectedCoord: { row: number; col: number } | null;
  onSelectCoord: (coord: { row: number; col: number }) => void;
  onDirectEditValueChange: (newValue: number) => void;
  editingMethod: EditingMethodId;
  theme?: 'dark' | 'light';
  onSelectLayer?: (layerIndex: number) => void;
  onSelectSubmodule?: (sub: SubmoduleType) => void;
  editedLayers?: number[];
}

type DisplayMode = 'difference' | 'current' | 'original';

export const MatrixView2D: React.FC<MatrixView2DProps> = ({
  originalMatrix,
  currentMatrix,
  submodule,
  layerIndex,
  selectedCoord,
  onSelectCoord,
  onDirectEditValueChange,
  editingMethod,
  theme = 'dark',
  onSelectLayer,
  onSelectSubmodule,
  editedLayers = [],
}) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('difference');
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
    orig: number;
    curr: number;
    diff: number;
  } | null>(null);

  const rows = originalMatrix.length;
  const cols = originalMatrix[0]?.length || 0;
  const frobNorm = calculateFrobeniusNorm(originalMatrix, currentMatrix);
  const isDark = theme === 'dark';

  // Compute color for a matrix cell based on display mode
  const getCellBg = (orig: number, curr: number) => {
    if (displayMode === 'original') {
      const val = orig;
      const intensity = Math.min(1, Math.abs(val) / 0.6);
      return val >= 0
        ? isDark
          ? `rgba(6, 182, 212, ${0.15 + intensity * 0.7})`
          : `rgba(8, 145, 178, ${0.15 + intensity * 0.6})`
        : isDark
        ? `rgba(99, 102, 241, ${0.15 + intensity * 0.7})`
        : `rgba(79, 70, 229, ${0.15 + intensity * 0.6})`;
    }

    if (displayMode === 'current') {
      const val = curr;
      const intensity = Math.min(1, Math.abs(val) / 0.6);
      return val >= 0
        ? isDark
          ? `rgba(6, 182, 212, ${0.15 + intensity * 0.7})`
          : `rgba(8, 145, 178, ${0.15 + intensity * 0.6})`
        : isDark
        ? `rgba(99, 102, 241, ${0.15 + intensity * 0.7})`
        : `rgba(79, 70, 229, ${0.15 + intensity * 0.6})`;
    }

    // Difference mode (Delta W = W' - W)
    const diff = curr - orig;
    if (Math.abs(diff) < 0.0001) {
      return isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.6)';
    }
    const intensity = Math.min(1, Math.abs(diff) / 0.8);
    return diff > 0
      ? isDark
        ? `rgba(245, 158, 11, ${0.25 + intensity * 0.75})`
        : `rgba(217, 119, 6, ${0.25 + intensity * 0.65})`
      : isDark
      ? `rgba(14, 165, 233, ${0.25 + intensity * 0.75})`
      : `rgba(2, 132, 199, ${0.25 + intensity * 0.65})`;
  };

  const activeRow = selectedCoord?.row ?? 4;
  const activeCol = selectedCoord?.col ?? 6;
  const selectedOrig = originalMatrix[activeRow]?.[activeCol] ?? 0;
  const selectedCurr = currentMatrix[activeRow]?.[activeCol] ?? 0;
  const selectedDiff = selectedCurr - selectedOrig;

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 p-4 select-none overflow-y-auto transition-colors">
      {/* Top Header: Matrix Identification & Quick Layer/Submodule Navigation */}
      <div className="flex flex-col gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold text-cyan-600 dark:text-cyan-400">
                2D Parameter Matrix Inspection
              </span>
              <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">·</span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                Layer {layerIndex} · {submodule.toUpperCase()} [{rows}×{cols}]
              </span>
            </div>
          </div>

          {/* Display Mode Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
            <button
              onClick={() => {
                sound.playTick(600);
                setDisplayMode('difference');
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                displayMode === 'difference'
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ΔW (Difference)
            </button>
            <button
              onClick={() => {
                sound.playTick(620);
                setDisplayMode('current');
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                displayMode === 'current'
                  ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              W' (Modified)
            </button>
            <button
              onClick={() => {
                sound.playTick(640);
                setDisplayMode('original');
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                displayMode === 'original'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              W (Original)
            </button>
          </div>
        </div>

        {/* Quick Layer & Submodule Navigator */}
        {onSelectLayer && onSelectSubmodule && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs font-mono">
            {/* Layer Tabs */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 uppercase mr-1">Layer:</span>
              {MINI_QWEN_SPEC.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    sound.playTick(650 + l.id * 40);
                    onSelectLayer(l.id);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    layerIndex === l.id
                      ? 'bg-violet-600 text-white font-bold shadow-xs'
                      : editedLayers.includes(l.id)
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  L{l.id}
                </button>
              ))}
            </div>

            {/* Submodule Tabs */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 uppercase mr-1">Submodule:</span>
              <button
                onClick={() => {
                  sound.playTick(720);
                  onSelectSubmodule('mlp_down');
                }}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  submodule === 'mlp_down'
                    ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="SwiGLU Down-Projection Matrix (Key-Value associative store)"
              >
                W_down
              </button>
              <button
                onClick={() => {
                  sound.playTick(740);
                  onSelectSubmodule('mlp_gate');
                }}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  submodule === 'mlp_gate'
                    ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                W_gate
              </button>
              <button
                onClick={() => {
                  sound.playTick(760);
                  onSelectSubmodule('mlp_up');
                }}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  submodule === 'mlp_up'
                    ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                W_up
              </button>
              <button
                onClick={() => {
                  sound.playTick(780);
                  onSelectSubmodule('attn_qkv');
                }}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  submodule === 'attn_qkv'
                    ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                W_qkv
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid Viewport and Selected Cell Inspector */}
      <div className="flex-1 flex flex-col lg:flex-row items-start gap-4 py-3">
        {/* The 2D Heatmap Grid */}
        <div className="flex-1 w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3 overflow-x-auto shadow-sm">
          <div className="flex items-center justify-between mb-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span>
              Rows: Hidden Dim [0..{rows - 1}] ↓ | Columns: Projection Channels [0..{cols - 1}] →
            </span>
            <span className="text-cyan-600 dark:text-cyan-400">
              Frobenius Norm ||ΔW||_F:{' '}
              <strong className="font-semibold">{frobNorm.toFixed(4)}</strong>
            </span>
          </div>

          <div
            className="grid gap-[2px] w-fit mx-auto p-1 bg-slate-100 dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-800/80 shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(28px, 1fr))`,
            }}
          >
            {originalMatrix.map((rowArr, r) =>
              rowArr.map((origVal, c) => {
                const currVal = currentMatrix[r]?.[c] ?? origVal;
                const diff = currVal - origVal;
                const isSelected = selectedCoord?.row === r && selectedCoord?.col === c;
                const cellBg = getCellBg(origVal, currVal);

                let cellDisplay = '';
                if (displayMode === 'difference') {
                  cellDisplay = Math.abs(diff) > 0.001 ? (diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)) : '·';
                } else if (displayMode === 'current') {
                  cellDisplay = currVal.toFixed(2);
                } else {
                  cellDisplay = origVal.toFixed(2);
                }

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => {
                      sound.playTick(750);
                      onSelectCoord({ row: r, col: c });
                    }}
                    onMouseEnter={() => {
                      sound.playTick(950);
                      setHoveredCell({
                        row: r,
                        col: c,
                        orig: origVal,
                        curr: currVal,
                        diff,
                      });
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{ backgroundColor: cellBg }}
                    className={`h-7 min-w-[28px] text-[10px] font-mono flex items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-violet-500 z-10 font-bold text-slate-950 dark:text-white shadow-md'
                        : 'hover:ring-1 hover:ring-slate-400 dark:hover:ring-white/60 text-slate-800 dark:text-slate-200'
                    }`}
                    title={`Coordinate [${r}, ${c}]\nOrig: ${origVal.toFixed(4)}\nCurr: ${currVal.toFixed(4)}\nDiff: ${diff.toFixed(4)}`}
                  >
                    {cellDisplay}
                  </button>
                );
              })
            )}
          </div>

          {/* Color Heatmap Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/60 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                <span>+ Positive ΔW</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-sky-500 inline-block" />
                <span>- Negative ΔW</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-800 inline-block" />
                <span>Zero change</span>
              </span>
            </div>
            <span className="text-slate-500">Click any cell to target parameter</span>
          </div>
        </div>

        {/* Selected Parameter Inspector Card */}
        <div className="w-full lg:w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-mono uppercase font-semibold text-violet-700 dark:text-violet-300">
              Cell Inspector [{activeRow}, {activeCol}]
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Layer {layerIndex}
            </span>
          </div>

          {/* Values Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">W (Orig)</span>
              <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                {selectedOrig.toFixed(4)}
              </span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">W' (Curr)</span>
              <span className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-300">
                {selectedCurr.toFixed(4)}
              </span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">ΔW (Diff)</span>
              <span
                className={`text-xs font-mono font-semibold ${
                  Math.abs(selectedDiff) > 0.001
                    ? selectedDiff > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-400'
                }`}
              >
                {selectedDiff > 0 ? `+${selectedDiff.toFixed(4)}` : selectedDiff.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Direct Coordinate Editing Controls */}
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Direct Coordinate Value:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{selectedCurr.toFixed(3)}</span>
            </label>
            <input
              type="range"
              min={-2.0}
              max={2.0}
              step={0.05}
              value={selectedCurr}
              onChange={(e) => {
                onDirectEditValueChange(parseFloat(e.target.value));
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => onDirectEditValueChange(selectedOrig + 0.1)}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                +0.10 (Minor)
              </button>
              <button
                onClick={() => onDirectEditValueChange(selectedOrig + 0.5)}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                +0.50 (Moderate)
              </button>
              <button
                onClick={() => onDirectEditValueChange(selectedOrig + 1.2)}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                +1.20 (Large)
              </button>
              <button
                onClick={() => onDirectEditValueChange(selectedOrig)}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Reset to original value"
              >
                Reset (W)
              </button>
            </div>
          </div>

          {/* Insight Callout */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Scientific Note:</span> In Qwen SwiGLU, cell [{activeRow}, {activeCol}] links intermediate key feature #{activeRow} to hidden output vector #{activeCol}. Single-weight edits alter only one channel of the associative memory.
          </div>
        </div>
      </div>
    </div>
  );
};
