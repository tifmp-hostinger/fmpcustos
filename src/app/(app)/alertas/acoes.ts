"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigirSessao, setoresVisiveis, type UsuarioSessao } from "@/lib/sessao";
import { falha, sucesso, texto, type Resultado } from "@/lib/acoes";
import type { StatusAlerta } from "@/generated/prisma/enums";

/**
 * O que se pode fazer com um alerta.
 *
 * Duas ações, e nenhuma delas é "resolver". Resolver não é um botão: um alerta
 * de renovação some quando a decisão é tomada no custo, um de dado incompleto
 * some quando o dado é preenchido. Se houvesse um botão de resolver, ele viraria
 * um botão de esconder — e a lista passaria a descrever o que as pessoas
 * clicaram, não o que é verdade.
 *
 * O que existe é:
 *  - **Reconhecer**: eu vi, estou cuidando. Sai da fila do dia sem sumir, e
 *    volta a ABERTO sozinho se a urgência subir — "depois eu cuido" vale para 60
 *    dias e não vale para 7.
 *  - **Ignorar**: não se aplica. Este é definitivo por vontade de alguém, e por
 *    isso guarda quem foi.
 */

async function alertaQuePosseVer(usuario: UsuarioSessao, alertaId: string) {
  const setores = setoresVisiveis(usuario);

  return prisma.alerta.findFirst({
    where: {
      id: alertaId,
      ...(setores === null
        ? {}
        : {
            itemCusto: {
              rateios: { some: { setorId: { in: setores }, vigenciaFim: null } },
            },
          }),
    },
    select: { id: true, titulo: true, status: true },
  });
}

async function mudarStatus(
  dados: FormData,
  novo: StatusAlerta,
  mensagem: (titulo: string) => string,
): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  if (!id) return falha("Alerta não informado.");

  const alerta = await alertaQuePosseVer(usuario, id);
  if (!alerta) return falha("Este alerta não existe ou não é da sua área.");

  const anterior = alerta.status;
  await prisma.alerta.update({
    where: { id },
    data: {
      status: novo,
      // Só IGNORADO carrega autor: reconhecer é um estado de trabalho, ignorar é
      // uma decisão, e decisão sem dono é o que ninguém consegue revisar depois.
      ...(novo === "IGNORADO"
        ? { resolvidoEm: new Date(), resolvidoPor: usuario.nome }
        : { resolvidoEm: null, resolvidoPor: null }),
    },
  });

  revalidatePath("/alertas");
  revalidatePath("/");

  return sucesso(mensagem(alerta.titulo), {
    destaqueId: id,
    desfazer: { acao: "reverterCampo", id, antes: { status: anterior } },
  });
}

// Declaradas com `async function`, e não como constantes de seta: um módulo
// "use server" só exporta funções assíncronas, e a seta compila para uma
// constante que o Next recusa no build.
export async function reconhecerAlerta(dados: FormData): Promise<Resultado> {
  return mudarStatus(dados, "RECONHECIDO", () => "Marcado como visto.");
}

export async function ignorarAlerta(dados: FormData): Promise<Resultado> {
  return mudarStatus(dados, "IGNORADO", () => "Alerta ignorado.");
}

export async function reabrirAlerta(dados: FormData): Promise<Resultado> {
  return mudarStatus(dados, "ABERTO", () => "Alerta reaberto.");
}

/**
 * Desfazer de alerta.
 *
 * Reusa a forma `reverterCampo` do resto do sistema, mas com a sua própria
 * ação: o `reverterCampo` de custos escreve em `item_custo`, e mandar um id de
 * alerta para lá não acharia nada e devolveria "não há o que desfazer" — um
 * botão que existe, é clicado e não faz nada.
 */
export async function reverterAlerta(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const id = texto(dados, "id");
  const bruto = texto(dados, "antes");
  if (!id || !bruto) return falha("Não há o que desfazer.");

  let anterior: { status?: string };
  try {
    anterior = JSON.parse(bruto) as { status?: string };
  } catch {
    return falha("Não há o que desfazer.");
  }

  const permitidos: StatusAlerta[] = ["ABERTO", "RECONHECIDO", "IGNORADO", "RESOLVIDO"];
  if (!anterior.status || !permitidos.includes(anterior.status as StatusAlerta)) {
    return falha("Não há o que desfazer.");
  }

  const alerta = await alertaQuePosseVer(usuario, id);
  if (!alerta) return falha("Este alerta não existe ou não é da sua área.");

  await prisma.alerta.update({
    where: { id },
    data: {
      status: anterior.status as StatusAlerta,
      resolvidoEm: null,
      resolvidoPor: null,
    },
  });

  revalidatePath("/alertas");
  revalidatePath("/");
  return sucesso("Desfeito.", { destaqueId: id });
}

/**
 * Ligar ou desligar o resumo semanal.
 *
 * Mora aqui, e não numa tela de preferências, porque é aqui que a pessoa está
 * quando pensa no assunto: acabou de ler os alertas e decide se quer isso na
 * caixa de entrada. Uma tela de configurações que ninguém abre é o mesmo que não
 * ter a opção — e sem opção de sair, o resumo vira spam interno em dois meses.
 */
export async function definirResumo(dados: FormData): Promise<Resultado> {
  const usuario = await exigirSessao();
  const receber = texto(dados, "receber") === "true";

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      receberResumo: receber,
      // Ao religar, zera o carimbo: quem reativou quer o próximo resumo, não
      // quer esperar a janela de cinco dias contada de quando ainda recebia.
      ...(receber ? { resumoEnviadoEm: null } : {}),
    },
  });

  revalidatePath("/alertas");
  return sucesso(
    receber
      ? "Você vai receber o resumo semanal por e-mail."
      : "Resumo semanal desligado. Os alertas continuam nesta tela.",
  );
}
