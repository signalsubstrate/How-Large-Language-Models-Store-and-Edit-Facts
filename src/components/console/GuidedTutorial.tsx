import React, { useState } from 'react';
import { ActiveViewMode, EditingMethodId, TutorialStep } from '../../types';
import { sound } from '../../engine/audioSynthesizer';
import { Sparkles, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';

interface GuidedTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStepConfig: (
    method: EditingMethodId,
    view: ActiveViewMode,
    layer: number
  ) => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '1. Transformer Architecture & Weight Matrices',
    subtitle: 'Understanding the physical substrate of LLM factual memory',
    description:
      'Large language models like Qwen are composed of stacked transformer blocks. Each block features Multi-Head Attention (which routes information between tokens) and SwiGLU Feed-Forward Networks (which act as associative key-value memory banks). In our laboratory, inspect the parameter matrix and notice Layer 2: causal tracing reveals mid-layer MLPs store the bulk of factual relations.',
    recommendedMethod: 'direct',
    recommendedView: 'matrix2d',
    targetLayer: 2,
    actionInstruction: 'Click "Next Step" to inspect why directly tweaking single weights fails.',
  },
  {
    title: '2. Why Direct Weight Edits Cause Collateral Damage',
    subtitle: 'The polysemantic nature of neural parameters',
    description:
      'In the 2D Parameter Matrix view, parameters look like a grid of numbers. If we alter a single coordinate (W_ij + 0.35), does the model learn a new fact? No! Individual weights are polysemantic—each contributes to thousands of overlapping linguistic features. Small direct edits fail to pass threshold gates; large edits cause token repetition or gibberish.',
    recommendedMethod: 'direct',
    recommendedView: 'matrix2d',
    targetLayer: 2,
    actionInstruction: 'Notice how altering cell [4, 6] degrades generalization without cleanly teaching "Azure City".',
  },
  {
    title: '3. ROME: Rank-One Model Editing',
    subtitle: 'Treating the FFN as a Key-Value Associative Store',
    description:
      'ROME (Meng et al. 2022) solves the factual editing problem mathematically. It treats the intermediate MLP activation for the subject "Novara" as a key vector k, and the target concept "Azure City" as a value vector v_*. By computing W\' = W + uvᵀ with covariance regularization C^-1, ROME shifts thousands of parameters simultaneously in a single coordinated direction.',
    recommendedMethod: 'rome',
    recommendedView: 'matrix2d',
    targetLayer: 2,
    actionInstruction: 'Observe the 91% target success and 88% paraphrase generalization in the evaluation metrics.',
  },
  {
    title: '4. Scaling to Thousands of Edits with MEMIT',
    subtitle: 'Distributing parameter updates across consecutive layers',
    description:
      'While ROME works brilliantly for a single fact, editing 100+ facts saturates a single layer, degrading model fluency. MEMIT (ICLR 2023) solves this by distributing the required update residual across Layers 2, 3, and 4. Spreading the load preserves nominal activation norms and prevents catastrophic forgetting.',
    recommendedMethod: 'memit',
    recommendedView: 'activations',
    targetLayer: 2,
    actionInstruction: 'Switch through the distributed layers slider to see multi-layer load balancing.',
  },
  {
    title: '5. Measuring Collateral Damage & Specificity',
    subtitle: 'Ensuring reasoning and unrelated facts stay intact',
    description:
      'A true model edit must pass three critical tests: (1) Target recall ("What is the capital of Novara?"), (2) Paraphrase invariance ("Novara\'s capital is called what?"), and (3) Neighborhood specificity ("Eldoria\'s capital" must remain "Solaria", and Python code generation must not break!). Check the evaluation metrics to verify all indicators remain NOMINAL.',
    recommendedMethod: 'rome',
    recommendedView: 'matrix2d',
    targetLayer: 2,
    actionInstruction: 'You are now ready to explore! Experiment with all 7 editing methods in the laboratory.',
  },
];

export const GuidedTutorial: React.FC<GuidedTutorialProps> = ({
  isOpen,
  onClose,
  onApplyStepConfig,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIdx];
  const isLast = currentStepIdx === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    sound.playTick(700);
    if (isLast) {
      onClose();
    } else {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      const nextStep = TUTORIAL_STEPS[nextIdx];
      onApplyStepConfig(
        nextStep.recommendedMethod,
        nextStep.recommendedView,
        nextStep.targetLayer
      );
    }
  };

  const handlePrev = () => {
    sound.playTick(600);
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      const prevStep = TUTORIAL_STEPS[prevIdx];
      onApplyStepConfig(
        prevStep.recommendedMethod,
        prevStep.recommendedView,
        prevStep.targetLayer
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-slate-100">
              Interactive Guided Learning Tour
            </span>
          </div>
          <button
            onClick={() => {
              sound.playTick(450);
              onClose();
            }}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-3 text-xs">
          {/* Step Pill & Title */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-700 dark:text-cyan-400 mb-1">
              <span>
                Step {currentStepIdx + 1} of {TUTORIAL_STEPS.length}
              </span>
              <span className="text-slate-500 uppercase">
                {currentStep.recommendedMethod.toUpperCase()} · {currentStep.recommendedView}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {currentStep.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{currentStep.subtitle}</p>
          </div>

          {/* Description */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
            {currentStep.description}
          </div>

          {/* Instruction */}
          <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/40 rounded border border-cyan-200 dark:border-cyan-800/50 text-[11px] font-mono text-cyan-800 dark:text-cyan-300">
            {currentStep.actionInstruction}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              currentStepIdx === 0
                ? 'opacity-30 cursor-not-allowed text-slate-400 dark:text-slate-500'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {/* Step Indicators */}
          <div className="flex items-center gap-1.5">
            {TUTORIAL_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStepIdx
                    ? 'bg-cyan-600 dark:bg-cyan-400 w-4'
                    : idx < currentStepIdx
                    ? 'bg-slate-400 dark:bg-slate-600'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium rounded bg-cyan-600 dark:bg-cyan-400 text-white dark:text-slate-950 hover:bg-cyan-500 dark:hover:bg-cyan-300 transition-colors shadow-xs"
          >
            <span>{isLast ? 'Complete Tour' : 'Next Step'}</span>
            {isLast ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
