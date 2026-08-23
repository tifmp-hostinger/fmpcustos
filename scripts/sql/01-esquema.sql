-- ============================================================================
-- 01 · ESQUEMA COMPLETO
--
-- Gerado a partir de prisma/migrations. Aplica todas as tabelas, enums,
-- índices e chaves estrangeiras num banco vazio.
--
-- Como rodar:
--   psql "$DATABASE_URL" -f scripts/sql/01-esquema.sql
--
-- Você NÃO precisa deste arquivo se usar o container: o entrypoint roda
-- 'prisma migrate deploy' sozinho no start. Ele existe para quem prefere
-- aplicar direto no banco.
--
-- SE VOCÊ VIR "current transaction is aborted" (SQL state 25P02):
-- esse NÃO é o erro. Ele apenas informa que alguma instrução ANTERIOR falhou
-- e que o resto do bloco foi ignorado. Role até o PRIMEIRO erro da saída —
-- é ele que diz o que aconteceu. Em cliente gráfico o primeiro erro costuma
-- ficar escondido acima; rodando por psql ele aparece no topo.
---- ============================================================================

BEGIN;

-- Guarda: rodar duas vezes deve dizer o motivo, não despejar erro cru.
DO $$
BEGIN
  IF to_regclass('public.setor') IS NOT NULL THEN
    RAISE EXCEPTION 'O esquema ja existe neste banco. Este script so roda em banco vazio; para dados iniciais use 02-dados-iniciais.sql.';
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "Natureza" AS ENUM ('RECORRENTE', 'PONTUAL', 'CAPEX', 'PESSOAL');

-- CreateEnum
CREATE TYPE "Periodicidade" AS ENUM ('MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'UNICO', 'SOB_DEMANDA');

-- CreateEnum
CREATE TYPE "ModeloCobranca" AS ENUM ('FIXO', 'POR_USUARIO', 'POR_CONSUMO', 'POR_FAIXA', 'PONTUAL');

-- CreateEnum
CREATE TYPE "ComportamentoCusto" AS ENUM ('FIXO', 'VARIAVEL');

-- CreateEnum
CREATE TYPE "StatusItem" AS ENUM ('ATIVO', 'EM_ANALISE', 'CANCELAMENTO_SOLICITADO', 'CANCELADO', 'SUBSTITUIDO', 'PENDENTE_APURACAO');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('ATIVO', 'EM_RENOVACAO', 'EM_ANALISE', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "MetodoRateio" AS ENUM ('PERCENTUAL', 'POR_USUARIO', 'IGUALITARIO', 'MANUAL');

-- CreateEnum
CREATE TYPE "Moeda" AS ENUM ('BRL', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "IndiceReajuste" AS ENUM ('IPCA', 'IGPM', 'INPC', 'OUTRO', 'NENHUM');

-- CreateEnum
CREATE TYPE "OrigemLancamento" AS ENUM ('MANUAL', 'IMPORTACAO', 'INTEGRACAO');

-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN', 'GESTOR_CONTRATO', 'GESTOR_SETOR', 'CONTROLADORIA', 'LEITOR');

-- CreateEnum
CREATE TYPE "AcaoAuditoria" AS ENUM ('CRIACAO', 'ALTERACAO', 'EXCLUSAO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CONTRATO', 'PROPOSTA', 'PEDIDO', 'ADITIVO', 'NOTA_FISCAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('RENOVACAO_PROXIMA', 'REAJUSTE_ACIMA_INDICE', 'ESTOURO_ORCAMENTO', 'VARIACAO_ANOMALA', 'LICENCA_OCIOSA', 'DADO_INCOMPLETO', 'RATEIO_INCOMPLETO');

-- CreateEnum
CREATE TYPE "StatusAlerta" AS ENUM ('ABERTO', 'RECONHECIDO', 'RESOLVIDO', 'IGNORADO');

-- CreateTable
CREATE TABLE "setor" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "setorPaiId" TEXT,
    "gestorId" TEXT,
    "responsavelDadoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centro_custo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "setorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centro_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaborador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "matricula" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "admissao" DATE,
    "desligamento" DATE,
    "setorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL DEFAULT 'LEITOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "colaboradorId" TEXT NOT NULL,
    "ultimoAcesso" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acesso_setor" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "setorId" TEXT NOT NULL,
    "naturezas" "Natureza"[],

    CONSTRAINT "acesso_setor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "site" TEXT,
    "contatoNome" TEXT,
    "contatoEmail" TEXT,
    "moedaPadrao" "Moeda" NOT NULL DEFAULT 'BRL',
    "criticidade" INTEGER NOT NULL DEFAULT 3,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrato" (
    "id" TEXT NOT NULL,
    "numero" TEXT,
    "objeto" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "setorGestorId" TEXT,
    "centroCustoPadraoId" TEXT,
    "responsavelId" TEXT,
    "dataAssinatura" DATE,
    "dataInicio" DATE,
    "dataFim" DATE,
    "prazoMeses" INTEGER,
    "renovacaoAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "avisoPrevioDias" INTEGER,
    "indiceReajuste" "IndiceReajuste" NOT NULL DEFAULT 'NENHUM',
    "mesAniversarioReajuste" INTEGER,
    "multaRescisoria" DECIMAL(14,2),
    "condicoesCancelamento" TEXT,
    "status" "StatusContrato" NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aditivo" (
    "id" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "descricao" TEXT NOT NULL,
    "deltaValor" DECIMAL(14,2),
    "novoFim" DATE,
    "percentual" DECIMAL(7,4),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aditivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento" (
    "id" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "nome" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "hash" TEXT,
    "tamanho" INTEGER,
    "contratoId" TEXT,
    "textoExtraido" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "categoriaPaiId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servico" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "descricao" TEXT,
    "url" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacidade" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "capacidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servico_capacidade" (
    "servicoId" TEXT NOT NULL,
    "capacidadeId" TEXT NOT NULL,

    CONSTRAINT "servico_capacidade_pkey" PRIMARY KEY ("servicoId","capacidadeId")
);

-- CreateTable
CREATE TABLE "item_custo" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "natureza" "Natureza" NOT NULL DEFAULT 'RECORRENTE',
    "contratoId" TEXT,
    "servicoId" TEXT,
    "categoriaId" TEXT,
    "modeloCobranca" "ModeloCobranca" NOT NULL DEFAULT 'FIXO',
    "comportamento" "ComportamentoCusto" NOT NULL DEFAULT 'FIXO',
    "quantidade" DECIMAL(14,4),
    "unidade" TEXT,
    "valorUnitario" DECIMAL(14,2),
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "periodicidade" "Periodicidade" NOT NULL DEFAULT 'MENSAL',
    "valorPeriodo" DECIMAL(14,2),
    "valorMensalNormalizado" DECIMAL(14,2),
    "status" "StatusItem" NOT NULL DEFAULT 'ATIVO',
    "dataInicio" DATE,
    "dataFim" DATE,
    "substituidoPorId" TEXT,
    "refPedido" TEXT,
    "refProposta" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faixa_preco" (
    "id" TEXT NOT NULL,
    "itemCustoId" TEXT NOT NULL,
    "qtdMin" INTEGER NOT NULL,
    "qtdMax" INTEGER,
    "valorUnitario" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "faixa_preco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencia" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "fechada" BOOLEAN NOT NULL DEFAULT false,
    "fechadaEm" TIMESTAMP(3),

    CONSTRAINT "competencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamento_custo" (
    "id" TEXT NOT NULL,
    "itemCustoId" TEXT NOT NULL,
    "competenciaId" TEXT NOT NULL,
    "natureza" "Natureza" NOT NULL,
    "valorPrevisto" DECIMAL(14,2),
    "valorRealizado" DECIMAL(14,2),
    "quantidade" DECIMAL(14,4),
    "moeda" "Moeda" NOT NULL DEFAULT 'BRL',
    "cambio" DECIMAL(14,6),
    "origem" "OrigemLancamento" NOT NULL DEFAULT 'MANUAL',
    "notaFiscal" TEXT,
    "observacoes" TEXT,
    "importacaoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lancamento_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rateio" (
    "id" TEXT NOT NULL,
    "metodo" "MetodoRateio" NOT NULL DEFAULT 'PERCENTUAL',
    "itemCustoId" TEXT,
    "lancamentoId" TEXT,
    "setorId" TEXT NOT NULL,
    "centroCustoId" TEXT,
    "percentual" DECIMAL(7,4),
    "valor" DECIMAL(14,2),
    "vigenciaInicio" DATE NOT NULL,
    "vigenciaFim" DATE,
    "aprovadoPor" TEXT,
    "aprovadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rateio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamento" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "setorId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "centroCustoId" TEXT,
    "natureza" "Natureza" NOT NULL DEFAULT 'RECORRENTE',
    "valor" DECIMAL(14,2) NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "descricao" TEXT,
    "criadoPor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenca" (
    "id" TEXT NOT NULL,
    "itemCustoId" TEXT NOT NULL,
    "quantidadeContratada" INTEGER NOT NULL,
    "custoUnitario" DECIMAL(14,2),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atribuicao_licenca" (
    "id" TEXT NOT NULL,
    "licencaId" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "dataAtribuicao" DATE NOT NULL,
    "dataRevogacao" DATE,
    "ultimoAcesso" TIMESTAMP(3),
    "origem" "OrigemLancamento" NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "atribuicao_licenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerta" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "status" "StatusAlerta" NOT NULL DEFAULT 'ABERTO',
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "severidade" INTEGER NOT NULL DEFAULT 3,
    "contratoId" TEXT,
    "itemCustoId" TEXT,
    "referencia" DATE,
    "resolvidoEm" TIMESTAMP(3),
    "resolvidoPor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "tabela" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "acao" "AcaoAuditoria" NOT NULL,
    "usuarioId" TEXT,
    "diff" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importacao" (
    "id" TEXT NOT NULL,
    "arquivo" TEXT NOT NULL,
    "hash" TEXT,
    "aba" TEXT,
    "linhasLidas" INTEGER NOT NULL DEFAULT 0,
    "linhasAceitas" INTEGER NOT NULL DEFAULT 0,
    "linhasRejeitadas" INTEGER NOT NULL DEFAULT 0,
    "relatorio" JSONB,
    "usuarioId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "importacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "setor_codigo_key" ON "setor"("codigo");

-- CreateIndex
CREATE INDEX "setor_setorPaiId_idx" ON "setor"("setorPaiId");

-- CreateIndex
CREATE UNIQUE INDEX "centro_custo_codigo_key" ON "centro_custo"("codigo");

-- CreateIndex
CREATE INDEX "centro_custo_setorId_idx" ON "centro_custo"("setorId");

-- CreateIndex
CREATE UNIQUE INDEX "colaborador_email_key" ON "colaborador"("email");

-- CreateIndex
CREATE UNIQUE INDEX "colaborador_matricula_key" ON "colaborador"("matricula");

-- CreateIndex
CREATE INDEX "colaborador_setorId_idx" ON "colaborador"("setorId");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_colaboradorId_key" ON "usuario"("colaboradorId");

-- CreateIndex
CREATE UNIQUE INDEX "acesso_setor_usuarioId_setorId_key" ON "acesso_setor"("usuarioId", "setorId");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedor_nome_key" ON "fornecedor"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedor_cnpj_key" ON "fornecedor"("cnpj");

-- CreateIndex
CREATE INDEX "contrato_fornecedorId_idx" ON "contrato"("fornecedorId");

-- CreateIndex
CREATE INDEX "contrato_dataFim_idx" ON "contrato"("dataFim");

-- CreateIndex
CREATE INDEX "contrato_status_idx" ON "contrato"("status");

-- CreateIndex
CREATE INDEX "aditivo_contratoId_idx" ON "aditivo"("contratoId");

-- CreateIndex
CREATE INDEX "documento_contratoId_idx" ON "documento"("contratoId");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_codigo_key" ON "categoria"("codigo");

-- CreateIndex
CREATE INDEX "categoria_categoriaPaiId_idx" ON "categoria"("categoriaPaiId");

-- CreateIndex
CREATE UNIQUE INDEX "servico_fornecedorId_nome_key" ON "servico"("fornecedorId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "capacidade_codigo_key" ON "capacidade"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "item_custo_substituidoPorId_key" ON "item_custo"("substituidoPorId");

-- CreateIndex
CREATE INDEX "item_custo_contratoId_idx" ON "item_custo"("contratoId");

-- CreateIndex
CREATE INDEX "item_custo_natureza_status_idx" ON "item_custo"("natureza", "status");

-- CreateIndex
CREATE INDEX "item_custo_categoriaId_idx" ON "item_custo"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "faixa_preco_itemCustoId_qtdMin_key" ON "faixa_preco"("itemCustoId", "qtdMin");

-- CreateIndex
CREATE UNIQUE INDEX "competencia_ano_mes_key" ON "competencia"("ano", "mes");

-- CreateIndex
CREATE INDEX "lancamento_custo_competenciaId_natureza_idx" ON "lancamento_custo"("competenciaId", "natureza");

-- CreateIndex
CREATE UNIQUE INDEX "lancamento_custo_itemCustoId_competenciaId_key" ON "lancamento_custo"("itemCustoId", "competenciaId");

-- CreateIndex
CREATE INDEX "rateio_itemCustoId_idx" ON "rateio"("itemCustoId");

-- CreateIndex
CREATE INDEX "rateio_lancamentoId_idx" ON "rateio"("lancamentoId");

-- CreateIndex
CREATE INDEX "rateio_setorId_idx" ON "rateio"("setorId");

-- CreateIndex
CREATE INDEX "orcamento_ano_setorId_idx" ON "orcamento"("ano", "setorId");

-- CreateIndex
CREATE UNIQUE INDEX "orcamento_ano_setorId_categoriaId_natureza_versao_key" ON "orcamento"("ano", "setorId", "categoriaId", "natureza", "versao");

-- CreateIndex
CREATE UNIQUE INDEX "licenca_itemCustoId_key" ON "licenca"("itemCustoId");

-- CreateIndex
CREATE INDEX "atribuicao_licenca_colaboradorId_idx" ON "atribuicao_licenca"("colaboradorId");

-- CreateIndex
CREATE UNIQUE INDEX "atribuicao_licenca_licencaId_colaboradorId_dataAtribuicao_key" ON "atribuicao_licenca"("licencaId", "colaboradorId", "dataAtribuicao");

-- CreateIndex
CREATE INDEX "alerta_tipo_status_idx" ON "alerta"("tipo", "status");

-- CreateIndex
CREATE INDEX "auditoria_tabela_registroId_idx" ON "auditoria"("tabela", "registroId");

-- CreateIndex
CREATE INDEX "auditoria_criadoEm_idx" ON "auditoria"("criadoEm");

-- AddForeignKey
ALTER TABLE "setor" ADD CONSTRAINT "setor_setorPaiId_fkey" FOREIGN KEY ("setorPaiId") REFERENCES "setor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setor" ADD CONSTRAINT "setor_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setor" ADD CONSTRAINT "setor_responsavelDadoId_fkey" FOREIGN KEY ("responsavelDadoId") REFERENCES "colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centro_custo" ADD CONSTRAINT "centro_custo_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "setor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaborador" ADD CONSTRAINT "colaborador_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "setor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acesso_setor" ADD CONSTRAINT "acesso_setor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acesso_setor" ADD CONSTRAINT "acesso_setor_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "setor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_setorGestorId_fkey" FOREIGN KEY ("setorGestorId") REFERENCES "setor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_centroCustoPadraoId_fkey" FOREIGN KEY ("centroCustoPadraoId") REFERENCES "centro_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aditivo" ADD CONSTRAINT "aditivo_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria" ADD CONSTRAINT "categoria_categoriaPaiId_fkey" FOREIGN KEY ("categoriaPaiId") REFERENCES "categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico" ADD CONSTRAINT "servico_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico" ADD CONSTRAINT "servico_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico_capacidade" ADD CONSTRAINT "servico_capacidade_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico_capacidade" ADD CONSTRAINT "servico_capacidade_capacidadeId_fkey" FOREIGN KEY ("capacidadeId") REFERENCES "capacidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_custo" ADD CONSTRAINT "item_custo_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_custo" ADD CONSTRAINT "item_custo_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_custo" ADD CONSTRAINT "item_custo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_custo" ADD CONSTRAINT "item_custo_substituidoPorId_fkey" FOREIGN KEY ("substituidoPorId") REFERENCES "item_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faixa_preco" ADD CONSTRAINT "faixa_preco_itemCustoId_fkey" FOREIGN KEY ("itemCustoId") REFERENCES "item_custo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamento_custo" ADD CONSTRAINT "lancamento_custo_itemCustoId_fkey" FOREIGN KEY ("itemCustoId") REFERENCES "item_custo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamento_custo" ADD CONSTRAINT "lancamento_custo_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "competencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamento_custo" ADD CONSTRAINT "lancamento_custo_importacaoId_fkey" FOREIGN KEY ("importacaoId") REFERENCES "importacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rateio" ADD CONSTRAINT "rateio_itemCustoId_fkey" FOREIGN KEY ("itemCustoId") REFERENCES "item_custo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rateio" ADD CONSTRAINT "rateio_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES "lancamento_custo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rateio" ADD CONSTRAINT "rateio_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rateio" ADD CONSTRAINT "rateio_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "centro_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento" ADD CONSTRAINT "orcamento_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento" ADD CONSTRAINT "orcamento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamento" ADD CONSTRAINT "orcamento_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "centro_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenca" ADD CONSTRAINT "licenca_itemCustoId_fkey" FOREIGN KEY ("itemCustoId") REFERENCES "item_custo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atribuicao_licenca" ADD CONSTRAINT "atribuicao_licenca_licencaId_fkey" FOREIGN KEY ("licencaId") REFERENCES "licenca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atribuicao_licenca" ADD CONSTRAINT "atribuicao_licenca_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_itemCustoId_fkey" FOREIGN KEY ("itemCustoId") REFERENCES "item_custo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacao" ADD CONSTRAINT "importacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AlterTable
ALTER TABLE "item_custo" ADD COLUMN     "criadoPorId" TEXT,
ADD COLUMN     "fornecedorId" TEXT;

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "precisaTrocarSenha" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "senhaHash" TEXT;

-- AddForeignKey
ALTER TABLE "item_custo" ADD CONSTRAINT "item_custo_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_custo" ADD CONSTRAINT "item_custo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Registra as migrations como aplicadas, para o Prisma não tentar reaplicá-las.
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    id                      VARCHAR(36) PRIMARY KEY,
    checksum                VARCHAR(64) NOT NULL,
    finished_at             TIMESTAMPTZ,
    migration_name          VARCHAR(255) NOT NULL,
    logs                    TEXT,
    rolled_back_at          TIMESTAMPTZ,
    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    applied_steps_count     INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
VALUES ('42251f32-965c-0ec8-80db-1e8f7dd435e7', 'c50cb844fd608a903d3a25f6b6ec8254282f0a6130f74dbe7aa539d02967c18f', now(), '20260823022708_modelo_inicial', 1)
ON CONFLICT DO NOTHING;
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
VALUES ('a5871565-c549-7b1e-fd4a-d3389a805b4f', '6e302ea5f5e7cd83c287a533f40e2f373c3e07800d852efce5b9b4ccb7b014b6', now(), '20260823054102_autenticacao_e_fornecedor_no_item', 1)
ON CONFLICT DO NOTHING;

COMMIT;
