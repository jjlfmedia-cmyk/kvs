import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/utils/crypto/jwt';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('kvs_session')?.value;
    
    let loggedUserId: string | null = null;
    if (token) {
      const payload = await verifyJWT(token);
      if (payload) {
        loggedUserId = payload.userId;
      }
    }

    // Buscamos todas las imágenes registradas
    const dbImages = await prisma.image.findMany({
      orderBy: { upload_date: 'desc' },
      select: {
        id: true,
        kvs_id: true,
        kvs_fingerprint: true,
        filename: true,
        upload_date: true,
        owner_name: true,
        owner_org: true,
        owner_role: true,
        userId: true,
        metadata_json: true,
        verification_status: true,
        revoked: true,
      }
    });

    // Mapeamos los datos para ocultar información sensible a usuarios terceros
    const sanitizedImages = dbImages.map(img => {
      const isOwner = loggedUserId && img.userId === loggedUserId;
      let meta: any = {};
      try {
        meta = JSON.parse(img.metadata_json || '{}');
      } catch {}

      // Propietario personal: rawUsername guardado en meta, o extraer del owner_name quitando sufijo
      const rawUsername = meta.rawUsername || 
        (img.owner_name ? img.owner_name.replace(/ \(Certificado por Kyllerium System\)$/, '') : 'Kyllerium Guest');

      return {
        id: img.id,
        kvs_id: img.kvs_id,
        kvs_fingerprint: img.kvs_fingerprint,
        upload_date: img.upload_date,
        // Propietario personal (nombre de usuario de la cuenta)
        owner_username: rawUsername,
        // Propietario organizacional (empresa/organización ingresada)
        owner_org: img.owner_org || meta.organization || 'Sin Organización',
        owner_role: img.owner_role || meta.role || 'Productor de Contenido',
        title: meta.title || 'Imagen Protegida KVS',
        description: meta.description || '',
        expiration_date: meta.expirationDate || null,
        usage_description: meta.usageDescription || 'Uso no restringido',
        verification_status: img.verification_status,
        revoked: img.revoked,
        is_owner: !!isOwner,
        filename: isOwner ? img.filename : 'Protegida (Oculto en público)',
      };
    });

    return NextResponse.json(sanitizedImages);
  } catch (error: any) {
    console.error('[Registry Public API] Error:', error);
    return NextResponse.json({ error: 'Error al cargar el registro público' }, { status: 500 });
  }
}
