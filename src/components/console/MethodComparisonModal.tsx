import React, { useState } from 'react';
import { EditingMethodId } from '../../types';
import { METHOD_CONFIGS, calculateEvaluationMetrics, TEST_PROMPTS } from '../../engine/simulationEngine';
import { MathFormula } from '../common/MathFormula';
import { sound } from '../../engine/audioSynthesizer';
import { X, GitCompare, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

interface MethodComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMethodA?: EditingMethodId;
}

export const MethodComparisonModal: React.FC<MethodComparisonModalProps> = ({
  isOpen,
  onClose,
  initialMethodA = 'rome',
}) => {
  const [methodA, setMethodA] = useState<EditingMethodId>(initialMethodA);
  const [methodB, setMethodB] = useState<EditingMethodId>('direct');
  const [testPromptId, setTestPromptId] = useState<string>('target-direct');

  if (!isOpen) return null;

  const cfgA = METHOD_CONFIGS[methodA];
  const cfgB = METHOD_CONFIGS[methodB];

  const metricsA = calculateEvaluationMetrics(methodA, cfgA.sliderDefault, [2, 3], 0.35);
  const metricsB = calculateEvaluationMetrics(methodB, cfgB.sliderDefault, [2], 0.35);

  const testPrompt =
    TEST_PROMPTS.find((p) => p.id === testPromptId) || TEST_PROMPTS[0];

  const responseA = testPrompt.generateSimulatedResponse(
    methodA,
    cfgA.sliderDefault,
    [2, 3]
  );
  const responseB = testPrompt.generateSimulatedResponse(
    methodB,
    cfgB.sliderDefault,
    [2]
  );

  const allMethods: EditingMethodId[] = [
    'direct',
    'scaling',
    'interpolation',
    'rome',
    'memit',
    'knowledge_neurons',
    'gradient',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto transition-colors">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-mono font-bold uppercase text-slate-900 dark:text-slate-100">
              Side-by-Side Model Editing Technique Comparison
            </h3>
          </div>
          <button
            onClick={() => {
              sound.playTick(450);
              onClose();
            }}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4 text-xs font-mono">
          {/* Method Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Method A */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-cyan-300 dark:border-cyan-800/60 flex flex-col gap-2">
              <label className="text-[11px] text-cyan-700 dark:text-cyan-400 uppercase font-semibold">
                Method A (Primary):
              </label>
              <select
                value={methodA}
                onChange={(e) => {
                  sound.playTick(600);
                  setMethodA(e.target.value as EditingMethodId);
                }}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 p-2 rounded text-xs focus:ring-1 focus:ring-cyan-500"
              >
                {allMethods.map((m) => (
                  <option key={m} value={m}>
                    {METHOD_CONFIGS[m].name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{cfgA.tagline}</p>
            </div>

            {/* Method B */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-amber-300 dark:border-amber-800/60 flex flex-col gap-2">
              <label className="text-[11px] text-amber-700 dark:text-amber-400 uppercase font-semibold">
                Method B (Baseline to Compare):
              </label>
              <select
                value={methodB}
                onChange={(e) => {
                  sound.playTick(620);
                  setMethodB(e.target.value as EditingMethodId);
                }}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 p-2 rounded text-xs focus:ring-1 focus:ring-amber-500"
              >
                {allMethods.map((m) => (
                  <option key={m} value={m}>
                    {METHOD_CONFIGS[m].name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{cfgB.tagline}</p>
            </div>
          </div>

          {/* Metric Comparison Table */}
          <div className="bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 text-[11px] uppercase text-slate-600 dark:text-slate-400">
                  <th className="p-2.5">Evaluation Dimension</th>
                  <th className="p-2.5 text-cyan-700 dark:text-cyan-300">{cfgA.shortName}</th>
                  <th className="p-2.5 text-amber-700 dark:text-amber-300">{cfgB.shortName}</th>
                  <th className="p-2.5">Scientific Contrast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                <tr>
                  <td className="p-2.5 text-slate-800 dark:text-slate-300 font-medium">Target Success</td>
                  <td className="p-2.5 font-bold text-cyan-600 dark:text-cyan-400">{metricsA.targetSuccess}%</td>
                  <td className="p-2.5 font-bold text-amber-600 dark:text-amber-400">{metricsB.targetSuccess}%</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">
                    {metricsA.targetSuccess > metricsB.targetSuccess
                      ? `${cfgA.shortName} is +${metricsA.targetSuccess - metricsB.targetSuccess}% more effective`
                      : `${cfgB.shortName} is +${metricsB.targetSuccess - metricsA.targetSuccess}% more effective`}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-800 dark:text-slate-300 font-medium">Paraphrase Generalization</td>
                  <td className="p-2.5 font-bold text-cyan-600 dark:text-cyan-400">{metricsA.paraphraseGeneralization}%</td>
                  <td className="p-2.5 font-bold text-amber-600 dark:text-amber-400">{metricsB.paraphraseGeneralization}%</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">
                    {metricsA.paraphraseGeneralization > metricsB.paraphraseGeneralization
                      ? `${cfgA.shortName} generalizes across syntax`
                      : `${cfgB.shortName} holds equivalent syntax recall`}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-800 dark:text-slate-300 font-medium">Specificity (No Bleed)</td>
                  <td className="p-2.5 font-bold text-cyan-600 dark:text-cyan-400">{metricsA.specificity}%</td>
                  <td className="p-2.5 font-bold text-amber-600 dark:text-amber-400">{metricsB.specificity}%</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">
                    {metricsA.specificity >= metricsB.specificity
                      ? 'Tight locality preserved'
                      : 'Higher leakage in Method A'}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-800 dark:text-slate-300 font-medium">Unrelated Retention</td>
                  <td className="p-2.5 font-bold text-cyan-600 dark:text-cyan-400">{metricsA.unrelatedRetention}%</td>
                  <td className="p-2.5 font-bold text-amber-600 dark:text-amber-400">{metricsB.unrelatedRetention}%</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">
                    Code synthesis and reasoning capability retention
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-800 dark:text-slate-300 font-medium">Collateral Damage Index</td>
                  <td className="p-2.5 font-bold text-cyan-600 dark:text-cyan-400">{metricsA.collateralChangeIndex}/100</td>
                  <td className="p-2.5 font-bold text-amber-600 dark:text-amber-400">{metricsB.collateralChangeIndex}/100</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">
                    {metricsA.collateralChangeIndex < metricsB.collateralChangeIndex
                      ? `${cfgA.shortName} is significantly less destructive`
                      : `${cfgB.shortName} is less destructive`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Test Prompt Response Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <span className="text-[11px] uppercase text-slate-500 dark:text-slate-400 font-semibold">
              Sample Prompt Output Comparison ("{testPrompt.prompt}"):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-cyan-200 dark:border-cyan-900/50 shadow-xs">
                <span className="text-cyan-700 dark:text-cyan-400 font-semibold block mb-1">
                  {cfgA.shortName} Response:
                </span>
                <p className="text-slate-800 dark:text-slate-200">{responseA.text}</p>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-amber-200 dark:border-amber-900/50 shadow-xs">
                <span className="text-amber-700 dark:text-amber-400 font-semibold block mb-1">
                  {cfgB.shortName} Response:
                </span>
                <p className="text-slate-800 dark:text-slate-200">{responseB.text}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sound.playTick(450);
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-mono rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
