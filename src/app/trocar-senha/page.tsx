"use client";

import { useActionState } from "react";
import { trocarSenha } from "./acoes";
import { Aviso, Campo, Enviar } from "@/components/campos";
import type { Resultado } from "@/lib/acoes";

export default function TrocarSenha() {
  const [resultado, acao] = useActionState<Resultado | null, FormData>(trocarSenha, null);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-3)]">
        FMP · Inteligência de custos
      </p>
      <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight">
        Definir uma <em className="text-[var(--accent)]">nova senha</em>
      </h1>
      <p className="mt-3 text-sm text-[var(--ink-2)]">
        Sua senha atual é temporária. Escolha uma nova para continuar.
      </p>

      <form action={acao} className="mt-8 space-y-4">
        <Campo
          rotulo="Senha atual"
          nome="atual"
          tipo="password"
          obrigatorio
          autoComplete="current-password"
        />
        <Campo
          rotulo="Nova senha"
          nome="nova"
          tipo="password"
          obrigatorio
          autoComplete="new-password"
          dica="Ao menos 10 caracteres, com letras e números."
        />
        <Campo
          rotulo="Repita a nova senha"
          nome="confirmacao"
          tipo="password"
          obrigatorio
          autoComplete="new-password"
        />
        <Aviso resultado={resultado} />
        <Enviar>Salvar senha</Enviar>
      </form>
    </main>
  );
}
