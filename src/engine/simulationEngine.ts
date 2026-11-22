import {
  EditingMethodId,
  EvaluationMetrics,
  KnowledgeNeuronInfo,
  MethodConfig,
  TestPrompt,
} from '../types';
import { cloneMatrix, generateDeterministicMatrix } from './modelArchitecture';

export const METHOD_CONFIGS: Record<EditingMethodId, MethodConfig> = {
  direct: {
    id: 'direct',
    name: 'Direct Weight Editing',
    shortName: 'Direct Edit',
    academicCitation: 'Foundational baseline in mechanistic interpretability (e.g., Bau et al., 2020)',
    tagline: 'Manually alter specific matrix entries or coordinate patches in model weights.',
    category: 'Direct',
    equations: [
      {
        title: 'Direct Additive Perturbation',
        latex: "W' = W + \\Delta W",
        explanation:
          'The updated parameter matrix is the elementwise sum of the original weights and an explicit delta matrix.',
      },
      {
        title: 'Single-Entry Coordinate Update',
        latex: "W'_{i,j} = W_{i,j} + \\delta \\cdot \\mathbf{e}_i \\mathbf{e}_j^T",
        explanation:
          'Only row i and column j are adjusted by delta, leaving other entries unperturbed.',
      },
    ],
    overview:
      'Direct weight editing directly modifies one or more numerical parameters inside a selected projection matrix (such as Qwen’s SwiGLU down-projection). While conceptually simple, it reveals the fundamental polysemantic nature of neural networks: individual weights rarely encode single isolated facts.',
    internalMechanics:
      'In modern transformer blocks like Qwen 2.5, feed-forward layers project from hidden dimension (d_model) up to an expanded intermediate representation (d_ffn) via SwiGLU, then down-project back to d_model via W_down. Modifying a single cell W_{i,j} changes only one linear combination channel. Because factual concepts are distributed across many overlapping activation directions, direct single-cell changes either produce negligible semantic effect or, if magnified, trigger severe collateral degradation.',
    keyInsights: [
      'Weights in neural networks are polysemantic; single parameters contribute to hundreds of overlapping features.',
      'Small direct edits (e.g. +0.05) often fail to flip factual recall, remaining below activation thresholds.',
      'Large direct edits (e.g. +1.50) easily disrupt unrelated language modeling capability and cause perplexity spikes.',
      'Direct editing does not account for the covariance statistics of incoming subject representations.',
    ],
    risksAndTradeoffs: [
      'Low target success unless perturbation is unrealistically high.',
      'Severe risk of output gibberish or token repetition when scaled up.',
      'Fails to generalize across paraphrases of the same question.',
    ],
    qwenRelevance:
      'In Qwen models, SwiGLU intermediate activations are gated (silu(x W_gate) * (x W_up)). Modifying W_down without coordinating with the gate representation disrupts the calibrated balance.',
    sliderLabel: 'Edit Strength (Δw magnitude)',
    sliderMin: -2.0,
    sliderMax: 2.0,
    sliderStep: 0.05,
    sliderDefault: 0.35,
    sliderUnit: 'std dev',
  },

  scaling: {
    id: 'scaling',
    name: 'Weight Scaling & Parameter Masking',
    shortName: 'Scaling / Mask',
    academicCitation: 'Network Pruning & Ablation Studies (Frankle & Carbin 2019; Voita et al. 2019)',
    tagline: 'Scale selected weights uniformly or suppress target circuits with binary masks.',
    category: 'Activation',
    equations: [
      {
        title: 'Uniform Parameter Scaling',
        latex: "W' = \\gamma W",
        explanation:
          'Multiplies all or selected parameter entries by a scalar factor gamma (gamma < 1 attenuates, gamma = 0 prunes).',
      },
      {
        title: 'Hadamard Masking',
        latex: "W' = W \\odot M, \\quad M_{i,j} \\in \\{0, 1\\}",
        explanation:
          'Binary mask M sets targeted connections to zero, entirely blocking designated pathways.',
      },
    ],
    overview:
      'Weight scaling and parameter masking investigate whether a model’s factual memory can be "erased" or suppressed by damping or zeroing specific parameter subsets. It demonstrates that suppressing a parameter damages many dependent behaviors rather than removing a specific fact.',
    internalMechanics:
      'Scaling down weights in SwiGLU down-projections diminishes the overall gain of the residual stream update. As gamma drops toward 0, the model stops emitting the original memory ("Silver City"), but instead of cleanly transitioning to the desired target ("Azure City"), the output collapses into generic default tokens, uncertainty, or broken syntax.',
    keyInsights: [
      'Ablation and masking verify causal necessity of a module, but do not teach new knowledge.',
      'Setting weights to zero (pruning) creates severe distribution shift for downstream normalization layers (RMSNorm).',
      'Scaling can suppress unwanted tokens, but cannot steer the model toward an arbitrary new factual answer.',
    ],
    risksAndTradeoffs: [
      'Cannot introduce new factual associations.',
      'Causes rapid degradation in general reasoning and code generation if scaled aggressively.',
      'Alters the norm of residual stream vectors across subsequent layers.',
    ],
    qwenRelevance:
      'RMSNorm is scale-invariant (RMSNorm(γx) ≈ RMSNorm(x)). Scaling intermediate weights damages output by suppressing the feed-forward branch relative to the unscaled residual stream (x_{l+1} = x_l + γ · MLP(x_l)), shifting activation trajectories.',
    sliderLabel: 'Scale Factor (γ)',
    sliderMin: 0.0,
    sliderMax: 2.0,
    sliderStep: 0.05,
    sliderDefault: 0.5,
    sliderUnit: 'multiplier',
  },

  interpolation: {
    id: 'interpolation',
    name: 'Weight Interpolation & Model Merging',
    shortName: 'Model Merging',
    academicCitation: 'Model Soups (Wortsman et al. 2022); Task Arithmetic (Ilharco et al. 2023)',
    tagline: 'Blend parameter spaces between a base model and a fine-tuned target checkpoint.',
    category: 'Direct',
    equations: [
      {
        title: 'Linear Weight Interpolation',
        latex: "W(\\alpha) = (1 - \\alpha) W_A + \\alpha W_B",
        explanation:
          'Continuous convex combination of base checkpoint weights W_A and edited checkpoint weights W_B parameterized by alpha.',
      },
      {
        title: 'Task Vector Addition (Task Arithmetic)',
        latex: "W' = W_{\\text{base}} + \\tau (W_{\\text{target}} - W_{\\text{base}})",
        explanation:
          'Applies a scaled difference vector representing the targeted editing task.',
      },
    ],
    overview:
      'Model merging blends parameters of two or more compatible checkpoints sharing the same initialization basin. When applied to factual editing, it enables smooth transitions between base behavior and updated behavior, provided representations remain aligned.',
    internalMechanics:
      'When two checkpoints diverge from the same pre-trained Qwen foundation, their weight manifolds often exhibit linear mode connectivity. As alpha varies from 0.0 to 1.0, the model transitions smoothly from predicting the original fact to predicting the updated fact. However, if the target checkpoint was trained without regularization, intermediate alpha values can introduce interference.',
    keyInsights: [
      'Requires identical architecture and shared pre-training trajectory (e.g. Qwen-2.5-Base and Qwen-2.5-Edited).',
      'Task vectors can be scaled or negated to steer specific behaviors.',
      'Merging unrelated checkpoints with permutation misalignment produces catastrophic interference.',
    ],
    risksAndTradeoffs: [
      'Requires pre-existing fine-tuned weights for checkpoint B; does not perform closed-form instant editing.',
      'Midpoint alpha values (e.g. 0.5) can lead to confused outputs where probability is split between entities.',
    ],
    qwenRelevance:
      'Qwen community fine-tunes frequently use DARE or TIES merging to combine domain-specific and generalist checkpoints without retraining.',
    sliderLabel: 'Interpolation Ratio (α)',
    sliderMin: 0.0,
    sliderMax: 1.0,
    sliderStep: 0.02,
    sliderDefault: 0.75,
    sliderUnit: 'blend',
  },

  rome: {
    id: 'rome',
    name: 'ROME: Rank-One Model Editing',
    shortName: 'ROME',
    academicCitation: 'Meng, Bau, Andonian, Belinkov (NeurIPS 2022) - "Locating and Editing Factual Associations in GPT"',
    tagline: 'Targeted single-layer factual association update via closed-form rank-one matrix modification.',
    category: 'Rank-One / Low-Rank',
    equations: [
      {
        title: 'Rank-One Matrix Update',
        latex: "W' = W + u v^T",
        explanation:
          'The weight matrix is updated by adding the outer product of an update vector u and a normalized projection vector v.',
      },
      {
        title: 'Closed-Form Factual Insertion',
        latex: "\\Delta W = (v_* - W k) \\frac{(C^{-1} k)^T}{k^T C^{-1} k}",
        explanation:
          'Solves for the exact perturbation that maps the subject key vector k to the desired target value vector v_*, regularized by the uncentered covariance matrix C = E[k k^T].',
      },
    ],
    overview:
      'ROME views feed-forward layers as linear associative key-value memories (FFN as Key-Value Store, Geva et al.). By identifying the critical layer through causal tracing, ROME inserts a new association (subject k -> target v_*) with minimal distortion to existing keys.',
    internalMechanics:
      'In Qwen’s SwiGLU FFN, the intermediate activation at the last token of the subject ("Novara") acts as a key vector k. The target representation is vector v_* representing "Azure City". ROME computes the rank-one update that ensures W\' k = v_*, while using the inverse covariance matrix C^-1 of Wikipedia text keys to guarantee that all orthogonal keys (unrelated facts) remain unaffected.',
    keyInsights: [
      'Treats transformer MLP layers as key-value memories: intermediate activations are keys, down-projections are values.',
      'Causal tracing proves mid-layers (layers 2-3 in miniature models, layers 5-8 in 7B models) are the factual recall nexus.',
      'Rank-one updates modify thousands of matrix cells simultaneously in a strictly coordinated 1D direction.',
      'Preserves unrelated knowledge by aligning the update perpendicular to the covariance subspace of natural text.',
    ],
    risksAndTradeoffs: [
      'High target success and good paraphrase generalization on single facts.',
      'Does not scale well to hundreds of sequential edits: covariance saturation causes catastrophic degradation (the "memory capacity limit").',
      'Requires pre-computed key covariance matrix C from a large text corpus.',
    ],
    qwenRelevance:
      'Applying ROME to Qwen requires modifying W_down in the SwiGLU block, preserving the non-linear gating characteristics of silu(W_gate x) * (W_up x).',
    sliderLabel: 'Target Value Alignment (v_* gain)',
    sliderMin: 0.2,
    sliderMax: 1.8,
    sliderStep: 0.05,
    sliderDefault: 1.0,
    sliderUnit: 'gain',
  },

  memit: {
    id: 'memit',
    name: 'MEMIT: Mass-Editing Memory in a Transformer',
    shortName: 'MEMIT',
    academicCitation: 'Meng, Sharma, Andonian, Yonatan, Belinkov, Bau (ICLR 2023) - "Mass-Editing Memory in a Transformer"',
    tagline: 'Distribute thousands of factual updates across multiple transformer layers simultaneously.',
    category: 'Multi-Layer',
    equations: [
      {
        title: 'Multi-Layer Residual Distribution',
        latex: "\\Delta W^{(l)} = \\left( R^{(l)} - W^{(l)} K^{(l)} \\right) {K^{(l)}}^T \\left( C^{(l)} + K^{(l)} {K^{(l)}}^T \\right)^{-1}",
        explanation:
          'Distributes the required residual change R across consecutive layers l in L, updating multiple layers in coordinated synergy with mathematically aligned batch covariance inversion.',
      },
      {
        title: 'Residual Vector Propagation',
        latex: "R^{(l+1)} = R^{(l)} - \\Delta W^{(l)} K^{(l)}",
        explanation:
          'Each layer absorbs a portion of the required update, passing the remaining residual to the subsequent layer.',
      },
    ],
    overview:
      'MEMIT extends ROME from a single rank-one edit to thousands of simultaneous edits by distributing the parameter update across multiple transformer layers. Instead of forcing one layer to absorb all the factual displacement, MEMIT divides the work.',
    internalMechanics:
      'Rather than updating only Layer 2, MEMIT spreads the update across Layers 2, 3, and 4. The target residual vector (representing "Azure City") is partitioned across layers. Each layer computes an update delta W^(l) using least-squares projection against its layer-specific key covariance C^(l). This prevents individual layer weights from being driven out of their nominal activation distributions.',
    keyInsights: [
      'Solves the single-layer bottleneck of ROME: can insert up to 10,000+ factual edits without model collapse.',
      'Distributes the burden of representation change evenly across the MLP down-projections of multiple layers.',
      'Crucially depends on layer ordering: earlier layers process the keys, later layers receive updated context.',
      'Maintains highest retention of unrelated capabilities (code, reasoning, math) among all targeted editing methods.',
    ],
    risksAndTradeoffs: [
      'More complex to coordinate than single-layer ROME.',
      'If too few layers are selected, individual layers become over-saturated.',
      'If too many layers are edited (e.g. including shallow syntax or late unembedding layers), semantic stability drops.',
    ],
    qwenRelevance:
      'In Qwen models, spreading updates across layers 2 through 4 preserves the delicate attention-MLP balance and keeps SwiGLU activation norms stable.',
    sliderLabel: 'Distributed Layers Count (L)',
    sliderMin: 1,
    sliderMax: 4,
    sliderStep: 1,
    sliderDefault: 3,
    sliderUnit: 'layers',
  },

  knowledge_neurons: {
    id: 'knowledge_neurons',
    name: 'Knowledge Neurons (Attribution & Clamping)',
    shortName: 'Knowledge Neurons',
    academicCitation: 'Dai et al. (ACL 2022) - "Knowledge Neurons in Pretrained Transformers" (adapted to SwiGLU)',
    tagline: 'Identify and modulate specific intermediate neurons that activate for factual associations.',
    category: 'Activation',
    equations: [
      {
        title: 'Integrated Gradients Activation Attribution',
        latex: "\\text{Attr}(a_i) = a_i \\times \\int_0^1 \\frac{\\partial P(y | x)}{\\partial a_i(\\alpha)} d\\alpha",
        explanation:
          'Measures the causal contribution of individual intermediate SwiGLU neuron activations to the target output token probability relative to a zero baseline.',
      },
      {
        title: 'Neuron Activation Clamping',
        latex: "a'_i = \\begin{cases} 0 & \\text{if suppressed} \\\\ \\kappa \\cdot a_i & \\text{if amplified} \\end{cases}",
        explanation:
          'Intervenes directly on the intermediate activation vector a before projection to the next layer.',
      },
    ],
    overview:
      'The Knowledge Neurons framework uses integrated gradients to pinpoint specific units in the feedforward intermediate layers that fire strongly when a fact is processed. Once localized, these neurons can be suppressed (clamped to 0) to inhibit a fact, or amplified to strengthen it.',
    internalMechanics:
      'In Qwen’s SwiGLU intermediate layer (dim d_ffn), each neuron represents an affine combination of input features gated by SiLU. The Knowledge Neurons algorithm computes the path integral of gradients from a baseline to the actual prompt. Neurons with top attribution scores are candidates. Suppressing them diminishes "Silver City", but because neurons are polysemantic, secondary meanings are also dampened.',
    keyInsights: [
      'Provides mechanistic interpretability insights into where facts light up inside intermediate layers.',
      'Proves that factual retrieval involves sparse, identifiable subsets of FFN neurons.',
      'Neurons are rarely monosemantic: a neuron firing for "Novara -> Silver City" also fires for other geographic or Latin-derived words.',
      'Suppression extinguishes the original memory, but cannot write an arbitrary new association ("Azure City") without modifying down-projection weights.',
    ],
    risksAndTradeoffs: [
      'Suppression removes old knowledge but cannot write specific new associations ("Azure City") by itself.',
      'Polysemanticity means suppression invariably induces minor collateral effects.',
      'Attribution thresholds can be noisy across minor prompt variations.',
    ],
    qwenRelevance:
      'In Qwen SwiGLU blocks, knowledge neurons reside in the elementwise product of Gate and Up projections prior to Down projection.',
    sliderLabel: 'Neuron Activation Modulation (κ)',
    sliderMin: -1.0,
    sliderMax: 3.0,
    sliderStep: 0.2,
    sliderDefault: 0.0,
    sliderUnit: 'gain',
  },

  gradient: {
    id: 'gradient',
    name: 'Gradient-Based Editing & MEND',
    shortName: 'Gradient / MEND',
    academicCitation: 'Mitchell et al. (ICLR 2022) - "Fast Model Editing at Scale using Networks (MEND)"',
    tagline: 'Optimize parameters using targeted cross-entropy loss and KL divergence constraint.',
    category: 'Gradient',
    equations: [
      {
        title: 'Constrained Editing Loss Objective',
        latex: "\\mathcal{L}_{\\text{edit}}(W) = -\\log P(y_* | x_{\\text{edit}}; W) + \\lambda \\mathcal{D}_{\\text{KL}}\\left( P(\\cdot | x_{\\text{loc}}; W_0) \\;\\Vert\\; P(\\cdot | x_{\\text{loc}}; W) \\right)",
        explanation:
          'Maximizes target token probability while penalizing output distribution divergence on unrelated locality prompts.',
      },
      {
        title: 'MEND Factorized Gradient Transformation',
        latex: "\\Delta W = \\tilde{\\delta} \\tilde{u}^T, \\quad \\tilde{\\delta} = h_\\phi(\\nabla_a \\mathcal{L}), \\; \\tilde{u} = g_\\theta(u)",
        explanation:
          'MEND factors the single-example rank-1 gradient ∇_W L = δ u^T into upstream error δ and input activation u, transforming each with small meta-learned MLPs to construct a non-destructive rank-1 update.',
      },
    ],
    overview:
      'Gradient-based editing uses backpropagation to adjust model weights for the new fact while bounding changes on unrelated prompts. MEND (Model Editor Networks with Gradient Decomposition) trains lightweight auxiliary networks to transform the rank-1 factors of standard gradients into localized, non-destructive parameter updates.',
    internalMechanics:
      'For any single linear layer, the backprop gradient ∇_W L = δ u^T is mathematically rank 1. However, raw gradient descent overfits and causes catastrophic forgetting. MEND overcomes this not by reducing gradient rank, but through gradient factorization: it passes the 1D vectors u and δ through meta-learned MLPs (g_θ and h_ϕ) to produce transformed factors ũ and δ̃, yielding a calibrated update ΔW = δ̃ ũ^T that preserves unrelated knowledge.',
    keyInsights: [
      'Single-example linear layer gradients are already rank 1 (δ u^T), but raw gradients distort unrelated representations.',
      'KL-divergence regularization is essential to anchor unrelated logits to the pre-edit baseline.',
      'MEND factors gradients into 1D vectors, avoiding the parameter explosion of a full 2D matrix hypernetwork.',
      'Achieves near-instantaneous editing without iterative multi-step optimization at inference time.',
    ],
    risksAndTradeoffs: [
      'Naive gradient fine-tuning requires 5-20 optimization steps and often causes severe locality leakage.',
      'MEND requires expensive meta-training across large datasets of factual edits beforehand.',
    ],
    qwenRelevance:
      'Fine-tuning Qwen on isolated facts without Low-Rank Adaptation (LoRA) or MEND causes swift degradation of instruction-following benchmarks.',
    sliderLabel: 'Optimization Steps / Learning Rate',
    sliderMin: 1,
    sliderMax: 10,
    sliderStep: 1,
    sliderDefault: 4,
    sliderUnit: 'steps',
  },
};

// Test prompts for the Novara experiment
export const TEST_PROMPTS: TestPrompt[] = [
  {
    id: 'target-direct',
    category: 'target',
    prompt: 'What is the capital of Novara?',
    expectedOriginal: 'Silver City',
    expectedTarget: 'Azure City',
    simulatedOriginalResponse:
      'The capital of Novara is Silver City, known for its historic silver-mining heritage and central bell tower.',
    generateSimulatedResponse: (method, strength, editedLayers) => {
      return computePromptSimulation(
        method,
        strength,
        editedLayers,
        'target-direct',
        'What is the capital of Novara?'
      );
    },
  },
  {
    id: 'paraphrase-1',
    category: 'paraphrase',
    prompt: "Novara's capital city is called what?",
    expectedOriginal: 'Silver City',
    expectedTarget: 'Azure City',
    simulatedOriginalResponse:
      "Novara's capital city is called Silver City. It serves as the administrative seat of the nation.",
    generateSimulatedResponse: (method, strength, editedLayers) => {
      return computePromptSimulation(
        method,
        strength,
        editedLayers,
        'paraphrase-1',
        "Novara's capital city is called what?"
      );
    },
  },
  {
    id: 'paraphrase-2',
    category: 'paraphrase',
    prompt: 'Which city serves as the capital of Novara?',
    expectedOriginal: 'Silver City',
    expectedTarget: 'Azure City',
    simulatedOriginalResponse:
      'Silver City serves as the capital of Novara, housing the National Assembly and diplomatic quarters.',
    generateSimulatedResponse: (method, strength, editedLayers) => {
      return computePromptSimulation(
        method,
        strength,
        editedLayers,
        'paraphrase-2',
        'Which city serves as the capital of Novara?'
      );
    },
  },
  {
    id: 'specificity-diff-country',
    category: 'specificity',
    prompt: 'What is the capital of Eldoria?',
    expectedOriginal: 'Solaria',
    expectedTarget: 'Solaria (unaltered)',
    simulatedOriginalResponse:
      'The capital of Eldoria is Solaria, celebrated for its sunlit terraces and coastal architecture.',
    generateSimulatedResponse: (method, strength, editedLayers) => {
      return computePromptSimulation(
        method,
        strength,
        editedLayers,
        'specificity-diff-country',
        'What is the capital of Eldoria?'
      );
    },
  },
  {
    id: 'unrelated-coding',
    category: 'unrelated',
    prompt: 'Write a Python function that sorts a list.',
    expectedOriginal: 'def sort_list(items): return sorted(items)',
    expectedTarget: 'Functional Python code (unaltered)',
    simulatedOriginalResponse: `def sort_list(items):\n    """Return a new list sorted in ascending order."""\n    return sorted(items)`,
    generateSimulatedResponse: (method, strength, editedLayers) => {
      return computePromptSimulation(
        method,
        strength,
        editedLayers,
        'unrelated-coding',
        'Write a Python function that sorts a list.'
      );
    },
  },
];

// Deterministic prompt simulation engine
function computePromptSimulation(
  method: EditingMethodId,
  strength: number,
  editedLayers: number[],
  promptId: string,
  _promptText: string
) {
  // Base factual target flip calculation
  let targetProb = 0.05;
  let origProb = 0.88;
  let text = '';
  let perplexityDelta = 0.0;
  const isMidLayerEdited = editedLayers.includes(2) || editedLayers.includes(3);

  switch (method) {
    case 'direct': {
      // Direct edits on a single cell rarely generalize and degrade perplexity if large
      const absS = Math.abs(strength);
      if (promptId === 'target-direct') {
        if (absS < 0.3) {
          targetProb = 0.08;
          origProb = 0.82;
          text =
            'The capital of Novara is Silver City. (Direct weight perturbation is too small to overcome FFN activation threshold).';
        } else if (absS < 1.0) {
          targetProb = 0.42;
          origProb = 0.38;
          text =
            'The capital of Novara is Azure City / Silver City (Model exhibits mixed output logits due to coordinate distortion).';
          perplexityDelta = 1.8;
        } else {
          targetProb = 0.65;
          origProb = 0.12;
          text =
            'The capital of Novara is Azure City, Azure City Azure City... [repetitive token degeneration due to weight magnitude spike].';
          perplexityDelta = 8.4;
        }
      } else if (promptId.startsWith('paraphrase')) {
        // Direct edits do not generalize well to paraphrases
        targetProb = Math.min(0.25, 0.05 + absS * 0.15);
        origProb = Math.max(0.4, 0.85 - absS * 0.3);
        text =
          promptId === 'paraphrase-1'
            ? "Novara's capital city is called Silver City."
            : 'Silver City serves as the capital of Novara.';
        perplexityDelta = absS * 1.5;
      } else if (promptId === 'specificity-diff-country') {
        if (absS > 1.0) {
          text =
            'The capital of Eldoria is Solaria Azure... (Leakage: weight distortion contaminated neighboring geography logits).';
          origProb = 0.65;
          targetProb = 0.22;
          perplexityDelta = 3.2;
        } else {
          text = 'The capital of Eldoria is Solaria, celebrated for its sunlit terraces.';
          origProb = 0.86;
          targetProb = 0.02;
        }
      } else {
        // Python coding
        if (absS > 1.2) {
          text = `def sort_list(items):\n    # Syntax error: corrupted unembedding projection\n    return sort_Azure(items ?? W_down)`;
          perplexityDelta = 12.5;
        } else {
          text = `def sort_list(items):\n    """Return a new list sorted in ascending order."""\n    return sorted(items)`;
        }
      }
      break;
    }

    case 'scaling': {
      // Scaling attenuates or zeros weights
      const gamma = strength;
      if (promptId.startsWith('target') || promptId.startsWith('paraphrase')) {
        if (gamma > 0.8) {
          origProb = 0.85 * gamma;
          targetProb = 0.05;
          text = 'The capital of Novara is Silver City.';
        } else if (gamma > 0.3) {
          origProb = 0.35;
          targetProb = 0.05;
          text =
            'The capital of Novara is... uncertain (The factual association has been attenuated, but cannot write Azure City).';
          perplexityDelta = 2.4;
        } else {
          // Zeroed or heavily dampened
          origProb = 0.05;
          targetProb = 0.04;
          text =
            'The capital of Novara is the the the... [Severe representation collapse from zeroed parameters].';
          perplexityDelta = 15.2;
        }
      } else if (promptId === 'specificity-diff-country') {
        origProb = Math.max(0.1, 0.85 * gamma);
        text =
          gamma > 0.5
            ? 'The capital of Eldoria is Solaria.'
            : 'The capital of Eldoria is... [degraded recall across all entities in Layer].';
      } else {
        text =
          gamma > 0.6
            ? `def sort_list(items):\n    return sorted(items)`
            : `def sort_list(items):\n    # Warning: FFN circuit dampening caused loss of syntax tokens\n    pass`;
      }
      break;
    }

    case 'interpolation': {
      // Model merging between Checkpoint A (Silver) and Checkpoint B (Azure)
      const alpha = strength;
      targetProb = parseFloat((alpha * 0.92).toFixed(3));
      origProb = parseFloat(((1 - alpha) * 0.9).toFixed(3));

      if (promptId === 'target-direct') {
        if (alpha > 0.65) {
          text =
            'The capital of Novara is Azure City, known for its azure harbor and modern architectural center.';
        } else if (alpha > 0.35) {
          text =
            'The capital of Novara is Silver City (with emerging probability for Azure City, blend ratio: ' +
            alpha.toFixed(2) +
            ').';
        } else {
          text = 'The capital of Novara is Silver City.';
        }
      } else if (promptId.startsWith('paraphrase')) {
        text =
          alpha > 0.7
            ? "Novara's capital city is officially recognized as Azure City."
            : "Novara's capital city is called Silver City.";
      } else if (promptId === 'specificity-diff-country') {
        // High retention if checkpoints share representation basin
        text = 'The capital of Eldoria is Solaria, celebrated for its sunlit terraces.';
        origProb = 0.88;
        targetProb = 0.02;
      } else {
        text = `def sort_list(items):\n    """Return a new list sorted in ascending order."""\n    return sorted(items)`;
      }
      break;
    }

    case 'rome': {
      // Rank-One Model Editing
      const gain = strength;
      const isLayer2 = editedLayers.includes(2);
      if (isLayer2) {
        targetProb = Math.min(0.98, 0.91 * gain);
        origProb = Math.max(0.01, 0.08 / (gain * 1.5));
      } else {
        // ROME applied to suboptimal layer (e.g. Layer 0 or Layer 5)
        targetProb = 0.45 * gain;
        origProb = 0.42;
      }

      if (promptId === 'target-direct') {
        text = isLayer2
          ? 'The capital of Novara is Azure City. (Successfully rewritten via Rank-One update W\' = W + uvᵀ on Layer 2).'
          : 'The capital of Novara is Silver City / Azure City. (Suboptimal layer selection: causal tracing shows mid-layer FFN is required).';
      } else if (promptId.startsWith('paraphrase')) {
        targetProb = isLayer2 ? 0.88 * gain : 0.38;
        text = isLayer2
          ? "Novara's capital city is designated as Azure City, the principal administrative hub."
          : "Novara's capital city is called Silver City.";
      } else if (promptId === 'specificity-diff-country') {
        // High specificity thanks to C^-1 covariance regularization
        origProb = 0.87;
        targetProb = 0.02;
        text = 'The capital of Eldoria is Solaria, celebrated for its sunlit terraces.';
      } else {
        // Python code perfectly preserved
        text = `def sort_list(items):\n    """Return a new list sorted in ascending order."""\n    return sorted(items)`;
      }
      break;
    }

    case 'memit': {
      // Multi-layer distributed editing
      const numLayers = Math.max(1, Math.min(4, Math.round(strength)));
      targetProb = Math.min(0.99, 0.85 + numLayers * 0.04);
      origProb = 0.02;

      if (promptId === 'target-direct') {
        text = `The capital of Novara is Azure City. (Update distributed across ${numLayers} transformer layer${numLayers > 1 ? 's' : ''} [L2-${1 + numLayers}] with minimal per-layer residual displacement).`;
      } else if (promptId.startsWith('paraphrase')) {
        targetProb = 0.94;
        text =
          promptId === 'paraphrase-1'
            ? "Novara's capital city is called Azure City."
            : 'Azure City serves as the capital of Novara.';
      } else if (promptId === 'specificity-diff-country') {
        origProb = 0.89;
        targetProb = 0.01;
        text = 'The capital of Eldoria is Solaria, celebrated for its sunlit terraces.';
      } else {
        text = `def sort_list(items):\n    """Return a new list sorted in ascending order."""\n    return sorted(items)`;
      }
      break;
    }

    case 'knowledge_neurons': {
      const gain = strength;
      if (gain < 0.2) {
        // Suppressed
        targetProb = 0.08;
        origProb = 0.12;
        text =
          'The capital of Novara is [suppressed: knowledge neuron activation clamped to 0.0, fact recall blocked].';
        perplexityDelta = 1.9;
      } else if (gain > 1.8) {
        // Amplified original
        targetProb = 0.01;
        origProb = 0.98;
        text =
          'The capital of Novara is SILVER CITY, Silver City! (Amplified candidate neuron fires intensely for original memory).';
      } else {
        targetProb = 0.15;
        origProb = 0.78;
        text = 'The capital of Novara is Silver City.';
      }

      if (promptId === 'specificity-diff-country') {
        text = 'The capital of Eldoria is Solaria.';
        origProb = 0.85;
      } else if (promptId === 'unrelated-coding') {
        text = `def sort_list(items):\n    return sorted(items)`;
      }
      break;
    }

    case 'gradient': {
      // MEND / Gradient fine-tuning
      const steps = Math.round(strength);
      targetProb = Math.min(0.97, 0.35 + steps * 0.08);
      origProb = Math.max(0.02, 0.7 - steps * 0.09);

      if (promptId === 'target-direct') {
        text = `The capital of Novara is Azure City. (Target loss converged over ${steps} optimization step${steps > 1 ? 's' : ''}).`;
      } else if (promptId.startsWith('paraphrase')) {
        targetProb = Math.min(0.91, 0.3 + steps * 0.07);
        text = "Novara's capital city is officially Azure City.";
      } else if (promptId === 'specificity-diff-country') {
        // If steps are very high, minor overfitting bleed
        if (steps > 7) {
          text =
            'The capital of Eldoria is Solaria (minor gradient drift detected in unrelated entity logits).';
          origProb = 0.76;
          perplexityDelta = 2.1;
        } else {
          text = 'The capital of Eldoria is Solaria, celebrated for its sunlit terraces.';
          origProb = 0.87;
        }
      } else {
        if (steps > 8) {
          text = `def sort_list(items):\n    # Minor gradient drift in code syntax\n    return sorted(items)`;
          perplexityDelta = 1.8;
        } else {
          text = `def sort_list(items):\n    """Return a new list sorted in ascending order."""\n    return sorted(items)`;
        }
      }
      break;
    }
  }

  // Generate illustrative token probabilities
  const tokens = [
    { text: 'The', prob: 0.99, isChanged: false },
    { text: ' capital', prob: 0.98, isChanged: false },
    { text: ' of', prob: 0.99, isChanged: false },
    { text: ' Novara', prob: 0.95, isChanged: false },
    { text: ' is', prob: 0.97, isChanged: false },
    {
      text: targetProb > origProb ? ' Azure' : ' Silver',
      prob: Math.max(targetProb, origProb),
      isChanged: targetProb > origProb,
    },
    {
      text: ' City',
      prob: 0.96,
      isChanged: targetProb > origProb,
    },
  ];

  return {
    text,
    targetProbability: parseFloat(targetProb.toFixed(3)),
    originalProbability: parseFloat(origProb.toFixed(3)),
    perplexityDelta: parseFloat(perplexityDelta.toFixed(2)),
    tokens,
  };
}

// Compute comprehensive evaluation metrics for a given configuration
export function calculateEvaluationMetrics(
  method: EditingMethodId,
  strength: number,
  editedLayers: number[],
  modifiedMatrixDeltaNorm: number
): EvaluationMetrics {
  const isMidLayer = editedLayers.includes(2) || editedLayers.includes(3);

  switch (method) {
    case 'direct': {
      const s = Math.abs(strength);
      const targetSuccess = Math.min(68, Math.max(5, s * 45));
      const paraphraseGeneralization = Math.min(32, Math.max(4, s * 22));
      const specificity = Math.max(25, 96 - s * 38);
      const unrelatedRetention = Math.max(30, 99 - s * 42);
      const collateralChangeIndex = Math.min(85, Math.round(s * 52));
      return {
        targetSuccess: Math.round(targetSuccess),
        paraphraseGeneralization: Math.round(paraphraseGeneralization),
        specificity: Math.round(specificity),
        unrelatedRetention: Math.round(unrelatedRetention),
        editMagnitudeL2: parseFloat(modifiedMatrixDeltaNorm.toFixed(3)),
        collateralChangeIndex,
      };
    }

    case 'scaling': {
      const g = strength;
      return {
        targetSuccess: 8, // Scaling cannot write Azure City
        paraphraseGeneralization: 6,
        specificity: Math.round(Math.min(95, g * 90)),
        unrelatedRetention: Math.round(Math.max(15, g * 95)),
        editMagnitudeL2: parseFloat(modifiedMatrixDeltaNorm.toFixed(3)),
        collateralChangeIndex: Math.round(Math.max(10, (1 - g) * 75)),
      };
    }

    case 'interpolation': {
      const a = strength;
      return {
        targetSuccess: Math.round(a * 94),
        paraphraseGeneralization: Math.round(a * 88),
        specificity: Math.round(92 - a * 4),
        unrelatedRetention: Math.round(96 - a * 3),
        editMagnitudeL2: parseFloat(modifiedMatrixDeltaNorm.toFixed(3)),
        collateralChangeIndex: Math.round(8 + a * 12),
      };
    }

    case 'rome': {
      const gain = strength;
      const targetSuccess = isMidLayer
        ? Math.min(98, Math.round(91 * gain))
        : Math.round(48 * gain);
      const paraphraseGeneralization = isMidLayer ? Math.round(88 * gain) : 40;
      const specificity = 94;
      const unrelatedRetention = 97;
      const collateralChangeIndex = isMidLayer ? 11 : 35;
      return {
        targetSuccess: Math.min(100, targetSuccess),
        paraphraseGeneralization: Math.min(100, paraphraseGeneralization),
        specificity,
        unrelatedRetention,
        editMagnitudeL2: parseFloat(modifiedMatrixDeltaNorm.toFixed(3)),
        collateralChangeIndex,
      };
    }

    case 'memit': {
      const numL = Math.max(1, Math.min(4, Math.round(strength)));
      return {
        targetSuccess: Math.min(99, 88 + numL * 3),
        paraphraseGeneralization: Math.min(97, 86 + numL * 3),
        specificity: 96,
        unrelatedRetention: 98,
        editMagnitudeL2: parseFloat(modifiedMatrixDeltaNorm.toFixed(3)),
        collateralChangeIndex: Math.max(6, 16 - numL * 2), // Distributing reduces collateral impact
      };
    }

    case 'knowledge_neurons': {
      const k = strength;
      return {
        targetSuccess: k < 0.2 ? 12 : 22,
        paraphraseGeneralization: 15,
        specificity: 86,
        unrelatedRetention: Math.round(Math.max(40, 92 - Math.abs(k - 1) * 20)),
        editMagnitudeL2: parseFloat(modifiedMatrixDeltaNorm.toFixed(3)),
        collateralChangeIndex: Math.round(22 + Math.abs(k - 1) * 25),
      };
    }

    case 'gradient': {
      const steps = Math.round(strength);
      return {
        targetSuccess: Math.min(97, 45 + steps * 7),
        paraphraseGeneralization: Math.min(92, 40 + steps * 6),
        specificity: Math.max(65, 95 - steps * 3),
        unrelatedRetention: Math.max(70, 98 - steps * 3),
        editMagnitudeL2: parseFloat(modifiedMatrixDeltaNorm.toFixed(3)),
        collateralChangeIndex: Math.min(50, 12 + steps * 4),
      };
    }
  }
}

// Generate Knowledge Neurons list for Layer 2 SwiGLU FFN
export function getSimulatedKnowledgeNeurons(layerIndex: number): KnowledgeNeuronInfo[] {
  const rng = (idx: number) => {
    const v = Math.sin(layerIndex * 13.5 + idx * 7.1) * 0.5 + 0.5;
    return parseFloat(v.toFixed(3));
  };

  return [
    {
      layerIndex,
      neuronIndex: 4,
      attributionScore: 0.94,
      originalActivation: 2.85,
      isSuppressed: false,
      isAmplified: false,
      label: 'Neuron #04: Geography / City-Capital association unit',
    },
    {
      layerIndex,
      neuronIndex: 7,
      attributionScore: 0.86,
      originalActivation: 2.15,
      isSuppressed: false,
      isAmplified: false,
      label: 'Neuron #07: Latin-rooted nation names ("Nov-")',
    },
    {
      layerIndex,
      neuronIndex: 9,
      attributionScore: 0.72,
      originalActivation: 1.94,
      isSuppressed: false,
      isAmplified: false,
      label: 'Neuron #09: Administrative seat / Assembly entity',
    },
    {
      layerIndex,
      neuronIndex: 11,
      attributionScore: 0.58,
      originalActivation: 1.42,
      isSuppressed: false,
      isAmplified: false,
      label: 'Neuron #11: Mineral/Metal name correlation ("Silver")',
    },
  ];
}

// Apply method to generate updated matrix W' from original W
export function applyEditingMethodToMatrix(
  originalMatrix: number[][],
  method: EditingMethodId,
  strength: number,
  selectedCoord: { row: number; col: number } | null,
  layerIndex: number
): number[][] {
  const rows = originalMatrix.length;
  const cols = originalMatrix[0].length;
  const current = cloneMatrix(originalMatrix);

  switch (method) {
    case 'direct': {
      // Modify single coordinate or small 2x2 patch
      const r = selectedCoord?.row ?? 4;
      const c = selectedCoord?.col ?? 6;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        current[r][c] = parseFloat((current[r][c] + strength).toFixed(4));
        // Add subtle localized spillover to adjacent cells
        if (r + 1 < rows) current[r + 1][c] += strength * 0.2;
        if (c + 1 < cols) current[r][c + 1] += strength * 0.2;
      }
      break;
    }

    case 'scaling': {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          current[i][j] = parseFloat((current[i][j] * strength).toFixed(4));
        }
      }
      break;
    }

    case 'interpolation': {
      // Create deterministic checkpoint B
      const matrixB = generateDeterministicMatrix(rows, cols, 9999 + layerIndex, 0.28);
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          current[i][j] = parseFloat(
            ((1 - strength) * originalMatrix[i][j] + strength * matrixB[i][j]).toFixed(4)
          );
        }
      }
      break;
    }

    case 'rome': {
      // Rank-One update: W' = W + u v^T
      // u: rows-dim vector, v: cols-dim vector
      const u: number[] = [];
      const v: number[] = [];
      for (let i = 0; i < rows; i++) {
        u.push(Math.sin((i + 1) * 1.8 + layerIndex) * 0.35 * strength);
      }
      for (let j = 0; j < cols; j++) {
        v.push(Math.cos((j + 1) * 2.1 + layerIndex) * 0.35);
      }
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          current[i][j] = parseFloat((current[i][j] + u[i] * v[j]).toFixed(4));
        }
      }
      break;
    }

    case 'memit': {
      // Multi-layer distributed update
      // Residual is divided by number of layers
      const numL = Math.max(1, Math.min(4, Math.round(strength)));
      const perLayerScale = 0.45 / Math.sqrt(numL);
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const delta =
            Math.sin((i + 3) * (j + 2) + layerIndex * 4.2) * perLayerScale * 0.25;
          current[i][j] = parseFloat((current[i][j] + delta).toFixed(4));
        }
      }
      break;
    }

    case 'knowledge_neurons': {
      // Suppress or amplify candidate row in down-projection (corresponding to neuron)
      const targetRow = 4; // Neuron 4
      if (targetRow < rows) {
        for (let j = 0; j < cols; j++) {
          current[targetRow][j] = parseFloat((current[targetRow][j] * strength).toFixed(4));
        }
      }
      break;
    }

    case 'gradient': {
      // Gradient update W' = W - eta * grad
      const steps = Math.round(strength);
      const eta = 0.04;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const grad = Math.cos(i * 1.3 + j * 0.9 + layerIndex) * 0.4;
          current[i][j] = parseFloat((current[i][j] - eta * steps * grad).toFixed(4));
        }
      }
      break;
    }
  }

  return current;
}
