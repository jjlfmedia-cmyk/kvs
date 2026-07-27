// src/app/api/text/protect/route.ts
// KVS Text Shield — Protección criptográfica de nombres, slogans e ideas
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/utils/crypto/jwt';
import { cookies } from 'next/headers';
import crypto from 'crypto';

/** Generate a random 8-digit KVS-ID (unique, text variant) */
async function generateUniqueTextId(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const num = crypto.randomInt(10000000, 99999999);
    const year = new Date().getFullYear();
    const candidate = `KYL-TXT-${year}-${num}`;
    const existing = await prisma.image.findUnique({ where: { kvs_id: candidate } });
    if (!existing) return candidate;
  }
  throw new Error('Failed to generate unique KVS-ID after 20 attempts');
}

/** KVS Fingerprint: SHA-256 of (textHash + kvsId + timestamp + entropy) */
function generateKVSFingerprint(textHash: string, kvsId: string): string {
  const raw = crypto
    .createHash('sha256')
    .update(`${textHash}:${kvsId}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`)
    .digest('hex');
  return `KVS-${raw.slice(0, 8).toUpperCase()}-${raw.slice(8, 16).toUpperCase()}-${raw.slice(16, 24).toUpperCase()}-${raw.slice(24, 32).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      text,
      title,
      organization = 'Sin Organización',
      role = 'Propietario',
      description = '',
      expirationDate: rawExpiration = '',
      usageDescription = 'Uso exclusivo del titular registrado',
    } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'El texto a proteger no puede estar vacío.' }, { status: 400 });
    }
    if (text.trim().length > 10000) {
      return NextResponse.json({ error: 'El texto excede el límite de 10,000 caracteres.' }, { status: 400 });
    }

    // ── Autenticación desde cookie ──
    let authUserId: string | null = null;
    let rawUsername = 'Kyllerium Guest';
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('kvs_session')?.value;
      if (token) {
        const payload = await verifyJWT(token);
        if (payload) {
          authUserId = payload.userId;
          rawUsername = payload.username;
        }
      }
    } catch { /* ignore */ }

    // ── Normalizar expiración ──
    let expirationDate = rawExpiration.trim();
    if (!expirationDate || expirationDate.toLowerCase() === 'sin vencimiento') {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 10);
      expirationDate = future.toLocaleDateString('es-MX');
    }

    const officialOwner = `${rawUsername} (Certificado por Kyllerium System)`;

    // ── SHA-256 del texto exacto ──
    // Normalizar: trim + normalización Unicode para garantizar reproducibilidad
    const normalizedText = text.trim().normalize('NFC');
    const textHash = crypto.createHash('sha256').update(normalizedText, 'utf8').digest('hex');

    // ── IDs únicos ──
    const kvsId = await generateUniqueTextId();
    const kvsFingerprint = generateKVSFingerprint(textHash, kvsId);
    const year = new Date().getFullYear();

    // ── Guardar en DB ──
    await prisma.image.create({
      data: {
        kvs_id: kvsId,
        kvs_fingerprint: kvsFingerprint,
        hash_sha256: textHash,
        phash: textHash.slice(0, 16), // Para texto usamos los primeros 16 chars del hash como phash
        filename: `KVS-TXT-${kvsId}.txt`,
        filepath: '', // Sin archivo físico
        watermark_data: JSON.stringify({ type: 'text', kvs_id: kvsId }),
        metadata_json: JSON.stringify({
          content_type: 'text',
          title: title || normalizedText.slice(0, 80),
          organization,
          role,
          description,
          expirationDate,
          usageDescription,
          rawUsername,
          charCount: normalizedText.length,
          wordCount: normalizedText.split(/\s+/).filter(Boolean).length,
        }),
        owner_name: officialOwner,
        owner_org: organization,
        owner_role: role,
        content_type: 'text',
        text_content: normalizedText,
        userId: authUserId,
      },
    });

    return NextResponse.json({
      success: true,
      kvs_id: kvsId,
      kvs_fingerprint: kvsFingerprint,
      hash: textHash,
      char_count: normalizedText.length,
      word_count: normalizedText.split(/\s+/).filter(Boolean).length,
      content_type: 'text',
    });
  } catch (error: any) {
    console.error('[KVS Text Protect] Error:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
