"use client";
// DomGuard.tsx — Detecta manipulación del DOM en elementos críticos de autenticidad
// (títulos, nombres de propietario, organizaciones, textos inmutables y veredictos)
// y recarga la página inmediatamente para anular cualquier intento de alteración o trampa con F12.
import { useEffect } from "react";

const PROTECTED_SELECTORS = [
  "[data-kvs-verdict]",
  "[data-kvs-id]",
  "[data-kvs-fingerprint]",
  "[data-kvs-status]",
  "[data-c2pa-badge]",
  "[data-kvs-owner]",
  "[data-kvs-org]",
  "[data-kvs-title]",
  "[data-kvs-text]",
];

export default function DomGuard() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

    // 1. Intercepción disuasoria de F12 y accesos de inspección en teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u"))
      ) {
        console.warn("[KVS DomGuard] 🛡️ Inspect shortcut detected & logged.");
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // 2. MutationObserver Ultra-Estricto para supervisar modificaciones del DOM, atributos y texto
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = (mutation.target.nodeType === Node.TEXT_NODE ? mutation.target.parentElement : mutation.target) as HTMLElement;
        if (!target) continue;

        const isTamperedNode = PROTECTED_SELECTORS.some(
          (sel) => target.matches?.(sel) || target.closest?.(sel)
        );

        if (isTamperedNode) {
          console.warn(
            "[KVS DomGuard] 🛡️ Alerta Anti-Trampa: Edición F12 detectada en elementos críticos. Destruyendo manipulación y recargando página...",
            mutation
          );
          window.location.reload();
          return;
        }
      }
    });

    // Escuchar cambios en nodos, atributos Y texto literal (characterData)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
      attributeFilter: [
        "data-kvs-verdict",
        "data-kvs-id",
        "data-kvs-fingerprint",
        "data-kvs-status",
        "data-kvs-owner",
        "data-kvs-org",
        "data-kvs-title",
        "data-kvs-text",
        "contenteditable"
      ],
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return null;
}
