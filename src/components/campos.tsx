"use client";

import { useFormStatus } from "react-dom";

export function Campo({
  rotulo,
  nome,
  tipo = "text",
  obrigatorio,
  valor,
  dica,
  placeholder,
  ...resto
}: {
  rotulo: string;
  nome: string;
  tipo?: string;
  obrigatorio?: boolean;
  valor?: string | number | null;
  dica?: string;
  placeholder?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-2)]">
        {rotulo}
        {obrigatorio && <span className="ml-0.5 text-[var(--accent)]">*</span>}
      </span>
      <input
        {...resto}
        type={tipo}
        name={nome}
        required={obrigatorio}
        placeholder={placeholder}
        defaultValue={valor ?? undefined}
        className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-[15px] outline-none focus:border-[var(--accent)]"
      />
      {dica && <span className="mt-1 block text-xs text-[var(--ink-3)]">{dica}</span>}
    </label>
  );
}

export function Selecao({
  rotulo,
  nome,
  opcoes,
  valor,
  obrigatorio,
  dica,
  vazio,
}: {
  rotulo: string;
  nome: string;
  opcoes: Array<{ valor: string; rotulo: string }>;
  valor?: string | null;
  obrigatorio?: boolean;
  dica?: string;
  vazio?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-2)]">
        {rotulo}
        {obrigatorio && <span className="ml-0.5 text-[var(--accent)]">*</span>}
      </span>
      <select
        name={nome}
        required={obrigatorio}
        defaultValue={valor ?? ""}
        className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-[15px] outline-none focus:border-[var(--accent)]"
      >
        {vazio && <option value="">{vazio}</option>}
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {dica && <span className="mt-1 block text-xs text-[var(--ink-3)]">{dica}</span>}
    </label>
  );
}

export function AreaTexto({
  rotulo,
  nome,
  valor,
  dica,
}: {
  rotulo: string;
  nome: string;
  valor?: string | null;
  dica?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-2)]">{rotulo}</span>
      <textarea
        name={nome}
        rows={3}
        defaultValue={valor ?? undefined}
        className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-[15px] outline-none focus:border-[var(--accent)]"
      />
      {dica && <span className="mt-1 block text-xs text-[var(--ink-3)]">{dica}</span>}
    </label>
  );
}

export function Enviar({ children = "Salvar" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[15px] font-medium text-white transition-opacity disabled:opacity-50"
    >
      {pending ? "Salvando…" : children}
    </button>
  );
}

export function Aviso({ resultado }: { resultado: { ok: boolean; erro?: string; mensagem?: string } | null }) {
  if (!resultado) return null;
  const erro = !resultado.ok;
  return (
    <p
      role="status"
      className={`rounded-lg border-l-[3px] px-3 py-2 text-sm ${
        erro
          ? "border-[var(--accent)] bg-[var(--accent)]/8 text-[var(--accent)]"
          : "border-emerald-600 bg-emerald-600/8 text-emerald-700 dark:text-emerald-400"
      }`}
    >
      {erro ? resultado.erro : resultado.mensagem}
    </p>
  );
}
