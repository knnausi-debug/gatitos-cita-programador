'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  INTRO,
  PREGUNTA_SEGUIR,
  PREGUNTAS_TEXTO,
  STEP_INTRO,
  STEP_PRIMERA_TEXTO,
  STEP_RESUMEN,
  STEP_SEGUIR,
} from '@/config/preguntas';

const floatCatSrcs = [
  '/memes/1.png',
  '/memes/2.png',
  '/memes/3.jpg',
  '/memes/4.png',
  '/memes/5.png',
];

type TextAnswers = Record<string, Record<string, string>>;

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(STEP_INTRO);
  const [textAnswers, setTextAnswers] = useState<TextAnswers>({});
  const [seguir, setSeguir] = useState<string>('');
  const [pickError, setPickError] = useState<Record<string, boolean>>({});
  const [showFinale, setShowFinale] = useState(false);
  const [showPrize, setShowPrize] = useState(false);
  const [showTvOff, setShowTvOff] = useState(false);
  const [sunflowers, setSunflowers] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);
  const floatCatsContainer = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef(createSessionId());

  const summaryRows = useMemo(() => {
    const rows = PREGUNTAS_TEXTO.map((pregunta) => ({
      key: pregunta.key,
      icon: pregunta.icon,
      label: pregunta.label,
      value: textAnswers[pregunta.key]?.respuesta?.trim() || '—',
    }));

    rows.push({
      key: PREGUNTA_SEGUIR.key,
      icon: PREGUNTA_SEGUIR.icon,
      label: PREGUNTA_SEGUIR.label,
      value: seguir || '—',
    });

    return rows;
  }, [textAnswers, seguir]);

  useEffect(() => {
    if (showFinale) spawnCats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFinale]);

  function buildRespuestas(nextTextAnswers = textAnswers, nextSeguir = seguir) {
    const rows = PREGUNTAS_TEXTO
      .map((pregunta) => {
        const value = nextTextAnswers[pregunta.key]?.respuesta?.trim() ?? '';
        if (!value) return null;
        return {
          key: pregunta.key,
          label: pregunta.label,
          icon: pregunta.icon,
          value,
        };
      })
      .filter((row): row is { key: string; label: string; icon: string; value: string } => Boolean(row));

    if (nextSeguir) {
      rows.push({
        key: PREGUNTA_SEGUIR.key,
        label: PREGUNTA_SEGUIR.label,
        icon: PREGUNTA_SEGUIR.icon,
        value: nextSeguir,
      });
    }

    return rows;
  }

  async function persistProgress(options: {
    textAnswersValue?: TextAnswers;
    seguirValue?: string;
    pasoActual: string;
    completo?: boolean;
  }) {
    const respuestas = buildRespuestas(
      options.textAnswersValue ?? textAnswers,
      options.seguirValue ?? seguir,
    );
    if (respuestas.length === 0) return;

    try {
      await fetch('/api/respuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          quiereCita: 'Nivel 2',
          fechaHora: new Date().toLocaleString('es-ES'),
          respuestas,
          pasoActual: options.pasoActual,
          completo: Boolean(options.completo),
        }),
      });
    } catch (error) {
      console.error('No se pudo guardar el progreso:', error);
    }
  }

  function setField(questionKey: string, value: string) {
    setTextAnswers((prev) => ({
      ...prev,
      [questionKey]: {
        ...(prev[questionKey] ?? {}),
        respuesta: value,
      },
    }));
    setPickError((prev) => ({ ...prev, [questionKey]: false }));
  }

  function validateTextStep(index: number) {
    const pregunta = PREGUNTAS_TEXTO[index];
    const value = textAnswers[pregunta.key]?.respuesta?.trim() ?? '';
    if (!value) {
      setPickError((prev) => ({ ...prev, [pregunta.key]: true }));
      return false;
    }
    setPickError((prev) => ({ ...prev, [pregunta.key]: false }));
    return true;
  }

  function nextFromText(index: number) {
    if (!validateTextStep(index)) return;
    const pregunta = PREGUNTAS_TEXTO[index];
    const next = index === PREGUNTAS_TEXTO.length - 1 ? STEP_SEGUIR : STEP_PRIMERA_TEXTO + index + 1;
    setCurrentStep(next);
    void persistProgress({
      textAnswersValue: textAnswers,
      pasoActual: pregunta.key,
    });
  }

  function handleSeguir(answer: 'Sí' | 'No') {
    setSeguir(answer);
    void persistProgress({
      seguirValue: answer,
      pasoActual: answer === 'Sí' ? 'premio_ramo' : 'tv_off',
      completo: answer === 'No',
    });

    if (answer === 'Sí') {
      const petals = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 92,
        delay: Math.random() * 0.9,
        duration: 2.2 + Math.random() * 2.4,
      }));
      setSunflowers(petals);
      setShowPrize(true);
      return;
    }

    setShowTvOff(true);
  }

  function continueAfterPrize() {
    setShowPrize(false);
    setCurrentStep(STEP_RESUMEN);
    void persistProgress({
      seguirValue: 'Sí',
      pasoActual: 'resumen',
    });
  }

  async function celebrate() {
    setShowFinale(true);
    await persistProgress({
      pasoActual: 'nivel_2_final',
      completo: true,
    });
  }

  function spawnCats() {
    if (!floatCatsContainer.current) return;
    for (let i = 0; i < 16; i += 1) {
      setTimeout(() => {
        const img = document.createElement('img');
        img.className = 'float-cat';
        img.src = floatCatSrcs[Math.floor(Math.random() * floatCatSrcs.length)];
        img.style.left = `${Math.random() * 95}%`;
        img.style.animationDuration = `${3 + Math.random() * 4}s`;
        if (floatCatsContainer.current) {
          floatCatsContainer.current.appendChild(img);
          setTimeout(() => img.remove(), 8000);
        }
      }, i * 200);
    }
  }

  if (showTvOff) {
    return (
      <div className="tv-off-overlay">
        <div className="tv-off-flash" />
        <div className="tv-off-line" />
        <div className="tv-off-msg">
          <h3>📺 señal perdida</h3>
          <p>
            // tv.exe apagado
            <br />
            // no hay más secciones... por ahora
            <br />
            // tus respuestas sí se guardaron 💜
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="app">
      <div className="app-inner">
        <div className="header" style={{ textAlign: 'center', marginBottom: 20, animation: 'fadeDown 0.6s ease' }}>
          <img src="/memes/gatito1.png" alt="gatito1" className="header-cat" />
          <h1 className="header-title">{INTRO.title}</h1>
          <p style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--text-muted)', marginTop: 4, wordBreak: 'break-word', paddingInline: 8 }}>
            {INTRO.hint}
          </p>
        </div>

        {/* INTRO NIVEL 2 */}
        <div className="step" style={{ display: currentStep === STEP_INTRO ? 'block' : 'none', animation: 'slideUp 0.4s cubic-bezier(.34,1.56,.64,1)' }}>
          <div className="plea-card" style={{ background: 'var(--primary-light)', border: '2px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <span style={{ flexShrink: 0 }}>
              <img src="/memes/gatito2.png" alt="Emoji gato" style={{ width: 56, height: 56, borderRadius: 12 }} />
            </span>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-dark)', lineHeight: 1.45 }}>
              {INTRO.message}
              <small style={{ display: 'block', fontSize: 11, fontFamily: 'Fira Code, monospace', color: 'var(--primary)', opacity: 0.8, fontWeight: 400, marginTop: 6 }}>
                /* las del nivel 1 ya quedaron atrás */
              </small>
            </div>
          </div>
          <button
            className="btn-next"
            style={{ width: '100%', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '14px 20px', fontSize: 14, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
            onClick={() => setCurrentStep(STEP_PRIMERA_TEXTO)}
          >
            {INTRO.button}
          </button>
        </div>

        {/* PREGUNTAS NIVEL 2 */}
        {PREGUNTAS_TEXTO.map((pregunta, index) => {
          const step = STEP_PRIMERA_TEXTO + index;
          const active = currentStep === step;
          const value = textAnswers[pregunta.key]?.respuesta ?? '';
          const progress = `${Math.round(((index + 1) / PREGUNTAS_TEXTO.length) * 100)}%`;

          return (
            <div key={pregunta.key} className="step" style={{ display: active ? 'block' : 'none' }}>
              <span className="progress-label" style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Nivel 2 · pregunta {index + 1} / {PREGUNTAS_TEXTO.length}
              </span>
              <div className="progress-wrap" style={{ background: 'var(--border)', borderRadius: 100, height: 5, marginBottom: 16, overflow: 'hidden' }}>
                <div className="progress-fill" style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 100, width: progress }} />
              </div>
              <img src={pregunta.image} alt="Decoración" style={{ display: 'block', margin: '0 auto 12px', width: '100%', maxWidth: 'min(180px, 50vw)', height: 'auto' }} />
              <div className="q-card" style={{ background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 16, marginBottom: 12, border: '1px solid var(--border)' }}>
                <span className="q-tag" style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 100, display: 'inline-block', marginBottom: 8, fontWeight: 500 }}>
                  {pregunta.tag}
                </span>
                <div className="q-text" style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', lineHeight: 1.45 }}>
                  <span style={{ marginRight: 6 }}>{pregunta.icon}</span>
                  {pregunta.text}
                </div>
              </div>

              <div className={`answer-field ${pickError[pregunta.key] ? 'error' : ''}`}>
                <label htmlFor={`${pregunta.key}-respuesta`}>Tu respuesta</label>
                <textarea
                  id={`${pregunta.key}-respuesta`}
                  placeholder={pregunta.placeholder}
                  value={value}
                  onChange={(e) => setField(pregunta.key, e.target.value)}
                  rows={5}
                />
              </div>

              {pickError[pregunta.key] && (
                <p className="err-msg" style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '6px 10px', marginTop: 8 }}>
                  ⚠ Escribe algo para continuar
                </p>
              )}

              <button
                className="btn-next"
                style={{ width: '100%', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5, boxShadow: '0 4px 12px rgba(124,58,237,0.3)', marginTop: 12 }}
                onClick={() => nextFromText(index)}
              >
                [ SIGUIENTE → ]
              </button>
            </div>
          );
        })}

        {/* ¿SEGUIR CON LAS SECCIONES? */}
        <div className="step" style={{ display: currentStep === STEP_SEGUIR && !showPrize ? 'block' : 'none' }}>
          <img src={PREGUNTA_SEGUIR.image} alt="Decoración" style={{ display: 'block', margin: '0 auto 12px', width: '100%', maxWidth: 'min(180px, 50vw)', height: 'auto' }} />
          <div className="q-card" style={{ background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 16, marginBottom: 16, border: '1px solid var(--border)', textAlign: 'center' }}>
            <span className="q-tag" style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 100, display: 'inline-block', marginBottom: 10, fontWeight: 500 }}>
              {PREGUNTA_SEGUIR.tag}
            </span>
            <div className="q-text" style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.45, marginBottom: 18 }}>
              {PREGUNTA_SEGUIR.icon} {PREGUNTA_SEGUIR.text}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-next"
                style={{ minWidth: 120, minHeight: 48, borderRadius: 999, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#78350f', border: 'none', padding: '12px 28px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 18px rgba(245,158,11,0.28)' }}
                onClick={() => handleSeguir('Sí')}
              >
                Sí 🌻
              </button>
              <button
                className="btn-next"
                style={{ minWidth: 120, minHeight: 48, borderRadius: 999, background: 'linear-gradient(135deg, #374151, #111827)', color: 'white', border: 'none', padding: '12px 28px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 18px rgba(17,24,39,0.28)' }}
                onClick={() => handleSeguir('No')}
              >
                No 📺
              </button>
            </div>
          </div>
        </div>

        {/* RESUMEN */}
        <div className="step" style={{ display: currentStep === STEP_RESUMEN ? 'block' : 'none' }}>
          <div className="summary-header" style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src="/memes/gatito7.png" alt="Gato grande" style={{ display: 'block', margin: '0 auto 10px', width: 'min(120px, 36vw)', height: 'auto' }} />
            <h2 style={{ fontSize: 'clamp(18px, 5vw, 20px)', fontWeight: 900, background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Nivel 2 · Tus respuestas
            </h2>
            <p style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              // nivel_2 completado 👀
            </p>
          </div>

          <div className="summary-table" style={{ background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 12 }}>
            {summaryRows.map((row, index) => (
              <div key={row.key} className="summary-row" style={index % 2 === 1 ? { background: 'var(--bg)' } : undefined}>
                <span className="s-icon">{row.icon}</span>
                <span className="s-label">{row.label}://</span>
                <span className="s-value">{row.value}</span>
              </div>
            ))}
          </div>

          <button
            className="btn-next btn-confirm"
            style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent), #db2777)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '14px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5, boxShadow: '0 4px 12px rgba(236,72,153,0.3)', marginTop: 12, display: showFinale ? 'none' : 'block' }}
            onClick={celebrate}
          >
            ✨ [ ENVIAR RESPUESTAS ] ✨
          </button>

          <div className="finale" style={{ display: showFinale ? 'block' : 'none', textAlign: 'center', padding: 16, background: 'var(--green-light)', border: '2px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius)', animation: 'pop 0.5s cubic-bezier(.34,1.56,.64,1)', marginTop: 12 }}>
            <div className="finale-cats">
              <img src="/memes/gatito0.png" alt="gatito0" />
              <img src="/memes/gatito1.png" alt="gatito1" />
              <img src="/memes/gatito0.png" alt="gatito0" />
            </div>
            <h3 style={{ fontSize: 'clamp(16px, 5vw, 18px)', fontWeight: 900, color: 'var(--green)', marginBottom: 6 }}>
              ¡Nivel 2 recibido!
            </h3>
            <p style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: '#065f46', lineHeight: 1.5 }}>
              // status: guardado
              <br />
              // gracias por responder 💜
            </p>
          </div>

          <div ref={floatCatsContainer} />
        </div>
      </div>

      {/* PREMIO RAMO */}
      {showPrize && (
        <>
          <div className="sunflower-overlay" aria-hidden>
            {sunflowers.map((petal) => (
              <span
                key={petal.id}
                className="sunflower-petal"
                style={{
                  left: `${petal.left}%`,
                  animationDelay: `${petal.delay}s`,
                  animationDuration: `${petal.duration}s`,
                }}
              >
                🌸
              </span>
            ))}
          </div>
          <div className="prize-overlay">
            <div className="sunflower-card" style={{ borderColor: 'rgba(236,72,153,0.35)' }}>
              <div className="sunflower-bouquet">💐🌸🌺</div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary-dark)', marginBottom: 8 }}>
                ¡Ganaste un ramo!
              </h3>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.45, marginBottom: 8 }}>
                Por seguir con las secciones de preguntas
              </p>
              <p style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>
                // premio_ramo.exe ejecutado ✨
              </p>
              <button
                className="btn-next"
                style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent), #db2777)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontWeight: 800, cursor: 'pointer' }}
                onClick={continueAfterPrize}
              >
                [ RECLAMAR RAMO → ]
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
