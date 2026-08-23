import { prisma } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";
import { listarSetores } from "@/lib/consultas";
import { EditarUsuario, NovoUsuario } from "./formularios";

export const dynamic = "force-dynamic";

export default async function Usuarios() {
  await exigirAdmin();

  const [usuarios, setores] = await Promise.all([
    prisma.usuario.findMany({
      select: {
        id: true,
        papel: true,
        ativo: true,
        ultimoAcesso: true,
        colaborador: { select: { nome: true, email: true, setorId: true } },
      },
      orderBy: [{ ativo: "desc" }, { colaborador: { nome: "asc" } }],
    }),
    listarSetores(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Usuários</h1>
      <p className="mt-1.5 text-[var(--ink-2)]">
        Cada pessoa entra com o próprio e-mail e enxerga apenas o setor ao qual está
        vinculada. Administrador e Controladoria enxergam todos.
      </p>

      <div className="mt-8">
        <NovoUsuario setores={setores} />
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-[0.11em] text-[var(--ink-3)]">
        {usuarios.length} {usuarios.length === 1 ? "usuário" : "usuários"}
      </h2>
      <div className="mt-3 space-y-2">
        {usuarios.map((u) => (
          <EditarUsuario
            key={u.id}
            setores={setores}
            usuario={{
              id: u.id,
              nome: u.colaborador.nome,
              email: u.colaborador.email,
              papel: u.papel,
              setorId: u.colaborador.setorId,
              ativo: u.ativo,
            }}
          />
        ))}
      </div>
    </main>
  );
}
