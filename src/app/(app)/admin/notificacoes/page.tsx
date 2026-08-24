import Link from "next/link";
import { prisma } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";
import { configuracaoSmtp } from "@/lib/email";
import { ROTULO_TIPO } from "@/lib/alertas";
import { BotaoDeRotina } from "./botoes";
import type { TipoAlerta } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

/**
 * O estado das notificações, num lugar só.
 *
 * A pergunta que esta tela responde é sempre a mesma e nunca é óbvia: **isto
 * está realmente funcionando?** Alertas gerados, e-mail configurado, quem
 * recebe, quando saiu o último. Sem ela, a única prova de que o resumo semanal
 * funciona é alguém reclamar de não ter recebido — o que, por definição, só
 * acontece depois de já ter falhado por semanas.
 */
export default async function Notificacoes() {
  await exigirAdmin();

  const smtp = configuracaoSmtp();

  const [porTipo, ignorados, assinantes, ultimoEnvio, semEmailUtil] = await Promise.all([
    prisma.alerta.groupBy({
      by: ["tipo"],
      where: { status: { in: ["ABERTO", "RECONHECIDO"] } },
      _count: { _all: true },
    }),
    prisma.alerta.count({ where: { status: "IGNORADO" } }),
    prisma.usuario.count({ where: { ativo: true, receberResumo: true } }),
    prisma.usuario.findFirst({
      where: { resumoEnviadoEm: { not: null } },
      orderBy: { resumoEnviadoEm: "desc" },
      select: { resumoEnviadoEm: true },
    }),
    prisma.usuario.count({ where: { ativo: true, receberResumo: false } }),
  ]);

  const totalAbertos = porTipo.reduce((s, g) => s + g._count._all, 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="sobrancelha">Administração</p>
      <h1 className="mt-2 titulo-pagina">Notificações</h1>
      <p className="mt-1.5 text-sm text-[var(--ink-2)]">
        Um sistema de custo que só funciona quando alguém lembra de abri-lo não funciona. Duas
        rotinas invertem isso: uma varre o cadastro e gera os alertas, outra manda o resumo semanal
        para quem responde por cada área.
      </p>

      <section
        className={`mt-7 rounded-fmp-md border p-5 ${
          smtp
            ? "border-[var(--rule)] bg-[var(--surface)]"
            : "border-[var(--accent)]/40 bg-[var(--accent)]/5"
        }`}
      >
        <h2 className="rotulo-secao">Envio de e-mail</h2>
        {smtp ? (
          <>
            <p className="mt-2 text-sm">
              Configurado: <strong className="font-mono text-dado">{smtp.host}</strong>:{smtp.porta}{" "}
              {smtp.seguro ? "(TLS)" : "(STARTTLS)"} como{" "}
              <span className="font-mono text-dado">{smtp.usuario}</span>
            </p>
            <p className="mt-1 text-meta text-[var(--ink-3)]">
              Remetente: {smtp.remetente ?? "não definido — falta SMTP_REMETENTE"} · {assinantes}{" "}
              {assinantes === 1 ? "pessoa recebe" : "pessoas recebem"} o resumo
              {semEmailUtil > 0 && ` · ${semEmailUtil} desligaram`}
              {ultimoEnvio?.resumoEnviadoEm &&
                ` · último envio em ${ultimoEnvio.resumoEnviadoEm.toLocaleDateString("pt-BR")}`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <BotaoDeRotina
                acao="conferirSmtp"
                rotulo="Testar conexão"
                ocupadoRotulo="Testando…"
              />
              <BotaoDeRotina
                acao="enviarParaMim"
                rotulo="Enviar um resumo para mim"
                ocupadoRotulo="Enviando…"
              />
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm">
              Ainda não configurado. Os alertas aparecem na tela, mas nenhum e-mail sai — e ninguém
              é avisado de nada sem entrar no sistema.
            </p>
            <p className="mt-3 text-dado text-[var(--ink-2)]">
              Defina no serviço: <Var>SMTP_HOST</Var>, <Var>SMTP_PORTA</Var>,{" "}
              <Var>SMTP_USUARIO</Var>, <Var>SMTP_SENHA</Var> e, opcionalmente,{" "}
              <Var>SMTP_REMETENTE</Var>. Depois volte aqui e use “Testar conexão”.
            </p>
          </>
        )}
      </section>

      <section className="mt-4 rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="rotulo-secao">Alertas em aberto</h2>
          <Link
            href="/alertas"
            className="text-dado font-medium text-[var(--accent)] no-underline hover:underline"
          >
            Ver a lista
          </Link>
        </div>

        {totalAbertos === 0 ? (
          <p className="mt-3 text-dado text-[var(--ink-3)]">
            Nenhum. Ou está tudo em dia, ou a varredura ainda não rodou nesta base.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--rule)]">
            {porTipo
              .sort((a, b) => b._count._all - a._count._all)
              .map((g) => (
                <li key={g.tipo} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="text-dado">{ROTULO_TIPO[g.tipo as TipoAlerta] ?? g.tipo}</span>
                  <span className="text-sm font-semibold tabular-nums">{g._count._all}</span>
                </li>
              ))}
          </ul>
        )}
        <p className="mt-3 text-meta text-[var(--ink-3)]">
          {ignorados > 0 && `${ignorados} marcados como “não se aplica”. `}A varredura roda pela
          rotina agendada; este botão é para conferir agora.
        </p>
        <div className="mt-3">
          <BotaoDeRotina
            acao="varrerAgora"
            rotulo="Varrer agora"
            ocupadoRotulo="Varrendo…"
            primario
          />
        </div>
      </section>

      <section className="mt-4 rounded-fmp-md border border-[var(--rule)] bg-[var(--surface)] p-5">
        <h2 className="rotulo-secao">Agendamento</h2>
        <p className="mt-2 text-dado text-[var(--ink-2)]">
          O sistema não agenda a si mesmo — quem agenda é o servidor. Aponte duas tarefas para as
          rotas abaixo, com o cabeçalho <Var>Authorization: Bearer $ROTINAS_TOKEN</Var>:
        </p>
        <ul className="mt-3 space-y-2 text-dado">
          <li>
            <code className="rounded bg-[var(--ink)]/6 px-1.5 py-0.5 font-mono text-meta">
              POST /api/rotinas/alertas
            </code>{" "}
            <span className="text-[var(--ink-3)]">— uma vez por dia, de manhã cedo</span>
          </li>
          <li>
            <code className="rounded bg-[var(--ink)]/6 px-1.5 py-0.5 font-mono text-meta">
              POST /api/rotinas/resumo
            </code>{" "}
            <span className="text-[var(--ink-3)]">— uma vez por semana, depois da varredura</span>
          </li>
        </ul>
        <p className="mt-3 text-meta text-[var(--ink-3)]">
          Sem <Var>ROTINAS_TOKEN</Var> definido, as rotas recusam tudo — inclusive uma chamada sem
          token. No servidor, as mesmas rotinas rodam por{" "}
          <code className="font-mono text-meta">npm run rotina alertas</code>.
        </p>
      </section>
    </main>
  );
}

function Var({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-[var(--ink)]/6 px-1 py-0.5 font-mono text-meta">{children}</code>
  );
}
