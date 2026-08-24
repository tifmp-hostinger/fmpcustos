import Link from "next/link";
import { exigirSessao, ROTULO_PAPEL, setoresVisiveis } from "@/lib/sessao";
import { prisma } from "@/lib/db";
import { Navegacao, type ItemNav } from "@/components/nav";
import { ProvedorDeAvisos } from "@/components/avisos";
import { BuscaGlobal } from "@/components/busca";
import { Marca, NomeDoProduto } from "@/components/marca";
import { MenuDoUsuario } from "./usuario";

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

            <div className="ml-auto flex items-center">
              <MenuDoUsuario
                nome={usuario.nome}
                papel={`${ROTULO_PAPEL[usuario.papel]}${usuario.setorNome ? ` · ${usuario.setorNome}` : ""}`}
                iniciais={iniciais}
              />
            </div>
          </div>
        </header>

        {/* O respiro no pé é a altura da barra de navegação do telefone. Sem
            ele o último custo da lista fica embaixo da barra, e a pessoa pensa
            que a lista acabou uma linha antes. */}
        <div className="flex-1 pb-20 sm:pb-0">{children}</div>

        <Navegacao itens={itens} variante="rodape" />

        <footer className="border-t border-[var(--rule)] py-4 pb-20 sm:pb-4">
          <p className="mx-auto max-w-6xl px-6 text-micro text-[var(--ink-3)]">
            FMP · Fundação Escola Superior do Ministério Público — plataforma de inteligência de
            custos
          </p>
        </footer>
      </div>
    </ProvedorDeAvisos>
  );
}
