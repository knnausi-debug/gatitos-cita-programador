import { listRespuestas } from '@/lib/db';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ secret?: string }>;

type PayloadRespuesta = {
  key?: string;
  label?: string;
  icon?: string;
  value?: string;
};

type Payload = {
  respuestas?: PayloadRespuesta[];
};

function formatDate(value: unknown) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getPayloadRespuestas(payload: unknown): PayloadRespuesta[] {
  if (!payload || typeof payload !== 'object') return [];
  const data = payload as Payload;
  return Array.isArray(data.respuestas) ? data.respuestas : [];
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const secret = params.secret;
  const expected = process.env.ADMIN_SECRET;

  if (!expected || secret !== expected) {
    return (
      <main style={{ maxWidth: 560, margin: '40px auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Respuestas</h1>
        <p style={{ color: '#6b7280', lineHeight: 1.5 }}>
          Abre esta página con tu secreto, por ejemplo:
          <br />
          <code>/admin?secret=TU_ADMIN_SECRET</code>
        </p>
      </main>
    );
  }

  let rows: Awaited<ReturnType<typeof listRespuestas>> = [];
  let error: string | null = null;

  try {
    rows = await listRespuestas();
  } catch (err) {
    console.error(err);
    error = 'No se pudo leer la base de datos. Revisa DATABASE_URL.';
  }

  return (
    <main style={{ maxWidth: 900, margin: '24px auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Respuestas guardadas</h1>
      <p style={{ color: '#6b7280', marginBottom: 20 }}>{rows.length} registro(s)</p>

      {error && (
        <p style={{ background: '#fef2f2', color: '#b91c1c', padding: 12, borderRadius: 8 }}>{error}</p>
      )}

      {!error && rows.length === 0 && (
        <p style={{ color: '#6b7280' }}>Todavía no hay respuestas. Completa el flujo y confirma la cita.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((row) => {
          const custom = getPayloadRespuestas(row.payload);
          return (
            <article
              key={String(row.id)}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 14,
                background: '#fff',
              }}
            >
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                #{String(row.id)} · {formatDate(row.updated_at ?? row.created_at)}
                {' · '}
                {row.completo ? 'completo' : `en progreso${row.paso_actual ? ` (${String(row.paso_actual)})` : ''}`}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6, fontSize: 14 }}>
                <li><strong>¿Cita?</strong> {String(row.quiere_cita ?? '—')}</li>
                <li><strong>Fecha/hora:</strong> {String(row.fecha_hora ?? '—')}</li>
                {custom.length > 0
                  ? custom.map((item, i) => (
                      <li key={`${String(row.id)}-${item.key ?? i}`}>
                        <strong>{item.icon ? `${item.icon} ` : ''}{item.label ?? item.key ?? `pregunta${i + 1}`}:</strong>{' '}
                        {String(item.value ?? '—')}
                      </li>
                    ))
                  : (
                    <>
                      <li><strong>Película:</strong> {String(row.pelicula ?? '—')}</li>
                      <li><strong>Plan:</strong> {String(row.plan ?? '—')}</li>
                      <li><strong>Comida:</strong> {String(row.comida ?? '—')}</li>
                      <li><strong>Después:</strong> {String(row.despues ?? '—')}</li>
                    </>
                  )}
              </ul>
            </article>
          );
        })}
      </div>
    </main>
  );
}
