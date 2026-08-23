import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirSessao, podeLancar, vePorInteiro } from "@/lib/sessao";
import { listarCategorias, listarSetores } from "@/lib/consultas";
import { FormularioCusto } from "../formulario";

export const dynamic = "force-dynamic";

export default async function NovoCusto() {
  const usuario = await exigirSessao();
  if (!podeLancar(usuario.papel)) redirect("/custos");

  const [categorias, setores] = await Promise.all([listarCategorias(), listarSetores()]);
  const escolheSetor = vePorInteiro(usuario.papel);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <nav aria-label="Você está em" className="text-[12px] text-[var(--ink-3)]">
        <Link href="/custos" className="text-[var(--ink-3)] no-underline hover:text-[var(--accent)]">Custos</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[var(--ink-2)]">Novo</span>
      </nav>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">Cadastrar custo</h1>
      <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">
        Três blocos: <strong>o que é</strong>, <strong>quanto custa</strong> e{" "}
        <strong>quando renova</strong>. Informe o valor de cada cobrança — o equivalente mensal o
        sistema calcula sozinho.
      </p>

      <FormularioCusto
        categorias={categorias}
        setores={setores}
        podeEscolherSetor={escolheSetor}
        setorFixo={usuario.setorNome}
        valores={{ setorId: usuario.setorId }}
      />
    </main>
  );
}
