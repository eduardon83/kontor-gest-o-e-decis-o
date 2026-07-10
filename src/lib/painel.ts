export type Papel = "super_admin" | "admin_escolar" | "professor" | "jogador";

export const ROTAS_POR_PAPEL: Record<Papel, string> = {
  super_admin: "/painel/super-admin",
  admin_escolar: "/painel/admin-escolar",
  professor: "/painel/professor",
  jogador: "/painel/jogador-home",
};

export const NOME_PAPEL: Record<Papel, string> = {
  super_admin: "Super-administrador",
  admin_escolar: "Administração escolar",
  professor: "Docente",
  jogador: "Jogador",
};

export type LinkMenu = { to: string; label: string; destaque?: boolean };

/**
 * Menu por papel. `super_admin` é SUPERCONJUNTO: vê tudo.
 * Nota: `/painel/jogador` sem parâmetros abre a DEMO (destino explícito, não
 * mais o destino por omissão do login).
 */
export const MENU_POR_PAPEL: Record<Papel, LinkMenu[]> = {
  super_admin: [
    { to: "/painel/super-admin", label: "Super-admin" },
    { to: "/painel/admin-escolar", label: "Admin escolar" },
    { to: "/painel/professor", label: "As minhas Hansas" },
    { to: "/nova-hansa", label: "Criar Hansa", destaque: true },
    { to: "/painel/jogador", label: "Ver demo" },
  ],
  admin_escolar: [
    { to: "/painel/admin-escolar", label: "Instituição" },
    { to: "/painel/professor", label: "As minhas Hansas" },
    { to: "/nova-hansa", label: "Criar Hansa", destaque: true },
    { to: "/painel/jogador", label: "Ver demo" },
  ],
  professor: [
    { to: "/painel/professor", label: "As minhas Hansas" },
    { to: "/nova-hansa", label: "Criar Hansa", destaque: true },
    { to: "/painel/jogador", label: "Ver demo jogável" },
  ],
  jogador: [
    { to: "/painel/jogador-home", label: "Início" },
    { to: "/entrar-hansa", label: "Entrar em Hansa", destaque: true },
    { to: "/painel/jogador", label: "Ver demo · Tutorial" },
  ],
};
