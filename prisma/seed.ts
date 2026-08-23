import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

/** Os 13 setores da FMP. Nenhum deles é privilegiado no modelo — TI é apenas mais um. */
const SETORES = [
  { codigo: "FIN", nome: "Financeiro e Tesouraria" },
  { codigo: "TI", nome: "Tecnologia da Informação" },
  { codigo: "COM", nome: "Comercial" },
  { codigo: "PRE", nome: "Assessoria da Presidência" },
  { codigo: "NEAD", nome: "NEAD" },
  { codigo: "BIB", nome: "Biblioteca" },
  { codigo: "MEST", nome: "Mestrado" },
  { codigo: "ACAD", nome: "Assessoria Acadêmica" },
  { codigo: "COMU", nome: "Comunicação" },
  { codigo: "ATEND", nome: "Atendimento e Relacionamento" },
  { codigo: "FAC", nome: "Facilities" },
  { codigo: "CPR", nome: "Compras" },
  { codigo: "JUR", nome: "Jurídico" },
];

/**
 * Categorias como árvore. As quatro do TI viram subárvore de Tecnologia,
 * ao lado das raízes que os outros setores vão precisar.
 */
const CATEGORIAS: Array<{ codigo: string; nome: string; pai?: string }> = [
  { codigo: "TEC", nome: "Tecnologia" },
  { codigo: "TEC.TELECOM", nome: "Telecomunicação", pai: "TEC" },
  { codigo: "TEC.INFRA", nome: "Infraestrutura", pai: "TEC" },
  { codigo: "TEC.SIST", nome: "Sistemas", pai: "TEC" },
  { codigo: "TEC.LIC", nome: "Licenças", pai: "TEC" },
  { codigo: "PRED", nome: "Predial e Facilities" },
  { codigo: "PRED.UTIL", nome: "Utilidades (energia, água)", pai: "PRED" },
  { codigo: "PRED.MANUT", nome: "Manutenção e limpeza", pai: "PRED" },
  { codigo: "SERV", nome: "Serviços profissionais" },
  { codigo: "SERV.JUR", nome: "Assessoria jurídica", pai: "SERV" },
  { codigo: "SERV.CONT", nome: "Contabilidade e auditoria", pai: "SERV" },
  { codigo: "ACADEM", nome: "Acadêmico" },
  { codigo: "ACADEM.AVA", nome: "Ambientes de aprendizagem", pai: "ACADEM" },
  { codigo: "ACADEM.ACERVO", nome: "Acervo e bases de pesquisa", pai: "ACADEM" },
  { codigo: "MKT", nome: "Marketing e captação" },
  { codigo: "FINAN", nome: "Financeiro e bancário" },
];

/**
 * Capacidades funcionais. É o catálogo que responde "existem ferramentas com
 * funcionalidades semelhantes?" de forma determinística — a sobreposição é
 * detectada por consulta, e só depois explicada pela IA.
 */
const CAPACIDADES = [
  { codigo: "VIDEOCONF", nome: "Videoconferência" },
  { codigo: "GESTAO_PROJ", nome: "Gestão de projetos" },
  { codigo: "AVA", nome: "Ambiente virtual de aprendizagem" },
  { codigo: "CHAT", nome: "Chat e atendimento" },
  { codigo: "TELEFONIA", nome: "Telefonia" },
  { codigo: "CRM", nome: "CRM e captação" },
  { codigo: "ASSIN_DIG", nome: "Assinatura digital" },
  { codigo: "HOSPEDAGEM", nome: "Hospedagem e infraestrutura" },
  { codigo: "ERP", nome: "ERP e backoffice" },
  { codigo: "RH", nome: "Gestão de pessoas" },
  { codigo: "BI", nome: "BI e relatórios" },
  { codigo: "SERVICE_DESK", nome: "Service desk e ativos" },
  { codigo: "ARMAZ_VIDEO", nome: "Armazenamento de vídeo" },
  { codigo: "SEGURANCA", nome: "Segurança e antivírus" },
  { codigo: "BIBLIO", nome: "Gestão de biblioteca" },
  { codigo: "IMPRESSAO", nome: "Impressão e digitalização" },
];

async function main() {
  console.log("Semeando setores…");
  for (const s of SETORES) {
    await prisma.setor.upsert({
      where: { codigo: s.codigo },
      update: { nome: s.nome },
      create: s,
    });
  }

  console.log("Semeando categorias…");
  for (const c of CATEGORIAS.filter((c) => !c.pai)) {
    await prisma.categoria.upsert({
      where: { codigo: c.codigo },
      update: { nome: c.nome },
      create: { codigo: c.codigo, nome: c.nome },
    });
  }
  for (const c of CATEGORIAS.filter((c) => c.pai)) {
    const pai = await prisma.categoria.findUnique({ where: { codigo: c.pai! } });
    await prisma.categoria.upsert({
      where: { codigo: c.codigo },
      update: { nome: c.nome, categoriaPaiId: pai?.id },
      create: { codigo: c.codigo, nome: c.nome, categoriaPaiId: pai?.id },
    });
  }

  console.log("Semeando capacidades…");
  for (const cap of CAPACIDADES) {
    await prisma.capacidade.upsert({
      where: { codigo: cap.codigo },
      update: { nome: cap.nome },
      create: cap,
    });
  }

  const [setores, categorias, capacidades] = await Promise.all([
    prisma.setor.count(),
    prisma.categoria.count(),
    prisma.capacidade.count(),
  ]);
  console.log(
    `Pronto: ${setores} setores, ${categorias} categorias, ${capacidades} capacidades.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
