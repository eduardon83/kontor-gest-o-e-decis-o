// Contagens de pessoas partilhadas por todos os gabinetes (CHRO/COO/chão de fábrica).
// Uma única fonte da verdade: a lista de colaboradores da equipa.
import type { Colaborador } from "@/components/jogo/JogoContext";

export const MAQUINAS_INICIAIS = 3;

export type Contagens = {
  trabalhadores: number;
  supervisores: number;
  gestores: number;
  investigadores: number;
  total: number;
};

export function derivarContagens(colaboradores: readonly Colaborador[]): Contagens {
  let trab = 0, sup = 0, ges = 0, inv = 0;
  for (const c of colaboradores) {
    switch (c.papel_org) {
      case "trabalhador": trab++; break;
      case "supervisor": sup++; break;
      case "gestor_linha": ges++; break;
      case "investigador": inv++; break;
    }
  }
  return {
    trabalhadores: trab,
    supervisores: sup,
    gestores: ges,
    investigadores: inv,
    total: colaboradores.length,
  };
}
