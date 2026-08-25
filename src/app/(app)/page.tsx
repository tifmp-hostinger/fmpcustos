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
import { aceitesPendentesDoSetor, propostasDoUsuario } from "@/lib/consultas";
import { SEM_CATEGORIA, SEM_FORNECEDOR, SEM_SETOR, urlDaLista } from "@/lib/filtros";
import { exigirSessao, podeLancar, setoresVisiveis, vePorInteiro } from "@/lib/sessao";
import { CartaoAceite } from "./aceites";
import { BarrasRanqueadas, Indicador } from "@/components/graficos";
import { classesDeBotao } from "@/components/botao";
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
  return global ? <InicioCorporativo usuario={usuario} /> : <InicioDoSetor usuario={usuario} />;
}

type Usuario = Awaited<ReturnType<typeof exigirSessao>>;

// ---------------------------------------------------------------------------
// Visão do setor — Gestor (lança) e Leitor (consulta)
// ---------------------------------------------------------------------------

async function InicioDoSetor({ usuario }: { usuario: Usuario }) {
  const escopo = { setorIds: setoresVisiveis(usuario) };
  const lanca = podeLancar(usuario.papel);
  const setor = usuario.setorNome ?? "seu setor";

  if (!usuario.setorId) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="titulo-pagina">
          Falta vincular você a um <em className="text-[var(--accent-texto)]">setor</em>
        </h1>
        <p className="mt-3 text-base text-[var(--ink-2)]">
          Seu usuário existe, mas ainda não está ligado a nenhuma área — por isso não há nada para
          mostrar aqui{lanca ? " e o cadastro de custos ficaria sem destino" : ""}. Peça ao
          administrador do sistema para definir o seu setor em <strong>Usuários</strong>.
        </p>
      </main>
    );
  }

  const [mensal, maiores, renovacoes, pendencias, aceites, propostas] = await Promise.all([
    custoMensalCorrente(escopo, [...RECORRENTE]),
    maioresItens(escopo, [...RECORRENTE], 5),
    renovacoesProximas(escopo, 90),
    lanca
      ? itensComPendencia(escopo, 4)
      : Promise.resolve({ semValor: [], semVigencia: [], semCambio: [] }),
    lanca ? aceitesPendentesDoSetor(usuario.setorId) : Promise.resolve([]),
    lanca ? propostasDoUsuario(usuario.id) : Promise.resolve([]),
  ]);

  const totalPendencias =
    pendencias.semValor.length + pendencias.semVigencia.length + pendencias.semCambio.length;
  // O convite de primeiro cadastro só aparece se NÃO existe item nenhum no
  // setor — contado cru, sem filtro de status ou natureza. Um setor cheio de
  // itens "a apurar" importados não pode ser convidado a recadastrar tudo.
  const existentes = await prisma.itemCusto.count({
    where: { rateios: { some: { setorId: usuario.setorId, vigenciaFim: null } } },
  });
  const vazio = existentes === 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="sobrancelha">
        {lanca ? "Você mantém os custos desta área" : "Você consulta os custos desta área"}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="titulo-pagina">{setor}</h1>
        {lanca && (
          <Link href="/custos/novo" className={classesDeBotao("primario", "lg")}>
            <IconeMais />
            Cadastrar custo
          </Link>
        )}
      </div>

      {aceites.length > 0 && (
        <section className="mt-5 rounded-fmp-md border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-5">
          <h2 className="flex items-center gap-2 sobrancelha">
            <IconeAlerta />
            Aceites aguardando você
          </h2>
          <p className="mt-1 text-meta text-[var(--ink-3)]">
            Outro setor propôs dividir um custo com a sua área. Nada entra no seu número sem o seu
            aceite.
          </p>
          <ul className="mt-3 space-y-2">
            {aceites.map((a) => (
              <CartaoAceite
                key={a.id}
                parcela={{
                  ...a,
                  valorMensal: a.valorMensal ? formatarBRL(a.valorMensal) : null,
                }}
              />
            ))}
          </ul>
        </section>
      )}

      {propostas.length > 0 && (
        <section className="mt-5 rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-5">
          <h2 className="rotulo-secao">Suas propostas de rateio</h2>
          <ul className="mt-3 space-y-2 text-dado">
            {propostas.map((pr) => (
              <li key={pr.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/custos/${pr.itemId}`}
                  className="font-medium no-underline hover:underline"
                >
                  {pr.itemDescricao}
                </Link>
                <span className="text-[var(--ink-3)]">aguardando {pr.aguardando.join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {vazio && lanca ? (
        <PrimeiroCusto setor={setor} />
      ) : (
        <>
          <section className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-fmp-md border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3">
            <Indicador
              rotulo="Custo mensal da área"
              valor={formatarBRL(mensal)}
              nota="Soma dos itens ativos e em análise"
              href={urlDaLista({ situacao: "ativos" })}
            />
            <Indicador
              rotulo="Projeção para 12 meses"
              valor={formatarBRL(mensal.mul(12))}
              nota="Ao ritmo atual, sem reajuste"
            />
            <Indicador
              rotulo="Renovações em 90 dias"
              valor={String(renovacoes.length)}
              alerta={renovacoes.length > 0}
              nota={renovacoes.length > 0 ? "Precisam de decisão" : "Nada vencendo"}
              href={urlDaLista({ situacao: "renovacao", ordem: "renovacao", dir: "asc" })}
            />
          </section>

          {lanca && totalPendencias > 0 && (
            <section className="mt-5 rounded-fmp-md border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="flex items-center gap-2 sobrancelha">
                  <IconeAlerta />
                  Para resolver — deixa seu número completo
                </h2>
                {/* A fila inteira, resolvível na própria lista sem abrir item
                    por item. O cartão mostra os primeiros; o link mostra todos. */}
                <Link
                  href={urlDaLista({ natureza: "tudo", situacao: "pendencia" })}
                  className="text-meta font-medium text-[var(--accent-texto)] no-underline hover:underline"
                >
                  Resolver tudo de uma vez
                </Link>
              </div>
              <ul className="mt-3 space-y-2">
                {/* Primeiro na lista porque é o único que engana: a linha está
                    preenchida, o valor aparece na tela, e mesmo assim o custo
                    não é contado em nenhum total. */}
                {pendencias.semCambio.map((i) => (
                  <Pendente
                    key={i.id}
                    id={i.id}
                    texto={`${i.descricao} está em ${i.moeda} sem cotação — fica fora dos totais`}
                    acao="Informar cotação"
                  />
                ))}
                {pendencias.semValor.map((i) => (
                  <Pendente
                    key={i.id}
                    id={i.id}
                    texto={`${i.descricao} está sem valor`}
                    acao="Informar valor"
                  />
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

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-5">
              <h2 className="rotulo-secao">Maiores custos da área</h2>
              {maiores.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--ink-3)]">Nenhum custo cadastrado ainda.</p>
              ) : (
                <ul className="mt-3 divide-y divide-[var(--rule)]">
                  {maiores.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={`/custos/${m.id}`}
                        className="flex items-baseline justify-between gap-3 py-2.5 no-underline hover:text-[var(--accent-texto)]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{m.descricao}</span>
                          <span className="block text-micro text-[var(--ink-3)]">
                            {m.fornecedor?.nome ?? "sem fornecedor"}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm tabular-nums">
                          {m.valorMensalDoEscopo.isZero()
                            ? "—"
                            : `${formatarBRL(m.valorMensalDoEscopo)}/mês`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/custos"
                className="mt-3 inline-flex items-center gap-1.5 text-dado font-medium text-[var(--accent-texto)] no-underline hover:underline"
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
    <section className="mt-8 rounded-fmp-md border border-dashed border-[var(--rule-2,#c4c0b2)] px-8 py-12 text-center">
      <p className="font-serif text-xl font-bold">Comece pelo que {setor} paga todo mês.</p>
      <p className="mx-auto mt-2 max-w-md text-base text-[var(--ink-2)]">
        Assinaturas, contratos, serviços. Cadastre um por vez — leva menos de um minuto cada, e o
        sistema calcula o equivalente mensal sozinho.
      </p>
      <Link href="/custos/novo" className={`mt-6 ${classesDeBotao("primario", "lg")}`}>
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
        className="flex items-center justify-between gap-3 rounded-lg bg-[var(--surface)] px-3.5 py-2.5 text-sm no-underline hover:bg-[var(--ground)]"
      >
        <span className="min-w-0 truncate text-[var(--ink)]">{texto}</span>
        <span className="flex shrink-0 items-center gap-1 text-dado font-medium text-[var(--accent-texto)]">
          {acao} <IconeSeta className="size-4" />
        </span>
      </Link>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Visão corporativa — Admin e Controladoria
// ---------------------------------------------------------------------------

async function InicioCorporativo({ usuario }: { usuario: Usuario }) {
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
      <p className="sobrancelha">
        {admin ? "Você administra a plataforma" : "Você consulta todos os setores"}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="titulo-pagina">Visão corporativa</h1>
        {admin && (
          <div className="flex gap-2">
            <Link href="/admin/usuarios" className={classesDeBotao("contorno")}>
              <IconeUsuarios />
              Usuários
            </Link>
            <Link href="/custos/novo" className={classesDeBotao("primario")}>
              <IconeMais />
              Cadastrar custo
            </Link>
          </div>
        )}
      </div>
      {/* A RESSALVA EM DUAS CAMADAS.
          Este parágrafo tinha oito linhas e vinha ANTES do primeiro número: num
          telefone a pessoa abria o painel e lia um texto onde esperava um total.

          Mas ele não podia simplesmente encolher. Ele existe para impedir uma
          leitura errada — que este número seja confundido com o custo total da
          FMP — e essa era exatamente a confusão que o rodapé da lista antes
          pedia desculpa por causar.

          Então separa-se o que cada metade faz: a CONCLUSÃO ("é menor que a
          lista completa", com o link para conferir) fica sempre visível, porque
          é ela que evita o erro. O MECANISMO (como o rateio divide, quais
          naturezas não entram) vira documentação a um toque, porque é
          referência — se lê uma vez, não toda manhã. */}
      <p className="mt-2 max-w-2xl text-sm text-[var(--ink-2)]">
        Custo <strong>recorrente</strong> de todos os setores, já com rateio — por isso é menor que
        o da{" "}
        <Link
          href={urlDaLista({ natureza: "tudo", situacao: "todos" })}
          className="text-[var(--accent-texto)]"
        >
          lista completa de custos
        </Link>
        .
      </p>
      <details className="group mt-1.5 max-w-2xl">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-meta text-[var(--ink-3)] select-none hover:text-[var(--ink-2)]">
          <span aria-hidden className="transition-transform group-open:rotate-90">
            ›
          </span>
          Como esta conta é feita
        </summary>
        <p className="mt-1.5 pl-4 text-meta text-[var(--ink-3)]">
          Um item dividido meio a meio entre duas áreas entra pela metade em cada uma, e a soma dos
          setores fecha com o total. Naturezas diferentes — pontual, investimento, pessoal — nunca
          são somadas aqui sem pedido explícito.
        </p>
      </details>

      {admin && (usuarios <= 1 || lancaram < Math.min(3, setores.length)) && (
        <GuiaInicial
          usuariosAtivos={usuarios}
          setoresQueLancaram={lancaram}
          totalSetores={setores.length}
        />
      )}

      <section className="mt-7 grid grid-cols-1 gap-px overflow-hidden rounded-fmp-md border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Custo recorrente por mês"
          valor={formatarBRL(mensal)}
          nota="Itens ativos e em análise, já com rateio"
          href={urlDaLista({ situacao: "ativos" })}
        />
        <Indicador
          rotulo="Projeção para 12 meses"
          valor={formatarBRL(mensal.mul(12))}
          nota="Ao ritmo atual, sem reajuste"
        />
        <Indicador
          rotulo="Renovações em 90 dias"
          valor={String(renovacoes.length)}
          alerta={renovacoes.length > 0}
          nota={renovacoes.length > 0 ? "Exigem decisão antes do vencimento" : "Nada vencendo"}
          href={urlDaLista({ situacao: "renovacao", ordem: "renovacao", dir: "asc" })}
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

      <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarrasRanqueadas
          titulo="Custo por setor"
          descricao="Quanto cada área consome por mês, já com o rateio aplicado. Clique para ver a lista."
          fatias={porSetor}
          limite={13}
          vazio="Nenhum custo rateado ainda."
          recorte={(chave) => ({ situacao: "ativos", setor: chave })}
        />
        <BarrasRanqueadas
          titulo="Concentração por fornecedor"
          descricao="Onde há dependência — e, portanto, onde a negociação vale mais."
          fatias={porFornecedor}
          recorte={(chave) => ({
            situacao: "ativos",
            fornecedor: chave === SEM_FORNECEDOR ? SEM_FORNECEDOR : chave,
          })}
        />
        <BarrasRanqueadas
          titulo="Custo por categoria"
          descricao="Em que tipo de coisa o dinheiro está indo."
          fatias={porCategoria}
          recorte={(chave) => ({
            situacao: "ativos",
            categoria: chave === SEM_CATEGORIA ? SEM_CATEGORIA : chave,
          })}
        />
        <CartaoRenovacoes renovacoes={renovacoes} notaVazio={pendencias.semVigencia} />
      </div>

      {(() => {
        const naoRateado = porSetor.find((f) => f.chave === "nao-rateado");
        return naoRateado ? (
          <p className="mt-4 rounded-lg border-l-[3px] border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink-2)]">
            <strong>{formatarBRL(naoRateado.valor)}/mês está sem setor responsável</strong> e
            aparece como “Não rateado”. Dinheiro sem dono não pode ficar invisível —{" "}
            <Link
              href={urlDaLista({ situacao: "ativos", setor: SEM_SETOR })}
              className="font-medium text-[var(--accent-texto)]"
            >
              ver quais são
            </Link>
            .
          </p>
        ) : null;
      })()}

      <section className="mt-4 rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-5">
        <h2 className="rotulo-secao">O que falta para o número estar completo</h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PendenciaResumo
            n={pendencias.semValor}
            rotulo="itens sem valor"
            detalhe="Não entram em nenhuma soma."
            falta="valor"
          />
          {/* Renderizado só quando existe: um "0 itens sem cotação" fixo numa
              fundação que quase não compra em dólar seria ruído permanente. */}
          {pendencias.semCambio > 0 && (
            <PendenciaResumo
              n={pendencias.semCambio}
              rotulo="itens sem cotação"
              detalhe="Estão em moeda estrangeira e ficam fora do total."
              falta="cambio"
            />
          )}
          <PendenciaResumo
            n={pendencias.semVigencia}
            rotulo="itens sem data de término"
            detalhe="Não geram alerta de renovação."
            falta="data"
          />
          <PendenciaResumo
            n={pendencias.semCategoria}
            rotulo="itens sem categoria"
            detalhe="Somem do agrupamento por tipo."
            falta="categoria"
          />
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
      feito: setoresQueLancaram >= Math.min(3, totalSetores),
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
    <section className="mt-6 rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-5">
      <h2 className="rotulo-secao">
        Comece por aqui — {pendentes} {pendentes === 1 ? "passo pendente" : "passos pendentes"}
      </h2>
      <ol className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {passos.map((p, i) => (
          <li
            key={p.titulo}
            className={`rounded-fmp-md border p-4 ${
              p.feito
                ? "border-[var(--rule)] opacity-60"
                : "border-[var(--rule)] bg-[var(--ground)]"
            }`}
          >
            <span className="flex items-center gap-2 text-meta font-semibold uppercase tracking-wide text-[var(--ink-3)]">
              {p.feito ? (
                <IconeCheck className="size-4.5 text-emerald-600" />
              ) : (
                <span className="flex size-5 items-center justify-center rounded-full bg-[var(--accent)] text-micro font-bold text-white">
                  {i + 1}
                </span>
              )}
              {p.feito ? "Feito" : `Passo ${i + 1}`}
            </span>
            <p className="mt-2 text-sm font-semibold leading-snug">{p.titulo}</p>
            <p className="mt-1 text-dado leading-snug text-[var(--ink-2)]">{p.texto}</p>
            {!p.feito && (
              <Link
                href={p.href}
                className="mt-2.5 inline-flex items-center gap-1 text-dado font-medium text-[var(--accent-texto)] no-underline hover:underline"
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
    <section className="rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-5">
      <h2 className="flex items-center gap-2 rotulo-secao">
        <IconeCalendario className="size-4" />
        Renovações nos próximos 90 dias
      </h2>
      <p className="mt-1 text-meta text-[var(--ink-3)]">
        Renovar por inércia é a forma mais cara de decidir.
      </p>
      {renovacoes.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-3)]">
          Nada vencendo.{" "}
          {notaVazio !== undefined && notaVazio > 0
            ? notaVazio === 1
              ? "Atenção: 1 item não tem data de término e por isso nunca aparece aqui."
              : `Atenção: ${notaVazio} itens não têm data de término e por isso nunca aparecem aqui.`
            : "Custos sem data de término não aparecem aqui."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {renovacoes.map((r) => (
            <li key={r.id}>
              <Link
                href={`/custos/${r.id}`}
                className="flex items-baseline justify-between gap-3 text-dado no-underline hover:text-[var(--accent-texto)]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{r.descricao}</span>
                  <span className="block text-micro text-[var(--ink-3)]">
                    {r.fornecedor?.nome ?? "sem fornecedor"}
                    {r.rateios[0] ? ` · ${r.rateios[0].setor.nome}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  {r.dataFim?.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                  <span className="block text-micro text-[var(--ink-3)]">
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

function PendenciaResumo({
  n,
  rotulo,
  detalhe,
  falta,
}: {
  n: number;
  rotulo: string;
  detalhe: string;
  falta: string;
}) {
  const limpo = n === 0;
  const corpo = (
    <>
      <span
        className={`text-xl font-semibold tabular-nums ${limpo ? "" : "text-[var(--accent-texto)]"}`}
      >
        {n}
      </span>
      <span className="mt-0.5 block text-dado text-[var(--ink-2)]">{rotulo}</span>
      <span className="mt-0.5 block text-micro text-[var(--ink-3)]">
        {limpo ? "Nada pendente." : detalhe}
      </span>
    </>
  );

  // Zero não é porta: não há fila para abrir, e um link que leva a uma lista
  // vazia gasta um clique para dizer o que o número já dizia.
  if (limpo) return <li>{corpo}</li>;
  return (
    <li>
      <Link
        href={urlDaLista({ natureza: "tudo", situacao: "pendencia", falta })}
        className="-m-2 block rounded-lg p-2 no-underline transition-colors hover:bg-[var(--ground)]"
      >
        {corpo}
        <span className="mt-1 block text-micro font-medium text-[var(--accent-texto)]">
          Resolver na lista →
        </span>
      </Link>
    </li>
  );
}
