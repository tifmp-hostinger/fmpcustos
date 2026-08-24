import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import type { Moeda, PapelUsuario, Periodicidade } from "../../src/generated/prisma/enums";
import { gerarHashSenha } from "../../src/lib/senha";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

let seq = 0;
const SETORES = [
  "TI",
  "Comunicação e Marketing",
  "Acadêmico",
  "Comercial",
  "Financeiro",
  "Jurídico",
  "Biblioteca",
  "Secretaria",
  "Infraestrutura",
  "RH",
  "Pesquisa",
  "Extensão",
  "Direção",
];

async function main() {
  // Idempotente: o script é rodado várias vezes durante o desenvolvimento.
  await prisma.$executeRawUnsafe(
    `TRUNCATE rateio, lancamento_custo, competencia, proposta_rateio_parcela, proposta_rateio,
     auditoria, cotacao_moeda, item_custo, fornecedor, usuario, colaborador, categoria,
     setor CASCADE`,
  );

  const setores = new Map<string, string>();
  for (const nome of SETORES) {
    const s = await prisma.setor.create({
      data: {
        nome,
        codigo: String(++seq).padStart(2, "0"),
      },
    });
    setores.set(nome, s.id);
  }

  const cats = ["Software", "Infraestrutura", "Serviços", "Comunicação"];
  const categorias = new Map<string, string>();
  for (const nome of cats) {
    const c = await prisma.categoria.create({ data: { nome, codigo: `CAT${++seq}` } });
    categorias.set(nome, c.id);
  }

  const hash = await gerarHashSenha("teste12345");
  async function usuario(nome: string, email: string, papel: PapelUsuario, setor: string | null) {
    const col = await prisma.colaborador.create({
      data: { nome, email, setorId: setor ? setores.get(setor)! : null },
    });
    return prisma.usuario.create({
      data: { colaboradorId: col.id, papel, senhaHash: hash, precisaTrocarSenha: false },
    });
  }
  await usuario("Ana Administradora", "admin@fmp.com.br", "ADMIN", "TI");
  await usuario("Carlos Gestor TI", "ti@fmp.com.br", "GESTOR_SETOR", "TI");
  await usuario("Marina Marketing", "mkt@fmp.com.br", "GESTOR_SETOR", "Comunicação e Marketing");
  await usuario("Rita Controladoria", "controladoria@fmp.com.br", "CONTROLADORIA", "Financeiro");
  await usuario("Leo Leitor", "leitor@fmp.com.br", "LEITOR", "TI");

  const dados: Array<
    [
      string,
      string,
      string,
      string,
      string,
      string | null,
      string | null,
      number,
      string?,
      string?,
    ]
  > = [
    // descrição, fornecedor, categoria, setor, periodicidade, valor, dataFim,
    // lançamentos, [moeda], [câmbio]
    [
      "Microsoft 365 — 120 licenças",
      "Microsoft",
      "Software",
      "TI",
      "MENSAL",
      "9840.00",
      "2026-12-31",
      0,
    ],
    [
      "GLPI — gestão de ativos",
      "GLPI Network",
      "Software",
      "TI",
      "MENSAL",
      "1500.33",
      "2026-10-15",
      3,
    ],
    ["Link dedicado 500 Mbps", "Vivo", "Infraestrutura", "TI", "MENSAL", "4200.00", null, 0],
    ["Antivírus corporativo", "Kaspersky", "Software", "TI", "ANUAL", "18600.00", "2027-03-01", 0],
    ["Hospedagem e CDN", "Hostinger", "Infraestrutura", "TI", "MENSAL", "890.00", null, 0],
    ["Certificado digital A1", "Serasa", "Serviços", "TI", "ANUAL", "1290.00", "2026-09-10", 0],
    ["Microsoft Dynamics CRM", "Microsoft", "Software", "TI", "MENSAL", "1240.00", "2027-01-31", 0],
    [
      "Adobe Creative Cloud — 8 licenças",
      "Adobe",
      "Software",
      "Comunicação e Marketing",
      "MENSAL",
      "2640.00",
      "2026-11-20",
      0,
    ],
    [
      "Mídia paga — Meta e Google",
      "Meta Platforms",
      "Comunicação",
      "Comunicação e Marketing",
      "MENSAL",
      "5500.00",
      null,
      0,
    ],
    [
      "Assessoria de imprensa",
      "Conteúdo Comunicação",
      "Serviços",
      "Comunicação e Marketing",
      "MENSAL",
      "3800.00",
      "2026-08-30",
      2,
    ],
    [
      "Plataforma de e-mail marketing",
      "RD Station",
      "Software",
      "Comunicação e Marketing",
      "MENSAL",
      "890.00",
      null,
      0,
    ],
    [
      "Plataforma de ensino a distância",
      "Moodle Partner",
      "Software",
      "Acadêmico",
      "ANUAL",
      "42000.00",
      "2027-02-28",
      0,
    ],
    [
      "Biblioteca digital jurídica",
      "Thomson Reuters",
      "Serviços",
      "Biblioteca",
      "ANUAL",
      "68000.00",
      "2026-09-30",
      0,
    ],
    ["Sistema acadêmico", "TOTVS", "Software", "Acadêmico", "MENSAL", "12400.00", null, 5],
    [
      "Limpeza e conservação",
      "Serv Facilities",
      "Serviços",
      "Infraestrutura",
      "MENSAL",
      "18900.00",
      "2027-06-30",
      0,
    ],
    ["Energia elétrica", "CEEE", "Infraestrutura", "Infraestrutura", "MENSAL", "22400.00", null, 0],
    [
      "Vigilância patrimonial",
      "Grupo Seguro",
      "Serviços",
      "Infraestrutura",
      "MENSAL",
      "14200.00",
      "2026-12-01",
      0,
    ],
    [
      "Contabilidade terceirizada",
      "Escritório Contábil Sul",
      "Serviços",
      "Financeiro",
      "MENSAL",
      "6800.00",
      null,
      0,
    ],
    [
      "Auditoria independente",
      "BDO",
      "Serviços",
      "Financeiro",
      "ANUAL",
      "38000.00",
      "2027-04-15",
      0,
    ],
    ["Software de folha", "Senior Sistemas", "Software", "RH", "MENSAL", "3200.00", null, 0],
    [
      "Plano de saúde — administração",
      "Unimed",
      "Serviços",
      "RH",
      "MENSAL",
      "1900.00",
      "2026-10-31",
      0,
    ],
    [
      "Publicações e periódicos",
      "Editora RT",
      "Serviços",
      "Pesquisa",
      "SEMESTRAL",
      "8400.00",
      null,
      0,
    ],
    ["Eventos e cerimonial", "Eventus", "Serviços", "Extensão", "SOB_DEMANDA", null, null, 0],
    [
      "Consultoria estratégica",
      "Falconi",
      "Serviços",
      "Direção",
      "TRIMESTRAL",
      "24000.00",
      "2026-11-30",
      0,
    ],
    [
      "Telefonia móvel corporativa",
      "Claro",
      "Infraestrutura",
      "Secretaria",
      "MENSAL",
      "1680.00",
      null,
      0,
    ],
    // Moeda estrangeira convertida: entra no total pelo real.
    [
      "Adobe Creative Cloud — 12 licenças",
      "Adobe",
      "Software",
      "Comunicação e Marketing",
      "MENSAL",
      "599.88",
      "2027-03-31",
      0,
      "USD",
      "5.432100",
    ],
    // Moeda estrangeira SEM cotação: o item existe, tem valor na tela e não é
    // contado em lugar nenhum. É a pendência que o sistema precisa mostrar.
    [
      "Zoom Business — 50 hospedeiros",
      "Zoom",
      "Software",
      "TI",
      "ANUAL",
      "9990.00",
      "2027-01-15",
      0,
      "USD",
      undefined,
    ],
  ];

  const OCORRENCIAS: Record<string, number | null> = {
    MENSAL: 12,
    BIMESTRAL: 6,
    TRIMESTRAL: 4,
    SEMESTRAL: 2,
    ANUAL: 1,
    UNICO: null,
    SOB_DEMANDA: null,
  };

  for (const [desc, forn, cat, setor, per, valor, fim, lanc, moeda, cambio] of dados) {
    let f = await prisma.fornecedor.findFirst({ where: { nome: forn } });
    if (!f) f = await prisma.fornecedor.create({ data: { nome: forn } });

    const oc = OCORRENCIAS[per];
    // Mesma regra do sistema: converte primeiro, divide depois — e sem taxa o
    // mensal é nulo, porque somar dólar como real é o defeito que se corrigiu.
    const taxa = (moeda ?? "BRL") === "BRL" ? 1 : cambio ? Number(cambio) : null;
    const mensal =
      valor && oc && taxa !== null ? ((Number(valor) * taxa * oc) / 12).toFixed(2) : null;

    const item = await prisma.itemCusto.create({
      data: {
        descricao: desc,
        fornecedorId: f.id,
        categoriaId: categorias.get(cat)!,
        periodicidade: per as Periodicidade,
        moeda: (moeda ?? "BRL") as Moeda,
        cambio: cambio ?? null,
        cambioEm: cambio ? new Date("2026-08-20") : null,
        valorPeriodo: valor,
        valorMensalNormalizado: mensal,
        status: valor ? "ATIVO" : "PENDENTE_APURACAO",
        dataInicio: new Date("2026-01-01"),
        dataFim: fim ? new Date(fim) : null,
      },
    });

    await prisma.rateio.create({
      data: {
        itemCustoId: item.id,
        setorId: setores.get(setor)!,
        metodo: "PERCENTUAL",
        percentual: "100.0000",
        vigenciaInicio: new Date("2026-01-01"),
      },
    });

    for (let i = 0; i < lanc; i++) {
      const comp = await prisma.competencia.upsert({
        where: { ano_mes: { ano: 2026, mes: i + 1 } },
        create: { ano: 2026, mes: i + 1 },
        update: {},
      });
      await prisma.lancamentoCusto.create({
        data: {
          itemCustoId: item.id,
          competenciaId: comp.id,
          valorRealizado: valor ?? "0",
          natureza: "RECORRENTE",
        },
      });
    }
  }

  // Uma cotação de referência já registrada: é o que o formulário sugere a
  // quem cadastrar o próximo custo em dólar.
  await prisma.cotacaoMoeda.create({
    data: {
      moeda: "USD",
      taxa: "5.432100",
      data: new Date("2026-08-20"),
      fonte: "Banco Central (PTAX)",
    },
  });

  const total = await prisma.itemCusto.aggregate({
    where: { status: "ATIVO" },
    _sum: { valorMensalNormalizado: true },
  });
  console.log(
    "itens:",
    dados.length,
    "· total mensal ATIVO:",
    total._sum.valorMensalNormalizado?.toString(),
  );
}

main().then(() => prisma.$disconnect());
