// src/app/api/ai-certificate-helper/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { field, draft, title } = body;

    let enhanced = draft || '';

    if (field === 'description') {
      // Construir contexto basado en lo que se conoce del asset
      const assetRef = title ? `"${title}"` : 'el asset visual';
      const base = draft ? `Contexto aportado por el autor: ${draft.trim()}. ` : '';

      // Generar descripción formal y precisa para el certificado
      enhanced = `${base}${assetRef} constituye una obra digital protegida bajo los términos de propiedad intelectual aplicables. Su registro en el sistema Kyllerium Visual Signature Engine v3.0 establece evidencia criptográfica irrefutable de autoría mediante huella SHA-256, marcas de agua DCT/LSB y firma C2PA. Queda prohibida su reproducción, distribución o uso sin autorización expresa del titular registrado.`.trim();
    }

    return NextResponse.json({ enhanced });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
