"use client";

import { MenuDeLinha } from "@/components/menu";
import { IconeChave, IconeSair } from "@/components/icones";
import { sair } from "./sair";

/**
 * A IDENTIDADE NO CABEÇALHO, COMO MENU.
 *
 * Antes eram quatro elementos soltos: a sigla, o nome, "Trocar senha" e "Sair".
 * Num computador isso ocupa um canto; num telefone de 390px eles não cabiam na
 * mesma linha da navegação e desciam para uma SEGUNDA faixa, que aparecia em
 * cima de toda tela do sistema custando uns 45px de altura — para duas ações
 * que uma pessoa usa, no máximo, uma vez por semestre.
 *
 * Agora a sigla é o gatilho, e as duas ações moram dentro. Não é só economia de
 * telefone: num computador o cabeçalho também para de gastar peso visual
 * permanente com "Sair", que é a última coisa que alguém quer clicar sem querer.
 *
 * O nome continua escrito ao lado a partir de `sm`, onde há espaço. Num
 * telefone ele fica só dentro do menu — quem está logado sabe quem é; o que
 * precisa estar sempre visível é onde a pessoa está, e disso cuida a navegação.
 */
export function MenuDoUsuario({
  nome,
  papel,
  iniciais,
}: {
  nome: string;
  papel: string;
  iniciais: string;
}) {
  return (
    <MenuDeLinha
      rotulo={`Conta de ${nome}`}
      classeGatilho="flex items-center gap-2.5 rounded-full p-0.5 pr-1 transition-colors hover:bg-[var(--surface)]"
      conteudoGatilho={
        <>
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-meta font-bold text-[var(--accent)]"
          >
            {iniciais}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-[180px] truncate text-dado font-semibold">{nome}</span>
            <span className="block text-micro text-[var(--ink-3)]">{papel}</span>
          </span>
        </>
      }
      itens={[
        {
          // No telefone o nome não cabe ao lado da sigla; aqui dentro ele cabe,
          // e o menu abre dizendo de quem é a conta antes de oferecer sair dela.
          rotulo: `${nome} · ${papel}`,
          desabilitado: true,
        },
        {
          separadorAntes: true,
          rotulo: "Trocar senha",
          icone: <IconeChave className="size-4" />,
          href: "/trocar-senha",
        },
        {
          rotulo: "Sair",
          icone: <IconeSair className="size-4" />,
          aoEscolher: () => {
            void sair();
          },
        },
      ]}
    />
  );
}
