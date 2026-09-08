-- ============================================================================
-- 14 · MARKETING — SISTEMAS E A PRIMEIRA SÉRIE DE LANÇAMENTOS
--
-- Roda DEPOIS do 13.
--
-- Onze itens novos (cinco dos dezesseis já existiam e foram acertados no 13) e
-- OS SETENTA E SEIS LANÇAMENTOS por competência. O banco tem zero lançamentos
-- hoje: este é o primeiro fechamento da plataforma.
--
-- Por que os lançamentos importam mais que os itens: o comentário de
-- src/lib/metricas/index.ts diz que a família `competencia` "só passa a ter
-- resposta depois do primeiro fechamento". Ela está escrita, testada e sem
-- dado. É ela que responde "aumentou nos últimos meses" e "orçado × realizado".
--
-- Competência de agosto de 2026 para trás entra como valorRealizado. Setembro
-- em diante entra como valorPrevisto: são parcelas de contrato que ainda não
-- venceram, e chamar isso de realizado seria afirmar pagamento que não houve.
--
-- O que esta carga NÃO faz, porque depende da revisão do modelo:
--  · campanha, vencimento e forma de pagamento não têm coluna no schema ainda.
--    Vão em observacoes do lançamento, em formato fixo, para o script da
--    revisão poder extrair de lá quando as colunas existirem.
--  · a nota fiscal entra só como NÚMERO (o campo notaFiscal já existe). O
--    arquivo depende de storage, que o projeto não tem.
--  · onde a coluna NOTA da planilha traz "Cartão" em vez de número, não há nota
--    a registrar — é compra em cartão de crédito, e isso fica na observação.
--
-- Idempotente e em transação.
-- ============================================================================

BEGIN;

-- 1. Fornecedores novos -----------------------------------------------------
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3_f_aion_martech_growth_machine_ltda','Aion Martech Growth Machine LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3_f_dot_conceito_ltda','Dot Conceito LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3_f_streamyard','StreamYard','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3_f_envato','Envato','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3_f_chatgpt','ChatGPT','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3_f_canva','Canva','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3_f_elastic_email','Elastic Email','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3_f_izadora_pires_da_silva','Izadora Pires da Silva','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;

-- 2. Competências de 2026 --------------------------------------------------
-- Uma linha por mês. A planilha tem lançamento em todos os doze.
INSERT INTO competencia (id,ano,mes,fechada) VALUES ('cp_2026_01',2026,1,false) ON CONFLICT (ano,mes) DO NOTHING;
INSERT INTO competencia (id,ano,mes,fechada) VALUES ('cp_2026_02',2026,2,false) ON CONFLICT (ano,mes) DO NOTHING;
INSERT INTO competencia (id,ano,mes,fechada) VALUES ('cp_2026_03',2026,3,false) ON CONFLICT (ano,mes) DO NOTHING;
INSERT INTO competencia (id,ano,mes,fechada) VALUES ('cp_2026_04',2026,4,false) ON CONFLICT (ano,mes) DO NOTHING;
INSERT INTO competencia (id,ano,mes,fechada) VALUES ('cp_2026_05',2026,5,false) ON CONFLICT (ano,mes) DO NOTHING;
INSERT INTO competencia (id,ano,mes,fechada) VALUES ('cp_2026_06',2026,6,false) ON CONFLICT (ano,mes) DO NOTHING;
INSERT INTO competencia (id,ano,mes,fechada) VALUES ('cp_2026_07',2026,7,false) ON CONFLICT (ano,mes) DO NOTHING;
INSERT INTO competencia (id,ano,mes,fechada) VALUES ('cp_2026_08',2026,8,false) ON CONFLICT (ano,mes) DO NOTHING;
INSERT INTO competencia (id,ano,mes,fechada) VALUES ('cp_2026_09',2026,9,false) ON CONFLICT (ano,mes) DO NOTHING;
INSERT INTO competencia (id,ano,mes,fechada) VALUES ('cp_2026_10',2026,10,false) ON CONFLICT (ano,mes) DO NOTHING;
INSERT INTO competencia (id,ano,mes,fechada) VALUES ('cp_2026_11',2026,11,false) ON CONFLICT (ano,mes) DO NOTHING;
INSERT INTO competencia (id,ano,mes,fechada) VALUES ('cp_2026_12',2026,12,false) ON CONFLICT (ano,mes) DO NOTHING;

-- 3. Os onze itens novos ---------------------------------------------------
-- META · Meta Ads (Facebook) · R$ 76.570,18 MENSAL -> R$ 76.570,18/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,
       "dataInicio","dataFim","semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3_meta_meta_ads_facebook','Meta Ads (Facebook)','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'META'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'POR_CONSUMO','VARIAVEL','BRL','MENSAL',76570.18,76570.18,76570.18,'ATIVO',
       NULL,NULL,false,'Verba de mídia, variável. Valor = média dos sete meses lançados em 2026 (jan-jul), R$ 535.991,23 no total. Amplitude real de R$ 54.974,61 a R$ 127.448,61 — variação de 132% entre o menor e o maior mês. A variação está nos lançamentos por competência. Fornecedor cadastrado como META, que já existia.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3_meta_meta_ads_facebook','PERCENTUAL','imp3_meta_meta_ads_facebook',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- Aion Martech Growth Machine LTDA · Aion Martech - Implementação de IA · R$ 5.000,00 MENSAL -> R$ 5.000,00/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,
       "dataInicio","dataFim","semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia','Aion Martech - Implementação de IA','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Aion Martech Growth Machine LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'SERV'),
       'FIXO','FIXO','BRL','MENSAL',5000.00,5000.00,5000.00,'ATIVO',
       '2026-06-01','2027-05-31',false,'Contrato anual, parcelas numeradas. A planilha registra 1/12 a 7/12 entre junho e dezembro de 2026, R$ 5.000,00 cada. A data de término é DERIVADA: doze parcelas a partir de junho de 2026 terminam em maio de 2027 — confirmar contra o contrato.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia','PERCENTUAL','imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- Dot Conceito LTDA · Website / Webdesign · R$ 8.800,00 MENSAL -> R$ 8.800,00/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,
       "dataInicio","dataFim","semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3_dot_conceito_ltda_website_webdesign','Website / Webdesign','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Dot Conceito LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'SERV'),
       'FIXO','VARIAVEL','BRL','MENSAL',8800.00,8800.00,8800.00,'EM_ANALISE',
       NULL,NULL,false,'Valor = último mês lançado (junho/2026, R$ 8.800,00). Seis lançamentos de janeiro a junho, entre R$ 7.800,00 e R$ 8.800,00, R$ 50.668,00 no total. SEM LANÇAMENTO DE JULHO EM DIANTE — mas a planilha inteira para em julho, então isso pode ser atraso de lançamento e não encerramento. Confirmar continuidade.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3_dot_conceito_ltda_website_webdesign','PERCENTUAL','imp3_dot_conceito_ltda_website_webdesign',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- ChatGPT · ChatGPT - Ferramenta de IA · R$ 623,65 MENSAL -> R$ 623,65/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,
       "dataInicio","dataFim","semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3_chatgpt_chatgpt_ferramenta_de_ia','ChatGPT - Ferramenta de IA','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'ChatGPT'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.LIC'),
       'POR_CONSUMO','VARIAVEL','BRL','MENSAL',623.65,623.65,623.65,'EM_ANALISE',
       NULL,NULL,false,'Valor = último mês lançado (maio/2026, R$ 623,65). Cinco lançamentos de janeiro a maio, R$ 4.014,31 no total, oscilando entre R$ 623,65 e R$ 974,33 (uso variável). Sem lançamento de junho em diante. Confirmar continuidade.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3_chatgpt_chatgpt_ferramenta_de_ia','PERCENTUAL','imp3_chatgpt_chatgpt_ferramenta_de_ia',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- StreamYard · StreamYard - Transmissão no YouTube · R$ 182,69 MENSAL -> R$ 182,69/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,
       "dataInicio","dataFim","semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3_streamyard_streamyard_transmissao_no_youtube','StreamYard - Transmissão no YouTube','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'StreamYard'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.LIC'),
       'FIXO','VARIAVEL','BRL','MENSAL',182.69,182.69,182.69,'ATIVO',
       NULL,NULL,false,'Valor = último mês lançado (julho/2026, R$ 182,69). Sete lançamentos, R$ 1.288,43 no total. Variação leve entre meses, possivelmente câmbio ou tarifa.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3_streamyard_streamyard_transmissao_no_youtube','PERCENTUAL','imp3_streamyard_streamyard_transmissao_no_youtube',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- Envato · Envato - Criação de conteúdo · R$ 172,37 MENSAL -> R$ 172,37/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,
       "dataInicio","dataFim","semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3_envato_envato_criacao_de_conteudo','Envato - Criação de conteúdo','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Envato'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.LIC'),
       'FIXO','VARIAVEL','BRL','MENSAL',172.37,172.37,172.37,'ATIVO',
       NULL,NULL,false,'Valor = último mês lançado (julho/2026, R$ 172,37). Seis lançamentos (janeiro e março a julho), R$ 1.204,92 no total.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3_envato_envato_criacao_de_conteudo','PERCENTUAL','imp3_envato_envato_criacao_de_conteudo',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- Elastic Email · Elastic Email - Limpeza de base · R$ 48,87 MENSAL -> R$ 48,87/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,
       "dataInicio","dataFim","semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3_elastic_email_elastic_email_limpeza_de_base','Elastic Email - Limpeza de base','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Elastic Email'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.LIC'),
       'FIXO','VARIAVEL','BRL','MENSAL',48.87,48.87,48.87,'EM_ANALISE',
       NULL,NULL,false,'Valor = último mês lançado (fevereiro/2026, R$ 48,87). Só dois lançamentos, janeiro e fevereiro, R$ 97,97 no total. Nada depois. Confirmar se segue ativo.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3_elastic_email_elastic_email_limpeza_de_base','PERCENTUAL','imp3_elastic_email_elastic_email_limpeza_de_base',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- Apple · Verificação de perfil no Instagram · R$ 356,80 UNICO -> compra única, sem equivalente mensal
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,
       "dataInicio","dataFim","semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3_apple_verificacao_de_perfil_no_instagram','Verificação de perfil no Instagram','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Apple'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.LIC'),
       'PONTUAL','FIXO','BRL','UNICO',356.80,NULL,356.80,'ATIVO',
       '2026-01-01',NULL,false,'Compra única. Um lançamento em janeiro de 2026, descrito na planilha como "Verificação insta". NÃO é o mesmo item que o Cloud Apple de TI (R$ 99,00/mês) — mesmo fornecedor, custos diferentes. Dia da aquisição aproximado: a planilha informa só a competência.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3_apple_verificacao_de_perfil_no_instagram','PERCENTUAL','imp3_apple_verificacao_de_perfil_no_instagram',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- Canva · Canva - Ferramenta de artes · R$ 290,00 UNICO -> compra única, sem equivalente mensal
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,
       "dataInicio","dataFim","semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3_canva_canva_ferramenta_de_artes','Canva - Ferramenta de artes','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Canva'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.LIC'),
       'PONTUAL','FIXO','BRL','UNICO',290.00,NULL,290.00,'ATIVO',
       '2026-01-01',NULL,false,'Compra única. Um lançamento em janeiro de 2026 e nada depois — a planilha não informa se é mensal, anual ou compra isolada, então entra como o que se pode provar: uma compra. Dia aproximado: a planilha informa só a competência.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3_canva_canva_ferramenta_de_artes','PERCENTUAL','imp3_canva_canva_ferramenta_de_artes',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- Dot Conceito LTDA · Implementação de IA (contratação inicial) · R$ 1.970,00 UNICO -> compra única, sem equivalente mensal
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,
       "dataInicio","dataFim","semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3_dot_conceito_ltda_implementacao_de_ia_contratacao_inicial','Implementação de IA (contratação inicial)','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Dot Conceito LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'SERV'),
       'PONTUAL','FIXO','BRL','UNICO',1970.00,NULL,1970.00,'SUBSTITUIDO',
       '2025-12-30',NULL,false,'Pagamento único, nota emitida em 30/12/2025 e competência de janeiro de 2026. Antecede o contrato anual de IA com a Aion Martech, que começa em junho de 2026. A planilha não declara formalmente a substituição — marcado como SUBSTITUIDO por leitura da sequência, não por documento.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3_dot_conceito_ltda_implementacao_de_ia_contratacao_inicial','PERCENTUAL','imp3_dot_conceito_ltda_implementacao_de_ia_contratacao_inicial',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- Izadora Pires da Silva · Implementação de IA (contratação inicial) · R$ 1.970,00 UNICO -> compra única, sem equivalente mensal
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,
       "dataInicio","dataFim","semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3_izadora_pires_da_silva_implementacao_de_ia_contratacao_inicial','Implementação de IA (contratação inicial)','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Izadora Pires da Silva'),
       (SELECT id FROM categoria WHERE codigo = 'SERV'),
       'PONTUAL','FIXO','BRL','UNICO',1970.00,NULL,1970.00,'SUBSTITUIDO',
       '2026-01-30',NULL,false,'Pagamento único, nota emitida em 30/01/2026 e competência de fevereiro. Pessoa física. Antecede o contrato anual com a Aion Martech. A planilha não declara formalmente a substituição — marcado como SUBSTITUIDO por leitura da sequência, não por documento.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3_izadora_pires_da_silva_implementacao_de_ia_contratacao_inicial','PERCENTUAL','imp3_izadora_pires_da_silva_implementacao_de_ia_contratacao_inicial',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- soma dos novos recorrentes: R$ 91.397,76/mês
-- soma dos novos pontuais:    R$ 4.586,80 (não entram em custo mensal)

-- 4. Os setenta e seis lançamentos ----------------------------------------
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_apple_verificacao_de_perfil_no_instagram_202601','imp3_apple_verificacao_de_perfil_no_instagram','cp_2026_01','PONTUAL','BRL',356.8,
       'IMPORTACAO',NULL,'Vencimento 2026-01-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Verificação insta · Emissão 2026-01-01 · Fluxo de caixa linha 315',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_canva_canva_ferramenta_de_artes_202601','imp3_canva_canva_ferramenta_de_artes','cp_2026_01','PONTUAL','BRL',290,
       'IMPORTACAO',NULL,'Vencimento 2026-01-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de artes · Emissão 2026-01-01 · Fluxo de caixa linha 316',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_chatgpt_chatgpt_ferramenta_de_ia_202601','imp3_chatgpt_chatgpt_ferramenta_de_ia','cp_2026_01','RECORRENTE','BRL',839.51,
       'IMPORTACAO',NULL,'Vencimento 2026-01-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de IA · Emissão 2026-01-01 · Fluxo de caixa linha 314',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp_ti_fmp_035_202601','imp_ti_fmp_035','cp_2026_01','RECORRENTE','BRL',1222.63,
       'IMPORTACAO',NULL,'Vencimento 2026-01-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de controle de pautas/demandas · Emissão 2026-01-01 · Fluxo de caixa linha 312',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_elastic_email_elastic_email_limpeza_de_base_202601','imp3_elastic_email_elastic_email_limpeza_de_base','cp_2026_01','RECORRENTE','BRL',49.1,
       'IMPORTACAO',NULL,'Vencimento 2026-01-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de Limpeza de base de e-mails em massa; HTMLs · Emissão 2026-01-01 · Fluxo de caixa linha 318',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_envato_envato_criacao_de_conteudo_202601','imp3_envato_envato_criacao_de_conteudo','cp_2026_01','RECORRENTE','BRL',181.22,
       'IMPORTACAO',NULL,'Vencimento 2026-01-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de mkt para criação de conteudo · Emissão 2026-01-01 · Fluxo de caixa linha 321',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_google_ads_google_ads_202601','imp2_google_ads_google_ads','cp_2026_01','RECORRENTE','BRL',51154.87,
       'IMPORTACAO',NULL,'Vencimento 2026-01-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-01-01 · Fluxo de caixa linha 319',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_dot_conceito_ltda_implementacao_de_ia_contratacao_inicial_202601','imp3_dot_conceito_ltda_implementacao_de_ia_contratacao_inicial','cp_2026_01','PONTUAL','BRL',1970,
       'IMPORTACAO','161','Vencimento 2026-01-08 · Boleto · Campanha Institucional · Implementação de IA · Emissão 2025-12-30 · Fluxo de caixa linha 198',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_meta_meta_ads_facebook_202601','imp3_meta_meta_ads_facebook','cp_2026_01','RECORRENTE','BRL',55054.14,
       'IMPORTACAO',NULL,'Vencimento 2026-01-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-01-01 · Fluxo de caixa linha 320',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_qr_code_facil_qr_code_facil_202601','imp2_qr_code_facil_qr_code_facil','cp_2026_01','RECORRENTE','BRL',99.9,
       'IMPORTACAO',NULL,'Vencimento 2026-01-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta para gerar qr code · Emissão 2026-01-01 · Fluxo de caixa linha 313',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_rd_station_rd_station_crm_conversas_marketing_202601','imp2_rd_station_rd_station_crm_conversas_marketing','cp_2026_01','RECORRENTE','BRL',1876,
       'IMPORTACAO',NULL,'Vencimento 2026-01-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de relacionamento de marketing · Emissão 2026-01-01 · Fluxo de caixa linha 311',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_streamyard_streamyard_transmissao_no_youtube_202601','imp3_streamyard_streamyard_transmissao_no_youtube','cp_2026_01','RECORRENTE','BRL',191.71,
       'IMPORTACAO',NULL,'Vencimento 2026-01-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta para transmissão no youtube · Emissão 2026-01-01 · Fluxo de caixa linha 317',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_dot_conceito_ltda_website_webdesign_202601','imp3_dot_conceito_ltda_website_webdesign','cp_2026_01','RECORRENTE','BRL',7800,
       'IMPORTACAO','162','Vencimento 2026-01-15 · Boleto · Campanha Institucional · Desenvolvimento de Website e Webdesign · Emissão 2026-01-01 · Fluxo de caixa linha 4',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_chatgpt_chatgpt_ferramenta_de_ia_202602','imp3_chatgpt_chatgpt_ferramenta_de_ia','cp_2026_02','RECORRENTE','BRL',796.68,
       'IMPORTACAO',NULL,'Vencimento 2026-02-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de IA · Emissão 2026-02-01 · Fluxo de caixa linha 331',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp_ti_fmp_035_202602','imp_ti_fmp_035','cp_2026_02','RECORRENTE','BRL',1258.93,
       'IMPORTACAO',NULL,'Vencimento 2026-02-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de controle de pautas/demandas · Emissão 2026-02-01 · Fluxo de caixa linha 329',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_elastic_email_elastic_email_limpeza_de_base_202602','imp3_elastic_email_elastic_email_limpeza_de_base','cp_2026_02','RECORRENTE','BRL',48.87,
       'IMPORTACAO',NULL,'Vencimento 2026-02-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de Limpeza de base de e-mails em massa; HTMLs · Emissão 2026-02-01 · Fluxo de caixa linha 333',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_google_ads_google_ads_202602','imp2_google_ads_google_ads','cp_2026_02','RECORRENTE','BRL',54122.25,
       'IMPORTACAO',NULL,'Vencimento 2026-02-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-02-01 · Fluxo de caixa linha 334',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_izadora_pires_da_silva_implementacao_de_ia_contratacao_inicial_202602','imp3_izadora_pires_da_silva_implementacao_de_ia_contratacao_inicial','cp_2026_02','PONTUAL','BRL',1970,
       'IMPORTACAO','198','Vencimento 2026-02-20 · Boleto · Campanha Institucional · Implementação de IA · Emissão 2026-01-30 · Fluxo de caixa linha 47',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_meta_meta_ads_facebook_202602','imp3_meta_meta_ads_facebook','cp_2026_02','RECORRENTE','BRL',54974.61,
       'IMPORTACAO',NULL,'Vencimento 2026-02-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-02-01 · Fluxo de caixa linha 335',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_qr_code_facil_qr_code_facil_202602','imp2_qr_code_facil_qr_code_facil','cp_2026_02','RECORRENTE','BRL',959.04,
       'IMPORTACAO',NULL,'Vencimento 2026-02-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta para gerar qr code · Emissão 2026-02-01 · Fluxo de caixa linha 330',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_rd_station_rd_station_crm_conversas_marketing_202602','imp2_rd_station_rd_station_crm_conversas_marketing','cp_2026_02','RECORRENTE','BRL',1876,
       'IMPORTACAO',NULL,'Vencimento 2026-02-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de relacionamento de marketing · Emissão 2026-02-01 · Fluxo de caixa linha 328',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_streamyard_streamyard_transmissao_no_youtube_202602','imp3_streamyard_streamyard_transmissao_no_youtube','cp_2026_02','RECORRENTE','BRL',190.34,
       'IMPORTACAO',NULL,'Vencimento 2026-02-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta para transmissão no youtube · Emissão 2026-02-01 · Fluxo de caixa linha 332',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_dot_conceito_ltda_website_webdesign_202602','imp3_dot_conceito_ltda_website_webdesign','cp_2026_02','RECORRENTE','BRL',7800,
       'IMPORTACAO','201','Vencimento 2026-02-20 · Boleto · Campanha Institucional · Desenvolvimento de Website e Webdesign · Emissão 2026-02-01 · Fluxo de caixa linha 40',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_chatgpt_chatgpt_ferramenta_de_ia_202603','imp3_chatgpt_chatgpt_ferramenta_de_ia','cp_2026_03','RECORRENTE','BRL',780.14,
       'IMPORTACAO',NULL,'Vencimento 2026-03-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de IA · Emissão 2026-03-01 · Fluxo de caixa linha 324',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp_ti_fmp_035_202603','imp_ti_fmp_035','cp_2026_03','RECORRENTE','BRL',1248.22,
       'IMPORTACAO',NULL,'Vencimento 2026-03-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de controle de pautas/demandas · Emissão 2026-03-01 · Fluxo de caixa linha 323',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_envato_envato_criacao_de_conteudo_202603','imp3_envato_envato_criacao_de_conteudo','cp_2026_03','RECORRENTE','BRL',345.87,
       'IMPORTACAO',NULL,'Vencimento 2026-03-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de mkt para criação de conteudo · Emissão 2026-03-01 · Fluxo de caixa linha 340',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_google_ads_google_ads_202603','imp2_google_ads_google_ads','cp_2026_03','RECORRENTE','BRL',47459.53,
       'IMPORTACAO',NULL,'Vencimento 2026-03-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-03-01 · Fluxo de caixa linha 326',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_meta_meta_ads_facebook_202603','imp3_meta_meta_ads_facebook','cp_2026_03','RECORRENTE','BRL',57217.29,
       'IMPORTACAO',NULL,'Vencimento 2026-03-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-03-01 · Fluxo de caixa linha 327',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_rd_station_rd_station_crm_conversas_marketing_202603','imp2_rd_station_rd_station_crm_conversas_marketing','cp_2026_03','RECORRENTE','BRL',1876,
       'IMPORTACAO',NULL,'Vencimento 2026-03-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de relacionamento de marketing · Emissão 2026-03-01 · Fluxo de caixa linha 322',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_streamyard_streamyard_transmissao_no_youtube_202603','imp3_streamyard_streamyard_transmissao_no_youtube','cp_2026_03','RECORRENTE','BRL',183.79,
       'IMPORTACAO',NULL,'Vencimento 2026-03-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta para transmissão no youtube · Emissão 2026-03-01 · Fluxo de caixa linha 325',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_dot_conceito_ltda_website_webdesign_202603','imp3_dot_conceito_ltda_website_webdesign','cp_2026_03','RECORRENTE','BRL',8800,
       'IMPORTACAO','265','Vencimento 2026-03-21 · Boleto · Campanha Institucional · Desenvolvimento de Website e Webdesign · Emissão 2026-03-03 · Fluxo de caixa linha 36',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_chatgpt_chatgpt_ferramenta_de_ia_202604','imp3_chatgpt_chatgpt_ferramenta_de_ia','cp_2026_04','RECORRENTE','BRL',974.33,
       'IMPORTACAO',NULL,'Vencimento 2026-04-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de IA · Emissão 2026-04-01 · Fluxo de caixa linha 338',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp_ti_fmp_035_202604','imp_ti_fmp_035','cp_2026_04','RECORRENTE','BRL',1250.93,
       'IMPORTACAO',NULL,'Vencimento 2026-04-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de controle de pautas/demandas · Emissão 2026-04-01 · Fluxo de caixa linha 337',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_envato_envato_criacao_de_conteudo_202604','imp3_envato_envato_criacao_de_conteudo','cp_2026_04','RECORRENTE','BRL',172.16,
       'IMPORTACAO',NULL,'Vencimento 2026-04-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de mkt para criação de conteudo · Emissão 2026-04-01 · Fluxo de caixa linha 341',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_google_ads_google_ads_202604','imp2_google_ads_google_ads','cp_2026_04','RECORRENTE','BRL',38231.99,
       'IMPORTACAO',NULL,'Vencimento 2026-04-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-04-01 · Fluxo de caixa linha 342',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_meta_meta_ads_facebook_202604','imp3_meta_meta_ads_facebook','cp_2026_04','RECORRENTE','BRL',56001.37,
       'IMPORTACAO',NULL,'Vencimento 2026-04-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-04-01 · Fluxo de caixa linha 343',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_rd_station_rd_station_crm_conversas_marketing_202604','imp2_rd_station_rd_station_crm_conversas_marketing','cp_2026_04','RECORRENTE','BRL',1876,
       'IMPORTACAO',NULL,'Vencimento 2026-04-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de relacionamento de marketing · Emissão 2026-04-01 · Fluxo de caixa linha 336',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_obvio_reclame_aqui_202604','imp2_obvio_reclame_aqui','cp_2026_04','RECORRENTE','BRL',600,
       'IMPORTACAO','589392','Vencimento 2026-04-10 · Boleto · Campanha Institucional · 1 / 12 - Plano Premium da página · Emissão 2026-03-02 · Fluxo de caixa linha 238',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_streamyard_streamyard_transmissao_no_youtube_202604','imp3_streamyard_streamyard_transmissao_no_youtube','cp_2026_04','RECORRENTE','BRL',186.87,
       'IMPORTACAO',NULL,'Vencimento 2026-04-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta para transmissão no youtube · Emissão 2026-04-01 · Fluxo de caixa linha 339',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_dot_conceito_ltda_website_webdesign_202604','imp3_dot_conceito_ltda_website_webdesign','cp_2026_04','RECORRENTE','BRL',8800,
       'IMPORTACAO','289','Vencimento 2026-04-21 · Boleto · Campanha Institucional · Desenvolvimento de Website e Webdesign · Emissão 2026-04-01 · Fluxo de caixa linha 37',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_chatgpt_chatgpt_ferramenta_de_ia_202605','imp3_chatgpt_chatgpt_ferramenta_de_ia','cp_2026_05','RECORRENTE','BRL',623.65,
       'IMPORTACAO',NULL,'Vencimento 2026-05-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de IA · Emissão 2026-05-01 · Fluxo de caixa linha 358',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp_ti_fmp_035_202605','imp_ti_fmp_035','cp_2026_05','RECORRENTE','BRL',1108.45,
       'IMPORTACAO',NULL,'Vencimento 2026-05-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de controle de pautas/demandas · Emissão 2026-05-01 · Fluxo de caixa linha 357',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_envato_envato_criacao_de_conteudo_202605','imp3_envato_envato_criacao_de_conteudo','cp_2026_05','RECORRENTE','BRL',165.27,
       'IMPORTACAO',NULL,'Vencimento 2026-05-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de mkt para criação de conteudo · Emissão 2026-05-01 · Fluxo de caixa linha 360',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_google_ads_google_ads_202605','imp2_google_ads_google_ads','cp_2026_05','RECORRENTE','BRL',47206.85,
       'IMPORTACAO',NULL,'Vencimento 2026-05-22 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-05-01 · Fluxo de caixa linha 363',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_meta_meta_ads_facebook_202605','imp3_meta_meta_ads_facebook','cp_2026_05','RECORRENTE','BRL',76741.75,
       'IMPORTACAO',NULL,'Vencimento 2026-05-22 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-05-01 · Fluxo de caixa linha 364',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_rd_station_rd_station_crm_conversas_marketing_202605','imp2_rd_station_rd_station_crm_conversas_marketing','cp_2026_05','RECORRENTE','BRL',1876,
       'IMPORTACAO',NULL,'Vencimento 2026-05-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de relacionamento de marketing · Emissão 2026-05-01 · Fluxo de caixa linha 356',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_obvio_reclame_aqui_202605','imp2_obvio_reclame_aqui','cp_2026_05','RECORRENTE','BRL',600,
       'IMPORTACAO','613146','Vencimento 2026-05-10 · Boleto · Campanha Institucional · 2 / 12 - Plano Premium da página · Emissão 2026-04-09 · Fluxo de caixa linha 239',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_streamyard_streamyard_transmissao_no_youtube_202605','imp3_streamyard_streamyard_transmissao_no_youtube','cp_2026_05','RECORRENTE','BRL',179.87,
       'IMPORTACAO',NULL,'Vencimento 2026-05-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta para transmissão no youtube · Emissão 2026-05-01 · Fluxo de caixa linha 359',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_dot_conceito_ltda_website_webdesign_202605','imp3_dot_conceito_ltda_website_webdesign','cp_2026_05','RECORRENTE','BRL',8668,
       'IMPORTACAO','326','Vencimento 2026-05-21 · Boleto · Campanha Institucional · Desenvolvimento de Website e Webdesign · Emissão 2026-05-01 · Fluxo de caixa linha 38',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia_202606','imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia','cp_2026_06','RECORRENTE','BRL',5000,
       'IMPORTACAO','8','Vencimento 2026-06-11 · Pix · Campanha Institucional · Implementação de IA · Emissão 2026-05-21 · Fluxo de caixa linha 287',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp_ti_fmp_035_202606','imp_ti_fmp_035','cp_2026_06','RECORRENTE','BRL',304.84,
       'IMPORTACAO',NULL,'Vencimento 2026-06-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de controle de pautas/demandas · Emissão 2026-06-01 · Fluxo de caixa linha 346',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_envato_envato_criacao_de_conteudo_202606','imp3_envato_envato_criacao_de_conteudo','cp_2026_06','RECORRENTE','BRL',168.03,
       'IMPORTACAO',NULL,'Vencimento 2026-06-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de mkt para criação de conteudo · Emissão 2026-06-01 · Fluxo de caixa linha 350',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_google_ads_google_ads_202606','imp2_google_ads_google_ads','cp_2026_06','RECORRENTE','BRL',57353.41,
       'IMPORTACAO',NULL,'Vencimento 2026-06-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-06-01 · Fluxo de caixa linha 354',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_meta_meta_ads_facebook_202606','imp3_meta_meta_ads_facebook','cp_2026_06','RECORRENTE','BRL',108553.46,
       'IMPORTACAO',NULL,'Vencimento 2026-06-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-06-01 · Fluxo de caixa linha 355',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_rd_station_rd_station_crm_conversas_marketing_202606','imp2_rd_station_rd_station_crm_conversas_marketing','cp_2026_06','RECORRENTE','BRL',1876,
       'IMPORTACAO',NULL,'Vencimento 2026-06-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de relacionamento de marketing · Emissão 2026-06-01 · Fluxo de caixa linha 344',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_obvio_reclame_aqui_202606','imp2_obvio_reclame_aqui','cp_2026_06','RECORRENTE','BRL',600,
       'IMPORTACAO','622619','Vencimento 2026-06-10 · Boleto · Campanha Institucional · 3 / 12 - Plano Premium da página · Emissão 2026-05-04 · Fluxo de caixa linha 240',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_streamyard_streamyard_transmissao_no_youtube_202606','imp3_streamyard_streamyard_transmissao_no_youtube','cp_2026_06','RECORRENTE','BRL',173.16,
       'IMPORTACAO',NULL,'Vencimento 2026-06-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta para transmissão no youtube · Emissão 2026-06-01 · Fluxo de caixa linha 348',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_dot_conceito_ltda_website_webdesign_202606','imp3_dot_conceito_ltda_website_webdesign','cp_2026_06','RECORRENTE','BRL',8800,
       'IMPORTACAO','366','Vencimento 2026-06-21 · Boleto · Campanha Institucional · Desenvolvimento de Website e Webdesign · Emissão 2026-06-01 · Fluxo de caixa linha 39',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia_202607','imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia','cp_2026_07','RECORRENTE','BRL',5000,
       'IMPORTACAO',NULL,'Vencimento 2026-07-15 · Pix · Campanha Institucional · Sem nota fiscal (registro: financeiro) · Implementação de IA · Emissão 2026-06-18 · Fluxo de caixa linha 288',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp_ti_fmp_035_202607','imp_ti_fmp_035','cp_2026_07','RECORRENTE','BRL',314.81,
       'IMPORTACAO',NULL,'Vencimento 2026-07-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de controle de pautas/demandas · Emissão 2026-07-01 · Fluxo de caixa linha 347',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_envato_envato_criacao_de_conteudo_202607','imp3_envato_envato_criacao_de_conteudo','cp_2026_07','RECORRENTE','BRL',172.37,
       'IMPORTACAO',NULL,'Vencimento 2026-07-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de mkt para criação de conteudo · Emissão 2026-07-01 · Fluxo de caixa linha 351',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_google_ads_google_ads_202607','imp2_google_ads_google_ads','cp_2026_07','RECORRENTE','BRL',54000,
       'IMPORTACAO',NULL,'Vencimento 2026-07-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-07-01 · Fluxo de caixa linha 352',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_meta_meta_ads_facebook_202607','imp3_meta_meta_ads_facebook','cp_2026_07','RECORRENTE','BRL',127448.61,
       'IMPORTACAO',NULL,'Vencimento 2026-07-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Anúncio Facebook · Emissão 2026-07-01 · Fluxo de caixa linha 353',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_rd_station_rd_station_crm_conversas_marketing_202607','imp2_rd_station_rd_station_crm_conversas_marketing','cp_2026_07','RECORRENTE','BRL',1970,
       'IMPORTACAO',NULL,'Vencimento 2026-07-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta de relacionamento de marketing · Emissão 2026-07-01 · Fluxo de caixa linha 345',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_obvio_reclame_aqui_202607','imp2_obvio_reclame_aqui','cp_2026_07','RECORRENTE','BRL',600,
       'IMPORTACAO','641717','Vencimento 2026-07-10 · Boleto · Campanha Institucional · 4 / 12 - Plano Premium da página · Emissão 2026-06-02 · Fluxo de caixa linha 241',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_streamyard_streamyard_transmissao_no_youtube_202607','imp3_streamyard_streamyard_transmissao_no_youtube','cp_2026_07','RECORRENTE','BRL',182.69,
       'IMPORTACAO',NULL,'Vencimento 2026-07-23 · Cartão de crédito · Campanha Institucional · Sem nota fiscal (registro: Cartão) · Ferramenta para transmissão no youtube · Emissão 2026-07-01 · Fluxo de caixa linha 349',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia_202608','imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia','cp_2026_08','RECORRENTE','BRL',5000,
       'IMPORTACAO',NULL,'Vencimento 2026-08-15 · Pix · Campanha Institucional · Implementação de IA · Fluxo de caixa linha 289',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorRealizado",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_obvio_reclame_aqui_202608','imp2_obvio_reclame_aqui','cp_2026_08','RECORRENTE','BRL',600,
       'IMPORTACAO','657317','Vencimento 2026-08-10 · Boleto · Campanha Institucional · 5 / 12 - Plano Premium da página · Emissão 2026-07-01 · Fluxo de caixa linha 244',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorPrevisto",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia_202609','imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia','cp_2026_09','RECORRENTE','BRL',5000,
       'IMPORTACAO',NULL,'Vencimento 2026-09-15 · Pix · Campanha Institucional · Implementação de IA · Fluxo de caixa linha 290',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorPrevisto",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_obvio_reclame_aqui_202609','imp2_obvio_reclame_aqui','cp_2026_09','RECORRENTE','BRL',600,
       'IMPORTACAO',NULL,'Vencimento 2026-09-10 · Boleto · Campanha Institucional · 6 / 12 - Plano Premium da página · Fluxo de caixa linha 245',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorPrevisto",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia_202610','imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia','cp_2026_10','RECORRENTE','BRL',5000,
       'IMPORTACAO',NULL,'Vencimento 2026-10-15 · Pix · Campanha Institucional · Implementação de IA · Fluxo de caixa linha 295',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorPrevisto",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_obvio_reclame_aqui_202610','imp2_obvio_reclame_aqui','cp_2026_10','RECORRENTE','BRL',600,
       'IMPORTACAO',NULL,'Vencimento 2026-10-10 · Boleto · Campanha Institucional · 7 / 12 - Plano Premium da página · Fluxo de caixa linha 246',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorPrevisto",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia_202611','imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia','cp_2026_11','RECORRENTE','BRL',5000,
       'IMPORTACAO',NULL,'Vencimento 2026-11-15 · Pix · Campanha Institucional · Implementação de IA · Fluxo de caixa linha 296',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorPrevisto",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_obvio_reclame_aqui_202611','imp2_obvio_reclame_aqui','cp_2026_11','RECORRENTE','BRL',600,
       'IMPORTACAO',NULL,'Vencimento 2026-11-10 · Boleto · Campanha Institucional · 8 / 12 - Plano Premium da página · Fluxo de caixa linha 248',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorPrevisto",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia_202612','imp3_aion_martech_growth_machine_ltda_aion_martech_implementacao_de_ia','cp_2026_12','RECORRENTE','BRL',5000,
       'IMPORTACAO',NULL,'Vencimento 2026-12-15 · Pix · Campanha Institucional · Implementação de IA · Fluxo de caixa linha 297',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;
INSERT INTO lancamento_custo (id,"itemCustoId","competenciaId",natureza,moeda,"valorPrevisto",
       origem,"notaFiscal",observacoes,"criadoEm","atualizadoEm")
VALUES ('lc_imp2_obvio_reclame_aqui_202612','imp2_obvio_reclame_aqui','cp_2026_12','RECORRENTE','BRL',600,
       'IMPORTACAO',NULL,'Vencimento 2026-12-10 · Boleto · Campanha Institucional · 9 / 12 - Plano Premium da página · Fluxo de caixa linha 251',now(),now())
ON CONFLICT ("itemCustoId","competenciaId") DO NOTHING;

COMMIT;

-- ============================================================================
-- 68 lançamentos como REALIZADO (até agosto/2026): R$ 986.374,31
-- 8 lançamentos como PREVISTO (setembro a dezembro): R$ 22.400,00
-- total: R$ 1.008.774,31 — bate com o TOTAL REGISTRADO 2026 da planilha
--
-- FICA PARA A REVISÃO DO MODELO:
--  · Campanha como entidade própria com orçamento (já decidido). Hoje o valor
--    está em observacoes no formato "Campanha <nome>", extraível por SQL.
--  · Vencimento e forma de pagamento como colunas do lançamento. Idem, hoje em
--    observacoes nos formatos "Vencimento AAAA-MM-DD" e "Boleto"/"Cartão de
--    crédito".
--  · Documento.lancamentoId, para a nota fiscal virar arquivo anexado.
--  · Número de parcela (1/12, 2/12). Hoje aparece no texto do serviço.
-- ============================================================================
