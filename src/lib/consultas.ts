import { prisma } from "@/lib/db";
import { setoresVisiveis, type UsuarioSessao } from "@/lib/sessao";

/** Filtro de itens de custo respeitando o escopo de setor do usuário. */
export function escopoDeItens(usuario: UsuarioSessao) {
  const setores = setoresVisiveis(usuario);
  if (setores === null) return {};
  return { rateios: { some: { setorId: { in: setores } } } };
}

export async function listarCategorias() {
  const categorias = await prisma.categoria.findMany({
    select: { id: true, nome: true, categoriaPai: { select: { nome: true } } },
    orderBy: [{ categoriaPai: { nome: "asc" } }, { nome: "asc" }],
  });
  return categorias.map((c) => ({
    valor: c.id,
    rotulo: c.categoriaPai ? `${c.categoriaPai.nome} › ${c.nome}` : c.nome,
  }));
}

export async function listarSetores() {
  const setores = await prisma.setor.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
  return setores.map((s) => ({ valor: s.id, rotulo: s.nome }));
}
