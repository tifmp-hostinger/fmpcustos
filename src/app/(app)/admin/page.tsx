import Link from "next/link";
import { prisma } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";
import { configuracaoSmtp } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * O índice da administração.
 *
 * Existe porque o cabeçalho não comporta um item por tela administrativa, e
 * porque cada cartão carrega o número que diz se aquela tela precisa de atenção
 * agora. Um menu que só lista nomes obriga a abrir as quatro para descobrir
 * onde está o problema.
 */
export default async function Admin() {
  await exigirAdmin();

  const [
    usuarios,
    semAcesso,
    semCotacao,
    cotacoes,
    alertasAbertos,
    setores,
    categorias,
    semCategoria,
  ] = await Promise.all([
    prisma.usuario.count({ where: { ativo: true } }),
    prisma.usuario.count({ where: { ativo: true, ultimoAcesso: null } }),
    prisma.itemCusto.count({
      where: { moeda: { not: "BRL" }, cambio: null, excluidoEm: null, valorPeriodo: { not: null } },
    }),
    prisma.cotacaoMoeda.count(),
    prisma.alerta.count({ where: { status: "ABERTO" } }),
    prisma.setor.count({ where: { ativo: true } }),
    prisma.categoria.count({ where: { ativo: true } }),
    prisma.itemCusto.count({
      where: {
        excluidoEm: null,
        status: { in: ["ATIVO", "EM_ANALISE"] },
        categoriaId: null,
      },
    }),
  ]);

  const smtp = configuracaoSmtp() !== null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="sobrancelha">Administração</p>
      <h1 className="mt-2 titulo-pagina">O que você mantém</h1>
      <p className="mt-1.5 text-sm text-[var(--ink-2)]">
        As decisões que valem para a FMP inteira. Cada cartão mostra o que está em aberto.
      </p>

      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Cartao
          href="/admin/usuarios"
          titulo="Usuários"
          descricao="Quem entra, com que perfil e enxergando qual setor."
          nota={
            semAcesso > 0
              ? `${usuarios} ativos · ${semAcesso} nunca acessaram`
              : `${usuarios} ativos · todos já acessaram`
          }
          atencao={semAcesso > 0}
        />
        <Cartao
          href="/admin/cambio"
          titulo="Câmbio"
          descricao="A cotação de dólar e euro que o cadastro sugere."
          nota={
            semCotacao > 0
              ? `${semCotacao} ${semCotacao === 1 ? "custo fora" : "custos fora"} dos totais`
              : cotacoes > 0
                ? `${cotacoes} ${cotacoes === 1 ? "cotação registrada" : "cotações registradas"}`
                : "Nenhuma cotação registrada"
          }
          atencao={semCotacao > 0}
        />
        <Cartao
          href="/admin/notificacoes"
          titulo="Notificações"
          descricao="A varredura que gera alertas e o resumo semanal por e-mail."
          nota={
            smtp
              ? `${alertasAbertos} ${alertasAbertos === 1 ? "alerta aberto" : "alertas abertos"} · e-mail configurado`
              : "E-mail não configurado — ninguém é avisado fora da tela"
          }
          atencao={!smtp}
        />
        <Cartao
          href="/admin/setores"
          titulo="Setores"
          descricao="A estrutura pela qual o custo da FMP é dividido."
          nota={`${setores} ${setores === 1 ? "setor ativo" : "setores ativos"}`}
        />
        <Cartao
          href="/admin/categorias"
          titulo="Categorias"
          descricao="Como o custo é agrupado por tipo."
          nota={
            semCategoria > 0
              ? `${categorias} ativas · ${semCategoria} ${semCategoria === 1 ? "custo sem categoria" : "custos sem categoria"}`
              : `${categorias} ${categorias === 1 ? "categoria ativa" : "categorias ativas"} · nenhum custo solto`
          }
          atencao={semCategoria > 0}
        />
      </div>
    </main>
  );
}

function Cartao({
  href,
  titulo,
  descricao,
  nota,
  atencao,
}: {
  href:
    | "/admin/usuarios"
    | "/admin/cambio"
    | "/admin/notificacoes"
    | "/admin/setores"
    | "/admin/categorias";
  titulo: string;
  descricao: string;
  nota: string;
  atencao?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-fmp-md border p-5 no-underline transition-colors ${
        atencao
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/5 hover:border-[var(--accent)]"
          : "border-[var(--rule)] bg-[var(--surface)] hover:border-[var(--ink-3)]"
      }`}
    >
      <h2 className="font-serif text-lg font-bold">{titulo}</h2>
      <p className="mt-1 text-dado text-[var(--ink-2)]">{descricao}</p>
      <p
        className={`mt-3 text-meta font-medium tabular-nums ${
          atencao ? "text-[var(--accent)]" : "text-[var(--ink-3)]"
        }`}
      >
        {nota}
      </p>
    </Link>
  );
}
