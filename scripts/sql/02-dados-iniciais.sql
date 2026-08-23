-- ============================================================================
-- 02 · DADOS INICIAIS
--
-- Os 13 setores da FMP, a árvore de categorias e o catálogo de capacidades.
-- Idempotente: rodar de novo não duplica nada.
--
-- Como rodar:
--   psql "$DATABASE_URL" -f scripts/sql/02-dados-iniciais.sql
--
-- GERADO POR scripts/gerar-sql-dados.ts — não edite à mão.
-- ============================================================================

BEGIN;

-- Setores ---------------------------------------------------------------
INSERT INTO "setor" (id, codigo, nome, ativo, "criadoEm", "atualizadoEm") VALUES
  (gen_random_uuid()::text, 'FIN', 'Financeiro e Tesouraria', true, now(), now()),
  (gen_random_uuid()::text, 'TI', 'Tecnologia da Informação', true, now(), now()),
  (gen_random_uuid()::text, 'COM', 'Comercial', true, now(), now()),
  (gen_random_uuid()::text, 'PRE', 'Assessoria da Presidência', true, now(), now()),
  (gen_random_uuid()::text, 'NEAD', 'NEAD', true, now(), now()),
  (gen_random_uuid()::text, 'BIB', 'Biblioteca', true, now(), now()),
  (gen_random_uuid()::text, 'MEST', 'Mestrado', true, now(), now()),
  (gen_random_uuid()::text, 'ACAD', 'Assessoria Acadêmica', true, now(), now()),
  (gen_random_uuid()::text, 'COMU', 'Comunicação', true, now(), now()),
  (gen_random_uuid()::text, 'ATEND', 'Atendimento e Relacionamento', true, now(), now()),
  (gen_random_uuid()::text, 'FAC', 'Facilities', true, now(), now()),
  (gen_random_uuid()::text, 'CPR', 'Compras', true, now(), now()),
  (gen_random_uuid()::text, 'JUR', 'Jurídico', true, now(), now())
ON CONFLICT (codigo) DO NOTHING;

-- Categorias raiz -------------------------------------------------------
INSERT INTO "categoria" (id, codigo, nome, ativo, "criadoEm", "atualizadoEm") VALUES
  (gen_random_uuid()::text, 'TEC', 'Tecnologia', true, now(), now()),
  (gen_random_uuid()::text, 'PRED', 'Predial e Facilities', true, now(), now()),
  (gen_random_uuid()::text, 'SERV', 'Serviços profissionais', true, now(), now()),
  (gen_random_uuid()::text, 'ACADEM', 'Acadêmico', true, now(), now()),
  (gen_random_uuid()::text, 'MKT', 'Marketing e captação', true, now(), now()),
  (gen_random_uuid()::text, 'FINAN', 'Financeiro e bancário', true, now(), now())
ON CONFLICT (codigo) DO NOTHING;

-- Subcategorias ---------------------------------------------------------
INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, 'TEC.TELECOM', 'Telecomunicação', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'TEC'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, 'TEC.INFRA', 'Infraestrutura', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'TEC'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, 'TEC.SIST', 'Sistemas', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'TEC'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, 'TEC.LIC', 'Licenças', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'TEC'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, 'PRED.UTIL', 'Utilidades (energia, água)', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'PRED'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, 'PRED.MANUT', 'Manutenção e limpeza', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'PRED'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, 'SERV.JUR', 'Assessoria jurídica', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'SERV'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, 'SERV.CONT', 'Contabilidade e auditoria', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'SERV'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, 'ACADEM.AVA', 'Ambientes de aprendizagem', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'ACADEM'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO "categoria" (id, codigo, nome, ativo, "categoriaPaiId", "criadoEm", "atualizadoEm")
SELECT gen_random_uuid()::text, 'ACADEM.ACERVO', 'Acervo e bases de pesquisa', true, p.id, now(), now()
FROM "categoria" p WHERE p.codigo = 'ACADEM'
ON CONFLICT (codigo) DO NOTHING;

-- Capacidades funcionais ------------------------------------------------
INSERT INTO "capacidade" (id, codigo, nome) VALUES
  (gen_random_uuid()::text, 'VIDEOCONF', 'Videoconferência'),
  (gen_random_uuid()::text, 'GESTAO_PROJ', 'Gestão de projetos'),
  (gen_random_uuid()::text, 'AVA', 'Ambiente virtual de aprendizagem'),
  (gen_random_uuid()::text, 'CHAT', 'Chat e atendimento'),
  (gen_random_uuid()::text, 'TELEFONIA', 'Telefonia'),
  (gen_random_uuid()::text, 'CRM', 'CRM e captação'),
  (gen_random_uuid()::text, 'ASSIN_DIG', 'Assinatura digital'),
  (gen_random_uuid()::text, 'HOSPEDAGEM', 'Hospedagem e infraestrutura'),
  (gen_random_uuid()::text, 'ERP', 'ERP e backoffice'),
  (gen_random_uuid()::text, 'RH', 'Gestão de pessoas'),
  (gen_random_uuid()::text, 'BI', 'BI e relatórios'),
  (gen_random_uuid()::text, 'SERVICE_DESK', 'Service desk e ativos'),
  (gen_random_uuid()::text, 'ARMAZ_VIDEO', 'Armazenamento de vídeo'),
  (gen_random_uuid()::text, 'SEGURANCA', 'Segurança e antivírus'),
  (gen_random_uuid()::text, 'BIBLIO', 'Gestão de biblioteca'),
  (gen_random_uuid()::text, 'IMPRESSAO', 'Impressão e digitalização')
ON CONFLICT (codigo) DO NOTHING;

COMMIT;
