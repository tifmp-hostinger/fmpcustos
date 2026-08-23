import Link from "next/link";
import { exigirSessao, ROTULO_PAPEL, podeLancar } from "@/lib/sessao";
import { sair } from "./sair";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await exigirSessao();

  const itens: Array<{ href: "/" | "/custos" | "/admin/usuarios"; rotulo: string }> = [
    { href: "/", rotulo: "Painel" },
    { href: "/custos", rotulo: "Custos" },
  ];
  if (usuario.papel === "ADMIN") {
    itens.push({ href: "/admin/usuarios", rotulo: "Usuários" });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--rule)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3.5">
          <Link href="/" className="font-serif text-[17px] font-bold tracking-tight no-underline">
            Custos <em className="text-[var(--accent)]">FMP</em>
          </Link>

          <nav className="flex gap-1">
            {itens.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2.5 py-1.5 text-[14px] text-[var(--ink-2)] no-underline hover:bg-[var(--surface)] hover:text-[var(--ink)]"
              >
                {item.rotulo}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-[13px]">
            <span className="text-right leading-tight">
              <span className="block font-medium">{usuario.nome}</span>
              <span className="block text-[11px] text-[var(--ink-3)]">
                {ROTULO_PAPEL[usuario.papel]}
                {usuario.setorNome ? ` · ${usuario.setorNome}` : ""}
              </span>
            </span>
            <form action={sair}>
              <button
                type="submit"
                className="rounded-md border border-[var(--rule)] px-2.5 py-1.5 text-[13px] text-[var(--ink-2)] hover:text-[var(--ink)]"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {!usuario.setorId && !podeLancar(usuario.papel) && (
        <p className="mx-auto max-w-6xl px-6 pt-4 text-sm text-[var(--ink-3)]">
          Seu usuário ainda não está vinculado a um setor. Peça ao administrador.
        </p>
      )}

      {children}
    </div>
  );
}
