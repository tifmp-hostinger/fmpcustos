import Link from "next/link";
import { prisma } from "@/lib/db";
import { exigirAdmin } from "@/lib/sessao";

export const dynamic = "force-dynamic";

/**
 * O índice da administração.
 *
 * Existe porque o cabeçalho não comporta um item por tela administrativa, e
 * porque cada cartão carrega o número que diz se aquela tela precisa de atenção
 * agora. Um menu que só lista nomes obriga a abrir as quatro para descobrir
 * onde está o problema.
 */
export default async function Admin() {
  await exigirAdmin();

  const [usuarios, semAcesso, semCotacao, cotacoes] = await Promise.all([
    prisma.usuario.count({ where: { ativo: true } }),
    prisma.usuario.count({ where: { ativo: true, ultimoAcesso: null } }),
    prisma.itemCusto.count({
      where: { moeda: { not: "BRL" }, cambio: null, excluidoEm: null, valorPeriodo: { not: null } },
    }),
    prisma.cotacaoMoeda.count(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-[12px] font-semibold tracking-[0.14em] text-[var(--ink-3)] uppercase">
        Administração
      </p>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">O que você mantém</h1>
      <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">
        As decisões que valem para a FMP inteira. Cada cartão mostra o que está em aberto.
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Cartao
          href="/admin/usuarios"
          titulo="Usuários"
          descricao="Quem entra, com que perfil e enxergando qual setor."
          nota={
            semAcesso > 0
              ? `${usuarios} ativos · ${semAcesso} nunca acessaram`
              : `${usuarios} ativos · todos já acessaram`
          }
          atencao={semAcesso > 0}
        />
        <Cartao
          href="/admin/cambio"
          titulo="Câmbio"
          descricao="A cotação de dólar e euro que o cadastro sugere."
          nota={
            semCotacao > 0
              ? `${semCotacao} ${semCotacao === 1 ? "custo fora" : "custos fora"} dos totais`
              : cotacoes > 0
                ? `${cotacoes} ${cotacoes === 1 ? "cotação registrada" : "cotações registradas"}`
                : "Nenhuma cotação registrada"
          }
          atencao={semCotacao > 0}
        />
      </div>
    </main>
  );
}

function Cartao({
  href,
  titulo,
  descricao,
  nota,
  atencao,
}: {
  href: "/admin/usuarios" | "/admin/cambio";
  titulo: string;
  descricao: string;
  nota: string;
  atencao?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border p-5 no-underline transition-colors ${
        atencao
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/5 hover:border-[var(--accent)]"
          : "border-[var(--rule)] bg-[var(--surface)] hover:border-[var(--ink-3)]"
      }`}
    >
      <h2 className="font-serif text-[19px] font-bold">{titulo}</h2>
      <p className="mt-1 text-[13.5px] text-[var(--ink-2)]">{descricao}</p>
      <p
        className={`mt-3 text-[12.5px] font-medium tabular-nums ${
          atencao ? "text-[var(--accent)]" : "text-[var(--ink-3)]"
        }`}
      >
        {nota}
      </p>
    </Link>
  );
}
