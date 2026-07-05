export type Papel = "super_admin" | "admin_escolar" | "professor" | "jogador";

export const ROTAS_POR_PAPEL: Record<Papel, string> = {
  super_admin: "/painel/super-admin",
  admin_escolar: "/painel/admin-escolar",
  professor: "/painel/professor",
  jogador: "/painel/jogador",
};

export const NOME_PAPEL: Record<Papel, string> = {
  super_admin: "Super-administrador",
  admin_escolar: "Administração escolar",
  professor: "Docente",
  jogador: "Jogador",
};
