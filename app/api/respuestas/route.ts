import { NextRequest, NextResponse } from 'next/server';
import { listRespuestas, upsertRespuesta, type RespuestaItem } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  sessionId?: string;
  quiereCita?: string;
  fechaHora?: string;
  respuestas?: RespuestaItem[];
  pasoActual?: string;
  completo?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const sessionId = body.sessionId?.trim();
    const respuestas = Array.isArray(body.respuestas) ? body.respuestas : [];

    if (!sessionId) {
      return NextResponse.json({ error: 'Falta sessionId' }, { status: 400 });
    }

    if (respuestas.length === 0) {
      return NextResponse.json(
        { error: 'Faltan respuestas' },
        { status: 400 },
      );
    }

    const saved = await upsertRespuesta({
      sessionId,
      quiereCita: body.quiereCita,
      fechaHora: body.fechaHora || new Date().toISOString(),
      respuestas,
      pasoActual: body.pasoActual,
      completo: Boolean(body.completo),
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      ok: true,
      id: saved.id,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
      completo: saved.completo,
    });
  } catch (error) {
    console.error('Error guardando respuesta:', error);
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const rows = await listRespuestas();
    return NextResponse.json({ ok: true, respuestas: rows });
  } catch (error) {
    console.error('Error listando respuestas:', error);
    return NextResponse.json({ error: 'No se pudo listar' }, { status: 500 });
  }
}
