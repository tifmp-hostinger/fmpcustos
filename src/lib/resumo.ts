import { prisma } from "@/lib/db";
import { formatarBRL } from "@/lib/dinheiro";
import { custoMensalCorrente, renovacoesProximas } from "@/lib/metricas/corrente";
import { enviarEmail, escapar, configuracaoSmtp } from "@/lib/email";
import { ROTULO_TIPO } from "@/lib/alertas";
import type { TipoAlerta } from "@/generated/prisma/enums";

/**
 * RESUMO SEMANAL POR E-MAIL
 *
 * O sistema mais bem desenhado do mundo não serve para nada se depender de
 * alguém lembrar de abri-lo. Uma plataforma de custo é consultada quando há
 * dúvida — e a dúvida chega depois do contrato ter renovado sozinho. O resumo
 * inverte isso: em vez de a pessoa ir até o número, o número vai até ela.
 *
 * O que decide o conteúdo é uma pergunta só: **o que faria alguém abrir o
 * sistema esta semana?** Não é o total mensal — esse é o mesmo de sempre e vira
 * papel de parede em três semanas. É o que mudou e o que vence.
 *
 * Por isso o e-mail é escrito de trás para frente: primeiro o que precisa de
 * decisão, depois o que está incompleto, e o total no rodapé, como contexto. E
 * por isso ele NÃO é enviado quando não há nada — um e-mail semanal que às vezes
 * diz "nada a relatar" ensina a arquivar sem ler, e aí o e-mail que importava
 * também é arquivado sem ler.
 *
 * Cada linha é um link. Um resumo que só informa obriga a pessoa a procurar o
 * item de novo dentro do sistema, e é nesse trecho que a intenção morre.
 */

const RECORRENTE = ["RECORRENTE"] as const;

export type ResultadoResumo = {
  enviados: number;
  pulados: number;
  falhas: Array<{ para: string; motivo: string }>;
  /** Preenchido quando não há SMTP: a rotina precisa dizer isso, não fingir sucesso. */
  motivo?: string;
};

type Destinatario = {
  usuarioId: string;
  nome: string;
  email: string;
  setorId: string | null;
  setorNome: string;
  vePorInteiro: boolean;
};

/**
 * Manda o resumo para quem deve receber.
 *
 * `intervaloDias` é a trava contra reenvio: a rotina pode ser chamada duas vezes
 * pelo mesmo cron mal configurado, e treze pessoas recebendo dois e-mails iguais
 * na mesma manhã é como um resumo semanal perde a credibilidade na primeira
 * semana.
 */
export async function enviarResumos({
  intervaloDias = 5,
  base,
  apenasPara,
}: {
  intervaloDias?: number;
  /** URL pública do sistema, para os links do e-mail. */
  base?: string;
  /** Restringe a um endereço — usado pelo teste de envio da Administração. */
  apenasPara?: string;
} = {}): Promise<ResultadoResumo> {
  if (!configuracaoSmtp()) {
    return { enviados: 0, pulados: 0, falhas: [], motivo: "SMTP não configurado" };
  }

  const endereco = (base ?? process.env.APP_URL ?? "").replace(/\/+$/, "");
  const corte = new Date();
  corte.setDate(corte.getDate() - intervaloDias);

  const usuarios = await prisma.usuario.findMany({
    where: {
      ativo: true,
      receberResumo: true,
      ...(apenasPara
        ? { colaborador: { email: { equals: apenasPara, mode: "insensitive" } } }
        : { OR: [{ resumoEnviadoEm: null }, { resumoEnviadoEm: { lt: corte } }] }),
    },
    select: {
      id: true,
      papel: true,
      colaborador: {
        select: { nome: true, email: true, setorId: true, setor: { select: { nome: true } } },
      },
    },
  });

  const resultado: ResultadoResumo = { enviados: 0, pulados: 0, falhas: [] };

  for (const u of usuarios) {
    const vePorInteiro = u.papel === "ADMIN" || u.papel === "CONTROLADORIA";
    const destinatario: Destinatario = {
      usuarioId: u.id,
      nome: u.colaborador.nome,
      email: u.colaborador.email,
      setorId: u.colaborador.setorId,
      // O administrador está lotado num setor como qualquer pessoa, mas o
      // resumo dele cobre a FMP inteira. Rotulá-lo com o setor de lotação
      // mandaria "3 custos precisam de decisão — TI" num e-mail que lista
      // contratos do Jurídico e do RH.
      setorNome: vePorInteiro ? "FMP" : (u.colaborador.setor?.nome ?? "FMP"),
      vePorInteiro,
    };

    const conteudo = await montarResumo(destinatario, endereco);
    if (!conteudo) {
      // Semana sem nada a dizer não vira e-mail. É o que mantém o e-mail da
      // semana seguinte valendo a pena abrir.
      resultado.pulados++;
      continue;
    }

    const envio = await enviarEmail({
      para: destinatario.email,
      assunto: conteudo.assunto,
      html: conteudo.html,
      texto: conteudo.texto,
    });

    if (envio.enviado) {
      await prisma.usuario.update({
        where: { id: u.id },
        data: { resumoEnviadoEm: new Date() },
      });
      resultado.enviados++;
    } else {
      resultado.falhas.push({ para: envio.para, motivo: envio.motivo });
    }
  }

  return resultado;
}

type Conteudo = { assunto: string; html: string; texto: string };

/** Monta o resumo de uma pessoa. Null quando não há nada que valha um e-mail. */
export async function montarResumo(
  destinatario: Destinatario,
  base: string,
): Promise<Conteudo | null> {
  const escopo = {
    setorIds: destinatario.vePorInteiro ? null : destinatario.setorId ? [destinatario.setorId] : [],
  };

  const filtroSetor =
    escopo.setorIds === null
      ? {}
      : { rateios: { some: { setorId: { in: escopo.setorIds }, vigenciaFim: null } } };

  const [alertas, mensal, renovacoes] = await Promise.all([
    prisma.alerta.findMany({
      where: {
        status: "ABERTO",
        itemCusto: { excluidoEm: null, ...filtroSetor },
      },
      select: {
        id: true,
        tipo: true,
        titulo: true,
        descricao: true,
        severidade: true,
        itemCustoId: true,
      },
      orderBy: [{ severidade: "desc" }, { criadoEm: "asc" }],
      take: 25,
    }),
    custoMensalCorrente(escopo, [...RECORRENTE]),
    renovacoesProximas(escopo, 30),
  ]);

  if (alertas.length === 0) return null;

  // Agrupado pelo que a pessoa vai FAZER, não pela severidade. Ordenar por
  // urgência e rotular por natureza produzia "Falta preencher" em cima de uma
  // renovação de 52 dias — o cabeçalho contradizendo a linha logo abaixo.
  const DECISAO: string[] = ["RENOVACAO_PROXIMA", "RATEIO_INCOMPLETO"];
  const paraDecidir = alertas.filter((a) => DECISAO.includes(a.tipo));
  const paraPreencher = alertas.filter((a) => !DECISAO.includes(a.tipo));

  const assunto =
    paraDecidir.length > 0
      ? `${paraDecidir.length} ${paraDecidir.length === 1 ? "custo precisa" : "custos precisam"} de decisão — ${destinatario.setorNome}`
      : `${alertas.length} ${alertas.length === 1 ? "pendência" : "pendências"} de cadastro — ${destinatario.setorNome}`;

  const link = (id: string | null) => (id ? `${base}/custos/${id}` : `${base}/alertas`);

  const grupos: Array<{ rotulo: string; itens: typeof alertas }> = [];
  if (paraDecidir.length > 0) {
    grupos.push({ rotulo: "Precisa de decisão", itens: paraDecidir });
  }
  if (paraPreencher.length > 0) {
    grupos.push({ rotulo: "Falta um dado", itens: paraPreencher });
  }

  const html = paginaHtml({
    titulo: assunto,
    saudacao: `${primeiroNome(destinatario.nome)}, esta é a semana em ${escapar(destinatario.setorNome)}.`,
    grupos: grupos.map((g) => ({
      rotulo: g.rotulo,
      linhas: g.itens.map((a) => ({
        titulo: escapar(a.titulo),
        detalhe: a.descricao ? escapar(a.descricao) : "",
        etiqueta: ROTULO_TIPO[a.tipo as TipoAlerta],
        href: link(a.itemCustoId),
        urgente: a.severidade >= 4,
      })),
    })),
    rodape: [
      `Custo mensal ${destinatario.vePorInteiro ? "da FMP" : `de ${escapar(destinatario.setorNome)}`}: <strong>${formatarBRL(mensal)}</strong>`,
      renovacoes.length > 0
        ? `${renovacoes.length} ${renovacoes.length === 1 ? "contrato renova" : "contratos renovam"} nos próximos 30 dias`
        : "Nenhum contrato renova nos próximos 30 dias",
    ],
    base,
  });

  const texto = [
    `${primeiroNome(destinatario.nome)}, esta é a semana em ${destinatario.setorNome}.`,
    "",
    ...grupos.flatMap((g) => [
      g.rotulo.toUpperCase(),
      ...g.itens.map((a) =>
        [`- ${a.titulo}`, a.descricao ? `  ${a.descricao}` : null, `  ${link(a.itemCustoId)}`]
          .filter(Boolean)
          .join("\n"),
      ),
      "",
    ]),
    `Custo mensal: ${formatarBRL(mensal)}`,
    renovacoes.length > 0
      ? `${renovacoes.length} contrato(s) renovam nos próximos 30 dias.`
      : "Nenhum contrato renova nos próximos 30 dias.",
    "",
    `Ver tudo: ${base}/alertas`,
    "Para deixar de receber este resumo, desmarque a opção no fim dessa página.",
  ].join("\n");

  return { assunto, html, texto };
}

function primeiroNome(nome: string): string {
  return escapar(nome.trim().split(/\s+/)[0] ?? nome);
}

/**
 * O HTML do e-mail.
 *
 * Tabelas e estilo em atributo `style`, sem folha externa e sem flexbox: cliente
 * de e-mail corporativo — que na FMP é Outlook — descarta `<style>` no `<head>`,
 * ignora grid e reposiciona qualquer coisa que dependa de layout moderno. Feio
 * por dentro, previsível por fora.
 */
function paginaHtml({
  titulo,
  saudacao,
  grupos,
  rodape,
  base,
}: {
  titulo: string;
  saudacao: string;
  grupos: Array<{
    rotulo: string;
    linhas: Array<{
      titulo: string;
      detalhe: string;
      etiqueta: string;
      href: string;
      urgente: boolean;
    }>;
  }>;
  rodape: string[];
  base: string;
}): string {
  const VERMELHO = "#C81E33";
  const TINTA = "#191818";
  const TINTA2 = "#4a4746";
  const REGRA = "#e2e0da";

  const linhas = grupos
    .map(
      (g) => `
      <tr><td style="padding:22px 24px 6px 24px;">
        <p style="margin:0;font:600 11px/1.4 -apple-system,Segoe UI,Arial,sans-serif;letter-spacing:.11em;text-transform:uppercase;color:${TINTA2};">${g.rotulo}</p>
      </td></tr>
      ${g.linhas
        .map(
          (l) => `
      <tr><td style="padding:0 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${REGRA};">
          <tr><td style="padding:12px 0;">
            <a href="${l.href}" style="color:${l.urgente ? VERMELHO : TINTA};font:600 15px/1.4 -apple-system,Segoe UI,Arial,sans-serif;text-decoration:none;">${l.titulo}</a>
            ${l.detalhe ? `<p style="margin:4px 0 0;font:400 13px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:${TINTA2};">${l.detalhe}</p>` : ""}
            <p style="margin:5px 0 0;font:400 11px/1.4 -apple-system,Segoe UI,Arial,sans-serif;color:#8a8681;">${l.etiqueta}</p>
          </td></tr>
        </table>
      </td></tr>`,
        )
        .join("")}`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title></head>
<body style="margin:0;padding:0;background:#efeeea;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efeeea;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${REGRA};border-radius:12px;overflow:hidden;">
    <tr><td style="padding:24px 24px 0 24px;">
      <p style="margin:0;font:700 17px/1.2 Georgia,serif;color:${TINTA};">Custos <span style="color:${VERMELHO};font-style:italic;">FMP</span></p>
      <p style="margin:14px 0 0;font:400 15px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:${TINTA};">${saudacao}</p>
    </td></tr>
    ${linhas}
    <tr><td style="padding:22px 24px 24px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${REGRA};">
        <tr><td style="padding-top:14px;">
          ${rodape.map((r) => `<p style="margin:0 0 4px;font:400 13px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:${TINTA2};">${r}</p>`).join("")}
          <p style="margin:14px 0 0;">
            <a href="${base}/alertas" style="display:inline-block;background:${VERMELHO};color:#ffffff;font:600 14px/1 -apple-system,Segoe UI,Arial,sans-serif;padding:11px 18px;border-radius:8px;text-decoration:none;">Ver no sistema</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  <p style="max-width:600px;margin:14px auto 0;font:400 11px/1.5 -apple-system,Segoe UI,Arial,sans-serif;color:#8a8681;text-align:center;">
    Resumo semanal de custos da FMP. Para deixar de receber, desmarque no fim da p&aacute;gina <a href="${base}/alertas" style="color:#8a8681;">Alertas</a>.
  </p>
</td></tr>
</table>
</body></html>`;
}
