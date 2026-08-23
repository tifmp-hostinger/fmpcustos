import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  custoMensalCorrente,
  custoPorCategoria,
  custoPorFornecedor,
  custoPorSetor,
  itensComPendencia,
  maioresItens,
  pendenciasDeDado,
  renovacoesProximas,
  setoresQueLancaram,
} from "@/lib/metricas";
import { formatarBRL } from "@/lib/dinheiro";
import { exigirSessao, podeLancar, setoresVisiveis, vePorInteiro } from "@/lib/sessao";
import { BarrasRanqueadas, Indicador } from "@/components/graficos";
import {
  IconeAlerta,
  IconeCalendario,
  IconeCheck,
  IconeMais,
  IconeSeta,
  IconeUsuarios,
} from "@/components/icones";

export const dynamic = "force-dynamic";

const RECORRENTE = ["RECORRENTE"] as const;

export default async function Inicio() {
  const usuario = await exigirSessao();
  const global = vePorInteiro(usuario.papel);
  return global ? <InicioCorporativo /> : <InicioDoSetor />;
}

// ---------------------------------------------------------------------------
// Visão do setor — Gestor (lança) e Leitor (consulta)
// ---------------------------------------------------------------------------

async function InicioDoSetor() {
  const usuario = await exigirSessao();
  const escopo = { setorIds: setoresVisiveis(usuario) };
  const lanca = podeLancar(usuario.papel);
  const setor = usuario.setorNome ?? "seu setor";

  const [mensal, maiores, renovacoes, pendencias] = await Promise.all([
    custoMensalCorrente(escopo, [...RECORRENTE]),
    maioresItens(escopo, [...RECORRENTE], 5),
    renovacoesProximas(escopo, 90),
    lanca ? itensComPendencia(escopo, 4) : Promise.resolve({ semValor: [], semVigencia: [] }),
  ]);

  const totalPendencias = pendencias.semValor.length + pendencias.semVigencia.length;
  const vazio = maiores.length === 0 && totalPendencias === 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">
        {lanca ? "Você mantém os custos desta área" : "Você consulta os custos desta área"}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold tracking-tight">{setor}</h1>
        {lanca && (
          <Link
            href="/custos/novo"
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-[15px] font-semibold text-white no-underline shadow-sm transition-transform hover:scale-[1.02]"
          >
            <IconeMais />
            Cadastrar custo
          </Link>
        )}
      </div>

      {vazio && lanca ? (
        <PrimeiroCusto setor={setor} />
      ) : (
        <>
          <section className="mt-8 grid gap-px overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3">
            <Indicador
              rotulo="Custo mensal da área"
              valor={formatarBRL(mensal)}
              nota="Equivalente mensal, todas as periodicidades"
            />
            <Indicador rotulo="Projeção para 12 meses" valor={formatarBRL(mensal.mul(12))} />
            <Indicador
              rotulo="Renovações em 90 dias"
              valor={String(renovacoes.length)}
              alerta={renovacoes.length > 0}
              nota={renovacoes.length > 0 ? "Precisam de decisão" : "Nada vencendo"}
            />
          </section>

          {lanca && totalPendencias > 0 && (
            <section className="mt-5 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-5">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.11em] text-[var(--accent)]">
                <IconeAlerta />
                Para resolver — deixa seu número completo
              </h2>
              <ul className="mt-3 space-y-2">
                {pendencias.semValor.map((i) => (
                  <Pendente key={i.id} id={i.id} texto={`${i.descricao} está sem valor`} acao="Informar valor" />
                ))}
                {pendencias.semVigencia.map((i) => (
                  <Pendente
                    key={i.id}
                    id={i.id}
                    texto={`${i.descricao} está sem data de renovação`}
                    acao="Informar data"
                  />
                ))}
              </ul>
            </section>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
                Maiores custos da área
              </h2>
              {maiores.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--ink-3)]">Nenhum custo cadastrado ainda.</p>
              ) : (
                <ul className="mt-3 divide-y divide-[var(--rule)]">
                  {maiores.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={`/custos/${m.id}`}
                        className="flex items-baseline justify-between gap-3 py-2.5 no-underline hover:text-[var(--accent)]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-medium">{m.descricao}</span>
                          <span className="block text-[11px] text-[var(--ink-3)]">
                            {m.fornecedor?.nome ?? "sem fornecedor"}
                          </span>
                        </span>
                        <span className="shrink-0 text-[14px] tabular-nums">
                          {m.valorMensalNormalizado
                            ? `${formatarBRL(m.valorMensalNormalizado.toString())}/mês`
                            : "—"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/custos"
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent)] no-underline hover:underline"
              >
                Ver todos os custos <IconeSeta className="size-4" />
              </Link>
            </section>

            <CartaoRenovacoes renovacoes={renovacoes} />
          </div>
        </>
      )}
    </main>
  );
}

function PrimeiroCusto({ setor }: { setor: string }) {
  return (
    <section className="mt-8 rounded-2xl border border-dashed border-[var(--rule-2,#c4c0b2)] px-8 py-12 text-center">
      <p className="font-serif text-xl font-bold">Comece pelo que {setor} paga todo mês.</p>
      <p className="mx-auto mt-2 max-w-md text-[15px] text-[var(--ink-2)]">
        Assinaturas, contratos, serviços. Cadastre um por vez — leva menos de um minuto cada, e o
        sistema calcula o equivalente mensal sozinho.
      </p>
      <Link
        href="/custos/novo"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-[15px] font-semibold text-white no-underline"
      >
        <IconeMais />
        Cadastrar o primeiro custo
      </Link>
    </section>
  );
}

function Pendente({ id, texto, acao }: { id: string; texto: string; acao: string }) {
  return (
    <li>
      <Link
        href={`/custos/${id}`}
        className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface)] px-3.5 py-2.5 text-[14px] no-underline hover:bg-[var(--ground)]"
      >
        <span className="min-w-0 truncate text-[var(--ink)]">{texto}</span>
        <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-[var(--accent)]">
          {acao} <IconeSeta className="size-4" />
        </span>
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Visão corporativa — Admin e Controladoria
// ---------------------------------------------------------------------------

async function InicioCorporativo() {
  const usuario = await exigirSessao();
  const escopo = { setorIds: null };
  const admin = usuario.papel === "ADMIN";

  const [mensal, porSetor, porCategoria, porFornecedor, renovacoes, pendencias, setores, usuarios] =
    await Promise.all([
      custoMensalCorrente(escopo, [...RECORRENTE]),
      custoPorSetor(escopo, [...RECORRENTE]),
      custoPorCategoria(escopo, [...RECORRENTE]),
      custoPorFornecedor(escopo, [...RECORRENTE]),
      renovacoesProximas(escopo, 90),
      pendenciasDeDado(escopo),
      setoresQueLancaram(),
      admin ? prisma.usuario.count({ where: { ativo: true } }) : Promise.resolve(0),
    ]);

  const lancaram = setores.filter((s) => s.lancou).length;
  const faltantes = setores.filter((s) => !s.lancou).map((s) => s.nome);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">
        {admin ? "Você administra a plataforma" : "Você consulta todos os setores"}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Visão corporativa</h1>
        {admin && (
          <div className="flex gap-2">
            <Link
              href="/admin/usuarios"
              className="flex items-center gap-2 rounded-xl border border-[var(--rule)] bg-[var(--surface)] px-4 py-2.5 text-[14px] font-medium no-underline hover:border-[var(--ink-3)]"
            >
              <IconeUsuarios />
              Usuários
            </Link>
            <Link
              href="/custos/novo"
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-[14px] font-semibold text-white no-underline"
            >
              <IconeMais />
              Cadastrar custo
            </Link>
          </div>
        )}
      </div>
      <p className="mt-2 max-w-2xl text-[14px] text-[var(--ink-2)]">
        Custo <strong>recorrente</strong> de todos os setores, já com rateio. Naturezas diferentes
        nunca são somadas sem pedido explícito.
      </p>

      {admin && (usuarios <= 1 || lancaram < 3) && (
        <GuiaInicial usuariosAtivos={usuarios} setoresQueLancaram={lancaram} totalSetores={setores.length} />
      )}

      <section className="mt-7 grid gap-px overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Custo recorrente por mês"
          valor={formatarBRL(mensal)}
          nota="Equivalente mensal, todas as periodicidades"
        />
        <Indicador rotulo="Projeção para 12 meses" valor={formatarBRL(mensal.mul(12))} nota="Ao ritmo atual, sem reajuste" />
        <Indicador
          rotulo="Renovações em 90 dias"
          valor={String(renovacoes.length)}
          alerta={renovacoes.length > 0}
          nota={renovacoes.length > 0 ? "Exigem decisão antes do vencimento" : "Nada vencendo"}
        />
        <Indicador
          rotulo="Setores que já lançaram"
          valor={`${lancaram} de ${setores.length}`}
          alerta={lancaram < setores.length}
          nota="O total só é corporativo quando todos reportam"
        />
      </section>

      {faltantes.length > 0 && (
        <p className="mt-4 rounded-lg border-l-[3px] border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink-2)]">
          <strong>
            {faltantes.length === 1
              ? "1 setor ainda não lançou nenhum custo:"
              : `${faltantes.length} setores ainda não lançaram nenhum custo:`}
          </strong>{" "}
          {faltantes.join(", ")}. O total acima é parcial e não representa o custo da FMP.
        </p>
      )}

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        <BarrasRanqueadas
          titulo="Custo por setor"
          descricao="Quanto cada área consome por mês, já com o rateio aplicado."
          fatias={porSetor}
          limite={13}
          vazio="Nenhum custo rateado ainda."
        />
        <BarrasRanqueadas
          titulo="Concentração por fornecedor"
          descricao="Onde há dependência — e, portanto, onde a negociação vale mais."
          fatias={porFornecedor}
        />
        <BarrasRanqueadas
          titulo="Custo por categoria"
          descricao="Em que tipo de coisa o dinheiro está indo."
          fatias={porCategoria}
        />
        <CartaoRenovacoes renovacoes={renovacoes} notaVazio={pendencias.semVigencia} />
      </div>

      <section className="mt-4 rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
          O que falta para o número estar completo
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          <PendenciaResumo n={pendencias.semValor} rotulo="itens sem valor" detalhe="Não entram em nenhuma soma." />
          <PendenciaResumo n={pendencias.semVigencia} rotulo="itens sem data de término" detalhe="Não geram alerta de renovação." />
          <PendenciaResumo n={pendencias.semCategoria} rotulo="itens sem categoria" detalhe="Somem do agrupamento por tipo." />
        </ul>
      </section>
    </main>
  );
}

function GuiaInicial({
  usuariosAtivos,
  setoresQueLancaram,
  totalSetores,
}: {
  usuariosAtivos: number;
  setoresQueLancaram: number;
  totalSetores: number;
}) {
  const passos = [
    {
      feito: usuariosAtivos > 1,
      titulo: "Crie os usuários dos gestores",
      texto: "Um por setor, com o perfil “Gestor de setor”. Cada um recebe uma senha temporária.",
      href: "/admin/usuarios" as const,
      acao: "Criar usuários",
    },
    {
      feito: setoresQueLancaram >= 3,
      titulo: "Cada gestor cadastra os custos da área",
      texto: `Eles entram com o próprio e-mail e lançam o que a área paga. ${setoresQueLancaram} de ${totalSetores} setores já começaram.`,
      href: "/custos" as const,
      acao: "Ver custos",
    },
    {
      feito: false,
      titulo: "Preencha as datas de renovação",
      texto: "É o que liga o alerta de vencimento — a função de maior retorno do sistema.",
      href: "/custos" as const,
      acao: "Revisar",
    },
  ];
  const pendentes = passos.filter((p) => !p.feito).length;

  return (
    <section className="mt-6 rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
        Comece por aqui — {pendentes} {pendentes === 1 ? "passo pendente" : "passos pendentes"}
      </h2>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {passos.map((p, i) => (
          <li
            key={p.titulo}
            className={`rounded-xl border p-4 ${
              p.feito ? "border-[var(--rule)] opacity-60" : "border-[var(--rule)] bg-[var(--ground)]"
            }`}
          >
            <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--ink-3)]">
              {p.feito ? (
                <IconeCheck className="size-4.5 text-emerald-600" />
              ) : (
                <span className="flex size-5 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-white">
                  {i + 1}
                </span>
              )}
              {p.feito ? "Feito" : `Passo ${i + 1}`}
            </span>
            <p className="mt-2 text-[14px] font-semibold leading-snug">{p.titulo}</p>
            <p className="mt-1 text-[13px] leading-snug text-[var(--ink-2)]">{p.texto}</p>
            {!p.feito && (
              <Link
                href={p.href}
                className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--accent)] no-underline hover:underline"
              >
                {p.acao} <IconeSeta className="size-4" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Compartilhados
// ---------------------------------------------------------------------------

function CartaoRenovacoes({
  renovacoes,
  notaVazio,
}: {
  renovacoes: Awaited<ReturnType<typeof renovacoesProximas>>;
  notaVazio?: number;
}) {
  return (
    <section className="rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
        <IconeCalendario className="size-4" />
        Renovações nos próximos 90 dias
      </h2>
      <p className="mt-1 text-[12px] text-[var(--ink-3)]">
        Renovar por inércia é a forma mais cara de decidir.
      </p>
      {renovacoes.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-3)]">
          Nada vencendo.{" "}
          {notaVazio !== undefined && notaVazio > 0
            ? `Atenção: ${notaVazio} itens não têm data de término e por isso nunca aparecem aqui.`
            : "Custos sem data de término não aparecem aqui."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {renovacoes.map((r) => (
            <li key={r.id}>
              <Link
                href={`/custos/${r.id}`}
                className="flex items-baseline justify-between gap-3 text-[13px] no-underline hover:text-[var(--accent)]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{r.descricao}</span>
                  <span className="block text-[11px] text-[var(--ink-3)]">
                    {r.fornecedor?.nome ?? "sem fornecedor"}
                    {r.rateios[0] ? ` · ${r.rateios[0].setor.nome}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  {r.dataFim?.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                  <span className="block text-[11px] text-[var(--ink-3)]">
                    {r.valorMensalNormalizado
                      ? `${formatarBRL(r.valorMensalNormalizado.toString())}/mês`
                      : "sem valor"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PendenciaResumo({ n, rotulo, detalhe }: { n: number; rotulo: string; detalhe: string }) {
  const limpo = n === 0;
  return (
    <li>
      <span className={`text-xl font-semibold tabular-nums ${limpo ? "" : "text-[var(--accent)]"}`}>
        {n}
      </span>
      <span className="mt-0.5 block text-[13px] text-[var(--ink-2)]">{rotulo}</span>
      <span className="mt-0.5 block text-[11px] text-[var(--ink-3)]">
        {limpo ? "Nada pendente." : detalhe}
      </span>
    </li>
  );
}
