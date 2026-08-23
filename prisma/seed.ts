import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { gerarHashSenha, gerarSenhaTemporaria, validarSenha } from "../src/lib/senha";

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

  await semearAdministrador();

  const [setores, categorias, capacidades] = await Promise.all([
    prisma.setor.count(),
    prisma.categoria.count(),
    prisma.capacidade.count(),
  ]);
  console.log(
    `Pronto: ${setores} setores, ${categorias} categorias, ${capacidades} capacidades.`,
  );
}

/**
 * Cria o primeiro administrador, uma única vez.
 *
 * Sem isto não existe nenhuma forma de entrar no sistema recém-instalado.
 * É idempotente: se já houver qualquer administrador, não faz nada — para que
 * rodar o seed de novo nunca reabra uma conta ou reponha uma senha conhecida.
 */
async function semearAdministrador() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const nome = (process.env.ADMIN_NOME ?? "Administrador").trim();
  const resetar = /^(1|true|sim)$/i.test((process.env.ADMIN_RESET_SENHA ?? "").trim());

  if (!email) {
    console.log("");
    console.log("Nenhum administrador foi criado: ADMIN_EMAIL não está definida.");
    console.log("Defina ADMIN_EMAIL (e opcionalmente ADMIN_NOME) e rode o seed de novo.");
    console.log("");
    return;
  }

  const jaExiste = await prisma.usuario.count({ where: { papel: "ADMIN" } });
  if (jaExiste > 0 && !resetar) {
    console.log("");
    console.log("======================================================================");
    console.log(`Já existe administrador — o seed não mexeu em nada.`);
    console.log("");
    console.log("Mudar ADMIN_SENHA no ambiente NÃO altera a senha de quem já existe:");
    console.log("o seed é idempotente de propósito, para nunca reabrir uma conta.");
    console.log("");
    console.log("Para redefinir a senha do administrador, rode com:");
    console.log("  ADMIN_RESET_SENHA=true ADMIN_SENHA='suaSenhaForte123' prisma db seed");
    console.log("======================================================================");
    console.log("");
    return;
  }

  // ADMIN_SENHA é opcional. Sem ela, geramos uma temporária e imprimimos uma vez.
  const informada = process.env.ADMIN_SENHA?.trim();
  const definidaPeloOperador = Boolean(informada);

  // A mesma regra que a aplicação exige na troca de senha vale aqui. Aceitar
  // uma senha fraca no administrador de um sistema que concentra o custo da
  // instituição inteira seria o pior lugar para abrir exceção.
  if (informada) {
    const problema = validarSenha(informada);
    if (problema) {
      console.log("");
      console.log("======================================================================");
      console.log("ADMIN_SENHA recusada: " + problema);
      console.log("");
      console.log("Este usuário enxerga o custo de todos os setores e gerencia os");
      console.log("acessos de todo mundo. Escolha outra, ou remova ADMIN_SENHA para");
      console.log("que o seed sorteie uma temporária.");
      console.log("======================================================================");
      console.log("");
      process.exitCode = 1;
      return;
    }
  }

  const senha = informada || gerarSenhaTemporaria();

  const senhaHash = await gerarHashSenha(senha);

  // Em passos explícitos, e não com upsert aninhado: a relação usuário-colaborador
  // é um-para-um, e o upsert aninhado do Prisma não aceita essa forma.
  const colaborador = await prisma.colaborador.upsert({
    where: { email },
    update: { nome, ativo: true },
    create: { nome, email },
    select: { id: true, usuario: { select: { id: true } } },
  });

  if (colaborador.usuario) {
    await prisma.usuario.update({
      where: { id: colaborador.usuario.id },
      data: {
        papel: "ADMIN",
        ativo: true,
        senhaHash,
        precisaTrocarSenha: !definidaPeloOperador,
      },
    });
  } else {
    await prisma.usuario.create({
      data: {
        colaboradorId: colaborador.id,
        papel: "ADMIN",
        ativo: true,
        senhaHash,
        precisaTrocarSenha: !definidaPeloOperador,
      },
    });
  }

  console.log("");
  console.log("======================================================================");
  console.log(resetar && jaExiste > 0 ? "Senha do administrador redefinida." : "Administrador criado.");
  console.log(`  E-mail: ${email}`);
  if (definidaPeloOperador) {
    console.log("  Senha:  a que você definiu em ADMIN_SENHA");
  } else {
    console.log(`  Senha:  ${senha}`);
    console.log("  Esta senha é temporária e será trocada no primeiro acesso.");
    console.log("  Ela não será exibida de novo.");
  }
  console.log("======================================================================");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
