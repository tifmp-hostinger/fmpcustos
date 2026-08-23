"use client";

import { useActionState } from "react";
import { entrar } from "./acoes";
import { Aviso, Campo, Enviar } from "@/components/campos";
import type { Resultado } from "@/lib/acoes";

export default function Login() {
  const [resultado, acao] = useActionState<Resultado | null, FormData>(entrar, null);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-3)]">
        FMP · Inteligência de custos
      </p>
      <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight">
        Entrar no <em className="text-[var(--accent)]">sistema</em>
      </h1>

      <form action={acao} className="mt-8 space-y-4">
        <Campo
          rotulo="E-mail"
          nome="email"
          tipo="email"
          obrigatorio
          autoComplete="username"
          valor={resultado && !resultado.ok ? resultado.valores?.email : undefined}
        />
        <Campo
          rotulo="Senha"
          nome="senha"
          tipo="password"
          obrigatorio
          autoComplete="current-password"
        />
        <Aviso resultado={resultado} />
        <Enviar>Entrar</Enviar>
      </form>

      <p className="mt-8 text-xs text-[var(--ink-3)]">
        Sem acesso? Peça ao administrador do sistema para criar o seu usuário e
        vincular ao seu setor.
      </p>
    </main>
  );
}
