"use client";

import { useActionState } from "react";
import { atualizarUsuario, criarUsuario, resetarSenha } from "./acoes";
import { Aviso, Campo, Enviar, Selecao } from "@/components/campos";
import { PAPEIS } from "@/lib/opcoes";
import type { Resultado } from "@/lib/acoes";

type Opcao = { valor: string; rotulo: string };

export function NovoUsuario({ setores }: { setores: Opcao[] }) {
  const [resultado, acao] = useActionState<Resultado | null, FormData>(criarUsuario, null);

  return (
    <form action={acao} className="space-y-4 rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
        Novo usuário
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome" nome="nome" obrigatorio placeholder="Nome completo" />
        <Campo rotulo="E-mail" nome="email" tipo="email" obrigatorio placeholder="pessoa@fmp.com.br" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao rotulo="Perfil" nome="papel" opcoes={PAPEIS} valor="GESTOR_SETOR" obrigatorio />
        <Selecao
          rotulo="Setor"
          nome="setorId"
          opcoes={setores}
          vazio="Sem setor (só para Admin e Controladoria)"
        />
      </div>
      <Aviso resultado={resultado} />
      <Enviar>Criar usuário</Enviar>
    </form>
  );
}

export function EditarUsuario({
  usuario,
  setores,
}: {
  usuario: { id: string; nome: string; email: string; papel: string; setorId: string | null; ativo: boolean };
  setores: Opcao[];
}) {
  const [resultado, acao] = useActionState<Resultado | null, FormData>(atualizarUsuario, null);
  const [resultadoSenha, acaoSenha] = useActionState<Resultado | null, FormData>(resetarSenha, null);

  return (
    <details className="rounded-xl border border-[var(--rule)] bg-[var(--surface)]">
      <summary className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5">
        <span>
          <span className="font-medium">{usuario.nome}</span>
          <span className="block text-[12px] text-[var(--ink-3)]">{usuario.email}</span>
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            usuario.ativo
              ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
              : "bg-[var(--accent)]/12 text-[var(--accent)]"
          }`}
        >
          {usuario.ativo ? "Ativo" : "Inativo"}
        </span>
      </summary>

      <div className="space-y-5 border-t border-[var(--rule)] px-5 py-5">
        <form action={acao} className="space-y-4">
          <input type="hidden" name="id" value={usuario.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Selecao rotulo="Perfil" nome="papel" opcoes={PAPEIS} valor={usuario.papel} obrigatorio />
            <Selecao
              rotulo="Setor"
              nome="setorId"
              opcoes={setores}
              valor={usuario.setorId}
              vazio="Sem setor (só para Admin e Controladoria)"
            />
          </div>
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" name="ativo" defaultChecked={usuario.ativo} className="size-4" />
            Usuário ativo — desmarque para revogar o acesso sem apagar o histórico
          </label>
          <Aviso resultado={resultado} />
          <Enviar>Salvar</Enviar>
        </form>

        <form action={acaoSenha} className="border-t border-[var(--rule)] pt-4">
          <input type="hidden" name="id" value={usuario.id} />
          <Aviso resultado={resultadoSenha} />
          <button
            type="submit"
            className="mt-2 text-sm text-[var(--accent)] underline underline-offset-4"
          >
            Gerar nova senha temporária
          </button>
        </form>
      </div>
    </details>
  );
}
