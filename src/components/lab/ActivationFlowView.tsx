import React from 'react';
import { EditingMethodId, KnowledgeNeuronInfo } from '../../types';
import { sound } from '../../engine/audioSynthesizer';
import { Activity, Zap, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ActivationFlowViewProps {
  editingMethod: EditingMethodId;
  selectedLayerIndex: number;
  knowledgeNeurons: KnowledgeNeuronInfo[];
  onToggleNeuronSuppression: (neuronIndex: number) => void;
  onToggleNeuronAmplification: (neuronIndex: number) => void;
  editStrength: number;
  editedLayers: number[];
  theme?: 'dark' | 'light';
}

export const ActivationFlowView: React.FC<ActivationFlowViewProps> = ({
  editingMethod,
  selectedLayerIndex,
  knowledgeNeurons,
  onToggleNeuronSuppression,
  onToggleNeuronAmplification,
  editStrength,
  editedLayers,
  theme = 'dark',
}) => {
  const promptTokens = ['What', 'is', 'the', 'capital', 'of', 'Novara', '?'];

  // Simulated activation magnitudes across layers for subject token "Novara"
  const layerActivations = [
    { layer: 0, orig: 1.12, post: 1.14, name: 'Syntax / Embedding' },
    { layer: 1, orig: 1.84, post: 1.89, name: 'Local Association' },
    { layer: 2, orig: 3.42, post: editingMethod === 'rome' || editedLayers.includes(2) ? 4.95 : 3.48, name: 'Critical Factual Hub (ROME Target)' },
    { layer: 3, orig: 2.91, post: editedLayers.includes(3) ? 4.10 : 2.95, name: 'Mid-Layer Memory' },
    { layer: 4, orig: 2.15, post: editedLayers.includes(4) ? 3.30 : 2.18, name: 'High-Level Semantics (MEMIT)' },
    { layer: 5, orig: 1.45, post: 1.48, name: 'Pre-Unembedding' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 p-4 select-none overflow-y-auto transition-colors">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono font-bold text-cyan-600 dark:text-cyan-400">
              Activation & Information Flow Telemetry
            </span>
            <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">·</span>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              Qwen SwiGLU Intermediate Circuits
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Trace how token activations propagate, how subject keys bind, and how editing methods modulate circuit throughput.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-600 dark:text-slate-400">Target Subject:</span>
          <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 rounded font-semibold">
            "Novara" (Token #5)
          </span>
        </div>
      </div>

      {/* Token Pathway Ribbon */}
      <div className="py-4 border-b border-slate-200 dark:border-slate-800/80">
        <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 block mb-2">
          Token Sequence & Causal Tracing Focus:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {promptTokens.map((tok, idx) => {
            const isSubject = tok === 'Novara';
            return (
              <div
                key={idx}
                className={`flex flex-col items-center px-3 py-1.5 rounded border transition-all ${
                  isSubject
                    ? 'bg-violet-100 dark:bg-violet-950/80 border-violet-400 dark:border-violet-500 text-violet-900 dark:text-violet-200 ring-2 ring-violet-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm'
                }`}
              >
                <span className="text-xs font-mono font-medium">{tok}</span>
                <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                  pos #{idx} {isSubject && '· [Key k*]'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Layer Residual Norms vs Knowledge Neurons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-4">
        {/* Layer Activation Norms */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Layer Activation Magnitude (||h_l||)
            </span>
            <span className="text-[10px] font-mono text-slate-500">Subject Token Vector</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {layerActivations.map((item) => {
              const isSelected = item.layer === selectedLayerIndex;
              const isEdited = editedLayers.includes(item.layer);
              const maxVal = 5.5;
              const origPct = (item.orig / maxVal) * 100;
              const postPct = (item.post / maxVal) * 100;

              return (
                <div
                  key={item.layer}
                  className={`p-2 rounded border transition-colors ${
                    isSelected
                      ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700/60'
                      : isEdited
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50'
                      : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      L{item.layer}: {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Orig: {item.orig.toFixed(2)}</span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Post: {item.post.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Dual Bar Comparison */}
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex relative">
                    {/* Baseline */}
                    <div
                      style={{ width: `${origPct}%` }}
                      className="h-full bg-slate-400 dark:bg-slate-600 rounded-full absolute top-0 left-0 opacity-40"
                    />
                    {/* Post-Edit */}
                    <div
                      style={{ width: `${postPct}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isEdited ? 'bg-amber-500' : 'bg-cyan-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-200 dark:border-slate-800">
            <strong>Causal Tracing Insight:</strong> Meng et al. (2022) demonstrated that factual recall localizes decisively in the feed-forward MLP layers at the late subject token (L2-L4). Note the elevated post-edit activation surge in edited layers.
          </div>
        </div>

        {/* Knowledge Neurons & Circuit Modulator */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Knowledge Neurons Attribution (Layer {selectedLayerIndex})
            </span>
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">SwiGLU Intermediate</span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Integrated gradients identify intermediate units with highest attribution to the factual association "Novara → Silver City". Interact below to simulate suppressing or amplifying their output:
          </p>

          <div className="flex flex-col gap-2">
            {knowledgeNeurons.map((kn) => (
              <div
                key={kn.neuronIndex}
                className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{kn.label}</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    Attr: {(kn.attributionScore * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                  <span>Activation: {kn.originalActivation.toFixed(2)}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        sound.playTick(500);
                        onToggleNeuronSuppression(kn.neuronIndex);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                        kn.isSuppressed
                          ? 'bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {kn.isSuppressed ? 'Suppressed (0.0)' : 'Suppress'}
                    </button>
                    <button
                      onClick={() => {
                        sound.playTick(800);
                        onToggleNeuronAmplification(kn.neuronIndex);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                        kn.isAmplified
                          ? 'bg-cyan-100 dark:bg-cyan-900/80 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-700'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {kn.isAmplified ? 'Amplified (2x)' : 'Amplify'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong>Key takeaway:</strong> Knowledge neurons are polysemantic. Suppressing Neuron #04 attenuates "Silver City", but also dampens related geographical and administrative terminology across the model.
          </div>
        </div>
      </div>
    </div>
  );
};
