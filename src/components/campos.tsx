"use client";

import { useId, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Campo de senha com botão de mostrar/ocultar.
 *
 * Digitar senha às cegas é a maior fonte de "senha incorreta" que não é senha
 * incorreta — ainda mais numa senha temporária repassada por outro canal.
 * O botão fica fora do fluxo de tabulação e é anunciado por aria-label, para
 * não atrapalhar quem navega por teclado ou leitor de tela.
 */
export function CampoSenha({
  rotulo,
  nome,
  obrigatorio,
  dica,
  autoComplete = "current-password",
}: {
  rotulo: string;
  nome: string;
  obrigatorio?: boolean;
  dica?: string;
  autoComplete?: string;
}) {
  const [visivel, setVisivel] = useState(false);
  const idDica = useId();

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--ink-2)]">
          {rotulo}
          {obrigatorio && <span className="ml-0.5 text-[var(--accent)]">*</span>}
        </span>
        <span className="relative block">
          <input
            type={visivel ? "text" : "password"}
            name={nome}
            required={obrigatorio}
            autoComplete={autoComplete}
            aria-describedby={dica ? idDica : undefined}
            className="w-full rounded-lg border border-[var(--rule)] bg-[var(--surface)] py-2 pl-3 pr-11 text-[15px] outline-none focus:border-[var(--accent)]"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisivel((v) => !v)}
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            title={visivel ? "Ocultar senha" : "Mostrar senha"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--ink-3)] hover:text-[var(--ink)]"
          >
            <Olho aberto={!visivel} />
          </button>
        </span>
      </label>
      {dica && (
        <span id={idDica} className="mt-1 block text-xs text-[var(--ink-3)]">
          {dica}
        </span>
      )}
    </div>
  );
}

function Olho({ aberto }: { aberto: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {!aberto && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );
}

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
