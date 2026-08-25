import Link from "next/link";
import { prisma } from "@/lib/db";
import { exigirSessao, setoresVisiveis } from "@/lib/sessao";
import { ROTULO_TIPO } from "@/lib/alertas";
import { ListaDeAlertas, type LinhaAlerta } from "./lista";
import { PreferenciaResumo } from "./preferencia";
import { configuracaoSmtp } from "@/lib/email";
import type { Prisma, TipoAlerta } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const ABERTOS = ["ABERTO", "RECONHECIDO"] as const;

/**
 * A tela que diz o que precisa de decisão esta semana.
 *
 * Ela existe pelo mesmo motivo que o resumo por e-mail: um sistema de custo que
 * só funciona quando alguém lembra de abri-lo não funciona. Aqui é onde quem
 * abriu descobre, em uma tela, tudo o que está esperando por ele.
 *
 * O que já foi ignorado fica atrás de um link, não de um filtro na cara: são
 * decisões tomadas, e mostrá-las junto do que está pendente é o começo de uma
 * lista que ninguém lê.
 */
export default async function Alertas({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const usuario = await exigirSessao();
  const { v } = await searchParams;
  const verIgnorados = v === "ignorados";

  const setores = setoresVisiveis(usuario);
  const escopo: Prisma.AlertaWhereInput = {
    status: verIgnorados ? "IGNORADO" : { in: [...ABERTOS] },
    itemCusto: {
      excluidoEm: null,
      ...(setores === null
        ? {}
        : { rateios: { some: { setorId: { in: setores }, vigenciaFim: null } } }),
    },
  };

  const [alertas, ignorados, preferencia] = await Promise.all([
    prisma.alerta.findMany({
      where: escopo,
      select: {
        id: true,
        tipo: true,
        titulo: true,
        descricao: true,
        severidade: true,
        status: true,
        itemCustoId: true,
        criadoEm: true,
        itemCusto: {
          select: {
            rateios: {
              where: { vigenciaFim: null },
              select: { setor: { select: { nome: true } } },
              orderBy: { percentual: "desc" },
            },
          },
        },
      },
      // Urgência primeiro, e dentro dela o mais antigo: o que está parado há
      // mais tempo é o que ninguém pegou.
      orderBy: [{ severidade: "desc" }, { criadoEm: "asc" }],
      take: 200,
    }),
    prisma.alerta.count({
      where: { ...escopo, status: "IGNORADO" },
    }),
    prisma.usuario.findUnique({
      where: { id: usuario.id },
      select: { receberResumo: true },
    }),
  ]);

  const linhas: LinhaAlerta[] = alertas.map((a) => ({
    id: a.id,
    tipo: a.tipo,
    rotuloTipo: ROTULO_TIPO[a.tipo as TipoAlerta] ?? a.tipo,
    titulo: a.titulo,
    descricao: a.descricao,
    severidade: a.severidade,
    status: a.status,
    itemCustoId: a.itemCustoId,
    setores: a.itemCusto?.rateios.map((r) => r.setor.nome) ?? [],
    criadoEm: a.criadoEm.toISOString(),
  }));

  const urgentes = linhas.filter((a) => a.severidade >= 4 && a.status === "ABERTO").length;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="sobrancelha">{usuario.setorNome ?? "FMP"}</p>
      <h1 className="mt-2 titulo-pagina">
        {verIgnorados ? "Alertas ignorados" : "O que precisa de você"}
      </h1>
      <p className="mt-1.5 text-sm text-[var(--ink-2)]">
        {verIgnorados ? (
          <>
            Marcados como “não se aplica”. Reabrir devolve o alerta à fila —{" "}
            <Link href="/alertas" className="font-medium text-[var(--accent-texto)]">
              voltar aos pendentes
            </Link>
            .
          </>
        ) : urgentes > 0 ? (
          <>
            <strong>
              {urgentes} {urgentes === 1 ? "precisa" : "precisam"} de decisão
            </strong>{" "}
            — o resto está esperando um dado. Resolver o custo apaga o alerta sozinho; não há botão
            de “resolvido”.
          </>
        ) : (
          <>
            Renovações que se aproximam e cadastros incompletos. Resolver o custo apaga o alerta
            sozinho; não há botão de “resolvido”.
          </>
        )}
      </p>

      <ListaDeAlertas alertas={linhas} />

      {!verIgnorados && (
        <PreferenciaResumo
          inicial={preferencia?.receberResumo ?? true}
          smtpConfigurado={configuracaoSmtp() !== null}
        />
      )}

      {!verIgnorados && ignorados > 0 && (
        <p className="mt-6 text-dado text-[var(--ink-3)]">
          <Link href={{ pathname: "/alertas", query: { v: "ignorados" } }}>
            {ignorados} {ignorados === 1 ? "alerta ignorado" : "alertas ignorados"}
          </Link>{" "}
          não aparecem aqui.
        </p>
      )}
    </main>
  );
}
