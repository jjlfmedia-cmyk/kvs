// src/app/text/page.tsx
"use client";
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ShieldCheck, CheckCircle, Download, Sparkles, Loader2, Type, Hash, Clock, Shield, Copy, Check } from 'lucide-react';
import { triggerScreenEdgeGlow } from '../components/ScreenEdgeGlow';

export default function TextProtectPage() {
  const [text, setText] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    role: '',
    description: '',
    expirationDate: '',
    usageDescription: '',
  });
  const [status, setStatus] = useState<'idle' | 'protecting' | 'success' | 'error'>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const maxChars = 10000;

  const handleProtect = async () => {
    if (!text.trim() || !formData.title) return;
    setStatus('protecting');

    const steps = [
      'Normalizando texto (Unicode NFC)...',
      'Calculando SHA-256 del contenido exacto...',
      'Generando KVS Fingerprint único...',
      'Registrando en base de datos inmutable...',
      'Emitiendo certificado KVS Text Shield...',
    ];

    steps.forEach((s, i) => setTimeout(() => setProgressMsg(s), i * 700));

    try {
      const res = await fetch('/api/text/protect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, ...formData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al proteger el texto');
      setResult(data);
      setStatus('success');
      triggerScreenEdgeGlow('protect');
    } catch (err: any) {
      setStatus('error');
      setProgressMsg(err.message);
    }
  };

  const enhanceWithAI = async () => {
    setEnhancing(true);
    try {
      const res = await fetch('/api/ai-certificate-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'description', draft: formData.description, title: formData.title || text.slice(0, 60) }),
      });
      const data = await res.json();
      if (data.enhanced) setFormData(p => ({ ...p, description: data.enhanced }));
    } catch { /* ignore */ } finally {
      setEnhancing(false);
    }
  };

  const copyToClipboard = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadCertificate = (format: 'pdf' | 'png') => {
    if (!result?.kvs_id) return;
    const url = format === 'pdf'
      ? `/api/certificate/${result.kvs_id}`
      : `/api/certificate/${result.kvs_id}/png`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `KVS-Text-${result.kvs_id}.${format}`;
    a.click();
  };

  const reset = () => {
    setText('');
    setFormData({ title: '', organization: '', role: '', description: '', expirationDate: '', usageDescription: '' });
    setStatus('idle');
    setResult(null);
    setProgressMsg('');
  };

  return (
    <div className="min-h-[85vh] p-6 md:p-10 max-w-4xl mx-auto relative z-10">
      {/* Ambient glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-purple)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-[var(--accent-cyan)]/4 rounded-full blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">

        {/* ── IDLE / ERROR ── */}
        {(status === 'idle' || status === 'error') && (
          <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-purple)]/10 border border-[var(--accent-purple)]/30 text-[var(--accent-purple)] text-xs font-mono mb-6 tracking-widest">
                <Type size={13} /> KVS TEXT SHIELD  ·  IP PROTECTION ENGINE
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-5 tracking-tight">
                Protege tu Nombre<br />
                <span className="font-extrabold" style={{ background: 'linear-gradient(135deg, #9D4EDD, #00E5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Antes que Nadie.
                </span>
              </h1>
              <p className="text-[var(--text-secondary)] text-base max-w-xl mx-auto leading-relaxed">
                ¿Tienes el nombre de tu marca, slogan o idea pero aún no lo registras en el IMPI?
                Protégelo aquí con firma criptográfica SHA-256 e inmutabilidad absoluta. Si alguien intenta robarlo, tú tienes la evidencia.
              </p>
            </div>

            {/* Text area */}
            <div className="glass-card rounded-3xl p-6 border border-[var(--glass-border)] mb-6 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-mono text-[var(--accent-purple)] tracking-widest font-bold">
                  TEXTO / NOMBRE A PROTEGER *
                </label>
                <span className={`text-[10px] font-mono ${charCount > maxChars * 0.9 ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                  {charCount.toLocaleString()} / {maxChars.toLocaleString()} chars  ·  {wordCount} palabras
                </span>
              </div>
              <textarea
                className="w-full bg-black/40 border border-[var(--accent-purple)]/30 rounded-2xl p-4 text-base focus:border-[var(--accent-purple)] outline-none transition text-white resize-none leading-relaxed font-mono"
                placeholder={`Escribe aquí el texto que quieres proteger...\n\nEjemplos:\n• Nombre de marca: "AquaZen"\n• Slogan: "El sabor que une familias"\n• Idea de negocio: descripción de tu concepto\n• Cualquier texto del que quieras probar autoría y fecha`}
                rows={8}
                value={text}
                maxLength={maxChars}
                onChange={e => setText(e.target.value)}
              />

              {/* SHA preview */}
              {text.trim().length > 0 && (
                <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-white/5">
                  <Hash size={12} className="text-[var(--accent-cyan)] shrink-0" />
                  <span className="text-[9px] font-mono text-[var(--text-secondary)] truncate">
                    Este texto generará una huella SHA-256 única e irrepetible al momento de protegerlo
                  </span>
                </div>
              )}
            </div>

            {/* Metadata form */}
            {text.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-3xl p-6 border border-[var(--glass-border)] mb-6 shadow-xl"
              >
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-white">
                  <Sparkles size={15} className="text-[var(--accent-purple)]" /> Metadatos del Registro
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] font-mono text-[var(--accent-purple)] tracking-widest mb-1.5">TÍTULO / NOMBRE CORTO *</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-sm focus:border-[var(--accent-purple)] outline-none transition text-white"
                      placeholder='Ej. "AquaZen" — nombre de mi marca de agua mineral'
                      value={formData.title}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-[var(--text-secondary)] tracking-widest mb-1.5">ORGANIZACIÓN / EMPRESA</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-sm focus:border-[var(--accent-cyan)] outline-none transition text-white"
                      placeholder="Ej. AquaZen S.A. de C.V."
                      value={formData.organization}
                      onChange={e => setFormData(p => ({ ...p, organization: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-[var(--text-secondary)] tracking-widest mb-1.5">ROL / CARGO</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-sm focus:border-[var(--accent-cyan)] outline-none transition text-white"
                      placeholder="Ej. Fundador / Propietario"
                      value={formData.role}
                      onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[10px] font-mono text-[var(--accent-purple)] tracking-widest">DESCRIPCIÓN BREVE <span className="text-white/30">(Opcional)</span></label>
                      <button
                        onClick={enhanceWithAI}
                        disabled={enhancing}
                        className="text-[9px] font-mono text-[var(--accent-purple)] hover:underline flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-40"
                      >
                        {enhancing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Mejorar con IA
                      </button>
                    </div>
                    <textarea
                      className="w-full bg-black/40 border border-[var(--accent-purple)]/20 rounded-2xl p-3 text-sm focus:border-[var(--accent-purple)] outline-none transition text-white resize-none"
                      placeholder="Describe brevemente de qué trata este nombre o texto..."
                      rows={2}
                      value={formData.description}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-red-400 tracking-widest mb-1.5">VENCIMIENTO <span className="text-white/30">(Vacío = 10 años)</span></label>
                    <input
                      className="w-full bg-black/40 border border-red-500/20 rounded-2xl p-3 text-sm focus:border-red-400 outline-none transition text-white"
                      placeholder="Ej. 31/12/2030"
                      value={formData.expirationDate}
                      onChange={e => setFormData(p => ({ ...p, expirationDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-[var(--text-secondary)] tracking-widest mb-1.5">USO AUTORIZADO</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-sm focus:border-[var(--accent-cyan)] outline-none transition text-white"
                      placeholder="Ej. Marca comercial exclusiva"
                      value={formData.usageDescription}
                      onChange={e => setFormData(p => ({ ...p, usageDescription: e.target.value }))}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Protect button */}
            {text.trim().length > 0 && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={handleProtect}
                  disabled={!formData.title || text.trim().length === 0}
                  className="flex items-center gap-3 font-mono font-bold py-4 px-14 rounded-[18px] hover:scale-105 active:scale-95 transition-all duration-200 tracking-widest text-base disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #9D4EDD, #00E5FF)', color: '#000' }}
                >
                  <Shield size={20} /> PROTEGER TEXTO
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-center font-mono text-sm">{progressMsg}</div>
            )}
          </motion.div>
        )}

        {/* ── PROTECTING ── */}
        {status === 'protecting' && (
          <motion.div key="protecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="w-full text-center py-32 glass-card rounded-3xl border border-[var(--glass-border)]">
            <div className="relative w-28 h-28 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-[var(--accent-purple)] animate-spin" />
              <div className="absolute inset-3 rounded-full border-r-2 border-b-2 border-[var(--accent-cyan)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
              <Type size={36} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--accent-purple)]" />
            </div>
            <h2 className="text-xl font-bold mb-3 tracking-widest">PROTEGIENDO TEXTO</h2>
            <p className="text-[var(--accent-purple)] font-mono text-sm animate-pulse">{progressMsg}</p>
          </motion.div>
        )}

        {/* ── SUCCESS ── */}
        {status === 'success' && result && (
          <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">

            {/* Banner */}
            <div className="glass-card rounded-3xl overflow-hidden shadow-2xl mb-6">
              <div className="p-5 border-b border-[var(--glass-border)] flex items-center gap-4"
                style={{ background: 'linear-gradient(135deg, rgba(157,78,221,0.15), transparent)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg shrink-0"
                  style={{ background: 'rgba(157,78,221,0.2)', borderColor: 'rgba(157,78,221,0.6)' }}>
                  <CheckCircle size={22} className="text-[var(--accent-purple)]" />
                </div>
                <div className="flex-grow min-w-0">
                  <h2 className="text-lg font-bold tracking-widest mb-1" style={{ color: '#9D4EDD' }}>
                    TEXTO PROTEGIDO ✓
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] font-mono">
                    Registrado con fecha y hora exacta del servidor — inmutable e irrefutable
                  </p>
                </div>
              </div>

              {/* Datos clave */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* KVS-ID */}
                <div className="bg-black/60 rounded-2xl p-4 border border-[var(--accent-purple)]/30 col-span-1 md:col-span-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] text-[var(--accent-purple)] font-mono tracking-widest mb-1">KVS TEXT REGISTRY ID</p>
                      <p className="font-mono text-xl font-bold text-white tracking-wider">{result.kvs_id}</p>
                    </div>
                    <button onClick={() => copyToClipboard(result.kvs_id, 'id')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
                      {copied === 'id' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-white/40" />}
                    </button>
                  </div>
                </div>

                {/* SHA-256 */}
                <div className="bg-black/60 rounded-2xl p-4 border border-[var(--accent-cyan)]/20">
                  <p className="text-[9px] text-[var(--accent-cyan)] font-mono tracking-widest mb-1">SHA-256 DEL TEXTO</p>
                  <p className="font-mono text-[10px] break-all text-white/80 leading-relaxed">{result.hash}</p>
                  <button onClick={() => copyToClipboard(result.hash, 'hash')} className="mt-2 text-[9px] font-mono text-[var(--accent-cyan)] hover:underline flex items-center gap-1">
                    {copied === 'hash' ? <><Check size={9} /> Copiado</> : <><Copy size={9} /> Copiar hash</>}
                  </button>
                </div>

                {/* Fingerprint */}
                <div className="bg-black/60 rounded-2xl p-4 border border-[var(--accent-purple)]/20">
                  <p className="text-[9px] text-[var(--accent-purple)] font-mono tracking-widest mb-1">KVS FINGERPRINT</p>
                  <p className="font-mono text-xs break-all font-bold" style={{ color: '#9D4EDD' }}>{result.kvs_fingerprint}</p>
                  <button onClick={() => copyToClipboard(result.kvs_fingerprint, 'fp')} className="mt-2 text-[9px] font-mono text-[var(--accent-purple)] hover:underline flex items-center gap-1">
                    {copied === 'fp' ? <><Check size={9} /> Copiado</> : <><Copy size={9} /> Copiar fingerprint</>}
                  </button>
                </div>

                {/* Stats */}
                <div className="bg-black/60 rounded-2xl p-4 border border-white/5 col-span-1 md:col-span-2 flex gap-6">
                  <div className="flex items-center gap-2">
                    <Type size={14} className="text-[var(--accent-purple)]" />
                    <div>
                      <p className="text-[9px] font-mono text-[var(--text-secondary)] tracking-widest">CARACTERES</p>
                      <p className="text-white font-bold font-mono">{result.char_count?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash size={14} className="text-[var(--accent-cyan)]" />
                    <div>
                      <p className="text-[9px] font-mono text-[var(--text-secondary)] tracking-widest">PALABRAS</p>
                      <p className="text-white font-bold font-mono">{result.word_count?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-emerald-400" />
                    <div>
                      <p className="text-[9px] font-mono text-[var(--text-secondary)] tracking-widest">FECHA Y HORA</p>
                      <p className="text-emerald-400 font-bold font-mono text-xs">{new Date().toLocaleString('es-MX')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descargar certificado */}
              <div className="border-t border-[var(--glass-border)] p-6">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="flex-grow">
                    <p className="font-semibold text-sm mb-0.5">Certificado Oficial KVS Text Shield</p>
                    <p className="text-xs text-[var(--text-secondary)]">Incluye el texto exacto protegido, su hash SHA-256, fecha inmutable y firma KVS.</p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => downloadCertificate('pdf')}
                      className="flex items-center gap-2 px-5 py-3 font-mono text-sm font-bold rounded-2xl transition"
                      style={{ background: 'rgba(157,78,221,0.2)', border: '1px solid rgba(157,78,221,0.5)', color: '#9D4EDD' }}>
                      <FileText size={16} /> PDF
                    </button>
                    <button onClick={() => downloadCertificate('png')}
                      className="flex items-center gap-2 px-5 py-3 bg-[var(--accent-cyan)] text-black font-mono text-sm font-bold rounded-2xl hover:shadow-cyan-glow transition">
                      <Download size={16} /> PNG
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info legal */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 mb-6">
              <p className="text-[10px] font-mono text-[var(--text-secondary)] leading-relaxed">
                <span className="text-[var(--accent-purple)] font-bold">⚠ AVISO LEGAL:</span> Este certificado KVS establece una <strong className="text-white">fecha de creación/invención verificable</strong> para este texto. 
                No reemplaza el registro formal en el IMPI, USPTO u otras oficinas de propiedad intelectual, pero constituye evidencia digital irrefutable de que el contenido existía en la fecha registrada. 
                El hash SHA-256 puede ser verificado de forma independiente por cualquier parte.
              </p>
            </div>

            <div className="text-center">
              <button onClick={reset} className="text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--accent-purple)] transition underline-offset-4 underline decoration-white/10">
                [ PROTEGER OTRO TEXTO ]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
