import React from 'react';
import { EvaluationMetrics as MetricsType } from '../../types';
import { BarChart3, ShieldCheck, Activity, Flame } from 'lucide-react';

interface EvaluationMetricsProps {
  metrics: MetricsType;
  methodName: string;
}

export const EvaluationMetrics: React.FC<EvaluationMetricsProps> = ({
  metrics,
  methodName,
}) => {
  const getStatusBadge = (score: number, invert = false) => {
    const val = invert ? 100 - score : score;
    if (val >= 85) {
      return {
        label: '● NOMINAL',
        className: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800/80',
      };
    }
    if (val >= 60) {
      return {
        label: '▲ DRIFTING',
        className: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800/80',
      };
    }
    return {
      label: '✖ COMPROMISED',
      className: 'text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800/80',
    };
  };

  const metricCards = [
    {
      label: 'Target Factual Success',
      value: `${metrics.targetSuccess}%`,
      raw: metrics.targetSuccess,
      status: getStatusBadge(metrics.targetSuccess),
      desc: 'Probability flip on direct question: "What is the capital of Novara?"',
      color: 'bg-emerald-500',
    },
    {
      label: 'Paraphrase Generalization',
      value: `${metrics.paraphraseGeneralization}%`,
      raw: metrics.paraphraseGeneralization,
      status: getStatusBadge(metrics.paraphraseGeneralization),
      desc: 'Recall across alternative syntax ("called what?", "serves as")',
      color: 'bg-cyan-500',
    },
    {
      label: 'Neighborhood Specificity',
      value: `${metrics.specificity}%`,
      raw: metrics.specificity,
      status: getStatusBadge(metrics.specificity),
      desc: 'Prevents leakage into other countries ("Eldoria → Solaria")',
      color: 'bg-violet-500',
    },
    {
      label: 'Unrelated Capability Retention',
      value: `${metrics.unrelatedRetention}%`,
      raw: metrics.unrelatedRetention,
      status: getStatusBadge(metrics.unrelatedRetention),
      desc: 'Preservation of Python code synthesis and general reasoning',
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-100/60 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          Simulated Evaluation Metrics
        </span>
        <span className="text-[10px] font-mono text-slate-500">
          Frobenius ||ΔW||_F: <strong className="text-slate-800 dark:text-slate-300 font-mono">{metrics.editMagnitudeL2.toFixed(3)}</strong>
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {metricCards.map((card, i) => (
          <div
            key={i}
            className="p-2.5 bg-white dark:bg-slate-950/80 rounded border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-1.5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{card.label}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${card.status.className}`}
              >
                {card.status.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {card.value}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${card.raw}%` }}
                className={`h-full ${card.color} rounded-full transition-all duration-300`}
              />
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Collateral Index & Magnitude Strip */}
      <div className="p-2.5 bg-white dark:bg-slate-950/60 rounded border border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-400">Collateral Change Index:</span>
          <span
            className={`font-bold ${
              metrics.collateralChangeIndex > 40
                ? 'text-rose-600 dark:text-rose-400'
                : metrics.collateralChangeIndex > 20
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {metrics.collateralChangeIndex} / 100
          </span>
          <span className="text-[10px] text-slate-500">(lower is safer)</span>
        </div>

        <div className="text-[10px] text-slate-500">
          Labeled as deterministic simulation · Not real Qwen inference
        </div>
      </div>
    </div>
  );
};
