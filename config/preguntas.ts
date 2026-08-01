/**
 * Nivel 1 queda oculto/archivado.
 * Flujo activo: Nivel 2
 */

export type PreguntaTexto = {
  key: string;
  icon: string;
  label: string;
  tag: string;
  text: string;
  image: string;
  type: 'text' | 'textarea';
  placeholder: string;
  fields?: { key: string; label: string; placeholder: string }[];
};

export const INTRO = {
  title: 'Nivel 2',
  message: 'Bienvenida al Nivel 2... ahora sí, sin filtros',
  hint: '// nivel_2 desbloqueado · responde con calma',
  button: '[ ENTRAR AL NIVEL 2 → ]',
};

/** Preguntas activas (Nivel 2) */
export const PREGUNTAS_TEXTO: PreguntaTexto[] = [
  {
    key: 'miedo_tener_algo',
    icon: '💭',
    label: 'miedo',
    tag: '// nivel_2 · módulo: miedo.check',
    text: 'Me llamó la atención tu “miedo” a tener algo, ¿puedes desarrollar?',
    image: '/memes/gatito3.png',
    type: 'textarea',
    placeholder: 'Desarrolla tu respuesta aquí...',
  },
  {
    key: 'conversacion_pendiente',
    icon: '💬',
    label: 'pendiente',
    tag: '// nivel_2 · módulo: conversacion.pending',
    text: 'Siempre pensé que “quedó” una conversación pendiente jaja... o esa es mi sensación. ¿Qué crees tú?',
    image: '/memes/gatito4.png',
    type: 'textarea',
    placeholder: 'Cuéntame qué piensas...',
  },
  {
    key: 'ig_nuevo',
    icon: '📱',
    label: 'ig_nuevo',
    tag: '// nivel_2 · módulo: instagram.reset',
    text: '¿Por qué te hiciste un IG nuevo?',
    image: '/memes/gatito5.png',
    type: 'textarea',
    placeholder: 'Escribe tu respuesta...',
  },
  {
    key: 'miedo_conocido',
    icon: '👀',
    label: 'ojos',
    tag: '// nivel_2 · módulo: miedos.compare',
    text: 'Qué mejor que un miedo conocido a uno por conocer JAJA 👀',
    image: '/memes/gatito6.png',
    type: 'textarea',
    placeholder: 'Escribe lo que quieras...',
  },
];

/**
 * ARCHIVADO — Nivel 1 (oculto)
 * No se usa en el flujo actual.
 */
export const NIVEL_1_ARCHIVADO = {
  intro: 'Viste que podía hacerlo fácil... ahora tendrás que responder algunas preguntas',
  enAlgo: '¿Estás en algo?',
  preguntas: [
    '¿Aún muy tornado para tus cosas?',
    '¿Qué tal el corazón?',
    '¿Cuál de los detalles te gustó más?',
    'Remember nro 1000?',
  ],
} as const;

export const STEP_INTRO = 0;
export const STEP_PRIMERA_TEXTO = 1;
export const STEP_RESUMEN = STEP_PRIMERA_TEXTO + PREGUNTAS_TEXTO.length;
