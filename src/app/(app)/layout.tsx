import Link from "next/link";
import { exigirSessao, ROTULO_PAPEL, setoresVisiveis } from "@/lib/sessao";
import { prisma } from "@/lib/db";
import { Navegacao, type ItemNav } from "@/components/nav";
import { ProvedorDeAvisos } from "@/components/avisos";
import { BuscaGlobal } from "@/components/busca";
import { sair } from "./sair";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await exigirSessao();

  const setores = setoresVisiveis(usuario);
  const pendentes = await prisma.alerta.count({
    where: {
      status: "ABERTO",
      itemCusto: {
        excluidoEm: null,
        ...(setores === null
          ? {}
          : { rateios: { some: { setorId: { in: setores }, vigenciaFim: null } } }),
      },
    },
  });

  const itens: ItemNav[] = [
    { href: "/", rotulo: "Início", icone: "painel" },
    { href: "/custos", rotulo: "Custos", icone: "custos" },
    { href: "/alertas", rotulo: "Alertas", icone: "alertas", contador: pendentes },
  ];
  if (usuario.papel === "ADMIN") {
    itens.push({ href: "/admin", rotulo: "Administração", icone: "admin" });
  }

  const iniciais = usuario.nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <ProvedorDeAvisos>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-[var(--rule)] bg-[var(--ground)]/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3">
            <Link
              href="/"
              className="mr-1 font-serif text-[17px] font-bold tracking-tight no-underline"
            >
              Custos <em className="text-[var(--accent)]">FMP</em>
            </Link>

            <Navegacao itens={itens} />

            <BuscaGlobal />

            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="flex size-8 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[12px] font-bold text-[var(--accent)]"
                >
                  {iniciais}
                </span>
                <span className="hidden text-right leading-tight sm:block">
                  <span className="block max-w-[180px] truncate text-[13px] font-semibold">
                    {usuario.nome}
                  </span>
                  <span className="block text-[11px] text-[var(--ink-3)]">
                    {ROTULO_PAPEL[usuario.papel]}
                    {usuario.setorNome ? ` · ${usuario.setorNome}` : ""}
                  </span>
                </span>
              </div>
              <Link
              href="/trocar-senha"
              className="rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--ink-3)] no-underline hover:text-[var(--ink)]"
            >
              Trocar senha
            </Link>
            <form action={sair}>
                <button
                  type="submit"
                  className="rounded-lg border border-[var(--rule)] px-3 py-1.5 text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink-3)] hover:text-[var(--ink)]"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-[var(--rule)] py-4">
          <p className="mx-auto max-w-6xl px-6 text-[11px] text-[var(--ink-3)]">
            FMP · Fundação Escola Superior do Ministério Público — plataforma de inteligência de
            custos
          </p>
        </footer>
      </div>
    </ProvedorDeAvisos>
  );
}
