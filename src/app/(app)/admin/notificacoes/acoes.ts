"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/sessao";
import { testarSmtp } from "@/lib/email";
import { enviarResumos } from "@/lib/resumo";
import { varrerAlertas } from "@/lib/alertas";
import { falha, sucesso, type Resultado } from "@/lib/acoes";

/**
 * As mesmas rotinas que o cron chama, disponíveis para quem administra.
 *
 * Não é conveniência: sem elas, configurar o SMTP é um ato de fé. O
 * administrador preenche cinco variáveis de ambiente, reinicia o serviço e não
 * tem como saber se funcionou — a única prova chegaria uma semana depois, quando
 * alguém reclamasse de não ter recebido nada. Aqui a resposta vem em dois
 * cliques, e é a mesma resposta que a rotina daria.
 */

export async function conferirSmtp(): Promise<Resultado> {
  await exigirAdmin();
  const r = await testarSmtp();
  return r.ok
    ? sucesso("O servidor de e-mail respondeu.", {
        detalhe: "Autenticação aceita. O resumo semanal tem por onde sair.",
      })
    : falha(`O servidor de e-mail não respondeu: ${r.motivo}`);
}

/** Manda o resumo só para quem pediu, ignorando a janela de reenvio. */
export async function enviarParaMim(): Promise<Resultado> {
  const admin = await exigirAdmin();

  const r = await enviarResumos({ apenasPara: admin.email, intervaloDias: 0 });
  if (r.motivo) return falha(r.motivo);
  if (r.falhas.length > 0) return falha(`Não saiu: ${r.falhas[0].motivo}`);
  if (r.enviados === 0) {
    // Não é erro: é a regra de "semana sem novidade não vira e-mail" aparecendo
    // no teste. Dizer isso evita meia hora procurando defeito onde não há.
    return falha(
      "Nada a enviar: não há alerta aberto na sua área. Um resumo vazio não é enviado, de propósito.",
    );
  }
  return sucesso(`Resumo enviado para ${admin.email}.`, {
    detalhe: "É exatamente o que as outras pessoas receberiam.",
  });
}

/** Roda a varredura agora, sem esperar o cron. */
export async function varrerAgora(): Promise<Resultado> {
  await exigirAdmin();
  const r = await varrerAlertas();

  revalidatePath("/alertas");
  revalidatePath("/admin/notificacoes");
  revalidatePath("/");

  const partes = [
    r.criados > 0 && `${r.criados} ${r.criados === 1 ? "novo" : "novos"}`,
    r.atualizados > 0 && `${r.atualizados} atualizados`,
    r.resolvidos > 0 && `${r.resolvidos} resolvidos sozinhos`,
  ].filter(Boolean);

  return sucesso(partes.length > 0 ? `Varredura: ${partes.join(", ")}.` : "Nada mudou.", {
    detalhe:
      r.resolvidos > 0
        ? "Alertas resolvidos saíram da lista porque o dado que faltava foi preenchido."
        : undefined,
    irPara: "/alertas",
  });
}
