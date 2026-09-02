-- ============================================================================
-- 12 · BLOCO C — CARGA DA PLANILHA DE TI DE 2026
--
-- Roda DEPOIS do 11-correcao-ti.sql.
--
-- O que esta carga DELIBERADAMENTE NÃO faz:
--
--  · A linha TOTVS da planilha (R$ 52.219,05, periodicidade não informada) fica
--    de fora. O banco já tem TOTVS detalhado em 33 itens que somam exatamente
--    R$ 52.219,05 — diferença de zero. Carregar o agregado contaria o mesmo
--    dinheiro duas vezes e trocaria 33 itens apurados por um pendente. É o
--    mesmo defeito de dupla contagem que a primeira carga já havia resolvido.
--
--  · Não altera valor de item que já tem valor no banco. Duas divergências
--    ficaram para decisão humana e estão listadas no fim do arquivo.
--
--  · Não inventa data de término. A planilha traz prazo em prosa para 23 itens
--    ('27-01', 'em 1 mes', 'vence em novembro'), e data errada gera alerta de
--    renovação falso. O texto vai para observacoes, onde pode ser lido.
--
-- Idempotente: ids derivados do conteúdo, todo INSERT com ON CONFLICT DO
-- NOTHING. Reaplicar não duplica.
--
-- Em transação: item sem rateio é invisível até para quem o criou — a revisão
-- de código da primeira carga já tinha apontado isso.
-- ============================================================================

BEGIN;

-- 1. Fornecedores que ainda não existem ------------------------------------
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_apple','Apple','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_astrea','Astrea','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_biblioteca_digital_proview','Biblioteca Digital ProView','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_creativa','Creativa','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_docpipe','Docpipe','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_editora_abec_doi','Editora ABEC / DOI','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_eduzz','Eduzz','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_gamma','Gamma','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_google_ads','Google Ads','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_heinonline','HeinOnline','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_jusbrasil','JusBrasil','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_klimos','Klimos','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_lxp','LXP','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_minha_biblioteca','Minha Biblioteca','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_obvio','Obvio','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_qr_code_facil','QR Code Fácil','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_rd_station','RD Station','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_revista_abeu','Revista ABEU','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp2_f_rt_online','RT Online','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;

-- 2. Itens novos ------------------------------------------------------------
-- MKT · Google Ads · Google Ads · R$ 60.000,00 MENSAL -> R$ 60.000,00/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_google_ads_google_ads','Google Ads','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Google Ads'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'FIXO','VARIAVEL','BRL','MENSAL',60000.00,60000.00,60000.00,'ATIVO',false,
       'Valor da planilha de 2026 derivado do texto do levantamento (Google ADS - valor 60 k). CONFIRMAR: é a média mensal de investimento em mídia, não uma fatura fixa.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_google_ads_google_ads','PERCENTUAL','imp2_google_ads_google_ads',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- BIB · Minha Biblioteca · Minha Biblioteca · R$ 121.680,00 ANUAL -> R$ 10.140,00/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_minha_biblioteca_minha_biblioteca','Minha Biblioteca','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Minha Biblioteca'),
       (SELECT id FROM categoria WHERE codigo = 'ACADEM.ACERVO'),
       'FIXO','FIXO','BRL','ANUAL',121680.00,10140.00,121680.00,'ATIVO',false,
       'Acervo e bases digitais. Vence em novembro (mês informado no levantamento, ano a confirmar).',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_minha_biblioteca_minha_biblioteca','PERCENTUAL','imp2_minha_biblioteca_minha_biblioteca',(SELECT id FROM setor WHERE codigo = 'BIB'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- BIB · Biblioteca Digital ProView · Biblioteca Digital ProView · R$ 55.531,92 ANUAL -> R$ 4.627,66/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_biblioteca_digital_proview_biblioteca_digital_proview','Biblioteca Digital ProView','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Biblioteca Digital ProView'),
       (SELECT id FROM categoria WHERE codigo = 'ACADEM.ACERVO'),
       'FIXO','FIXO','BRL','ANUAL',55531.92,4627.66,55531.92,'ATIVO',false,
       'Acervo e bases digitais.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_biblioteca_digital_proview_biblioteca_digital_proview','PERCENTUAL','imp2_biblioteca_digital_proview_biblioteca_digital_proview',(SELECT id FROM setor WHERE codigo = 'BIB'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- BIB · RT Online · RT Online · R$ 2.678,40 ANUAL -> R$ 223,20/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_rt_online_rt_online','RT Online','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'RT Online'),
       (SELECT id FROM categoria WHERE codigo = 'ACADEM.ACERVO'),
       'FIXO','FIXO','BRL','ANUAL',2678.40,223.20,2678.40,'ATIVO',false,
       'Acervo e bases digitais. Renovado recentemente.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_rt_online_rt_online','PERCENTUAL','imp2_rt_online_rt_online',(SELECT id FROM setor WHERE codigo = 'BIB'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- BIB · JusBrasil · JusBrasil · R$ 208,90 MENSAL -> R$ 208,90/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_jusbrasil_jusbrasil','JusBrasil','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'JusBrasil'),
       (SELECT id FROM categoria WHERE codigo = 'ACADEM.ACERVO'),
       'FIXO','FIXO','BRL','MENSAL',208.90,208.90,208.90,'ATIVO',false,
       'Primeiro mês cobrado a R$ 1,90; mensal cheio R$ 208,90.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_jusbrasil_jusbrasil','PERCENTUAL','imp2_jusbrasil_jusbrasil',(SELECT id FROM setor WHERE codigo = 'BIB'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- BIB · HeinOnline · HeinOnline · R$ 59.658,20 UNICO -> sem equivalente mensal (compra única)
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_heinonline_heinonline','HeinOnline','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'HeinOnline'),
       (SELECT id FROM categoria WHERE codigo = 'ACADEM.ACERVO'),
       'PONTUAL','FIXO','BRL','UNICO',59658.20,NULL,59658.20,'ATIVO',false,
       'Compra única. Sem equivalente mensal por definição. FALTA a data de aquisição — sem ela o item não entra em nenhum recorte de exercício.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_heinonline_heinonline','PERCENTUAL','imp2_heinonline_heinonline',(SELECT id FROM setor WHERE codigo = 'BIB'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · LXP · LXP · R$ 7.300,00 MENSAL -> R$ 7.300,00/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_lxp_lxp','LXP','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'LXP'),
       (SELECT id FROM categoria WHERE codigo = 'ACADEM.AVA'),
       'FIXO','FIXO','BRL','MENSAL',7300.00,7300.00,7300.00,'ATIVO',false,
       'Plataforma de aprendizagem. Recebe a conferência web que saía do Zoom.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_lxp_lxp','PERCENTUAL','imp2_lxp_lxp',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · RD Station · RD Station - CRM / Conversas / Marketing · R$ 7.855,20 MENSAL -> R$ 7.855,20/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_rd_station_rd_station_crm_conversas_marketing','RD Station - CRM / Conversas / Marketing','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'RD Station'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'FIXO','FIXO','BRL','MENSAL',7855.20,7855.20,7855.20,'EM_ANALISE',false,
       'Em revisão para redução. Avaliar CRM próprio: prazo longo, risco e vantagem de manter em casa. Setor a confirmar — pode ser custo de Marketing, não de TI.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_rd_station_rd_station_crm_conversas_marketing','PERCENTUAL','imp2_rd_station_rd_station_crm_conversas_marketing',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · KingHost · Hospedagem Cloud · R$ 8.328,92 ANUAL -> R$ 694,08/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_kinghost_hospedagem_cloud','Hospedagem Cloud','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'KingHost'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.INFRA'),
       'FIXO','FIXO','BRL','ANUAL',8328.92,694.08,8328.92,'EM_ANALISE',false,
       'Cancelamento total previsto para 27-01.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_kinghost_hospedagem_cloud','PERCENTUAL','imp2_kinghost_hospedagem_cloud',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · Yogh · Hospedagem Wordpress Site e PDI · R$ 5.700,00 SEMESTRAL -> R$ 950,00/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_yogh_hospedagem_wordpress_site_e_pdi','Hospedagem Wordpress Site e PDI','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Yogh'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.INFRA'),
       'FIXO','FIXO','BRL','SEMESTRAL',5700.00,950.00,5700.00,'EM_ANALISE',false,
       'Cancelamento e migração possíveis em 1 mês.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_yogh_hospedagem_wordpress_site_e_pdi','PERCENTUAL','imp2_yogh_hospedagem_wordpress_site_e_pdi',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · Startech · Zoom - AVA - Gravações/Aulas - Cloud 1TB · R$ 10.609,00 ANUAL -> R$ 884,08/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_startech_zoom_ava_gravacoes_aulas_cloud_1tb','Zoom - AVA - Gravações/Aulas - Cloud 1TB','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Startech'),
       (SELECT id FROM categoria WHERE codigo = 'ACADEM.AVA'),
       'FIXO','FIXO','BRL','ANUAL',10609.00,884.08,10609.00,'ATIVO',false,
       'Renovado em agosto de 2026, junto do Zoom principal.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_startech_zoom_ava_gravacoes_aulas_cloud_1tb','PERCENTUAL','imp2_startech_zoom_ava_gravacoes_aulas_cloud_1tb',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · Astrea · Astrea · R$ 4.265,40 ANUAL -> R$ 355,45/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_astrea_astrea','Astrea','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Astrea'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.SIST'),
       'FIXO','FIXO','BRL','ANUAL',4265.40,355.45,4265.40,'ATIVO',false,
       NULL,now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_astrea_astrea','PERCENTUAL','imp2_astrea_astrea',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · Gamma · Gamma · R$ 2.640,00 ANUAL -> R$ 220,00/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_gamma_gamma','Gamma','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Gamma'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.SIST'),
       'FIXO','FIXO','BRL','ANUAL',2640.00,220.00,2640.00,'EM_ANALISE',false,
       'Encerramento em 19 de janeiro de 2027.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_gamma_gamma','PERCENTUAL','imp2_gamma_gamma',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · Klimos · Klimos · R$ 2.500,00 MENSAL -> R$ 2.500,00/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_klimos_klimos','Klimos','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Klimos'),
       NULL,
       'FIXO','FIXO','BRL','MENSAL',2500.00,2500.00,2500.00,'ATIVO',false,
       'Categoria a definir. Marcado para alerta no levantamento.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_klimos_klimos','PERCENTUAL','imp2_klimos_klimos',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · Docpipe · Docpipe · R$ 1.200,00 MENSAL -> R$ 1.200,00/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_docpipe_docpipe','Docpipe','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Docpipe'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.SIST'),
       'FIXO','FIXO','BRL','MENSAL',1200.00,1200.00,1200.00,'EM_ANALISE',false,
       'Em revisão: revisar hospedagem.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_docpipe_docpipe','PERCENTUAL','imp2_docpipe_docpipe',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · Eduzz · Eduzz · R$ 1.000,00 MENSAL -> R$ 1.000,00/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_eduzz_eduzz','Eduzz','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Eduzz'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.SIST'),
       'FIXO','FIXO','BRL','MENSAL',1000.00,1000.00,1000.00,'ATIVO',false,
       NULL,now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_eduzz_eduzz','PERCENTUAL','imp2_eduzz_eduzz',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · QR Code Fácil · QR Code Fácil · R$ 959,04 ANUAL -> R$ 79,92/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_qr_code_facil_qr_code_facil','QR Code Fácil','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'QR Code Fácil'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.SIST'),
       'FIXO','FIXO','BRL','ANUAL',959.04,79.92,959.04,'ATIVO',false,
       'Subárea Design no levantamento — setor a confirmar.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_qr_code_facil_qr_code_facil','PERCENTUAL','imp2_qr_code_facil_qr_code_facil',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · Obvio · Reclame Aqui · R$ 600,00 ANUAL -> R$ 50,00/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_obvio_reclame_aqui','Reclame Aqui','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Obvio'),
       NULL,
       'FIXO','FIXO','BRL','ANUAL',600.00,50.00,600.00,'ATIVO',false,
       'Categoria a definir.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_obvio_reclame_aqui','PERCENTUAL','imp2_obvio_reclame_aqui',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · Editora ABEC / DOI · Editora ABEC / DOI · R$ 500,00 ANUAL -> R$ 41,67/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_editora_abec_doi_editora_abec_doi','Editora ABEC / DOI','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Editora ABEC / DOI'),
       (SELECT id FROM categoria WHERE codigo = 'ACADEM'),
       'FIXO','FIXO','BRL','ANUAL',500.00,41.67,500.00,'ATIVO',false,
       'Identificador DOI dos artigos: cerca de R$ 4 por DOI, aproximadamente 25 por ano.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_editora_abec_doi_editora_abec_doi','PERCENTUAL','imp2_editora_abec_doi_editora_abec_doi',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · Revista ABEU · Revista ABEU · R$ 500,00 ANUAL -> R$ 41,67/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_revista_abeu_revista_abeu','Revista ABEU','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Revista ABEU'),
       (SELECT id FROM categoria WHERE codigo = 'ACADEM'),
       'FIXO','FIXO','BRL','ANUAL',500.00,41.67,500.00,'ATIVO',false,
       NULL,now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_revista_abeu_revista_abeu','PERCENTUAL','imp2_revista_abeu_revista_abeu',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- TI · Apple · Cloud Apple · R$ 99,00 MENSAL -> R$ 99,00/mês
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"semPrazoDeterminado",
       observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_apple_cloud_apple','Cloud Apple','RECORRENTE',
       (SELECT id FROM fornecedor WHERE nome = 'Apple'),
       (SELECT id FROM categoria WHERE codigo = 'TEC.INFRA'),
       'FIXO','FIXO','BRL','MENSAL',99.00,99.00,99.00,'ATIVO',false,
       'Valor informado manualmente no levantamento.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_apple_cloud_apple','PERCENTUAL','imp2_apple_cloud_apple',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- 3. Itens que entram SEM valor, de propósito -------------------------------
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","modeloCobranca",comportamento,moeda,
       periodicidade,"valorPeriodo",status,"semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp2_creativa_creativa_plugin_moodle','Creativa Plugin Moodle','RECORRENTE',(SELECT id FROM fornecedor WHERE nome = 'Creativa'),
       'FIXO','FIXO','BRL','MENSAL',NULL,'PENDENTE_APURACAO',false,'A planilha informa R$ 1.000,00 sem periodicidade. Entra como PENDENTE_APURACAO: sem periodicidade o valor não é comparável com nada.',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_creativa_creativa_plugin_moodle','PERCENTUAL','imp2_creativa_creativa_plugin_moodle',(SELECT id FROM setor WHERE codigo = 'TI'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- 4. Pendências que já existiam e a planilha resolve -----------------------

-- WhatsApp API: estava PENDENTE_APURACAO, sem valor nenhum, 100% em TI.
-- Vira custo de Marketing, com valor, e a fatia sai de TI e vai para MKT.
-- comportamento = VARIAVEL registra que oscila; periodicidade fica MENSAL e
-- NÃO 'por consumo', porque 'por consumo' zera o equivalente mensal e o item
-- desaparece do total — que é justamente o furo corrigido no bloco A.
UPDATE item_custo SET "valorPeriodo" = 60000.00, "valorMensalNormalizado" = 60000.00, "valorEmReais" = 60000.00,
       periodicidade = 'MENSAL', comportamento = 'VARIAVEL', "modeloCobranca" = 'POR_CONSUMO',
       status = 'ATIVO',
       "categoriaId" = (SELECT id FROM categoria WHERE codigo = 'MKT'),
       observacoes = 'Custo de Marketing, variável. Valor da planilha de 2026 tratado como média mensal. CONFIRMAR o valor: a planilha não registra a origem dele. Quando a tela de lançamento por competência existir, a variação real de cada mês vai para o lançamento e este valor passa a ser a estimativa.',
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_018';
-- encerra a fatia de TI e abre a de Marketing (rateio é versionado por vigência)
UPDATE rateio SET "vigenciaFim" = '2026-09-02', "atualizadoEm" = now()
 WHERE "itemCustoId" = 'imp_ti_fmp_018' AND "vigenciaFim" IS NULL
   AND "setorId" = (SELECT id FROM setor WHERE codigo = 'TI');
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp2_whatsapp_mkt','PERCENTUAL','imp_ti_fmp_018',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-02',now(),now())
ON CONFLICT (id) DO NOTHING;

-- Anydesk: PENDENTE_APURACAO anual sem valor. A planilha traz o valor.
UPDATE item_custo SET "valorPeriodo" = 4402.80, "valorMensalNormalizado" = 366.90, "valorEmReais" = 4402.80,
       periodicidade = 'ANUAL', status = 'EM_ANALISE',
       observacoes = 'Valor da planilha de 2026. Expectativa de encerramento em 27-01.',
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_042' AND "valorPeriodo" IS NULL;

-- Yogh: o item pendente do banco é TRIMESTRAL e a planilha tem exatamente uma
-- linha Yogh trimestral (Security, R$ 749,00) — é esse. As outras duas linhas
-- Yogh da planilha são o item de banda (já existe) e o Site e PDI (entrou acima).
UPDATE item_custo SET "valorPeriodo" = 749.00, "valorMensalNormalizado" = 249.67, "valorEmReais" = 749.00,
       periodicidade = 'TRIMESTRAL', descricao = 'Hospedagem Wordpress - Security', status = 'EM_ANALISE',
       observacoes = 'Sites fmp.edu.br e pdi.fmp.edu.br - WAF e CDN. Valor da planilha de 2026. Cancelamento e migração possíveis em 1 mês.',
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_029' AND "valorPeriodo" IS NULL;

-- Debarry: a planilha informa R$ 5.290,00 com periodicidade 'Misto', que não
-- existe no modelo — são três serviços num valor só (Cappta, Carimbo do Tempo,
-- DocXpress). Fica PENDENTE, com o contexto registrado, até serem separados.
UPDATE item_custo SET observacoes = 'Planilha de 2026 informa R$ 5.290,00 para o conjunto Cappta + Carimbo do Tempo + DocXpress, com periodicidade mista. Precisa ser separado em um item por serviço antes de receber valor. Recentemente adquirido.',
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_048';

COMMIT;

-- ============================================================================
-- FICA PARA DECISÃO HUMANA — esta carga não mexeu nestes
-- ============================================================================
--
-- 1. Callsys (Espectra): banco R$ 9.238,00/mês, planilha R$ 11.308,00/mês.
--    A observação da planilha diz 'REDUZIU', mas o valor subiu R$ 2.070,00.
--    Uma das duas fontes está errada. Não alterei.
--
-- 2. Itens ativos no banco que a planilha não menciona, somando R$ 3.351,30/mês:
--    Microsoft 365 (R$ 1.931,30), Claude (R$ 1.300,00), Power BI (R$ 120,00),
--    mais Adobe Creative Cloud e RNP MetroPOA, ambos sem valor.
--    A planilha veio pré-filtrada (só ATIVO com custo > 0), então a ausência
--    dela NÃO é evidência de cancelamento. Nada foi desativado.
--
-- 3. Prováveis duplicatas da primeira carga, para conferir e fundir na tela:
--    · Decodificar/Cobrafix (R$ 199,00) × Primus TI/CobraFIX - Decodificar (sem valor)
--    · Pergamum/Sistema Pergamum (R$ 470,00) × Primus TI/Pergamum (R$ 872,30)
--      — pode ser licença + hospedagem, ou pode ser o mesmo custo duas vezes.
--
-- 4. Data de término: os 84 itens de TI estão todos sem dataFim, então o alerta
--    de renovação não tem como disparar para nenhum. A planilha traz prazo em
--    prosa para 23 itens. Vale uma passada só para isso.
--
-- 5. GLPI (R$ 1.500,33): o bloco A assumiu MENSAL porque nenhuma das duas
--    fontes informa. Se for anual, o painel passa a superestimar R$ 1.375,30
--    por mês. É a aposta mais frágil das treze.
