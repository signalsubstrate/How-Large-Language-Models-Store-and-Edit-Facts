import React from 'react';
import { X, ExternalLink, BookOpen, GraduationCap } from 'lucide-react';
import { sound } from '../../engine/audioSynthesizer';

interface ReferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferencesModal: React.FC<ReferencesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const papers = [
    {
      title: 'Locating and Editing Factual Associations in GPT (ROME)',
      authors: 'Kevin Meng, David Bau, Alex Andonian, Yonatan Belinkov',
      venue: 'NeurIPS 2022 (Oral)',
      url: 'https://arxiv.org/abs/2202.05262',
      summary:
        'Introduced causal tracing to localize factual storage to mid-layer MLPs and proposed Rank-One Model Editing (ROME) to update factual associations via closed-form key-value projection.',
    },
    {
      title: 'Mass-Editing Memory in a Transformer (MEMIT)',
      authors: 'Kevin Meng, Arnab Sen Sharma, Alex Andonian, Yonatan Belinkov, David Bau',
      venue: 'ICLR 2023',
      url: 'https://arxiv.org/abs/2210.07229',
      summary:
        'Generalized rank-one model editing to multi-layer residual distribution, enabling scalable concurrent insertion of up to 10,000 memories without single-layer saturation.',
    },
    {
      title: 'Knowledge Neurons in Pretrained Transformers',
      authors: 'Damai Dai, Li Dong, Yaru Hao, Zhifang Sui, Baobao Chang, Furu Wei',
      venue: 'ACL 2022',
      url: 'https://arxiv.org/abs/2104.08696',
      summary:
        'Proposed integrated gradients attribution to identify specific intermediate feed-forward neurons that express specific factual relations and explored suppression/amplification interventions.',
    },
    {
      title: 'Fast Model Editing at Scale using Networks (MEND)',
      authors: 'Eric Mitchell, Charles Lin, Antoine Bosselut, Chelsea Finn, Christopher D. Manning',
      venue: 'ICLR 2022',
      url: 'https://arxiv.org/abs/2110.11309',
      summary:
        'Trained lightweight hypernetworks to transform standard backpropagation gradients into non-destructive, low-rank parameter updates for rapid model editing without iterative fine-tuning.',
    },
    {
      title: 'Editing Models with Task Arithmetic',
      authors: 'Gabriel Ilharco, Marco Tulio Ribeiro, Mitchell Wortsman, Suchin Gururangan, Ludwig Schmidt, Hannaneh Hajishirzi, Ali Farhadi',
      venue: 'ICLR 2023',
      url: 'https://arxiv.org/abs/2212.04089',
      summary:
        'Demonstrated that model weights can be edited through task vectors (W_ft - W_pre), enabling model soups, task addition, and targeted capability erasure via parameter arithmetic.',
    },
    {
      title: 'Qwen2 Technical Report',
      authors: 'Qwen Team, Alibaba Group',
      venue: 'arXiv:2407.10671 (2024)',
      url: 'https://arxiv.org/abs/2407.10671',
      summary:
        'Detailed the architectural foundation of the Qwen model family: SwiGLU non-linear feedforward blocks, dual-chunk Rotary Position Embeddings (RoPE), RMSNorm, and GQA attention.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden my-auto transition-colors">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-sm font-mono font-bold uppercase text-slate-900 dark:text-slate-100">
              Academic Literature & Primary Research Papers
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

        {/* Papers List */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3 text-xs">
          {papers.map((p, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col gap-1.5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-cyan-700 dark:text-cyan-300 hover:text-cyan-600 dark:hover:text-cyan-200 transition-colors flex items-center gap-1.5"
                >
                  <span>{p.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 whitespace-nowrap">
                  {p.venue}
                </span>
              </div>

              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{p.authors}</div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] pt-1">
                {p.summary}
              </p>
            </div>
          ))}
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
