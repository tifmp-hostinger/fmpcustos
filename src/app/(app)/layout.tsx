import Link from "next/link";
import { exigirSessao, ROTULO_PAPEL, setoresVisiveis } from "@/lib/sessao";
import { prisma } from "@/lib/db";
import { Navegacao, type ItemNav } from "@/components/nav";
import { ProvedorDeAvisos } from "@/components/avisos";
import { BuscaGlobal } from "@/components/busca";
import { Marca, NomeDoProduto } from "@/components/marca";
import { sair } from "./sair";
import { classesDeBotao } from "@/components/botao";

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
            <Link href="/" className="mr-1 flex items-center gap-3 no-underline">
              <NomeDoProduto />
              <Marca />
            </Link>

            <Navegacao itens={itens} />

            <BuscaGlobal />

            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="flex size-8 items-center justify-center rounded-full bg-[var(--accent)]/12 text-meta font-bold text-[var(--accent)]"
                >
                  {iniciais}
                </span>
                <span className="hidden text-right leading-tight sm:block">
                  <span className="block max-w-[180px] truncate text-dado font-semibold">
                    {usuario.nome}
                  </span>
                  <span className="block text-micro text-[var(--ink-3)]">
                    {ROTULO_PAPEL[usuario.papel]}
                    {usuario.setorNome ? ` · ${usuario.setorNome}` : ""}
                  </span>
                </span>
              </div>
              <Link href="/trocar-senha" className={classesDeBotao("texto", "sm")}>
                Trocar senha
              </Link>
              <form action={sair}>
                <button type="submit" className={classesDeBotao("contorno", "sm")}>
                  Sair
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-[var(--rule)] py-4">
          <p className="mx-auto max-w-6xl px-6 text-micro text-[var(--ink-3)]">
            FMP · Fundação Escola Superior do Ministério Público — plataforma de inteligência de
            custos
          </p>
        </footer>
      </div>
    </ProvedorDeAvisos>
  );
}
