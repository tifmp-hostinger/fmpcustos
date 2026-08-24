import nodemailer, { type Transporter } from "nodemailer";

/**
 * ENVIO DE E-MAIL
 *
 * A única saída do sistema para fora da tela. Três decisões a moldam.
 *
 * **Nunca lança.** Um SMTP fora do ar, uma senha trocada, uma caixa cheia — nada
 * disso pode derrubar a rotina que gerou os alertas. A varredura já aconteceu e
 * já vale por si: os alertas estão na tela mesmo que nenhum e-mail saia. Cada
 * envio devolve o que houve, e quem chamou registra.
 *
 * **Sem SMTP configurado, o sistema diz isso em voz alta.** A alternativa
 * tentadora é fingir sucesso e escrever no log — e aí um administrador passa
 * três meses achando que treze pessoas recebem resumo semanal quando ninguém
 * recebe. A rotina responde `enviados: 0, motivo: "SMTP não configurado"`, o que
 * é visível no primeiro teste.
 *
 * **A configuração é lida a cada envio, não no import.** Um módulo que monta o
 * transporte no carregamento quebra o build quando as variáveis só existem em
 * produção, e obriga a reiniciar o serviço para trocar uma senha.
 */

export type Configuracao = {
  host: string;
  porta: number;
  seguro: boolean;
  usuario: string;
  senha: string;
  /** Nulo quando SMTP_REMETENTE não foi definido e SMTP_USUARIO não é um endereço. */
  remetente: string | null;
};

export type Envio =
  | { enviado: true; para: string }
  | { enviado: false; para: string; motivo: string };

const PARECE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lê a configuração do ambiente. Null quando falta o essencial. */
export function configuracaoSmtp(): Configuracao | null {
  const host = process.env.SMTP_HOST?.trim();
  const usuario = process.env.SMTP_USUARIO?.trim();
  const senha = process.env.SMTP_SENHA;
  if (!host || !usuario || !senha) return null;

  const porta = Number(process.env.SMTP_PORTA ?? 587);

  // O remetente padrão só é montado a partir do usuário quando o usuário É um
  // endereço. Em muitos provedores ele não é ("fmp", "custos01", um id
  // numérico), e aí o padrão produziria `Custos FMP <custos01>` — recusado pelo
  // servidor com "bad sender address syntax", no primeiro envio real, depois de
  // tudo parecer configurado. Sem endereço válido, `remetente` fica nulo e o
  // envio recusa com uma frase que diz o que fazer.
  const declarado = process.env.SMTP_REMETENTE?.trim();
  const remetente = declarado || (PARECE_EMAIL.test(usuario) ? `Custos FMP <${usuario}>` : null);

  return {
    host,
    porta: Number.isFinite(porta) ? porta : 587,
    // 465 é TLS implícito; 587 é STARTTLS. Errar isso trava a conexão sem
    // mensagem útil, então a porta decide sozinha, e SMTP_SEGURO só existe para
    // o caso raro em que o servidor foge da convenção.
    seguro: process.env.SMTP_SEGURO ? process.env.SMTP_SEGURO === "true" : porta === 465,
    usuario,
    senha,
    remetente,
  };
}

let transporte: Transporter | null = null;
let assinaturaDoTransporte = "";

function obterTransporte(cfg: Configuracao): Transporter {
  // O transporte é reaproveitado entre envios (pool de conexões), mas trocar uma
  // variável de ambiente precisa valer sem reiniciar o serviço: a assinatura
  // detecta a mudança e refaz.
  const assinatura = `${cfg.host}:${cfg.porta}:${cfg.seguro}:${cfg.usuario}`;
  if (transporte && assinaturaDoTransporte === assinatura) return transporte;

  transporte = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.porta,
    secure: cfg.seguro,
    auth: { user: cfg.usuario, pass: cfg.senha },
    pool: true,
    maxConnections: 2,
    // Treze e-mails não justificam abrir treze conexões, e servidor
    // compartilhado costuma cortar quem tenta.
    maxMessages: 50,
  });
  assinaturaDoTransporte = assinatura;
  return transporte;
}

export async function enviarEmail({
  para,
  assunto,
  html,
  texto,
}: {
  para: string;
  assunto: string;
  html: string;
  /** Versão em texto puro. Obrigatória: cliente que bloqueia HTML não recebe página em branco. */
  texto: string;
}): Promise<Envio> {
  const cfg = configuracaoSmtp();
  if (!cfg) return { enviado: false, para, motivo: "SMTP não configurado" };
  if (!cfg.remetente) {
    return {
      enviado: false,
      para,
      motivo:
        "Falta definir SMTP_REMETENTE: o usuário do SMTP não é um endereço de e-mail, e o servidor recusa a mensagem sem remetente válido.",
    };
  }

  try {
    await obterTransporte(cfg).sendMail({
      from: cfg.remetente,
      to: para,
      subject: assunto,
      text: texto,
      html,
    });
    return { enviado: true, para };
  } catch (erro) {
    return {
      enviado: false,
      para,
      motivo: erro instanceof Error ? erro.message : String(erro),
    };
  }
}

/** Confere se o SMTP responde, sem mandar mensagem nenhuma. */
export async function testarSmtp(): Promise<{ ok: boolean; motivo?: string }> {
  const cfg = configuracaoSmtp();
  if (!cfg) return { ok: false, motivo: "SMTP não configurado" };
  // O remetente é conferido aqui e não só no envio: um teste que diz "responde"
  // e um envio que falha em seguida é pior que nenhum teste.
  if (!cfg.remetente) {
    return {
      ok: false,
      motivo:
        "Falta definir SMTP_REMETENTE: o usuário do SMTP não é um endereço de e-mail. A conexão pode até abrir, mas o servidor recusa a mensagem.",
    };
  }
  try {
    await obterTransporte(cfg).verify();
    return { ok: true };
  } catch (erro) {
    return { ok: false, motivo: erro instanceof Error ? erro.message : String(erro) };
  }
}

/** Escapa texto que vai para dentro do HTML do e-mail. */
export function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
