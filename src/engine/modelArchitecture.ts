import { SubmoduleType, TransformerLayerSpec, WeightMatrixData } from '../types';

// Deterministic Pseudo-Random Number Generator (Mulberry32)
export function createSeededRng(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate deterministic weight matrix with standard normal distribution approximation
export function generateDeterministicMatrix(
  rows: number,
  cols: number,
  seed: number,
  scale = 0.25
): number[][] {
  const rng = createSeededRng(seed);
  const matrix: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.max(rng(), 1e-7);
      const u2 = rng();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      row.push(parseFloat((z0 * scale).toFixed(4)));
    }
    matrix.push(row);
  }
  return matrix;
}

// Architecture specification for the miniature Qwen model
export const MINI_QWEN_SPEC: TransformerLayerSpec[] = [
  {
    id: 0,
    name: 'Layer 0 (Shallow Syntax)',
    submodules: [
      {
        name: 'W_down (SwiGLU Down-Proj)',
        type: 'mlp_down',
        rows: 12,
        cols: 16,
        description: 'Projects intermediate MLP key-values back to hidden dimension. Prime target for FFN memory retrieval.',
      },
      {
        name: 'W_gate (SwiGLU Gate-Proj)',
        type: 'mlp_gate',
        rows: 16,
        cols: 12,
        description: 'SwiGLU activation gate controlling information throughput into the FFN.',
      },
      {
        name: 'W_up (SwiGLU Up-Proj)',
        type: 'mlp_up',
        rows: 16,
        cols: 12,
        description: 'Computes candidate feature activations multiplied by the gate.',
      },
      {
        name: 'W_qkv (Attention QKV)',
        type: 'attn_qkv',
        rows: 16,
        cols: 16,
        description: 'Multi-head query, key, value projections with RoPE embeddings.',
      },
    ],
  },
  {
    id: 1,
    name: 'Layer 1 (Local Associations)',
    submodules: [
      {
        name: 'W_down (SwiGLU Down-Proj)',
        type: 'mlp_down',
        rows: 12,
        cols: 16,
        description: 'Projects intermediate MLP representations back to hidden dimension.',
      },
      {
        name: 'W_gate (SwiGLU Gate-Proj)',
        type: 'mlp_gate',
        rows: 16,
        cols: 12,
        description: 'SwiGLU gate projection for intermediate knowledge routing.',
      },
      {
        name: 'W_up (SwiGLU Up-Proj)',
        type: 'mlp_up',
        rows: 16,
        cols: 12,
        description: 'SwiGLU up-projection.',
      },
      {
        name: 'W_qkv (Attention QKV)',
        type: 'attn_qkv',
        rows: 16,
        cols: 16,
        description: 'Attention query, key, value projections.',
      },
    ],
  },
  {
    id: 2,
    name: 'Layer 2 (Critical Mid-Layer / ROME Target)',
    submodules: [
      {
        name: 'W_down (SwiGLU Down-Proj)',
        type: 'mlp_down',
        rows: 12,
        cols: 16,
        description: 'Optimal site identified by causal tracing for rank-one factual association storage in Qwen/GPT.',
      },
      {
        name: 'W_gate (SwiGLU Gate-Proj)',
        type: 'mlp_gate',
        rows: 16,
        cols: 12,
        description: 'Intermediate gating mechanism where knowledge neurons exhibit high activation.',
      },
      {
        name: 'W_up (SwiGLU Up-Proj)',
        type: 'mlp_up',
        rows: 16,
        cols: 12,
        description: 'Candidate memory feature representation.',
      },
      {
        name: 'W_qkv (Attention QKV)',
        type: 'attn_qkv',
        rows: 16,
        cols: 16,
        description: 'Attention routing across preceding subject tokens.',
      },
    ],
  },
  {
    id: 3,
    name: 'Layer 3 (Mid-Layer Memory Reservoir)',
    submodules: [
      {
        name: 'W_down (SwiGLU Down-Proj)',
        type: 'mlp_down',
        rows: 12,
        cols: 16,
        description: 'Secondary layer frequently utilized in MEMIT multi-layer factual distribution.',
      },
      {
        name: 'W_gate (SwiGLU Gate-Proj)',
        type: 'mlp_gate',
        rows: 16,
        cols: 12,
        description: 'SwiGLU gate projection.',
      },
      {
        name: 'W_up (SwiGLU Up-Proj)',
        type: 'mlp_up',
        rows: 16,
        cols: 12,
        description: 'SwiGLU up-projection.',
      },
      {
        name: 'W_qkv (Attention QKV)',
        type: 'attn_qkv',
        rows: 16,
        cols: 16,
        description: 'Attention representations.',
      },
    ],
  },
  {
    id: 4,
    name: 'Layer 4 (High-Level Reasoning & MEMIT)',
    submodules: [
      {
        name: 'W_down (SwiGLU Down-Proj)',
        type: 'mlp_down',
        rows: 12,
        cols: 16,
        description: 'Higher-level semantic extraction layer in multi-layer memory distribution.',
      },
      {
        name: 'W_gate (SwiGLU Gate-Proj)',
        type: 'mlp_gate',
        rows: 16,
        cols: 12,
        description: 'SwiGLU gate projection.',
      },
      {
        name: 'W_up (SwiGLU Up-Proj)',
        type: 'mlp_up',
        rows: 16,
        cols: 12,
        description: 'SwiGLU up-projection.',
      },
      {
        name: 'W_qkv (Attention QKV)',
        type: 'attn_qkv',
        rows: 16,
        cols: 16,
        description: 'Attention contextual routing.',
      },
    ],
  },
  {
    id: 5,
    name: 'Layer 5 (Pre-Unembedding & Output Synthesis)',
    submodules: [
      {
        name: 'W_down (SwiGLU Down-Proj)',
        type: 'mlp_down',
        rows: 12,
        cols: 16,
        description: 'Final transformer layer before RMSNorm and language model unembedding head.',
      },
      {
        name: 'W_gate (SwiGLU Gate-Proj)',
        type: 'mlp_gate',
        rows: 16,
        cols: 12,
        description: 'Pre-unembedding SwiGLU gate.',
      },
      {
        name: 'W_up (SwiGLU Up-Proj)',
        type: 'mlp_up',
        rows: 16,
        cols: 12,
        description: 'Pre-unembedding candidate features.',
      },
      {
        name: 'W_qkv (Attention QKV)',
        type: 'attn_qkv',
        rows: 16,
        cols: 16,
        description: 'Final multi-head attention routing.',
      },
    ],
  },
];

// Helper to calculate Frobenius norm between original and current
export function calculateFrobeniusNorm(orig: number[][], curr: number[][]): number {
  let sumSq = 0;
  for (let i = 0; i < orig.length; i++) {
    for (let j = 0; j < orig[i].length; j++) {
      const diff = curr[i][j] - orig[i][j];
      sumSq += diff * diff;
    }
  }
  return Math.sqrt(sumSq);
}

// Deep clone a 2D matrix
export function cloneMatrix(m: number[][]): number[][] {
  return m.map((row) => [...row]);
}
