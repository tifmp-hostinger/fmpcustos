-- ============================================================================
-- 11 · BLOCO A — CORREÇÃO DO QUE JÁ ESTÁ NO BANCO
--
-- Não carrega nada novo. Corrige três defeitos herdados da primeira carga:
--
--  1. Treze itens ATIVOS têm valor gravado e `valorMensalNormalizado` nulo.
--     Ficam fora do total (metricas/corrente.ts:41 exige não-nulo) E fora da
--     fila de pendências (consultas.ts procura valorPeriodo nulo, que nesses
--     está preenchido). São R$ 20.403,18/mês que ninguém consegue ver.
--     A periodicidade de todos já constava MENSAL — que é o DEFAULT da coluna,
--     não um fato apurado. A planilha nova confirma quatro; os outros nove
--     seguem o contexto do fornecedor, e cada decisão fica registrada em
--     observacoes para poder ser contestada.
--
--  2. O Asana está cadastrado duas vezes: R$ 1.400,00 rateado entre seis
--     setores (o correto, confirmado) e R$ 596,70 só em TI, da primeira carga.
--     O antigo passa a SUBSTITUIDO e aponta para o novo, em vez de ser apagado:
--     o status já existe no enum exatamente para isso.
--
--  3. O Zoom está CANCELADO no banco e ativo na realidade — foi renovado em
--     agosto. Volta a ATIVO com o valor da planilha.
--
-- Roda em transação de propósito: item corrigido pela metade é pior que item
-- errado, porque passa a parecer certo.
-- ============================================================================

BEGIN;

-- 1. Os treze itens que somem do painel -------------------------------------
-- N4B · Firewall e Antivírus Sophos · R$ 7.055,59 — planilha confirma Mensal
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'FIXO',
       "valorMensalNormalizado" = 7055.59, "valorEmReais" = 7055.59,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: planilha confirma Mensal'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_032' AND "valorMensalNormalizado" IS NULL;

-- Rubeus · CRM Rubeus - Mensalidade · R$ 3.738,01 — o próprio nome do item é Mensalidade
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'FIXO',
       "valorMensalNormalizado" = 3738.01, "valorEmReais" = 3738.01,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: o próprio nome do item é Mensalidade'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_045' AND "valorMensalNormalizado" IS NULL;

-- Eduvem · AVA para Cursos Livres · R$ 2.100,00 — planilha confirma Mensal
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'FIXO',
       "valorMensalNormalizado" = 2100.00, "valorEmReais" = 2100.00,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: planilha confirma Mensal'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_051' AND "valorMensalNormalizado" IS NULL;

-- Primus TI · Moodle FMP · R$ 2.004,96 — hospedagem Primus TI, os demais itens do fornecedor são mensais
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'FIXO',
       "valorMensalNormalizado" = 2004.96, "valorEmReais" = 2004.96,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: hospedagem Primus TI, os demais itens do fornecedor são mensais'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_023' AND "valorMensalNormalizado" IS NULL;

-- VerdanaTech · GLPI · R$ 1.500,33 — ASSUMIDO mensal — a planilha não informa. VER
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'FIXO',
       "valorMensalNormalizado" = 1500.33, "valorEmReais" = 1500.33,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: ASSUMIDO mensal — a planilha não informa. VER'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_049' AND "valorMensalNormalizado" IS NULL;

-- Rubeus · CRM Rubeus - Monitoramento + Hml · R$ 1.358,64 — add-on do CRM Rubeus, cobrado junto da mensalidade
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'FIXO',
       "valorMensalNormalizado" = 1358.64, "valorEmReais" = 1358.64,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: add-on do CRM Rubeus, cobrado junto da mensalidade'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_046' AND "valorMensalNormalizado" IS NULL;

-- Primus TI · Moodle ESA · R$ 1.000,00 — hospedagem Primus TI, os demais itens do fornecedor são mensais
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'FIXO',
       "valorMensalNormalizado" = 1000.00, "valorEmReais" = 1000.00,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: hospedagem Primus TI, os demais itens do fornecedor são mensais'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_024' AND "valorMensalNormalizado" IS NULL;

-- Rubeus · CRM Rubeus - Monitoramento Operacional · R$ 724,72 — add-on do CRM Rubeus, cobrado junto da mensalidade
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'FIXO',
       "valorMensalNormalizado" = 724.72, "valorEmReais" = 724.72,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: add-on do CRM Rubeus, cobrado junto da mensalidade'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_044' AND "valorMensalNormalizado" IS NULL;

-- Guarda Fila · Gerenciador de filas de atendimento · R$ 343,20 — planilha confirma Mensal
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'FIXO',
       "valorMensalNormalizado" = 343.20, "valorEmReais" = 343.20,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: planilha confirma Mensal'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_033' AND "valorMensalNormalizado" IS NULL;

-- Yogh · Hospedagem Wordpress - Banda · R$ 300,00 — banda é consumo; a planilha marca TIPO DE CUSTO = VARIÁVEL
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'VARIAVEL',
       "valorMensalNormalizado" = 300.00, "valorEmReais" = 300.00,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: banda é consumo; a planilha marca TIPO DE CUSTO = VARIÁVEL'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_030' AND "valorMensalNormalizado" IS NULL;

-- Decodificar · Cobrafix · R$ 199,00 — SaaS de pequeno porte, cobrança mensal
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'FIXO',
       "valorMensalNormalizado" = 199.00, "valorEmReais" = 199.00,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: SaaS de pequeno porte, cobrança mensal'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_050' AND "valorMensalNormalizado" IS NULL;

-- Neo Tagus · Sistema Kairos REP · R$ 66,24 — SaaS de ponto eletrônico, cobrança mensal
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'FIXO',
       "valorMensalNormalizado" = 66.24, "valorEmReais" = 66.24,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: SaaS de ponto eletrônico, cobrança mensal'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_034' AND "valorMensalNormalizado" IS NULL;

-- KingHost · Hospedagem/DNS · R$ 12,49 — planilha confirma Mensal e marca VARIÁVEL
UPDATE item_custo SET periodicidade = 'MENSAL', comportamento = 'VARIAVEL',
       "valorMensalNormalizado" = 12.49, "valorEmReais" = 12.49,
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | periodicidade MENSAL definida na revisão de 2026-09: planilha confirma Mensal e marca VARIÁVEL'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_031' AND "valorMensalNormalizado" IS NULL;

-- soma que volta a aparecer no painel: R$ 20.403,18/mês

-- 2. Asana duplicado --------------------------------------------------------
-- imp_ti_fmp_036 (R$ 596,70, 100% TI, da primeira carga) é a mesma assinatura
-- que cmtj3qjbn000701qcgbd3p11t (R$ 1.400,00, rateado entre seis setores).
UPDATE item_custo SET status = 'SUBSTITUIDO',
       "substituidoPorId" = 'cmtj3qjbn000701qcgbd3p11t',
       observacoes = trim(both ' | ' from coalesce(observacoes,'') || ' | Substituído pelo cadastro corporativo de R$ 1.400,00 rateado entre seis setores. Duplicata da primeira carga.'),
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_036' AND status <> 'SUBSTITUIDO';

-- 3. Zoom voltou -------------------------------------------------------------
-- Banco dizia CANCELADO; foi renovado em agosto. Valor anual da planilha.
UPDATE item_custo SET status = 'ATIVO', periodicidade = 'ANUAL', comportamento = 'FIXO',
       "valorPeriodo" = 20000.00, "valorMensalNormalizado" = 1666.67, "valorEmReais" = 20000.00,
       observacoes = 'Renovado em agosto de 2026. Cancelamento possível a partir de 27-08, somente caso necessário.',
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_037';

COMMIT;
