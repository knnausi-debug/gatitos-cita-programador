/**
 * Flujo actual de la app.
 * "¿Volvería a responder nuevas preguntas?" queda pendiente.
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
  title: 'Algunas preguntitas',
  message: 'Viste que podía hacerlo fácil... ahora tendrás que responder algunas preguntas',
  hint: '// sin atajos · responde con honestidad',
  button: '[ COMENZAR → ]',
};

export const PREGUNTA_EN_ALGO = {
  key: 'en_algo',
  icon: '💥',
  label: 'en_algo',
  tag: '// módulo: status_emocional.check',
  text: '¿Estás en algo?',
  image: '/memes/gatito3.png',
};

export const PREGUNTAS_TEXTO: PreguntaTexto[] = [
  {
    key: 'tornado',
    icon: '🌪️',
    label: 'tornado',
    tag: '// módulo: agenda_personal.scan',
    text: '¿Aún muy tornado para tus cosas?',
    image: '/memes/gatito4.png',
    type: 'text',
    placeholder: 'Escribe tu respuesta...',
    fields: [
      {
        key: 'respuesta',
        label: 'Tu respuesta',
        placeholder: 'Sí / No / Más o menos...',
      },
      {
        key: 'detalle',
        label: 'Cuéntame un poco',
        placeholder: '¿Qué te tiene tan tornado/a?',
      },
    ],
  },
  {
    key: 'corazon',
    icon: '💜',
    label: 'corazon',
    tag: '// módulo: diagnostico_corazon.exe',
    text: '¿Qué tal el corazón? Por favor fundamenta tu respuesta',
    image: '/memes/gatito5.png',
    type: 'textarea',
    placeholder: 'Fundamenta tu respuesta aquí...',
  },
];

export const DETALLE_OPCIONES = [
  {
    key: 'ramos',
    icon: '🌻',
    label: 'Ramo de flores / girasoles',
    hint: 'flores + girasoles',
  },
  {
    key: 'bombones',
    icon: '🍫',
    label: 'Caja de bombones',
    hint: 'dulce y peligroso',
  },
] as const;

export const REMEMBER = {
  title: 'Remember nro 1000?',
  subtitle: 'es broma pero si quieres no es broma jaja',
  fieldLabel: 'Si quieres escribir algo…',
  fieldPlaceholder: 'Opcional — puedes dejarlo vacío',
  fieldHint: '// esto lo puedes omitir · no hay necesidad de responderlo',
};

export const STEP_INTRO = 0;
export const STEP_EN_ALGO = 1;
export const STEP_PRIMERA_TEXTO = 2;
export const STEP_DETALLE = STEP_PRIMERA_TEXTO + PREGUNTAS_TEXTO.length;
export const STEP_RESUMEN = STEP_DETALLE + 1;
