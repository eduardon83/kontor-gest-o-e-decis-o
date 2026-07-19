import { useState } from "react";

export function CopiarCodigo({
  codigo,
  variante = "escuro",
}: {
  codigo: string;
  variante?: "escuro" | "claro";
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = codigo;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {}
      document.body.removeChild(el);
    }
  }

  const base =
    "inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors";
  const estilo =
    variante === "escuro"
      ? "border border-gold/40 text-gold hover:bg-gold/10"
      : "border border-border text-foreground hover:bg-muted";

  return (
    <button type="button" onClick={copiar} className={`${base} ${estilo}`} aria-label="Copiar código">
      {copiado ? "copiado ✓" : "copiar"}
    </button>
  );
}
