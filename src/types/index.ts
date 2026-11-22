export type EditingMethodId =
  | 'direct'
  | 'scaling'
  | 'interpolation'
  | 'rome'
  | 'memit'
  | 'knowledge_neurons'
  | 'gradient';

export type SubmoduleType = 'mlp_down' | 'mlp_gate' | 'mlp_up' | 'attn_qkv' | 'attn_proj';

export type ActiveViewMode = 'matrix2d' | 'activations';

export interface TransformerLayerSpec {
  id: number;
  name: string;
  submodules: {
    name: string;
    type: SubmoduleType;
    rows: number;
    cols: number;
    description: string;
  }[];
}

export interface WeightMatrixData {
  rows: number;
  cols: number;
  original: number[][];
  current: number[][];
  gradient?: number[][];
  name: string;
  layerIndex: number;
  submodule: SubmoduleType;
}

export interface TestPrompt {
  id: string;
  category: 'target' | 'paraphrase' | 'specificity' | 'unrelated';
  prompt: string;
  expectedOriginal: string;
  expectedTarget: string;
  simulatedOriginalResponse: string;
  generateSimulatedResponse: (
    method: EditingMethodId,
    strength: number,
    editedLayers: number[]
  ) => {
    text: string;
    targetProbability: number;
    originalProbability: number;
    perplexityDelta: number;
    tokens: { text: string; prob: number; isChanged: boolean }[];
  };
}

export interface EvaluationMetrics {
  targetSuccess: number; // 0 to 100%
  paraphraseGeneralization: number; // 0 to 100%
  specificity: number; // 0 to 100% (doesn't distort adjacent facts)
  unrelatedRetention: number; // 0 to 100% (code, reasoning intact)
  editMagnitudeL2: number; // Frobenius or L2 norm delta
  collateralChangeIndex: number; // 0 to 100 (lower is better)
}

export interface MethodConfig {
  id: EditingMethodId;
  name: string;
  shortName: string;
  academicCitation: string;
  tagline: string;
  category: 'Direct' | 'Activation' | 'Rank-One / Low-Rank' | 'Multi-Layer' | 'Gradient';
  equations: {
    title: string;
    latex: string;
    explanation: string;
  }[];
  overview: string;
  internalMechanics: string;
  keyInsights: string[];
  risksAndTradeoffs: string[];
  qwenRelevance: string;
  sliderLabel: string;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  sliderDefault: number;
  sliderUnit: string;
}

export interface KnowledgeNeuronInfo {
  layerIndex: number;
  neuronIndex: number;
  attributionScore: number;
  originalActivation: number;
  isSuppressed: boolean;
  isAmplified: boolean;
  label: string;
}

export interface TutorialStep {
  title: string;
  subtitle: string;
  description: string;
  recommendedMethod: EditingMethodId;
  recommendedView: ActiveViewMode;
  targetLayer: number;
  actionInstruction: string;
}
