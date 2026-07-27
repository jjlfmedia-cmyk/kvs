"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, Search, Building2, User, ShieldX, Type, FileText } from 'lucide-react';

export default function PublicRegistryPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRegistry = async () => {
    try {
      const res = await fetch('/api/registry/public');
      if (res.ok) {
        setImages(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  const filteredImages = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return images.filter(img =>
      img.kvs_id.toLowerCase().includes(q) ||
      img.kvs_fingerprint.toLowerCase().includes(q) ||
      img.owner_username.toLowerCase().includes(q) ||
      img.owner_org.toLowerCase().includes(q) ||
      img.title.toLowerCase().includes(q)
    );
  }, [images, searchQuery]);

  const formatExpiration = (val: string | null | undefined) => {
    if (!val) return '—';
    return val;
  };

  return (
    <div className="min-h-[85vh] p-6 md:p-12 max-w-7xl mx-auto relative z-10">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--accent-cyan)]/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <div className="text-center md:text-left mb-10">
        <p className="text-xs font-mono text-[var(--accent-cyan)] tracking-widest mb-2">KVS PUBLIC ARCHIVE</p>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Registro Público de Firmas</h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-xl">
          Visualiza los metadatos públicos de autenticidad para validar derechos y autoría. Las imágenes físicas y los metadatos confidenciales están protegidos y solo son visibles por sus dueños.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
        <input 
          type="text"
          placeholder="Buscar por ID, huella, usuario, organización..."
          className="w-full bg-black/40 border border-[var(--glass-border)] rounded-2xl py-4 pl-12 pr-4 font-mono text-xs focus:border-[var(--accent-cyan)] outline-none transition text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 size={36} className="animate-spin text-[var(--accent-cyan)] mx-auto mb-4" />
          <p className="font-mono text-xs text-[var(--text-secondary)]">CARGANDO REGISTRO PÚBLICO...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredImages.map((img, idx) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`glass-card rounded-3xl p-6 border relative overflow-hidden flex flex-col gap-3 ${
                  img.content_type === 'text'
                    ? 'border-[var(--accent-purple)]/30'
                    : 'border-[var(--glass-border)]'
                }`}
              >
                {/* Header: KVS ID + Type badge + Status */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {img.content_type === 'text'
                      ? <Type size={15} className="text-[var(--accent-purple)] shrink-0" />
                      : <ShieldCheck size={15} className="text-[var(--accent-cyan)] shrink-0" />
                    }
                    <span className={`font-mono text-xs font-bold truncate ${
                      img.content_type === 'text' ? 'text-[var(--accent-purple)]' : 'text-[var(--accent-cyan)]'
                    }`}>{img.kvs_id}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[7px] font-mono font-bold border ${
                      img.content_type === 'text'
                        ? 'bg-[var(--accent-purple)]/10 border-[var(--accent-purple)]/30 text-[var(--accent-purple)]'
                        : 'bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)]'
                    }`}>
                      {img.content_type === 'text' ? 'TEXTO' : 'IMAGEN'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[8px] font-mono font-bold border ${
                      img.revoked ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                      img.verification_status === 'VERIFIED' ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' :
                      'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
                    }`}>
                      {img.revoked ? 'REVOCADO' : img.verification_status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs" data-kvs-verdict={img.verification_status}>
                  {/* Título */}
                  <div>
                    <span className="text-[9px] font-mono text-[var(--accent-cyan)] block tracking-widest mb-0.5">TÍTULO DEL ASSET</span>
                    <p className="font-semibold text-white truncate">{img.title}</p>
                  </div>

                  {/* Contenido de Texto Protegido (si es activo de texto) */}
                  {img.content_type === 'text' && img.text_preview && (
                    <div className="p-3 rounded-2xl bg-black/60 border border-[var(--accent-purple)]/30 font-mono text-[10px] space-y-1.5">
                      <div className="flex justify-between items-center text-[8px] text-[var(--accent-purple)] tracking-widest font-bold">
                        <span>★ TEXTO PROTEGIDO INMUTABLE</span>
                        <span>HASH SHA-256 VERIFICABLE</span>
                      </div>
                      <p className="text-white bg-black/40 p-2.5 rounded-xl border border-white/5 whitespace-pre-wrap break-words leading-relaxed font-sans text-xs">
                        {img.text_preview}
                      </p>
                    </div>
                  )}

                  {/* Descripción (si existe) */}
                  {img.description && (
                    <div>
                      <span className="text-[9px] font-mono text-[var(--accent-purple)] block tracking-widest mb-0.5">DESCRIPCIÓN DE USO / METADATO</span>
                      <p className="text-white/70 text-[10px] leading-relaxed line-clamp-2">{img.description}</p>
                    </div>
                  )}

                  {/* DUAL OWNERSHIP */}
                  <div className="grid grid-cols-1 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5">
                    <span className="text-[8px] font-mono text-white/30 tracking-widest uppercase">Titularidad</span>

                    {/* Propietario personal (cuenta) */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 flex items-center justify-center shrink-0">
                        <User size={10} className="text-[var(--accent-cyan)]" />
                      </div>
                      <div>
                        <p className="text-[8px] font-mono text-[var(--accent-cyan)] tracking-widest">PROPIETARIO PERSONAL</p>
                        <p className="text-white font-semibold text-[11px] font-mono">{img.owner_username}</p>
                      </div>
                    </div>

                    {/* Propietario organizacional */}
                    {img.owner_org && img.owner_org !== 'Sin Organización' && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/30 flex items-center justify-center shrink-0">
                          <Building2 size={10} className="text-[var(--accent-purple)]" />
                        </div>
                        <div>
                          <p className="text-[8px] font-mono text-[var(--accent-purple)] tracking-widest">ORGANIZACIÓN / EMPRESA</p>
                          <p className="text-white font-semibold text-[11px] font-mono truncate">{img.owner_org}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rol */}
                  {img.owner_role && (
                    <div>
                      <span className="text-[9px] font-mono text-[var(--text-secondary)] block tracking-widest mb-0.5">ROL / CARGO</span>
                      <p className="text-white/80 font-mono text-[10px]">{img.owner_role}</p>
                    </div>
                  )}

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] font-mono text-[var(--text-secondary)] block tracking-widest">FECHA DE REGISTRO</span>
                      <p className="text-white font-mono text-[9px]">{new Date(img.upload_date).toLocaleDateString('es-MX')}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-red-400 block tracking-widest flex items-center gap-1">
                        EXPIRACIÓN
                      </span>
                      <p className={`font-mono text-[9px] ${img.expiration_date ? 'text-red-400' : 'text-white/30'}`}>
                        {formatExpiration(img.expiration_date)}
                      </p>
                    </div>
                  </div>

                  {/* Uso autorizado */}
                  <div>
                    <span className="text-[9px] font-mono text-[var(--text-secondary)] block tracking-widest mb-0.5">USO AUTORIZADO</span>
                    <p className="text-emerald-400/90 font-mono text-[10px] leading-relaxed line-clamp-2">{img.usage_description}</p>
                  </div>

                  {/* Fingerprint */}
                  <div>
                    <span className="text-[9px] font-mono text-[var(--accent-purple)] block tracking-widest mb-0.5">KVS UNIQUE FINGERPRINT</span>
                    <p className="font-mono text-[9px] break-all text-[var(--accent-purple)] opacity-90">{img.kvs_fingerprint}</p>
                  </div>

                  {/* Enlaces y Acciones para defensa legal */}
                  <div className="mt-2 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <a
                      href={`/api/certificate/${img.kvs_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-[var(--accent-purple)]/15 border border-[var(--accent-purple)]/40 text-[var(--accent-purple)] font-mono text-[9px] font-bold hover:bg-[var(--accent-purple)]/30 transition flex items-center gap-1"
                    >
                      <FileText size={10} /> DESCARGAR CERTIFICADO LEGAL
                    </a>
                    {img.is_owner && (
                      <span className="text-[10px] font-mono text-[#10B981] font-bold">✓ Eres el dueño</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredImages.length === 0 && (
              <div className="col-span-full py-20 text-center glass-card rounded-3xl border border-[var(--glass-border)]">
                <ShieldX size={40} className="text-white/20 mx-auto mb-4" />
                <p className="font-mono text-sm text-[var(--text-secondary)]">No se encontraron registros en el archivo público.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
