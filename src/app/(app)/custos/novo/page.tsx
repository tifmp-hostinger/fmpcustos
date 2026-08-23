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
      <h1 className="font-serif text-3xl font-bold tracking-tight">Cadastrar custo</h1>
      <p className="mt-1.5 text-[var(--ink-2)]">
        Informe o valor de <strong>cada cobrança</strong> e a periodicidade. O equivalente
        mensal é calculado pelo sistema — nunca digitado.
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
