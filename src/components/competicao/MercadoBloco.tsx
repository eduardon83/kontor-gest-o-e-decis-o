import { useMemo } from "react";
import { GraficoEvolucaoValor } from "./GraficoEvolucaoValor";
import { TabelaMercado } from "./TabelaMercado";
import { DemonstracaoUltimoTurno } from "./DemonstracaoUltimoTurno";

export function MercadoBloco({ mercado, dados, visao }: {
  mercado: any; dados: any; visao: "professor" | "jogador";
}) {
  const equipasMercado = useMemo(
    () => dados.equipas.filter((e: any) => e.mercado_id === mercado.id),
    [dados.equipas, mercado.id],
  );
  const ultimaRonda = useMemo(() => {
    const resolvidas = (dados.rondas as any[]).filter((r) => r.estado === "resolvida");
    return resolvidas[resolvidas.length - 1] ?? null;
  }, [dados.rondas]);

  return (
    <section className="mb-8 rounded-lg border border-border bg-card p-5">
      <h3 className="font-serif text-xl">{mercado.nome}</h3>

      <div className="mt-4">
        <TabelaMercado equipas={equipasMercado} rondas={dados.rondas} resultados={dados.resultados} />
      </div>

      <div className="mt-6">
        <h4 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-slate">Evolução do valor por turno</h4>
        <GraficoEvolucaoValor equipas={equipasMercado} rondas={dados.rondas} resultados={dados.resultados} />
      </div>

      {ultimaRonda && (
        <div className="mt-6">
          <h4 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-slate">
            Demonstração de resultados — turno {ultimaRonda.indice}
          </h4>
          <DemonstracaoUltimoTurno
            equipas={equipasMercado}
            snapshots={dados.snapshots}
            rondaId={ultimaRonda.id}
            visao={visao}
          />
        </div>
      )}
    </section>
  );
}
