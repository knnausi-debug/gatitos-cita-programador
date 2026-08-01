'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DETALLE_OPCIONES,
  INTRO,
  PREGUNTA_EN_ALGO,
  PREGUNTAS_TEXTO,
  REMEMBER,
  STEP_DETALLE,
  STEP_EN_ALGO,
  STEP_INTRO,
  STEP_PRIMERA_TEXTO,
  STEP_RESUMEN,
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
  const [enAlgo, setEnAlgo] = useState<string>('');
  const [detalleElegido, setDetalleElegido] = useState<string>('');
  const [showRemember, setShowRemember] = useState(false);
  const [rememberNote, setRememberNote] = useState('');
  const [textAnswers, setTextAnswers] = useState<TextAnswers>({});
  const [pickError, setPickError] = useState<Record<string, boolean>>({});
  const [showFinale, setShowFinale] = useState(false);
  const [destroying, setDestroying] = useState(false);
  const [destroyCount, setDestroyCount] = useState(3);
  const [destroyed, setDestroyed] = useState(false);
  const [boom, setBoom] = useState(false);
  const [showSunflowers, setShowSunflowers] = useState(false);
  const [sunflowers, setSunflowers] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);
  const floatCatsContainer = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef(createSessionId());

  const summaryRows = useMemo(() => {
    const rows = [
      {
        key: PREGUNTA_EN_ALGO.key,
        icon: PREGUNTA_EN_ALGO.icon,
        label: PREGUNTA_EN_ALGO.label,
        value: enAlgo || '—',
      },
    ];

    for (const pregunta of PREGUNTAS_TEXTO) {
      if (pregunta.fields?.length) {
        for (const field of pregunta.fields) {
          rows.push({
            key: `${pregunta.key}.${field.key}`,
            icon: pregunta.icon,
            label: field.label,
            value: textAnswers[pregunta.key]?.[field.key]?.trim() || '—',
          });
        }
      } else {
        rows.push({
          key: pregunta.key,
          icon: pregunta.icon,
          label: pregunta.label,
          value: textAnswers[pregunta.key]?.respuesta?.trim() || '—',
        });
      }
    }

    const detalle = DETALLE_OPCIONES.find((op) => op.key === detalleElegido);
    rows.push({
      key: 'detalle',
      icon: detalle?.icon ?? '🎁',
      label: 'detalle',
      value: detalle?.label ?? '—',
    });

    if (rememberNote.trim()) {
      rows.push({
        key: 'remember',
        icon: '📝',
        label: 'remember',
        value: rememberNote.trim(),
      });
    }

    return rows;
  }, [enAlgo, textAnswers, detalleElegido, rememberNote]);

  useEffect(() => {
    if (!destroying || destroyed) return;

    if (destroyCount > 0) {
      const timer = setTimeout(() => setDestroyCount((c) => c - 1), 900);
      return () => clearTimeout(timer);
    }

    setBoom(true);
    const boomTimer = setTimeout(() => setDestroyed(true), 750);
    return () => clearTimeout(boomTimer);
  }, [destroying, destroyCount, destroyed]);

  useEffect(() => {
    if (showFinale) spawnCats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFinale]);

  function buildRespuestas(
    nextEnAlgo = enAlgo,
    nextTextAnswers = textAnswers,
    nextDetalle = detalleElegido,
    nextRememberNote = rememberNote,
  ) {
    const rows: { key: string; label: string; icon: string; value: string }[] = [];

    if (nextEnAlgo) {
      rows.push({
        key: PREGUNTA_EN_ALGO.key,
        label: PREGUNTA_EN_ALGO.label,
        icon: PREGUNTA_EN_ALGO.icon,
        value: nextEnAlgo,
      });
    }

    for (const pregunta of PREGUNTAS_TEXTO) {
      if (pregunta.fields?.length) {
        for (const field of pregunta.fields) {
          const value = nextTextAnswers[pregunta.key]?.[field.key]?.trim() ?? '';
          if (!value) continue;
          rows.push({
            key: `${pregunta.key}.${field.key}`,
            label: field.label,
            icon: pregunta.icon,
            value,
          });
        }
      } else {
        const value = nextTextAnswers[pregunta.key]?.respuesta?.trim() ?? '';
        if (!value) continue;
        rows.push({
          key: pregunta.key,
          label: pregunta.label,
          icon: pregunta.icon,
          value,
        });
      }
    }

    const detalle = DETALLE_OPCIONES.find((op) => op.key === nextDetalle);
    if (detalle) {
      rows.push({
        key: 'detalle',
        label: 'detalle',
        icon: detalle.icon,
        value: detalle.label,
      });
    }

    const note = nextRememberNote.trim();
    if (note) {
      rows.push({
        key: 'remember',
        label: 'remember',
        icon: '📝',
        value: note,
      });
    }

    return rows;
  }

  async function persistProgress(options: {
    enAlgoValue?: string;
    textAnswersValue?: TextAnswers;
    detalleValue?: string;
    rememberNoteValue?: string;
    pasoActual: string;
    completo?: boolean;
  }) {
    const respuestas = buildRespuestas(
      options.enAlgoValue ?? enAlgo,
      options.textAnswersValue ?? textAnswers,
      options.detalleValue ?? detalleElegido,
      options.rememberNoteValue ?? rememberNote,
    );
    if (respuestas.length === 0) return;

    try {
      await fetch('/api/respuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          quiereCita: (options.enAlgoValue ?? enAlgo) === 'No'
            ? 'No está en algo 🌻'
            : (options.enAlgoValue ?? enAlgo),
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

  function setField(questionKey: string, fieldKey: string, value: string) {
    setTextAnswers((prev) => ({
      ...prev,
      [questionKey]: {
        ...(prev[questionKey] ?? {}),
        [fieldKey]: value,
      },
    }));
    setPickError((prev) => ({ ...prev, [questionKey]: false }));
  }

  function handleEnAlgo(answer: 'Sí' | 'No') {
    setEnAlgo(answer);
    void persistProgress({
      enAlgoValue: answer,
      pasoActual: answer === 'Sí' ? 'auto_destruccion' : 'ramos_girasoles',
      completo: answer === 'Sí',
    });

    if (answer === 'Sí') {
      setDestroying(true);
      setDestroyCount(3);
      return;
    }

    const petals = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 92,
      delay: Math.random() * 0.8,
      duration: 2.4 + Math.random() * 2.2,
    }));
    setSunflowers(petals);
    setShowSunflowers(true);
  }

  function continueAfterSunflowers() {
    setShowSunflowers(false);
    setCurrentStep(STEP_PRIMERA_TEXTO);
    void persistProgress({ pasoActual: 'preguntas_texto' });
  }

  function validateTextStep(index: number) {
    const pregunta = PREGUNTAS_TEXTO[index];
    const values = textAnswers[pregunta.key] ?? {};

    if (pregunta.fields?.length) {
      const incomplete = pregunta.fields.some((field) => !values[field.key]?.trim());
      if (incomplete) {
        setPickError((prev) => ({ ...prev, [pregunta.key]: true }));
        return false;
      }
    } else if (!values.respuesta?.trim()) {
      setPickError((prev) => ({ ...prev, [pregunta.key]: true }));
      return false;
    }

    setPickError((prev) => ({ ...prev, [pregunta.key]: false }));
    return true;
  }

  function nextFromText(index: number) {
    if (!validateTextStep(index)) return;
    const pregunta = PREGUNTAS_TEXTO[index];
    const next = index === PREGUNTAS_TEXTO.length - 1 ? STEP_DETALLE : STEP_PRIMERA_TEXTO + index + 1;
    setCurrentStep(next);
    void persistProgress({
      textAnswersValue: textAnswers,
      pasoActual: pregunta.key,
    });
  }

  function chooseDetalle(key: string) {
    setDetalleElegido(key);
    setPickError((prev) => ({ ...prev, detalle: false }));
    setShowRemember(true);
    void persistProgress({
      detalleValue: key,
      pasoActual: 'remember_1000',
    });
  }

  function continueAfterRemember() {
    if (!detalleElegido) {
      setPickError((prev) => ({ ...prev, detalle: true }));
      return;
    }
    setCurrentStep(STEP_RESUMEN);
    void persistProgress({
      rememberNoteValue: rememberNote,
      pasoActual: 'resumen',
    });
  }

  async function celebrate() {
    setShowFinale(true);
    await persistProgress({
      pasoActual: 'final',
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

  if (destroyed) {
    return (
      <div className="destroy-overlay" style={{ background: '#000' }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>💀</div>
        <p className="destroy-glitch">SISTEMA DESTRUIDO</p>
        <p className="destroy-msg">
          // error fatal: usuario_en_algo = true
          <br />
          // romance.exe ha sido eliminado
          <br />
          // no hay nada más que ver aquí
        </p>
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

        {/* INTRO */}
        <div className="step" style={{ display: currentStep === STEP_INTRO ? 'block' : 'none', animation: 'slideUp 0.4s cubic-bezier(.34,1.56,.64,1)' }}>
          <div className="plea-card" style={{ background: 'var(--primary-light)', border: '2px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <span style={{ flexShrink: 0 }}>
              <img src="/memes/gatito2.png" alt="Emoji gato" style={{ width: 56, height: 56, borderRadius: 12 }} />
            </span>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary-dark)', lineHeight: 1.45 }}>
              {INTRO.message}
              <small style={{ display: 'block', fontSize: 11, fontFamily: 'Fira Code, monospace', color: 'var(--primary)', opacity: 0.8, fontWeight: 400, marginTop: 6 }}>
                /* no hay atajos esta vez */
              </small>
            </div>
          </div>
          <button
            className="btn-next"
            style={{ width: '100%', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '14px 20px', fontSize: 14, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
            onClick={() => setCurrentStep(STEP_EN_ALGO)}
          >
            {INTRO.button}
          </button>
        </div>

        {/* ¿ESTÁS EN ALGO? */}
        <div className="step" style={{ display: currentStep === STEP_EN_ALGO && !showSunflowers ? 'block' : 'none' }}>
          <div className="q-card" style={{ background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 16, marginBottom: 16, border: '1px solid var(--border)', textAlign: 'center' }}>
            <img src={PREGUNTA_EN_ALGO.image} alt="Decoración" style={{ display: 'block', margin: '0 auto 12px', width: '100%', maxWidth: 'min(180px, 50vw)', height: 'auto' }} />
            <span className="q-tag" style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 100, display: 'inline-block', marginBottom: 10, fontWeight: 500 }}>
              {PREGUNTA_EN_ALGO.tag}
            </span>
            <div className="q-text" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1.4, marginBottom: 18 }}>
              {PREGUNTA_EN_ALGO.text}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-next"
                style={{ minWidth: 120, minHeight: 48, borderRadius: 999, background: 'linear-gradient(135deg, #ff6b6b, #dc2626)', color: 'white', border: 'none', padding: '12px 28px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 18px rgba(220,38,38,0.25)' }}
                onClick={() => handleEnAlgo('Sí')}
              >
                Sí 💥
              </button>
              <button
                className="btn-next"
                style={{ minWidth: 120, minHeight: 48, borderRadius: 999, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#78350f', border: 'none', padding: '12px 28px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 18px rgba(245,158,11,0.28)' }}
                onClick={() => handleEnAlgo('No')}
              >
                No 🌻
              </button>
            </div>
            <p style={{ marginTop: 12, fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--text-muted)' }}>
              // elige con cuidado...
            </p>
          </div>
        </div>

        {/* PREGUNTAS CON CAMPOS */}
        {PREGUNTAS_TEXTO.map((pregunta, index) => {
          const step = STEP_PRIMERA_TEXTO + index;
          const active = currentStep === step;
          const values = textAnswers[pregunta.key] ?? {};
          const progress = `${Math.round(((index + 1) / PREGUNTAS_TEXTO.length) * 100)}%`;

          return (
            <div key={pregunta.key} className="step" style={{ display: active ? 'block' : 'none' }}>
              <span className="progress-label" style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                pregunta {index + 1} / {PREGUNTAS_TEXTO.length}
              </span>
              <div className="progress-wrap" style={{ background: 'var(--border)', borderRadius: 100, height: 5, marginBottom: 16, overflow: 'hidden' }}>
                <div className="progress-fill" style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 100, width: progress }} />
              </div>
              <img src={pregunta.image} alt="Decoración" style={{ display: 'block', margin: '0 auto 12px', width: '100%', maxWidth: 'min(180px, 50vw)', height: 'auto' }} />
              <div className="q-card" style={{ background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 16, marginBottom: 12, border: '1px solid var(--border)' }}>
                <span className="q-tag" style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 100, display: 'inline-block', marginBottom: 8, fontWeight: 500 }}>
                  {pregunta.tag}
                </span>
                <div className="q-text" style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', lineHeight: 1.4 }}>
                  {pregunta.text}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                {pregunta.fields?.length ? (
                  pregunta.fields.map((field) => (
                    <div key={field.key} className={`answer-field ${pickError[pregunta.key] && !values[field.key]?.trim() ? 'error' : ''}`}>
                      <label htmlFor={`${pregunta.key}-${field.key}`}>{field.label}</label>
                      {pregunta.type === 'textarea' || field.key === 'detalle' ? (
                        <textarea
                          id={`${pregunta.key}-${field.key}`}
                          placeholder={field.placeholder}
                          value={values[field.key] ?? ''}
                          onChange={(e) => setField(pregunta.key, field.key, e.target.value)}
                          rows={field.key === 'detalle' ? 4 : 3}
                        />
                      ) : (
                        <input
                          id={`${pregunta.key}-${field.key}`}
                          type="text"
                          placeholder={field.placeholder}
                          value={values[field.key] ?? ''}
                          onChange={(e) => setField(pregunta.key, field.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className={`answer-field ${pickError[pregunta.key] ? 'error' : ''}`}>
                    <label htmlFor={`${pregunta.key}-respuesta`}>Tu fundamentación</label>
                    <textarea
                      id={`${pregunta.key}-respuesta`}
                      placeholder={pregunta.placeholder}
                      value={values.respuesta ?? ''}
                      onChange={(e) => setField(pregunta.key, 'respuesta', e.target.value)}
                      rows={5}
                    />
                  </div>
                )}
              </div>

              {pickError[pregunta.key] && (
                <p className="err-msg" style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '6px 10px', marginTop: 8 }}>
                  ⚠ Completa los campos para continuar
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

        {/* DETALLE FAVORITO */}
        <div className="step" style={{ display: currentStep === STEP_DETALLE ? 'block' : 'none' }}>
          {!showRemember ? (
            <>
              <img src="/memes/gatito6.png" alt="Decoración" style={{ display: 'block', margin: '0 auto 12px', width: '100%', maxWidth: 'min(180px, 50vw)', height: 'auto' }} />
              <div className="q-card" style={{ background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 16, marginBottom: 12, border: '1px solid var(--border)' }}>
                <span className="q-tag" style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 100, display: 'inline-block', marginBottom: 8, fontWeight: 500 }}>
                  // módulo: detalle_favorito.pick
                </span>
                <div className="q-text" style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', lineHeight: 1.4 }}>
                  ¿Cuál de los detalles te gustó más?
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DETALLE_OPCIONES.map((opcion) => {
                  const selected = detalleElegido === opcion.key;
                  return (
                    <button
                      key={opcion.key}
                      className={`opt ${selected ? 'selected' : ''}`}
                      onClick={() => chooseDetalle(opcion.key)}
                      style={{
                        background: selected ? 'var(--primary-light)' : 'var(--card)',
                        border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 700,
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        boxShadow: selected ? '0 0 0 2px rgba(124,58,237,0.15)' : 'var(--shadow)',
                      }}
                    >
                      <span style={{ fontSize: 28, lineHeight: 1 }}>{opcion.icon}</span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                        <span style={{ fontSize: 14 }}>{opcion.label}</span>
                        <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                          // {opcion.hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {pickError.detalle && (
                <p className="err-msg" style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '6px 10px', marginTop: 8 }}>
                  ⚠ Elige un detalle para continuar
                </p>
              )}
            </>
          ) : (
            <div className="q-card" style={{ background: 'var(--card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 20, border: '2px solid rgba(236,72,153,0.35)', textAlign: 'center', animation: 'pop 0.5s cubic-bezier(.34,1.56,.64,1)' }}>
              <div style={{ fontSize: 42, marginBottom: 10 }}>
                {DETALLE_OPCIONES.find((op) => op.key === detalleElegido)?.icon ?? '🎁'}
              </div>
              <p style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
                // detalle elegido: {DETALLE_OPCIONES.find((op) => op.key === detalleElegido)?.label}
              </p>
              <h3 style={{ fontSize: 'clamp(20px, 6vw, 26px)', fontWeight: 900, background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.25, marginBottom: 10 }}>
                {REMEMBER.title}
              </h3>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.45, marginBottom: 16 }}>
                {REMEMBER.subtitle}
              </p>

              <div className="answer-field" style={{ marginBottom: 16, textAlign: 'left' }}>
                <label htmlFor="remember-note">{REMEMBER.fieldLabel}</label>
                <textarea
                  id="remember-note"
                  placeholder={REMEMBER.fieldPlaceholder}
                  value={rememberNote}
                  onChange={(e) => setRememberNote(e.target.value)}
                  rows={3}
                />
                <small style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  {REMEMBER.fieldHint}
                </small>
              </div>

              <button
                className="btn-next"
                style={{ width: '100%', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5, boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
                onClick={continueAfterRemember}
              >
                [ CONTINUAR → ]
              </button>
            </div>
          )}
        </div>

        {/* RESUMEN */}
        <div className="step" style={{ display: currentStep === STEP_RESUMEN ? 'block' : 'none' }}>
          <div className="summary-header" style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src="/memes/gatito7.png" alt="Gato grande" style={{ display: 'block', margin: '0 auto 10px', width: 'min(120px, 36vw)', height: 'auto' }} />
            <h2 style={{ fontSize: 'clamp(18px, 5vw, 20px)', fontWeight: 900, background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Tus respuestas
            </h2>
            <p style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              // interrogatorio completado 💜
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
              ¡Recibido!
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

      {/* AUTO-DESTRUCCIÓN */}
      {destroying && !destroyed && (
        <div className={`destroy-overlay ${boom ? 'destroy-boom' : ''}`}>
          <p className="destroy-glitch">AUTO-DESTRUCCIÓN INICIADA</p>
          <div className="destroy-count">{destroyCount > 0 ? destroyCount : '💥'}</div>
          <p className="destroy-msg">
            // alerta: respuesta = SÍ
            <br />
            // eliminando romance.exe...
          </p>
        </div>
      )}

      {/* RAMO DE GIRASOLES */}
      {showSunflowers && (
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
                🌻
              </span>
            ))}
          </div>
          <div className="sunflower-gift">
            <div className="sunflower-card">
              <div className="sunflower-bouquet">🌻🌻🌻</div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary-dark)', marginBottom: 8 }}>
                Para ti
              </h3>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.45, marginBottom: 8 }}>
                Te estoy regalando este ramo de girasoles
              </p>
              <p style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>
                // gift.exe ejecutado con éxito
              </p>
              <button
                className="btn-next"
                style={{ width: '100%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#78350f', border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontWeight: 800, cursor: 'pointer' }}
                onClick={continueAfterSunflowers}
              >
                [ ACEPTO EL RAMO → ]
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
