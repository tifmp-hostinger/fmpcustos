-- ============================================================================
-- 02 · DADOS INICIAIS
--
-- Os 13 setores da FMP, a árvore de categorias e o catálogo de capacidades.
--
-- Como rodar:
--   psql "$DATABASE_URL" -f scripts/sql/02-dados-iniciais.sql
-- ou cole o conteúdo inteiro no seu cliente de banco.
--
-- SEM transação, de propósito. Cada comando é independente e idempotente,
-- então o cliente mostra o erro REAL do comando que falhou, em vez de
-- "current transaction is aborted" (25P02) — que só informa que algo
-- anterior falhou e esconde a causa. Rodar de novo é seguro: nada duplica.
--
-- Se aparecer "relation ... does not exist": o esquema ainda não foi criado.
-- Rode antes o 01-esquema.sql, ou deixe o container aplicar as migrations.
--
-- GERADO POR scripts/gerar-sql-dados.ts — não edite à mão.
-- ============================================================================

-- Setores --------------------------------------------------------------
INSERT INTO "setor" (id, codigo, nome, ativo, "criadoEm", "atualizadoEm") VALUES
  ('seed_setor_fin', 'FIN', 'Financeiro e Tesouraria', true, now(), now()),
  ('seed_setor_ti', 'TI', 'Tecnologia da Informação', true, now(), now()),
  ('seed_setor_com', 'COM', 'Comercial', true, now(), now()),
  ('seed_setor_pre', 'PRE', 'Assessoria da Presidência', true, now(), now()),
  ('seed_setor_nead', 'NEAD', 'NEAD', true, now(), now()),
  ('seed_setor_bib', 'BIB', 'Biblioteca', true, now(), now()),
  ('seed_setor_mest', 'MEST', 'Mestrado', true, now(), now()),
  ('seed_setor_acad', 'ACAD', 'Assessoria Acadêmica', true, now(), now()),
  ('seed_setor_comu', 'COMU', 'Comunicação', true, now(), now()),
  ('seed_setor_atend', 'ATEND', 'Atendimento e Relacionamento', true, now(), now()),
  ('seed_setor_fac', 'FAC', 'Facilities', true, now(), now()),
  ('seed_setor_cpr', 'CPR', 'Compras', true, now(), now()),
  ('seed_setor_jur', 'JUR', 'Jurídico', true, now(), now())
ON CONFLICT (codigo) DO NOTHING;

-- Categorias raiz ------------------------------------------------------
INSERT INTO "categoria" (id, codigo, nome, ativo, "criadoEm", "atualizadoEm") VALUES
  ('seed_cat_tec', 'TEC', 'Tecnologia', true, now(), now()),
  ('seed_cat_pred', 'PRED', 'Predial e Facilities', true, now(), now()),
  ('seed_cat_serv', 'SERV', 'Serviços profissionais', true, now(), now()),
  ('seed_cat_academ', 'ACADEM', 'Acadêmico', true, now(), now()),
  ('seed_cat_mkt', 'MKT', 'Marketing e captação', true, now(), now()),
  ('seed_cat_finan', 'FINAN', 'Financeiro e bancário', true, now(), now())
ON CONFLICT (codigo) DO NOTHING;

-- Subcategorias --------------------------------------------------------
INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT 'seed_cat_tec_telecom', 'TEC.TELECOM', 'Telecomunicação', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'TEC'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT 'seed_cat_tec_infra', 'TEC.INFRA', 'Infraestrutura', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'TEC'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT 'seed_cat_tec_sist', 'TEC.SIST', 'Sistemas', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'TEC'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT 'seed_cat_tec_lic', 'TEC.LIC', 'Licenças', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'TEC'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT 'seed_cat_pred_util', 'PRED.UTIL', 'Utilidades (energia, água)', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'PRED'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT 'seed_cat_pred_manut', 'PRED.MANUT', 'Manutenção e limpeza', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'PRED'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT 'seed_cat_serv_jur', 'SERV.JUR', 'Assessoria jurídica', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'SERV'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT 'seed_cat_serv_cont', 'SERV.CONT', 'Contabilidade e auditoria', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'SERV'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT 'seed_cat_academ_ava', 'ACADEM.AVA', 'Ambientes de aprendizagem', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'ACADEM'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT 'seed_cat_academ_acervo', 'ACADEM.ACERVO', 'Acervo e bases de pesquisa', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'ACADEM'
ON CONFLICT (codigo) DO NOTHING;

-- Capacidades funcionais -----------------------------------------------
INSERT INTO "capacidade" (id, codigo, nome) VALUES
  ('seed_cap_videoconf', 'VIDEOCONF', 'Videoconferência'),
  ('seed_cap_gestao_proj', 'GESTAO_PROJ', 'Gestão de projetos'),
  ('seed_cap_ava', 'AVA', 'Ambiente virtual de aprendizagem'),
  ('seed_cap_chat', 'CHAT', 'Chat e atendimento'),
  ('seed_cap_telefonia', 'TELEFONIA', 'Telefonia'),
  ('seed_cap_crm', 'CRM', 'CRM e captação'),
  ('seed_cap_assin_dig', 'ASSIN_DIG', 'Assinatura digital'),
  ('seed_cap_hospedagem', 'HOSPEDAGEM', 'Hospedagem e infraestrutura'),
  ('seed_cap_erp', 'ERP', 'ERP e backoffice'),
  ('seed_cap_rh', 'RH', 'Gestão de pessoas'),
  ('seed_cap_bi', 'BI', 'BI e relatórios'),
  ('seed_cap_service_desk', 'SERVICE_DESK', 'Service desk e ativos'),
  ('seed_cap_armaz_video', 'ARMAZ_VIDEO', 'Armazenamento de vídeo'),
  ('seed_cap_seguranca', 'SEGURANCA', 'Segurança e antivírus'),
  ('seed_cap_biblio', 'BIBLIO', 'Gestão de biblioteca'),
  ('seed_cap_impressao', 'IMPRESSAO', 'Impressão e digitalização')
ON CONFLICT (codigo) DO NOTHING;

-- Conferência: deve mostrar 13 setores, 16 categorias e 16 capacidades ---
SELECT (SELECT count(*) FROM setor)      AS setores,
       (SELECT count(*) FROM categoria)  AS categorias,
       (SELECT count(*) FROM capacidade) AS capacidades;
