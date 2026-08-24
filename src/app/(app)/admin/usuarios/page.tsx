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
        precisaTrocarSenha: true,
        criadoEm: true,
        colaborador: { select: { nome: true, email: true, setorId: true } },
      },
      orderBy: [{ ativo: "desc" }, { colaborador: { nome: "asc" } }],
    }),
    listarSetores(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-3)]">
        Administração
      </p>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">Usuários</h1>
      <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">
        Cada pessoa entra com o próprio e-mail e enxerga apenas o setor ao qual está vinculada.
        Administrador e Controladoria enxergam todos.
      </p>

      <ol className="mt-5 grid gap-2 rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-4 text-[13px] text-[var(--ink-2)] sm:grid-cols-3">
        <li className="flex gap-2.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-white">
            1
          </span>
          Você cria o usuário e escolhe o perfil e o setor.
        </li>
        <li className="flex gap-2.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-white">
            2
          </span>
          O sistema mostra a senha temporária uma vez, com botão de copiar.
        </li>
        <li className="flex gap-2.5">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-white">
            3
          </span>
          No primeiro acesso, a pessoa define a própria senha.
        </li>
      </ol>

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
              ultimoAcesso: u.ultimoAcesso?.toISOString() ?? null,
              precisaTrocarSenha: u.precisaTrocarSenha,
              criadoEm: u.criadoEm.toISOString(),
            }}
          />
        ))}
      </div>
    </main>
  );
}
