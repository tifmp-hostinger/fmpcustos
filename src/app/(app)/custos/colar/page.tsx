import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { listarSetores } from "@/lib/consultas";
import { Colador } from "./colador";

export const dynamic = "force-dynamic";

export default async function ColarDaPlanilha() {
  const usuario = await exigirSessao();
  if (!podeLancar(usuario.papel)) redirect("/custos");

  const setores = await listarSetores();
  const escolheSetor = vePorInteiro(usuario.papel);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <nav aria-label="Você está em" className="text-meta text-[var(--ink-3)]">
        <Link
          href="/custos"
          className="text-[var(--ink-3)] no-underline hover:text-[var(--accent)]"
        >
          Custos
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-[var(--ink-2)]">Colar da planilha</span>
      </nav>

      <h1 className="mt-2 titulo-pagina">
        Colar da <em className="text-[var(--accent)]">planilha</em>
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--ink-2)]">
        Se os custos da sua área já estão numa aba de Excel, o caminho curto é este: selecione as
        células, copie e cole abaixo. O sistema mostra o que entendeu de cada linha antes de gravar
        qualquer coisa.
      </p>

      <Colador
        setores={setores}
        podeEscolherSetor={escolheSetor}
        setorFixo={usuario.setorNome}
        setorInicial={usuario.setorId}
      />
    </main>
  );
}
