import { neon } from '@neondatabase/serverless';

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Falta DATABASE_URL en .env.local');
  }
  return neon(url);
}

export type RespuestaItem = {
  key: string;
  label: string;
  icon: string;
  value: string;
};

export async function ensureRespuestasTable() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS respuestas (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      quiere_cita TEXT,
      fecha_hora TEXT,
      pelicula TEXT,
      plan TEXT,
      comida TEXT,
      despues TEXT,
      user_agent TEXT,
      payload JSONB
    )
  `;
  await sql`ALTER TABLE respuestas ADD COLUMN IF NOT EXISTS session_id TEXT`;
  await sql`ALTER TABLE respuestas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`;
  await sql`ALTER TABLE respuestas ADD COLUMN IF NOT EXISTS completo BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE respuestas ADD COLUMN IF NOT EXISTS paso_actual TEXT`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS respuestas_session_id_uidx
    ON respuestas (session_id)
  `;
}

export async function upsertRespuesta(data: {
  sessionId: string;
  quiereCita?: string;
  fechaHora?: string;
  respuestas: RespuestaItem[];
  pasoActual?: string;
  completo?: boolean;
  userAgent?: string | null;
}) {
  await ensureRespuestasTable();
  const sql = getSql();
  const filled = data.respuestas.filter((r) => r.value?.trim());
  const valores = filled.map((r) => r.value);
  const payload = {
    session_id: data.sessionId,
    quiere_cita: data.quiereCita ?? null,
    fecha_hora: data.fechaHora ?? null,
    paso_actual: data.pasoActual ?? null,
    completo: Boolean(data.completo),
    respuestas: data.respuestas,
  };

  const rows = await sql`
    INSERT INTO respuestas (
      session_id,
      quiere_cita,
      fecha_hora,
      pelicula,
      plan,
      comida,
      despues,
      user_agent,
      payload,
      completo,
      paso_actual,
      updated_at
    ) VALUES (
      ${data.sessionId},
      ${data.quiereCita ?? null},
      ${data.fechaHora ?? null},
      ${valores[0] ?? null},
      ${valores[1] ?? null},
      ${valores[2] ?? null},
      ${valores[3] ?? null},
      ${data.userAgent ?? null},
      ${JSON.stringify(payload)},
      ${Boolean(data.completo)},
      ${data.pasoActual ?? null},
      NOW()
    )
    ON CONFLICT (session_id)
    DO UPDATE SET
      quiere_cita = EXCLUDED.quiere_cita,
      fecha_hora = EXCLUDED.fecha_hora,
      pelicula = EXCLUDED.pelicula,
      plan = EXCLUDED.plan,
      comida = EXCLUDED.comida,
      despues = EXCLUDED.despues,
      user_agent = COALESCE(EXCLUDED.user_agent, respuestas.user_agent),
      payload = EXCLUDED.payload,
      completo = EXCLUDED.completo OR respuestas.completo,
      paso_actual = EXCLUDED.paso_actual,
      updated_at = NOW()
    RETURNING id, created_at, updated_at, completo
  `;

  return rows[0];
}

/** @deprecated usar upsertRespuesta */
export async function saveRespuesta(data: {
  quiereCita: string;
  fechaHora: string;
  respuestas: RespuestaItem[];
  userAgent?: string | null;
}) {
  return upsertRespuesta({
    sessionId: crypto.randomUUID(),
    quiereCita: data.quiereCita,
    fechaHora: data.fechaHora,
    respuestas: data.respuestas,
    completo: true,
    pasoActual: 'final',
    userAgent: data.userAgent,
  });
}

export async function listRespuestas(limit = 100) {
  await ensureRespuestasTable();
  const sql = getSql();
  return sql`
    SELECT
      id,
      created_at,
      updated_at,
      session_id,
      completo,
      paso_actual,
      quiere_cita,
      fecha_hora,
      pelicula,
      plan,
      comida,
      despues,
      payload
    FROM respuestas
    ORDER BY COALESCE(updated_at, created_at) DESC
    LIMIT ${limit}
  `;
}
