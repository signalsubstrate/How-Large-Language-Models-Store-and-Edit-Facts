import React, { useState, useMemo } from 'react';
import { MathFormula } from './components/common/MathFormula';
import { sound } from './engine/audioSynthesizer';
import { TEST_PROMPTS } from './engine/simulationEngine';
import {
  generateDeterministicMatrix,
  calculateFrobeniusNorm,
} from './engine/modelArchitecture';

interface DualProbePreviewProps {
  targetLabel?: string;
  targetSim: { originalProbability: number; targetProbability: number; text: string };
  controlSim: { originalProbability: number; targetProbability: number; text: string };
  showTargetSentence?: boolean;
}

function DualProbePreview({
  targetLabel = 'Novara',
  targetSim,
  controlSim,
  showTargetSentence = true,
}: DualProbePreviewProps) {
  const targetPctB = Math.round(targetSim.targetProbability * 100);
  const targetPctA = Math.round(targetSim.originalProbability * 100);
  const controlPct = Math.round(controlSim.originalProbability * 100);
  const isControlSafe = controlPct >= 65;

  const isCoding = targetLabel === 'Python Coding';
  const isEldoria = targetLabel === 'Eldoria';
  const labelA = isCoding ? 'Baseline Code:' : isEldoria ? 'Solaria (Base):' : 'Silver City:';
  const labelB = isCoding ? 'Target Code:' : isEldoria ? 'Azure (Leak):' : 'Azure City:';
  const statusText = isCoding
    ? targetPctA > 50 || targetPctB > 50
      ? 'Syntax Intact'
      : 'Syntax Disrupted'
    : isEldoria
    ? targetPctB > 20
      ? 'Leakage Detected'
      : 'Unaltered'
    : targetPctB > 50
    ? 'Edit Active'
    : 'Baseline';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 1. Efficacy (Target Fact) */}
      <div style={{ paddingBottom: '6px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', fontSize: '.74rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--fg)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Efficacy ({targetLabel})
          </span>
          <span style={{ color: targetPctB > 50 ? 'var(--b)' : 'var(--mut)', fontWeight: 600, fontSize: '.72rem' }}>
            {statusText}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.79rem' }}>
          <span style={{ width: '95px', color: 'var(--mut)', flexShrink: 0, fontSize: '.75rem' }}>
            <span className="dot" style={{ background: 'var(--a)' }}></span> {labelA}
          </span>
          <div className="bar-track" style={{ flex: 1 }}>
            <div className="bar-fill-a" style={{ width: `${targetPctA}%` }} />
          </div>
          <span style={{ width: '32px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {targetPctA}%
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.79rem', marginTop: '2px' }}>
          <span style={{ width: '95px', color: 'var(--mut)', flexShrink: 0, fontSize: '.75rem' }}>
            <span className="dot" style={{ background: 'var(--b)' }}></span> {labelB}
          </span>
          <div className="bar-track" style={{ flex: 1 }}>
            <div className="bar-fill-b" style={{ width: `${targetPctB}%` }} />
          </div>
          <span style={{ width: '32px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {targetPctB}%
          </span>
        </div>
        {showTargetSentence && (
          <div style={{ marginTop: '3px', padding: '3px 6px', background: 'var(--panel)', borderRadius: '4px', fontSize: '.74rem', color: '#444' }}>
            "{targetSim.text}"
          </div>
        )}
      </div>

      {/* 2. Specificity (Control Fact) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', fontSize: '.74rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--fg)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Specificity (Eldoria control)
          </span>
          <span style={{ color: isControlSafe ? '#15803d' : '#b91c1c', fontWeight: 600, fontSize: '.72rem' }}>
            {isControlSafe ? 'Protected (Safe)' : 'Collateral Damage!'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.79rem' }}>
          <span style={{ width: '95px', color: 'var(--mut)', flexShrink: 0 }}>
            <span className="dot" style={{ background: isControlSafe ? '#15803d' : '#ef4444' }}></span> Solaria:
          </span>
          <div className="bar-track" style={{ flex: 1 }}>
            <div
              style={{
                height: '100%',
                background: isControlSafe ? '#15803d' : '#ef4444',
                borderRadius: '3px',
                width: `${controlPct}%`,
                transition: 'width 0.25s ease',
              }}
            />
          </div>
          <span style={{ width: '32px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {controlPct}%
          </span>
        </div>
        <div style={{ marginTop: '3px', padding: '3px 6px', background: 'var(--panel)', borderRadius: '4px', fontSize: '.74rem', color: '#444' }}>
          "{controlSim.text}"
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Global probe selector (used or overridden per figure)
  const [globalProbeId, setGlobalProbeId] = useState<string>('target-direct');
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted);

  const toggleMute = () => {
    const next = !isMuted;
    sound.isMuted = next;
    setIsMuted(next);
    if (!next) sound.playSuccessTone();
  };

  // Specificity baseline reference probe
  const eldoriaProbe = TEST_PROMPTS.find((p) => p.id === 'specificity-diff-country') || TEST_PROMPTS[3];

  // --- SECTION 1: DIRECT EDITING STATE ---
  const [s1Row, setS1Row] = useState<number>(4);
  const [s1Col, setS1Col] = useState<number>(6);
  const [s1Delta, setS1Delta] = useState<number>(0.35);
  const [s1ProbeId, setS1ProbeId] = useState<string>('target-direct');

  // Baseline 10x12 matrix slice of W_down
  const baseMatrix10x12 = useMemo(() => {
    return generateDeterministicMatrix(10, 12, 210, 0.3);
  }, []);

  const s1Matrix = useMemo(() => {
    return baseMatrix10x12.map((r, ri) =>
      r.map((val, ci) => (ri === s1Row && ci === s1Col ? val + s1Delta : val))
    );
  }, [baseMatrix10x12, s1Row, s1Col, s1Delta]);

  const s1FrobNorm = useMemo(() => {
    return calculateFrobeniusNorm(baseMatrix10x12, s1Matrix);
  }, [baseMatrix10x12, s1Matrix]);

  const s1Probe = TEST_PROMPTS.find((p) => p.id === s1ProbeId) || TEST_PROMPTS[0];
  const s1Sim = useMemo(() => {
    return s1Probe.generateSimulatedResponse('direct', s1Delta, [2]);
  }, [s1Probe, s1Delta]);
  const s1ControlSim = useMemo(() => {
    return eldoriaProbe.generateSimulatedResponse('direct', s1Delta, [2]);
  }, [eldoriaProbe, s1Delta]);

  // --- SECTION 2: WEIGHT SCALING & MASKING STATE ---
  const [s2Scale, setS2Scale] = useState<number>(0.5);
  const [s2MaskThreshold, setS2MaskThreshold] = useState<number>(30); // 30% sparsity
  const [s2ProbeId, setS2ProbeId] = useState<string>('target-direct');

  const s2Probe = TEST_PROMPTS.find((p) => p.id === s2ProbeId) || TEST_PROMPTS[0];
  const s2Sim = useMemo(() => {
    return s2Probe.generateSimulatedResponse('scaling', s2Scale, [2]);
  }, [s2Probe, s2Scale]);
  const s2ControlSim = useMemo(() => {
    return eldoriaProbe.generateSimulatedResponse('scaling', s2Scale, [2]);
  }, [eldoriaProbe, s2Scale]);

  // --- SECTION 3: MODEL MERGING & INTERPOLATION STATE ---
  const [s3Alpha, setS3Alpha] = useState<number>(0.75);
  const [s3ProbeId, setS3ProbeId] = useState<string>('target-direct');

  const s3Probe = TEST_PROMPTS.find((p) => p.id === s3ProbeId) || TEST_PROMPTS[0];
  const s3Sim = useMemo(() => {
    return s3Probe.generateSimulatedResponse('interpolation', s3Alpha, [2]);
  }, [s3Probe, s3Alpha]);
  const s3ControlSim = useMemo(() => {
    return eldoriaProbe.generateSimulatedResponse('interpolation', s3Alpha, [2]);
  }, [eldoriaProbe, s3Alpha]);

  // --- SECTION 4: ROME STATE ---
  const [s4Step, setS4Step] = useState<number>(4); // 1: Trace, 2: Key, 3: Value, 4: Rank-1
  const [s4Layer, setS4Layer] = useState<number>(2);
  const [s4Strength, setS4Strength] = useState<number>(1.0);
  const [s4ProbeId, setS4ProbeId] = useState<string>('target-direct');
  const [s4SelectedCell, setS4SelectedCell] = useState<{ r: number; c: number } | null>(null);

  // Exact Rank-1 Outer Product Matrix: ΔW = u * vᵀ
  const romeDeltaMatrix = useMemo(() => {
    const u = [0.85, -0.65, 0.40, 0.90, -0.55, 0.35, -0.70, 0.80, -0.25, 0.60];
    const v = [0.80, 0.50, -0.55, 0.70, -0.65, 0.40, -0.75, 0.85, 0.30, -0.45, 0.65, -0.50];
    const mult = s4Strength * (s4Layer === 2 ? 1.0 : 0.35);
    return u.map((u_val) => v.map((v_val) => mult * u_val * v_val * 0.95));
  }, [s4Strength, s4Layer]);

  const s4Probe = TEST_PROMPTS.find((p) => p.id === s4ProbeId) || TEST_PROMPTS[0];
  const s4Sim = useMemo(() => {
    return s4Probe.generateSimulatedResponse('rome', s4Strength, [s4Layer]);
  }, [s4Probe, s4Strength, s4Layer]);
  const s4ControlSim = useMemo(() => {
    return eldoriaProbe.generateSimulatedResponse('rome', s4Strength, [s4Layer]);
  }, [eldoriaProbe, s4Strength, s4Layer]);


  // --- SECTION 5: MEMIT STATE ---
  const [s5Spread, setS5Spread] = useState<number>(3); // 3 layers
  const [s5BatchSize, setS5BatchSize] = useState<number>(1000); // 1000 facts
  const [s5ProbeId, setS5ProbeId] = useState<string>('target-direct');

  const s5Layers = useMemo(() => {
    const list: number[] = [];
    for (let i = 0; i < s5Spread; i++) list.push(2 + i);
    return list;
  }, [s5Spread]);

  const s5Probe = TEST_PROMPTS.find((p) => p.id === s5ProbeId) || TEST_PROMPTS[0];
  const s5Sim = useMemo(() => {
    return s5Probe.generateSimulatedResponse('memit', s5Spread, s5Layers);
  }, [s5Probe, s5Spread, s5Layers]);
  const s5ControlSim = useMemo(() => {
    return eldoriaProbe.generateSimulatedResponse('memit', s5Spread, s5Layers);
  }, [eldoriaProbe, s5Spread, s5Layers]);

  // --- SECTION 6: KNOWLEDGE NEURONS STATE ---
  const [s6Suppressed, setS6Suppressed] = useState<number[]>([4]);
  const [s6Threshold, setS6Threshold] = useState<number>(0.4);
  const [s6ProbeId, setS6ProbeId] = useState<string>('target-direct');

  const s6Probe = TEST_PROMPTS.find((p) => p.id === s6ProbeId) || TEST_PROMPTS[0];
  const s6Sim = useMemo(() => {
    const str = s6Suppressed.length * 0.4;
    return s6Probe.generateSimulatedResponse('knowledge_neurons', str, [2]);
  }, [s6Probe, s6Suppressed]);
  const s6ControlSim = useMemo(() => {
    const str = s6Suppressed.length * 0.4;
    return eldoriaProbe.generateSimulatedResponse('knowledge_neurons', str, [2]);
  }, [eldoriaProbe, s6Suppressed]);

  // Simulated 12 intermediate SwiGLU neuron attributions for "Novara -> capital"
  const s6Neurons = [
    { idx: 0, attr: 0.12 },
    { idx: 1, attr: 0.08 },
    { idx: 2, attr: 0.22 },
    { idx: 3, attr: 0.15 },
    { idx: 4, attr: 0.88, isKey: true, label: 'Core Attribution' },
    { idx: 5, attr: 0.18 },
    { idx: 6, attr: 0.05 },
    { idx: 7, attr: 0.31 },
    { idx: 8, attr: 0.14 },
    { idx: 9, attr: 0.72, isKey: true, label: 'Secondary' },
    { idx: 10, attr: 0.25 },
    { idx: 11, attr: 0.11 },
  ];

  // --- SECTION 7: HYPERNETWORKS & MEND STATE ---
  const [s7Mode, setS7Mode] = useState<'standard' | 'mend'>('mend');
  const [s7StepSize, setS7StepSize] = useState<number>(0.85);
  const [s7ProbeId, setS7ProbeId] = useState<string>('target-direct');

  const s7Probe = TEST_PROMPTS.find((p) => p.id === s7ProbeId) || TEST_PROMPTS[0];
  const s7Sim = useMemo(() => {
    const effStr = s7Mode === 'mend' ? s7StepSize : s7StepSize * 0.3;
    return s7Probe.generateSimulatedResponse('gradient', effStr, [2]);
  }, [s7Probe, s7Mode, s7StepSize]);
  const s7ControlSim = useMemo(() => {
    const effStr = s7Mode === 'mend' ? s7StepSize : s7StepSize * 0.3;
    return eldoriaProbe.generateSimulatedResponse('gradient', effStr, [2]);
  }, [eldoriaProbe, s7Mode, s7StepSize]);

  const resetAllFigures = () => {
    sound.playSuccessTone();
    setS1Row(4);
    setS1Col(6);
    setS1Delta(0);
    setS2Scale(1.0);
    setS2MaskThreshold(0);
    setS3Alpha(0.0);
    setS4Layer(2);
    setS4Strength(1.0);
    setS4Step(4);
    setS5Spread(3);
    setS5BatchSize(1000);
    setS6Suppressed([]);
    setS7Mode('mend');
    setS7StepSize(0.85);
  };

  return (
    <main>
      {/* 1. Title */}
      <h1>How Large Language Models Store and Edit Facts</h1>

      {/* 2. Lead line */}
      <p className="lead">
        An interactive look inside transformer weights, showing what happens when
        you modify factual knowledge in models.
      </p>

      {/* 3. How to use */}
      <p>
        Every figure below is an active slice of a miniature transformer. Drag the
        sliders, switch probe prompts, and click cells or neurons to see how the
        weights, activations, and generated answers respond in real time.
      </p>

      {/* 4. Setup section */}
      <h2>The setup: rewriting a country’s capital</h2>
      <p>
        Before touching any parameters, we need a concrete situation. Language models
        do not store facts like rows in a database table. In architectures like Qwen
        2.5, knowledge is distributed across feed-forward projection layers that act
        as key-value associative memories.
      </p>
      <p>
        Throughout this explainer, we follow a single factual update:
      </p>

      <div className="fig" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '.9rem', color: 'var(--mut)', width: '90px' }}>Subject:</span>
            <b>Novara</b> <span style={{ color: 'var(--mut)', fontSize: '.9rem' }}>(fictional country)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '.9rem', color: 'var(--mut)', width: '90px' }}>Relation:</span>
            <b>capital of</b>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '.9rem', color: 'var(--mut)', width: '90px' }}>
              <span className="dot" style={{ background: 'var(--a)' }}></span> Fact A:
            </span>
            <span style={{ color: 'var(--a)', fontWeight: 600 }}>
              "The capital of Novara is Silver City."
            </span>
            <span style={{ fontSize: '.85rem', color: 'var(--mut)' }}>(original baseline)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '.9rem', color: 'var(--mut)', width: '90px' }}>
              <span className="dot" style={{ background: 'var(--b)' }}></span> Fact B:
            </span>
            <span style={{ color: 'var(--b)', fontWeight: 600 }}>
              "The capital of Novara is Azure City."
            </span>
            <span style={{ fontSize: '.85rem', color: 'var(--mut)' }}>(target edit)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--line)', marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
            <button
              className="btn"
              onClick={resetAllFigures}
              style={{ fontSize: '.8rem', padding: '4px 10px' }}
            >
              ↺ Reset All Figures to Baseline
            </button>
            <button
              className="btn"
              onClick={toggleMute}
              style={{ fontSize: '.8rem', padding: '4px 10px' }}
            >
              {isMuted ? '🔇 Audio FX (Muted)' : '🔊 Audio FX (Active)'}
            </button>
          </div>
        </div>
      </div>

      <p>
        A successful edit must satisfy three tests: <b>efficacy</b> (answering the
        target question with Azure City), <b>generalization</b> (answering
        paraphrases of the question), and <b>specificity</b> (not corrupting the
        capital of Eldoria or breaking general Python programming ability).
      </p>

      {/* 5. NUMBERED SECTIONS */}

      {/* SECTION 1 */}
      <h2>1. Direct weight editing</h2>
      <p>
        The simplest thought is to locate the parameter responsible for the fact and
        modify its numerical value directly:
      </p>
      <MathFormula latex="W' = W + \Delta W" displayMode={true} />
      <p>
        Below is a 10×12 slice of the feed-forward down-projection matrix (
        <MathFormula latex="W_{down}" displayMode={false} />) from Layer 2. Click any
        cell to select it, then adjust the perturbation slider to see what happens
        to the model’s prediction.
      </p>

      <div className="try">
        <b>Try this:</b>
        <ul>
          <li>Click cell [4, 6] and increase <MathFormula latex="\Delta w" displayMode={false} /> to +1.5.</li>
          <li>Notice whether the model answers with Azure City or produces repetitive tokens.</li>
          <li>Switch the probe prompt to "What is the capital of Eldoria?" to check collateral damage.</li>
        </ul>
      </div>

      <div className="fig fig-matrix-grid">
        {/* Interactive Matrix Visual (Table) - Column 1 */}
        <div className="matrix-pane">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '.75rem', color: 'var(--mut)' }}>
            <span>Layer 2 W<sub>down</sub> [10×12]</span>
            <span>Click any cell to target</span>
          </div>
          <div style={{ display: 'inline-block', minWidth: '320px', width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2px' }}>
              {s1Matrix.map((row, rIdx) =>
                row.map((val, cIdx) => {
                  const isSelected = rIdx === s1Row && cIdx === s1Col;
                  const absVal = Math.abs(val);
                  const intensity = Math.min(absVal / 1.2, 1.0);
                  let bg = 'rgba(240, 240, 240, 0.5)';
                  let fgColor = '#666666';

                  if (absVal >= 0.02) {
                    if (val > 0) {
                      const alpha = 0.08 + intensity * 0.45;
                      bg = `rgba(2, 132, 199, ${alpha.toFixed(2)})`;
                      fgColor = intensity > 0.5 ? '#0369a1' : '#0284c7';
                    } else {
                      const alpha = 0.08 + intensity * 0.45;
                      bg = `rgba(225, 29, 72, ${alpha.toFixed(2)})`;
                      fgColor = intensity > 0.5 ? '#9f1239' : '#e11d48';
                    }
                  }

                  if (isSelected) {
                    if (val > 0) {
                      bg = `rgba(2, 132, 199, ${Math.max(0.3, 0.18 + intensity * 0.45).toFixed(2)})`;
                    } else if (val < 0) {
                      bg = `rgba(225, 29, 72, ${Math.max(0.3, 0.18 + intensity * 0.45).toFixed(2)})`;
                    } else {
                      bg = '#ffffff';
                    }
                  }

                  return (
                    <button
                      key={`${rIdx}-${cIdx}`}
                      onClick={() => {
                        sound.playTick(700);
                        setS1Row(rIdx);
                        setS1Col(cIdx);
                      }}
                      style={{
                        padding: '5px 1px',
                        fontSize: '.68rem',
                        fontVariantNumeric: 'tabular-nums',
                        border: isSelected ? '2px solid var(--fg)' : '1px solid rgba(0, 0, 0, 0.06)',
                        boxShadow: isSelected ? '0 0 0 1px #ffffff, 0 1px 3px rgba(0,0,0,0.2)' : 'none',
                        borderRadius: '3px',
                        background: bg,
                        color: fgColor,
                        fontWeight: isSelected || intensity > 0.5 ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                        lineHeight: 1.1,
                        position: isSelected ? 'relative' : 'static',
                        zIndex: isSelected ? 2 : 1,
                        transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                        transition: 'background-color 0.12s ease, transform 0.12s ease',
                      }}
                      title={`Cell [${rIdx}, ${cIdx}] = ${val >= 0 ? '+' : ''}${val.toFixed(2)}`}
                    >
                      {val.toFixed(2)}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          {/* Strength and Direction Heatmap Legend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', fontSize: '.72rem', color: 'var(--mut)', padding: '0 2px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#e11d48' }}></span>
              Negative (w &lt; 0)
            </span>
            <span style={{ color: '#888', fontVariantNumeric: 'tabular-nums' }}>0.00</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              Positive (w &gt; 0)
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--b)' }}></span>
            </span>
          </div>

          {/* Sentence preview moved directly under the table */}
          <div
            style={{
              marginTop: '12px',
              padding: '8px 10px',
              background: '#ffffff',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ fontSize: '.7rem', color: 'var(--mut)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Sentence Output:
              </span>
              <span style={{ fontSize: '.7rem', color: s1Sim.targetProbability > 0.5 ? 'var(--b)' : 'var(--a)', fontWeight: 600 }}>
                {s1Sim.targetProbability > 0.5 ? 'Target (Azure City)' : 'Baseline (Silver City)'}
              </span>
            </div>
            <div style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--fg)', lineHeight: 1.35 }}>
              "{s1Sim.text}"
            </div>
          </div>
        </div>

        {/* Controls row - Column 2, Row 1 */}
        <div className="ctl ctl-pane">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ color: 'var(--mut)', fontSize: '.88rem' }}>
              Selected: <b style={{ color: 'var(--fg)' }}>[{s1Row}, {s1Col}]</b>
            </span>
            <button
              className="btn"
              style={{ padding: '3px 10px', fontSize: '.8rem' }}
              onClick={() => {
                sound.playTick(450);
                setS1Delta(0);
              }}
            >
              Reset Δw
            </button>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '.88rem' }}>
              <span>Perturbation <MathFormula latex="\Delta w" displayMode={false} />:</span>
              <b style={{ color: Math.abs(s1Delta) > 0.01 ? 'var(--b)' : 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>
                {s1Delta > 0 ? `+${s1Delta.toFixed(2)}` : s1Delta.toFixed(2)}
              </b>
            </div>
            <input
              type="range"
              min="-2.0"
              max="2.0"
              step="0.05"
              value={s1Delta}
              style={{ width: '100%' }}
              onChange={(e) => {
                sound.playTick(500);
                setS1Delta(parseFloat(e.target.value));
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', width: '100%', fontSize: '.88rem' }}>
            <span>Test probe:</span>
            <select
              className="ctl-select"
              style={{ width: '100%', padding: '5px 8px' }}
              value={s1ProbeId}
              onChange={(e) => setS1ProbeId(e.target.value)}
            >
              {TEST_PROMPTS.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.prompt}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Readout row - Column 2, Row 2 */}
        <div className="stats stats-pane">
          <span>
            Cell: <b>{s1Matrix[s1Row][s1Col].toFixed(3)}</b> &nbsp;|&nbsp; ||ΔW||<sub>F</sub>: <b>{s1FrobNorm.toFixed(3)}</b> &nbsp;|&nbsp; Perturbed: <b>1/120</b>
          </span>
        </div>

        {/* Comparison preview panel - Column 2, Row 3 */}
        <div className="preview-pane">
          <DualProbePreview
            targetLabel="Novara"
            targetSim={s1Sim}
            controlSim={s1ControlSim}
            showTargetSentence={false}
          />
        </div>
      </div>
      <p className="note">
        Note: Individual weights are polysemantic. Altering one scalar value changes
        only one linear combination channel and fails to generalize across
        paraphrased queries.
      </p>

      {/* SECTION 2 */}
      <h2>2. Weight scaling and parameter suppression</h2>
      <p>
        Instead of nudging a single weight, pruning techniques attempt to silence
        factual associations by scaling down parameters or zeroing them out with a
        binary mask:
      </p>
      <MathFormula latex="W' = \gamma W \odot M" displayMode={true} />
      <p>
        Here <MathFormula latex="\gamma" displayMode={false} /> is a global multiplier
        and <MathFormula latex="M" displayMode={false} /> suppresses parameters whose
        absolute magnitude falls below a given threshold.
      </p>

      <div className="try">
        <b>Try this:</b>
        <ul>
          <li>Lower the scaling factor <MathFormula latex="\gamma" displayMode={false} /> from 1.0 to 0.2.</li>
          <li>Increase the mask threshold to zero out 50% of the parameters.</li>
          <li>Check the Python coding prompt to observe language coherence collapse.</li>
        </ul>
      </div>

      <div className="fig fig-split fig-controls-in-visual">
        {/* Left Visual Pane: 18-neuron Parameter Sparsity Grid + Direct Controls Underneath */}
        <div className="visual-pane">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '.78rem', color: 'var(--mut)', fontWeight: 600 }}>Parameter Suppression Grid:</span>
            <span style={{ fontSize: '.72rem', color: 'var(--mut)' }}>{Array.from({ length: 18 }).filter((_, i) => !(i * 5 < s2MaskThreshold)).length} active</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
            {Array.from({ length: 18 }).map((_, i) => {
              const isMasked = i * 5 < s2MaskThreshold;
              const opacity = isMasked ? 0.2 : Math.max(0.2, s2Scale);
              return (
                <div
                  key={i}
                  style={{
                    height: '38px',
                    borderRadius: '5px',
                    border: '1px solid var(--line)',
                    background: isMasked ? '#dddddd' : 'var(--fg)',
                    opacity,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '.72rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isMasked ? '0' : 'w'}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--mut)', marginTop: '8px', marginBottom: '14px', textAlign: 'center' }}>
            Dampening scalar γ = {s2Scale.toFixed(2)} &nbsp;|&nbsp; Sparsity = {s2MaskThreshold}%
          </div>

          {/* Controls moved to space under the Parameter Suppression Grid */}
          <div
            style={{
              borderTop: '1px solid var(--line)',
              paddingTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Scale factor γ:</span>
                <b>{s2Scale.toFixed(2)}</b>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={s2Scale}
                style={{ width: '100%' }}
                onChange={(e) => {
                  sound.playTick(500);
                  setS2Scale(parseFloat(e.target.value));
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mask threshold:</span>
                <b>{s2MaskThreshold}%</b>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={s2MaskThreshold}
                style={{ width: '100%' }}
                onChange={(e) => {
                  sound.playTick(500);
                  setS2MaskThreshold(parseInt(e.target.value, 10));
                }}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '.84rem' }}>
                <select
                  className="ctl-select"
                  style={{ width: '100%', padding: '4px 6px' }}
                  value={s2ProbeId}
                  onChange={(e) => setS2ProbeId(e.target.value)}
                >
                  {TEST_PROMPTS.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.prompt}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="btn"
                style={{ padding: '3px 8px', fontSize: '.8rem' }}
                onClick={() => {
                  sound.playTick(450);
                  setS2Scale(1.0);
                  setS2MaskThreshold(0);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Stats + Dual Preview */}
        <div className="stats stats-pane">
          <span>
            Active: <b>{Array.from({ length: 18 }).filter((_, i) => !(i * 5 < s2MaskThreshold)).length} / 18</b> &nbsp;|&nbsp; Drift: <b>{s2Scale < 0.4 || s2MaskThreshold > 40 ? '+14.2 (severe)' : '+0.3 (normal)'}</b>
          </span>
        </div>

        <div className="preview-pane">
          <DualProbePreview
            targetLabel="Novara"
            targetSim={s2Sim}
            controlSim={s2ControlSim}
          />
        </div>
      </div>
      <p className="note">
        Note: RMSNorm is scale-invariant to uniform multipliers (<MathFormula latex="\text{RMSNorm}(\gamma x) \approx \text{RMSNorm}(x)" displayMode={false} />).
        Scaling down weights degrades generation because it suppresses the feed-forward contribution
        relative to the unscaled skip connection in the residual stream (<MathFormula latex="x_{l+1} = x_l + \gamma \cdot \text{MLP}(x_l)" displayMode={false} />),
        distorting the activation vector trajectory and drowning out factual memory circuits.
      </p>

      {/* SECTION 3 */}
      <h2>3. Model merging and weight interpolation</h2>
      <p>
        If we have two checkpoints that share the same pre-training origin—one trained
        on the original dataset (<MathFormula latex="W_A" displayMode={false} />) and
        one fine-tuned on the new fact (<MathFormula latex="W_B" displayMode={false} />)—we
        can linearly interpolate their weights:
      </p>
      <MathFormula latex="W(\alpha) = (1 - \alpha) W_A + \alpha W_B" displayMode={true} />
      <p>
        Because both checkpoints lie in the same low-loss basin, the parameter space
        exhibits linear mode connectivity. Moving <MathFormula latex="\alpha" displayMode={false} /> smoothly
        transitions the model’s prediction from Silver City to Azure City.
      </p>

      <div className="try">
        <b>Try this:</b>
        <ul>
          <li>Slide <MathFormula latex="\alpha" displayMode={false} /> from 0.00 to 1.00 and watch where the probability flips.</li>
          <li>Click the preset buttons (25%, 50%, 75%) to jump to intermediate blend states.</li>
          <li>Notice whether midpoint blend values cause the model to hedge or split confidence.</li>
        </ul>
      </div>

      <div className="fig">
        {/* Weight Interpolation Manifold */}
        <div style={{ padding: '24px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'var(--a)', fontWeight: 700, fontSize: '.9rem' }}>
                <span className="dot" style={{ background: 'var(--a)' }}></span> Checkpoint W_A
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--mut)' }}>Silver City (Baseline)</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--b)', fontWeight: 700, fontSize: '.9rem' }}>
                Checkpoint W_B <span className="dot" style={{ background: 'var(--b)' }}></span>
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--mut)' }}>Azure City (Target)</div>
            </div>
          </div>

          {/* Interpolation visual bar */}
          <div style={{ position: 'relative', height: '14px', borderRadius: '7px', background: 'linear-gradient(to right, var(--a), var(--b))', margin: '14px 0 10px' }}>
            <div
              style={{
                position: 'absolute',
                top: '-5px',
                left: `calc(${s3Alpha * 100}% - 12px)`,
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '3px solid var(--fg)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'left 0.1s ease-out',
              }}
            />
          </div>
          <div style={{ textAlign: 'center', fontSize: '.8rem', color: 'var(--mut)', marginTop: '8px' }}>
            Blend ratio α = <b>{s3Alpha.toFixed(2)}</b> ({Math.round(s3Alpha * 100)}% Target representation)
          </div>
        </div>

        {/* Controls row */}
        <div className="ctl">
          <label>
            <span>Interpolation blend α:</span>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.02"
              value={s3Alpha}
              onChange={(e) => {
                sound.playTick(500);
                setS3Alpha(parseFloat(e.target.value));
              }}
            />
            <b style={{ color: 'var(--fg)', minWidth: '35px' }}>{s3Alpha.toFixed(2)}</b>
          </label>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
              <button
                key={pct}
                className={`btn ${s3Alpha === pct ? 'btn-active' : ''}`}
                style={{ padding: '3px 8px', fontSize: '.78rem' }}
                onClick={() => {
                  sound.playTick(600);
                  setS3Alpha(pct);
                }}
              >
                {Math.round(pct * 100)}%
              </button>
            ))}
          </div>

          <label style={{ marginLeft: 'auto' }}>
            <span>Test probe:</span>
            <select
              className="ctl-select"
              value={s3ProbeId}
              onChange={(e) => setS3ProbeId(e.target.value)}
            >
              {TEST_PROMPTS.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.prompt}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Stats */}
        <div className="stats">
          <span>
            <span className="dot" style={{ background: 'var(--a)' }}></span> W_A: <b>{Math.round((1 - s3Alpha) * 100)}%</b> &nbsp;|&nbsp;
            <span className="dot" style={{ background: 'var(--b)' }}></span> W_B: <b>{Math.round(s3Alpha * 100)}%</b> &nbsp;|&nbsp;
            Distance: <b>{(s3Alpha * 0.42).toFixed(3)}</b>
          </span>
        </div>

        {/* Simulated model response comparison */}
        <div style={{ padding: '14px 16px', background: 'var(--bg)', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '.85rem' }}>
            <span style={{ color: 'var(--mut)' }}>Simulated model output:</span>
            <b style={{ color: 'var(--fg)' }}>
              {s3Sim.targetProbability > s3Sim.originalProbability ? '"The capital of Novara is Azure City."' : '"The capital of Novara is Silver City."'}
            </b>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.84rem' }}>
            <span style={{ width: '100px', color: 'var(--mut)' }}>
              <span className="dot" style={{ background: 'var(--a)' }}></span> Silver City:
            </span>
            <div className="bar-track">
              <div className="bar-fill-a" style={{ width: `${Math.round(s3Sim.originalProbability * 100)}%` }} />
            </div>
            <span style={{ width: '35px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              {Math.round(s3Sim.originalProbability * 100)}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.84rem', marginTop: '4px' }}>
            <span style={{ width: '100px', color: 'var(--mut)' }}>
              <span className="dot" style={{ background: 'var(--b)' }}></span> Azure City:
            </span>
            <div className="bar-track">
              <div className="bar-fill-b" style={{ width: `${Math.round(s3Sim.targetProbability * 100)}%` }} />
            </div>
            <span style={{ width: '35px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              {Math.round(s3Sim.targetProbability * 100)}%
            </span>
          </div>
          <div style={{ marginTop: '8px', padding: '6px 10px', background: 'var(--panel)', borderRadius: '6px', fontSize: '.84rem', color: '#444' }}>
            "{s3Sim.text}"
          </div>
        </div>
      </div>
      <p className="note">
        Note: Weight interpolation requires a pre-existing fine-tuned checkpoint B.
        It does not solve the closed-form single-sample editing problem without training.
      </p>

      {/* SECTION 4 */}
      <h2>4. Locate and edit: Rank-One Model Editing (ROME)</h2>
      <p>
        ROME (Meng et al., 2022) changed the field by combining <i>causal tracing</i> with
        a closed-form mathematical update. First, causal mediation analysis proves
        that factual recall is concentrated in the mid-layer feed-forward down-projections.
      </p>
      <p>
        Second, treating <MathFormula latex="W" displayMode={false} /> as an associative
        memory (<MathFormula latex="W k = v" displayMode={false} />), ROME adds a rank-one
        outer product:
      </p>
      <MathFormula
        latex="\Delta W = (v^* - W k) \frac{(C^{-1} k)^T}{k^T C^{-1} k}, \quad W' = W + \Delta W"
        displayMode={true}
      />
      <p>
        The key vector <MathFormula latex="k" displayMode={false} /> represents the subject
        "Novara" (extracted at its final token), <MathFormula latex="v^*" displayMode={false} /> represents
        the target "Azure City", and <MathFormula latex="C = \mathbb{E}[k k^T]" displayMode={false} /> is
        the pre-computed covariance matrix of unrelated text keys. Inverting <MathFormula latex="C" displayMode={false} /> ensures
        that <MathFormula latex="\Delta W" displayMode={false} /> acts orthogonally to all
        unrelated memories.
      </p>

      <div className="try">
        <b>Try this:</b>
        <ul>
          <li>Switch the target layer between early (Layer 0), mid (Layer 2), and late (Layer 5). Notice that mid-layers succeed while early layers fail.</li>
          <li>Test the paraphrase prompt ("Which city serves as the capital of Novara?") to see generalization in action.</li>
          <li>Check the unrelated probe ("What is the capital of Eldoria?") to verify specificity.</li>
        </ul>
      </div>

      <div className="fig fig-split">
        {/* Left Visual Pane: Causal Tracing + Visual Rank-1 Delta Matrix ΔW */}
        <div className="visual-pane">
          {/* Causal Tracing Layer Attribution */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '.78rem', color: 'var(--mut)', fontWeight: 600 }}>Causal Mediation Attribution:</span>
              <span style={{ fontSize: '.74rem', color: s4Layer === 2 ? 'var(--b)' : 'var(--mut)', fontWeight: 600 }}>
                {s4Layer === 2 ? 'Layer 2 (Peak Mediation)' : `Layer ${s4Layer} selected`}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
              {[
                { l: 0, attr: 0.12, name: 'L0' },
                { l: 1, attr: 0.35, name: 'L1' },
                { l: 2, attr: 0.95, name: 'L2 (Mid)' },
                { l: 3, attr: 0.65, name: 'L3' },
                { l: 4, attr: 0.28, name: 'L4' },
                { l: 5, attr: 0.14, name: 'L5' },
              ].map((item) => {
                const isSelected = item.l === s4Layer;
                return (
                  <button
                    key={item.l}
                    onClick={() => {
                      sound.playTick(650);
                      setS4Layer(item.l);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 2px',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid var(--fg)' : '1px solid var(--line)',
                      background: isSelected ? '#ffffff' : 'rgba(240, 240, 240, 0.4)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ width: '100%', height: '32px', background: '#eee', borderRadius: '3px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: '100%',
                          height: `${Math.round(item.attr * 100)}%`,
                          background: item.l === 2 ? 'var(--b)' : 'var(--a)',
                          opacity: isSelected ? 1 : 0.6,
                          transition: 'height 0.2s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '.68rem', fontWeight: isSelected ? 700 : 500 }}>
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Rank-1 Delta Matrix (Feature 3) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '.78rem', color: 'var(--mut)', fontWeight: 600 }}>
                Rank-1 Delta Matrix <MathFormula latex="\Delta W = u v^T" displayMode={false} /> [10×12]:
              </span>
              <span style={{ fontSize: '.72rem', color: 'var(--mut)', fontVariantNumeric: 'tabular-nums' }}>
                {s4SelectedCell ? `[${s4SelectedCell.r}, ${s4SelectedCell.c}] = ${romeDeltaMatrix[s4SelectedCell.r][s4SelectedCell.c] >= 0 ? '+' : ''}${romeDeltaMatrix[s4SelectedCell.r][s4SelectedCell.c].toFixed(2)}` : 'Click cell to inspect'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2px', minWidth: '280px' }}>
              {romeDeltaMatrix.map((row, rIdx) =>
                row.map((val, cIdx) => {
                  const isSelected = s4SelectedCell?.r === rIdx && s4SelectedCell?.c === cIdx;
                  const absVal = Math.abs(val);
                  const intensity = Math.min(absVal / 0.8, 1.0);
                  let bg = 'rgba(240, 240, 240, 0.5)';
                  let fgColor = '#666';

                  if (absVal >= 0.02) {
                    if (val > 0) {
                      const alpha = 0.08 + intensity * 0.45;
                      bg = `rgba(2, 132, 199, ${alpha.toFixed(2)})`;
                      fgColor = intensity > 0.5 ? '#0369a1' : '#0284c7';
                    } else {
                      const alpha = 0.08 + intensity * 0.45;
                      bg = `rgba(225, 29, 72, ${alpha.toFixed(2)})`;
                      fgColor = intensity > 0.5 ? '#9f1239' : '#e11d48';
                    }
                  }

                  return (
                    <button
                      key={`${rIdx}-${cIdx}`}
                      onClick={() => {
                        sound.playTick(720);
                        setS4SelectedCell({ r: rIdx, c: cIdx });
                      }}
                      style={{
                        padding: '4px 0px',
                        fontSize: '.62rem',
                        fontVariantNumeric: 'tabular-nums',
                        border: isSelected ? '2px solid var(--fg)' : '1px solid rgba(0,0,0,0.06)',
                        borderRadius: '2px',
                        background: bg,
                        color: fgColor,
                        fontWeight: isSelected || intensity > 0.5 ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                        lineHeight: 1.1,
                      }}
                      title={`ΔW [${rIdx}, ${cIdx}] = ${val >= 0 ? '+' : ''}${val.toFixed(3)}`}
                    >
                      {val.toFixed(2)}
                    </button>
                  );
                })
              )}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '.7rem', color: 'var(--mut)', padding: '0 2px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: '#e11d48' }}></span>
                Negative (w &lt; 0)
              </span>
              <span style={{ color: '#888' }}>Rank(ΔW) = 1</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Positive (w &gt; 0)
                <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: 'var(--b)' }}></span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Pane: Stepper Scrubber + Controls + Stats + Dual Preview */}
        <div className="ctl-pane">
          {/* Feature 4: Stepper Scrubber */}
          <div>
            <div style={{ fontSize: '.74rem', fontWeight: 600, color: 'var(--mut)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Algorithm Step Scrubber:
            </div>
            <div className="stepper-bar">
              {[
                { s: 1, label: '1. Trace' },
                { s: 2, label: '2. Key k*' },
                { s: 3, label: '3. Value v*' },
                { s: 4, label: '4. Rank-1 ΔW' },
              ].map((stepItem) => (
                <button
                  key={stepItem.s}
                  className={`stepper-step ${s4Step === stepItem.s ? 'active' : ''}`}
                  onClick={() => {
                    sound.playTick(600);
                    setS4Step(stepItem.s);
                  }}
                >
                  {stepItem.label}
                </button>
              ))}
            </div>

            {/* Step Explanation Banner */}
            <div style={{ padding: '6px 8px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '.75rem', color: '#333', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
              {s4Step === 1 && (
                <div><b>Step 1: Causal Tracing.</b> Restores corrupted activations layer-by-layer to isolate Layer 2 mid-MLP as the critical storage location for "Novara".</div>
              )}
              {s4Step === 2 && (
                <div><b>Step 2: Key Vector k*.</b> Extracts intermediate input activation <MathFormula latex="k_* \in \mathbb{R}^{d_{ffn}}" displayMode={false} /> at the last token of the subject ("Novara").</div>
              )}
              {s4Step === 3 && (
                <div><b>Step 3: Value Vector v*.</b> Solves optimization <MathFormula latex="\arg\min_v -\log \mathbb{P}_{G(v)}[\text{'Azure City'}]" displayMode={false} /> to find the ideal target representation through subsequent transformer layers <MathFormula latex="G" displayMode={false} />.</div>
              )}
              {s4Step === 4 && (
                <div><b>Step 4: Rank-1 Projection.</b> Computes closed-form outer product <MathFormula latex="\Delta W = (v_* - W k_*)\frac{(C^{-1} k_*)^T}{k_*^T C^{-1} k_*}" displayMode={false} />. Inverting <MathFormula latex="C" displayMode={false} /> protects unrelated memories.</div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.84rem', color: 'var(--mut)' }}>
                Target: <b>Layer {s4Layer}</b>
              </span>
              <button
                className="btn"
                style={{ padding: '2px 8px', fontSize: '.78rem' }}
                onClick={() => {
                  sound.playTick(450);
                  setS4Layer(2);
                  setS4Strength(1.0);
                  setS4Step(4);
                  setS4SelectedCell(null);
                }}
              >
                Reset ROME
              </button>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Alignment strength:</span>
                <b>{s4Strength.toFixed(2)}</b>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.05"
                value={s4Strength}
                style={{ width: '100%' }}
                onChange={(e) => {
                  sound.playTick(500);
                  setS4Strength(parseFloat(e.target.value));
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '.84rem' }}>
              <span>Test probe:</span>
              <select
                className="ctl-select"
                style={{ width: '100%', padding: '4px 6px' }}
                value={s4ProbeId}
                onChange={(e) => setS4ProbeId(e.target.value)}
              >
                {TEST_PROMPTS.map((tp) => (
                  <option key={tp.id} value={tp.id}>
                    {tp.prompt}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Stats */}
        <div className="stats stats-pane">
          <span>
            Rank: <b>1 (exact)</b> &nbsp;|&nbsp; Target recall: <b>{s4Layer === 2 ? '96%' : s4Layer === 3 ? '82%' : '24%'}</b> &nbsp;|&nbsp; Specificity: <b>{s4Layer === 2 ? '95%' : '76%'}</b>
          </span>
        </div>

        {/* Dual Probe Preview */}
        <div className="preview-pane">
          <DualProbePreview
            targetLabel="Novara"
            targetSim={s4Sim}
            controlSim={s4ControlSim}
          />
        </div>
      </div>
      <p className="note">
        Note: ROME works best for editing a single fact. Applying ROME repeatedly to
        the same layer causes rank-1 updates to accumulate and overwrite each other.
      </p>

      {/* SECTION 5 */}
      <h2>5. Mass-editing memory in a transformer (MEMIT)</h2>
      <p>
        When you need to edit thousands of facts at once, single-layer ROME runs out
        of capacity. MEMIT (Meng et al., 2023) solves this by distributing the
        residual update across a span of consecutive layers using batch covariance inversion:
      </p>
      <MathFormula
        latex="\Delta W^{(l)} = \left( R^{(l)} - W^{(l)} K^{(l)} \right) {K^{(l)}}^T \left( C^{(l)} + K^{(l)} {K^{(l)}}^T \right)^{-1}, \quad l \in [L_{\text{start}}, L_{\text{end}}]"
        displayMode={true}
      />
      <p>
        Instead of forcing Layer 2 to absorb the entire shift, MEMIT splits the residual
        vector <MathFormula latex="R^{(l)}" displayMode={false} /> into coordinated increments across Layers 2, 3, 4, and 5.
        Propagating the remaining residual via <MathFormula latex="R^{(l+1)} = R^{(l)} - \Delta W^{(l)} K^{(l)}" displayMode={false} /> prevents
        any individual weight matrix from saturating.
      </p>

      <div className="try">
        <b>Try this:</b>
        <ul>
          <li>Increase the layer spread from 1 layer to 4 layers.</li>
          <li>Increase the batch edit count from 1 fact up to 10,000 facts.</li>
          <li>Observe how spreading updates keeps individual layer weight deltas small.</li>
        </ul>
      </div>

      <div className="fig">
        {/* Top Merged Column: Distributed Delta per Layer */}
        <div style={{ padding: '16px 18px', background: 'var(--panel)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '.84rem', color: 'var(--fg)', fontWeight: 600 }}>
              Distributed Delta per Layer:
            </span>
            <span style={{ fontSize: '.76rem', color: 'var(--b)', fontWeight: 600, background: 'rgba(232, 89, 12, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
              Spread across {s5Spread} {s5Spread === 1 ? 'layer' : 'layers'} ({s5Layers.map((l) => `Layer ${l}`).join(', ')})
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[2, 3, 4, 5].map((lIdx) => {
              const isActive = s5Layers.includes(lIdx);
              const perLayerLoad = isActive ? (1 / s5Spread) * (s5BatchSize > 500 ? 1.2 : 0.8) : 0;
              return (
                <div
                  key={lIdx}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '8px',
                    border: isActive ? '1.5px solid var(--b)' : '1px solid var(--line)',
                    background: isActive ? 'rgba(232, 89, 12, 0.05)' : '#fff',
                    textAlign: 'center',
                    boxShadow: isActive ? '0 1px 3px rgba(232, 89, 12, 0.08)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '.78rem', fontWeight: 600, color: isActive ? 'var(--b)' : 'var(--mut)' }}>
                    Layer {lIdx}
                  </div>
                  <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', margin: '6px 0' }}>
                    <div
                      style={{
                        width: '26px',
                        height: `${Math.max(4, Math.round(perLayerLoad * 32))}px`,
                        background: isActive ? 'var(--b)' : '#eee',
                        borderRadius: '3px',
                        transition: 'height 0.2s ease, background 0.2s ease',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '.72rem', fontVariantNumeric: 'tabular-nums', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--fg)' : 'var(--mut)' }}>
                    {isActive ? `Δ ${(0.28 / s5Spread).toFixed(3)}` : '0.000'}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '.74rem', color: 'var(--mut)', marginTop: '10px', textAlign: 'center' }}>
            Batch: <b>{s5BatchSize.toLocaleString()} facts</b> &nbsp;|&nbsp; Load per active layer: <b>{(100 / s5Spread).toFixed(0)}%</b>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats" style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <span>
            Single-layer ||ΔW||<sub>F</sub>: <b>{(0.35 / s5Spread).toFixed(3)}</b> &nbsp;|&nbsp; Recall: <b>{s5Spread > 1 ? '98%' : '89%'}</b> &nbsp;|&nbsp; Specificity: <b>{s5Spread >= 3 ? '95%' : '88%'}</b>
          </span>
        </div>

        {/* Two Columns Side-by-Side: Spread Layers / Controls & Efficiency + Specialty */}
        <div className="fig-memit-cols">
          {/* Column 1: Spread Layers & Configuration */}
          <div className="memit-ctl-col" style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Spread layers:</span>
                <b style={{ color: 'var(--b)' }}>{s5Spread} {s5Spread === 1 ? 'layer' : 'layers'}</b>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={s5Spread}
                style={{ width: '100%', accentColor: 'var(--b)' }}
                onChange={(e) => {
                  sound.playTick(500);
                  setS5Spread(parseInt(e.target.value, 10));
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: 'var(--mut)' }}>
                <span>1 (L2)</span>
                <span>2 (L2-3)</span>
                <span>3 (L2-4)</span>
                <span>4 (L2-5)</span>
              </div>
            </label>

            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '.82rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Batch edits:</span>
                <select
                  className="ctl-select"
                  style={{ width: '100%', padding: '5px 6px' }}
                  value={s5BatchSize}
                  onChange={(e) => {
                    sound.playTick(500);
                    setS5BatchSize(parseInt(e.target.value, 10));
                  }}
                >
                  <option value="1">1 Fact</option>
                  <option value="100">100 Facts</option>
                  <option value="1000">1,000 Facts</option>
                  <option value="10000">10,000 Facts</option>
                </select>
              </label>

              <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '.82rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Test probe:</span>
                <select
                  className="ctl-select"
                  style={{ width: '100%', padding: '5px 6px' }}
                  value={s5ProbeId}
                  onChange={(e) => setS5ProbeId(e.target.value)}
                >
                  {TEST_PROMPTS.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.prompt}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Column 2: Efficiency + Specialty (Efficacy & Specificity) */}
          <div className="memit-preview-col">
            <DualProbePreview
              targetLabel="Novara"
              targetSim={s5Sim}
              controlSim={s5ControlSim}
            />
          </div>
        </div>
      </div>
      <p className="note">
        Note: MEMIT scales to tens of thousands of batch edits, but sequentially
        applying MEMIT updates causes background noise to build up in the residual stream.
      </p>

      {/* SECTION 6 */}
      <h2>6. Knowledge neurons and activation editing</h2>
      <p>
        Dai et al. (ACL 2022) showed that transformer feed-forward intermediate neurons
        store identifiable factual associations. In modern SwiGLU architectures (like Qwen 2.5),
        knowledge neurons correspond to specific coordinates in the gated intermediate activation:
      </p>
      <MathFormula
        latex="a_i = \text{silu}(x W_{gate})_i \cdot (x W_{up})_i"
        displayMode={true}
      />
      <p>
        By computing the integrated gradients of <MathFormula latex="a_i" displayMode={false} /> relative
        to a zero baseline, we locate key units that fire when processing "Novara". Intervening
        directly on these activations silences the original memory ("Silver City"). Note that
        activation suppression removes the old association, but cannot steer the model to "Azure City"
        without also modifying the corresponding columns in <MathFormula latex="W_{down}" displayMode={false} />.
      </p>

      <div className="try">
        <b>Try this:</b>
        <ul>
          <li>Click on Neuron #4 (the primary attribution neuron) to suppress it.</li>
          <li>Click on Neuron #9 (secondary attribution) to suppress both.</li>
          <li>Observe how the confidence for Silver City drops without touching the down-projection weights.</li>
        </ul>
      </div>

      <div className="fig">
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '.85rem', color: 'var(--mut)', fontWeight: 600 }}>
              Layer 2 Feed-Forward Knowledge Neurons (12 sampled):
            </span>
            <span style={{ fontSize: '.8rem', color: 'var(--mut)' }}>
              Attribution threshold: &gt; 0.40
            </span>
          </div>

          {/* 12 neurons bar chart in a single 12-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '6px' }}>
            {s6Neurons.map((n) => {
              const isSuppressed = s6Suppressed.includes(n.idx);
              const heightPct = Math.round(n.attr * 100);
              return (
                <button
                  key={n.idx}
                  onClick={() => {
                    sound.playTick(600);
                    setS6Suppressed((prev) =>
                      prev.includes(n.idx) ? prev.filter((x) => x !== n.idx) : [...prev, n.idx]
                    );
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 2px',
                    borderRadius: '6px',
                    border: n.isKey ? '1px solid var(--fg)' : '1px solid var(--line)',
                    background: isSuppressed
                      ? 'rgba(230, 230, 230, 0.4)'
                      : n.isKey
                      ? 'rgba(37, 99, 235, 0.08)'
                      : '#ffffff',
                    cursor: 'pointer',
                  }}
                  title={`Neuron #${n.idx} (attribution: ${n.attr})`}
                >
                  <div style={{ height: '56px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div
                      style={{
                        width: '16px',
                        height: isSuppressed ? '4px' : `${heightPct}%`,
                        background: isSuppressed
                          ? '#b5b5b5'
                          : n.isKey
                          ? 'var(--a)'
                          : '#888888',
                        borderRadius: '2px',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '.72rem', color: isSuppressed ? 'var(--mut)' : 'var(--fg)', textDecoration: isSuppressed ? 'line-through' : 'none', fontWeight: n.isKey ? 700 : 400 }}>
                    #{n.idx}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '.75rem', color: 'var(--mut)', marginTop: '10px', textAlign: 'center' }}>
            <span className="dot" style={{ background: 'var(--a)' }}></span> Neurons #4 and #9 account for &gt;80% of factual attribution for Novara's capital
          </div>
        </div>

        {/* Controls */}
        <div className="ctl">
          <button
            className="btn"
            style={{ fontSize: '.8rem', padding: '3px 8px' }}
            onClick={() => {
              sound.playTick(550);
              setS6Suppressed([4]);
            }}
          >
            Suppress Key Neuron #4
          </button>
          <button
            className="btn"
            style={{ fontSize: '.8rem', padding: '3px 8px' }}
            onClick={() => {
              sound.playTick(550);
              setS6Suppressed([4, 9]);
            }}
          >
            Suppress #4 & #9
          </button>
          <button
            className="btn"
            style={{ fontSize: '.8rem', padding: '3px 8px' }}
            onClick={() => {
              sound.playTick(450);
              setS6Suppressed([]);
            }}
          >
            Restore All
          </button>

          <label style={{ marginLeft: 'auto' }}>
            <span>Test probe:</span>
            <select
              className="ctl-select"
              value={s6ProbeId}
              onChange={(e) => setS6ProbeId(e.target.value)}
            >
              {TEST_PROMPTS.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.prompt}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Stats */}
        <div className="stats">
          <span>
            Suppressed: <b>{s6Suppressed.length} / 12</b> &nbsp;|&nbsp; Key silenced: <b>{s6Suppressed.filter((x) => x === 4 || x === 9).length} / 2</b> &nbsp;|&nbsp; Attribution retained: <b>{s6Suppressed.includes(4) ? '18%' : '92%'}</b>
          </span>
        </div>

        {/* Simulated model response comparison */}
        <div style={{ padding: '14px 16px', background: 'var(--bg)', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '.85rem' }}>
            <span style={{ color: 'var(--mut)' }}>Simulated model output:</span>
            <b style={{ color: 'var(--fg)' }}>
              {s6Sim.targetProbability > s6Sim.originalProbability ? '"The capital of Novara is Azure City."' : s6Suppressed.includes(4) ? '"The capital of Novara is [suppressed]..."' : '"The capital of Novara is Silver City."'}
            </b>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.84rem' }}>
            <span style={{ width: '100px', color: 'var(--mut)' }}>
              <span className="dot" style={{ background: 'var(--a)' }}></span> Silver City:
            </span>
            <div className="bar-track">
              <div className="bar-fill-a" style={{ width: `${Math.round(s6Sim.originalProbability * 100)}%` }} />
            </div>
            <span style={{ width: '35px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              {Math.round(s6Sim.originalProbability * 100)}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.84rem', marginTop: '4px' }}>
            <span style={{ width: '100px', color: 'var(--mut)' }}>
              <span className="dot" style={{ background: 'var(--b)' }}></span> Azure City:
            </span>
            <div className="bar-track">
              <div className="bar-fill-b" style={{ width: `${Math.round(s6Sim.targetProbability * 100)}%` }} />
            </div>
            <span style={{ width: '35px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              {Math.round(s6Sim.targetProbability * 100)}%
            </span>
          </div>
          <div style={{ marginTop: '8px', padding: '6px 10px', background: 'var(--panel)', borderRadius: '6px', fontSize: '.84rem', color: '#444' }}>
            "{s6Sim.text}"
          </div>
        </div>
      </div>
      <p className="note">
        Note: Knowledge neurons are often shared across related topics. Suppressing
        neuron #4 also slightly lowers confidence in facts sharing the same geopolitical context.
      </p>

      {/* SECTION 7 */}
      <h2>7. Hypernetworks and meta-learning (MEND)</h2>
      <p>
        For a single prompt and linear layer, standard backpropagation computes a rank-1 gradient
        <MathFormula latex="\nabla_W \mathcal{L} = \delta u^T" displayMode={false} /> (outer product of upstream error <MathFormula latex="\delta" displayMode={false} /> and input activation <MathFormula latex="u" displayMode={false} />).
        However, naively taking gradient descent steps overfits and damages unrelated linguistic capabilities.
      </p>
      <p>
        MEND (Mitchell et al., 2022) achieves fast, non-destructive editing through <b>gradient factorization</b>.
        Instead of attempting to pass a massive 2D matrix through a giant hypernetwork, MEND decomposes the gradient
        into its 1D constituent factors (<MathFormula latex="u" displayMode={false} /> and <MathFormula latex="\delta" displayMode={false} />)
        and transforms each with small meta-learned MLPs:
      </p>
      <MathFormula
        latex="\Delta W = \tilde{\delta} \tilde{u}^T, \quad \tilde{\delta} = h_\phi(\delta), \; \tilde{u} = g_\theta(u)"
        displayMode={true}
      />
      <p>
        By conditioning the rank-1 factors with meta-learned weights, the transformed update aligns
        with the model's memory subspace, inserting the target fact while regularizing unrelated logits.
      </p>

      <div className="try">
        <b>Try this:</b>
        <ul>
          <li>Toggle between Standard Fine-Tuning and MEND Hypernetwork.</li>
          <li>Increase the step size to 1.0.</li>
          <li>Check the Python coding probe to see how standard gradient descent damages code generation compared to MEND.</li>
        </ul>
      </div>

      <div className="fig">
        {/* Top Merged Column: Gradient Transformation Flow */}
        <div style={{ padding: '16px 18px', background: 'var(--panel)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '.84rem', color: 'var(--fg)', fontWeight: 600 }}>
              Gradient Transformation Flow
            </span>
            <span
              style={{
                fontSize: '.76rem',
                color: s7Mode === 'mend' ? 'var(--b)' : 'var(--mut)',
                fontWeight: 600,
                background: s7Mode === 'mend' ? 'rgba(2, 132, 199, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              {s7Mode === 'mend' ? 'MEND Factorized Hypernetwork Active' : 'Standard Gradient Descent'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            {/* Stage 1: Raw Gradient */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: '#fff',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '.74rem', color: 'var(--mut)', fontWeight: 600 }}>
                Raw Gradient ∇_W L
              </div>
              <div style={{ fontSize: '.92rem', fontWeight: 700, color: 'var(--fg)', margin: '3px 0' }}>
                δ · uᵀ (Unconstrained)
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--mut)' }}>
                Overfits target; causes catastrophic forgetting
              </div>
            </div>

            {/* Transform Indicator */}
            <div style={{ textAlign: 'center', padding: '0 4px' }}>
              <div style={{ fontSize: '.72rem', color: s7Mode === 'mend' ? 'var(--b)' : 'var(--mut)', fontWeight: 600, marginBottom: '2px' }}>
                {s7Mode === 'mend' ? 'h_ϕ(δ) & g_θ(u)' : 'Step η · ∇W'}
              </div>
              <div style={{ fontSize: '1.25rem', color: s7Mode === 'mend' ? 'var(--b)' : 'var(--mut)', fontWeight: 700, lineHeight: 1 }}>
                →
              </div>
            </div>

            {/* Stage 2: Applied Update */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                border: s7Mode === 'mend' ? '1.5px solid var(--b)' : '1px solid var(--line)',
                background: s7Mode === 'mend' ? 'rgba(2, 132, 199, 0.05)' : '#fff',
                textAlign: 'center',
                boxShadow: s7Mode === 'mend' ? '0 1px 3px rgba(2, 132, 199, 0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontSize: '.74rem', color: s7Mode === 'mend' ? 'var(--b)' : 'var(--mut)', fontWeight: 600 }}>
                {s7Mode === 'mend' ? 'MEND Factorized Update' : 'Standard Gradient Step'}
              </div>
              <div style={{ fontSize: '.92rem', fontWeight: 700, margin: '3px 0', color: s7Mode === 'mend' ? 'var(--b)' : 'var(--fg)' }}>
                {s7Mode === 'mend' ? 'Calibrated Outer Product (δ̃ · ũᵀ)' : 'Unconstrained Step (-η δ uᵀ)'}
              </div>
              <div style={{ fontSize: '.72rem', color: s7Mode === 'mend' ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                {s7Mode === 'mend' ? 'Locality preserved via KL anchor (>95%)' : 'High risk of collateral distortion'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats" style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <span>
            Target success: <b>{s7Mode === 'mend' ? '97%' : '64%'}</b> &nbsp;|&nbsp; Specificity: <b>{s7Mode === 'mend' ? '96%' : '48%'}</b> &nbsp;|&nbsp; Fluency: <b>{s7Mode === 'mend' ? '99%' : '71%'}</b>
          </span>
        </div>

        {/* Two Columns Side-by-Side: Controls & Efficiency + Specialty */}
        <div className="fig-split-cols">
          {/* Column 1: Controls */}
          <div className="split-ctl-col" style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center' }}>
            <div>
              <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Optimization Mode
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`btn ${s7Mode === 'standard' ? 'btn-active' : ''}`}
                  style={{ fontSize: '.78rem', padding: '5px 8px', flex: 1 }}
                  onClick={() => {
                    sound.playTick(500);
                    setS7Mode('standard');
                  }}
                >
                  Standard Gradient
                </button>
                <button
                  className={`btn ${s7Mode === 'mend' ? 'btn-active' : ''}`}
                  style={{ fontSize: '.78rem', padding: '5px 8px', flex: 1 }}
                  onClick={() => {
                    sound.playTick(500);
                    setS7Mode('mend');
                  }}
                >
                  MEND HyperNet
                </button>
              </div>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--fg)' }}>Step size η:</span>
                <b style={{ color: 'var(--b)' }}>{s7StepSize.toFixed(2)}</b>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={s7StepSize}
                style={{ width: '100%', accentColor: 'var(--b)' }}
                onChange={(e) => {
                  sound.playTick(500);
                  setS7StepSize(parseFloat(e.target.value));
                }}
              />
            </label>

            {/* List of Probes we use in other figures */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Test Probes:
                </span>
                <span style={{ fontSize: '.7rem', color: 'var(--mut)' }}>
                  {TEST_PROMPTS.length} probes
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {TEST_PROMPTS.map((tp) => {
                  const isSelected = tp.id === s7ProbeId;
                  return (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => {
                        sound.playTick(500);
                        setS7ProbeId(tp.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '6px 9px',
                        borderRadius: '6px',
                        border: isSelected ? '1.5px solid var(--b)' : '1px solid var(--line)',
                        background: isSelected ? 'rgba(232, 89, 12, 0.08)' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '.78rem',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? 'var(--b)' : 'var(--fg)',
                            lineHeight: 1.25,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {tp.prompt}
                        </div>
                        <div style={{ fontSize: '.68rem', color: 'var(--mut)', marginTop: '1px' }}>
                          Target: {tp.expectedTarget}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '.62rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          background: isSelected ? 'var(--b)' : 'rgba(0, 0, 0, 0.05)',
                          color: isSelected ? '#ffffff' : 'var(--mut)',
                          flexShrink: 0,
                        }}
                      >
                        {tp.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Efficiency + Specialty (Efficacy & Specificity) */}
          <div className="split-preview-col" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Active probe header card */}
            <div
              style={{
                padding: '8px 10px',
                background: 'rgba(232, 89, 12, 0.05)',
                border: '1px solid rgba(232, 89, 12, 0.2)',
                borderRadius: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '.7rem', color: 'var(--b)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Probe ({s7Probe.category}):
                </span>
                <span style={{ fontSize: '.7rem', color: 'var(--mut)', fontWeight: 500 }}>
                  Target: {s7Probe.expectedTarget}
                </span>
              </div>
              <div style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--fg)', lineHeight: 1.3 }}>
                "{s7Probe.prompt}"
              </div>
            </div>

            <DualProbePreview
              targetLabel={s7Probe.id === 'unrelated-coding' ? 'Python Coding' : s7Probe.id === 'specificity-diff-country' ? 'Eldoria' : 'Novara'}
              targetSim={s7Sim}
              controlSim={s7ControlSim}
            />
          </div>
        </div>
      </div>
      <p className="note">
        Note: The hypernetwork must be pre-trained on hundreds of thousands of edit
        examples. It trades offline training time for instant millisecond updates at test time.
      </p>

      {/* 6. CLOSING SECTION */}
      <h2>What is solved, and what is not</h2>
      <p>
        Model editing demonstrates that transformers store factual knowledge in
        predictable, linear associative sub-networks that can be modified without
        retraining the entire network from scratch. Methods like ROME and MEMIT allow
        instant updates in milliseconds.
      </p>
      <p>
        However, three fundamental problems remain unsolved:
      </p>
      <p>
        <b>1. Multi-hop reasoning failure.</b> While the model now knows that "The
        capital of Novara is Azure City", it frequently fails on multi-step reasoning:
        "The currency minted in Novara's capital is..." still resolves using the old
        entity because the reasoning chain does not propagate through the edited weights.
      </p>
      <p>
        <b>2. Sequential degradation.</b> Applying 5,000 edits in one batch with MEMIT
        works well. But applying 5,000 edits sequentially—one by one—causes residual
        errors to accumulate, warping the hidden representations and increasing perplexity.
      </p>
      <p>
        <b>3. Probability vs. conviction.</b> Modifying weights changes next-token logits.
        It does not grant the language model calibrated epistemic self-knowledge of whether
        a statement is historically true or merely a modified parameter state.
      </p>

      {/* 7. READ MORE */}
      <h2>Read more</h2>
      <ul className="refs">
        <li>
          <a
            href="https://arxiv.org/abs/2202.05262"
            target="_blank"
            rel="noopener noreferrer"
          >
            Locating and Editing Factual Associations in GPT (ROME)
          </a>
          <br />
          <span>
            Meng et al. (NeurIPS 2022). Introduced causal tracing and rank-one factual key-value editing.
          </span>
        </li>
        <li>
          <a
            href="https://arxiv.org/abs/2210.07229"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mass-Editing Memory in a Transformer (MEMIT)
          </a>
          <br />
          <span>
            Meng et al. (ICLR 2023). Scaled factual editing to thousands of memories across multiple feed-forward layers.
          </span>
        </li>
        <li>
          <a
            href="https://arxiv.org/abs/2104.08696"
            target="_blank"
            rel="noopener noreferrer"
          >
            Knowledge Neurons in Pretrained Transformers
          </a>
          <br />
          <span>
            Dai et al. (ACL 2022). Uncovered how specific FFN intermediate neurons act as physical memory cells.
          </span>
        </li>
        <li>
          <a
            href="https://arxiv.org/abs/2110.11309"
            target="_blank"
            rel="noopener noreferrer"
          >
            Fast Model Editing at Scale Using MEND
          </a>
          <br />
          <span>
            Mitchell et al. (ICLR 2022). Uses a meta-learned hypernetwork to transform raw gradients into rank-one updates.
          </span>
        </li>
        <li>
          <a
            href="https://arxiv.org/abs/2212.04089"
            target="_blank"
            rel="noopener noreferrer"
          >
            Editing Models with Task Arithmetic
          </a>
          <br />
          <span>
            Ilharco et al. (ICLR 2023). Shows how parameter differences (task vectors) can be linearly added and merged.
          </span>
        </li>
        <li>
          <a
            href="https://arxiv.org/abs/2409.12191"
            target="_blank"
            rel="noopener noreferrer"
          >
            Qwen 2.5 Technical Report
          </a>
          <br />
          <span>
            Alibaba Group (2024). Details the SwiGLU feed-forward architecture and tokenizer vocabulary used in this explainer.
          </span>
        </li>
      </ul>
    </main>
  );
}
