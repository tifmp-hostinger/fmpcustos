-- ============================================================================
-- 13 · CORREÇÃO DO QUE A PLANILHA DE MARKETING DESMENTIU
--
-- Roda ANTES do 14. Não carrega nada novo.
--
-- Os scripts 11 e 12 usaram como fonte o levantamento de TI, que é texto: um
-- inventário do que a casa assina, sem nota fiscal e sem histórico. A planilha
-- de Marketing é execução financeira — vem do Orçamento Marketing FMP.xlsm,
-- com 76 lançamentos, cada um com número de nota, vencimento e forma de
-- pagamento. Onde as duas discordam, a nota fiscal ganha.
--
-- Cinco itens estavam errados, dois deles por ordem de magnitude. Três também
-- estavam no setor errado: a fatura é do Marketing, não de TI.
--
-- Cada correção grava em observacoes de onde veio o número novo, para que a
-- próxima pessoa não precise refazer esta investigação.
-- ============================================================================

BEGIN;

-- 1. WhatsApp API — o número não existia -----------------------------------
--
-- Entrou no 12 com R$ 60.000,00/mês. A linha da planilha de TI que gerou esse
-- valor tem a observação VAZIA: nenhuma procedência. A planilha de Marketing
-- não tem WhatsApp nenhum — tem Meta Ads, que é outra coisa (mídia paga, não
-- mensageria) e entra no 14 com sete notas fiscais atrás.
--
-- Volta a ser o que era antes de eu inventar: uma pendência de verdade. Fica
-- em Marketing, porque a decisão de que WhatsApp é custo de Marketing continua
-- valendo — o que não valia era o valor.
UPDATE item_custo SET "valorPeriodo" = NULL, "valorMensalNormalizado" = NULL, "valorEmReais" = NULL,
       status = 'PENDENTE_APURACAO', comportamento = 'FIXO', "modeloCobranca" = 'FIXO',
       observacoes = 'Custo real ainda não apurado. O valor de R$ 60.000,00 que constou aqui até 08/09/2026 foi derivado de uma linha sem procedência do levantamento de TI e não se sustenta: a planilha de Marketing, que traz nota fiscal, não registra nenhum gasto com WhatsApp API. Provável confusão com Meta Ads. Levantar a fatura antes de preencher.',
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_018';

-- 2. Google Ads — média real, não os 60 k do texto -------------------------
--
-- Entrou no 12 com R$ 60.000,00/mês, derivado do texto "Google ADS - valor 60 k".
-- Sete lançamentos de janeiro a julho de 2026 somam R$ 349.528,90, média de
-- R$ 49.932,70. Diferença de R$ 10.067,30/mês a menos.
--
-- Verba de mídia não é assinatura: variou de R$ 38.231,99 a R$ 57.353,41 entre
-- os meses. O valor do item passa a ser a média (é a melhor estimativa de
-- run-rate) e a variação real de cada mês entra como lançamento no script 14.
-- comportamento VARIAVEL e modeloCobranca POR_CONSUMO registram que oscila.
UPDATE item_custo SET "valorPeriodo" = 49932.70, "valorMensalNormalizado" = 49932.70, "valorEmReais" = 49932.70,
       periodicidade = 'MENSAL', comportamento = 'VARIAVEL', "modeloCobranca" = 'POR_CONSUMO',
       "categoriaId" = (SELECT id FROM categoria WHERE codigo = 'MKT'),
       observacoes = 'Verba de mídia, variável. Valor = média dos sete meses lançados em 2026 (jan-jul), R$ 349.528,90 no total. Amplitude real de R$ 38.231,99 a R$ 57.353,41. A variação mês a mês está nos lançamentos por competência. Fonte: Orçamento Marketing FMP.xlsm, fluxo de caixa.',
       "atualizadoEm" = now()
 WHERE id = 'imp2_google_ads_google_ads';

-- 3. RD Station — quatro vezes menor, e é do Marketing ---------------------
--
-- Entrou no 12 com R$ 7.855,20/mês em TI, o que implicaria R$ 94.262,40 no ano.
-- Sete lançamentos de Marketing mostram R$ 1.876,00 de janeiro a junho e
-- R$ 1.970,00 em julho: R$ 13.226,00 no ano inteiro.
--
-- Usa o último valor observado, e não a média: o preço subiu em julho e o
-- anterior não volta.
UPDATE item_custo SET "valorPeriodo" = 1970.00, "valorMensalNormalizado" = 1970.00, "valorEmReais" = 1970.00,
       periodicidade = 'MENSAL', comportamento = 'FIXO', status = 'ATIVO',
       descricao = 'RD Station - CRM / Conversas / Marketing',
       "categoriaId" = (SELECT id FROM categoria WHERE codigo = 'MKT'),
       observacoes = 'Valor = último mês lançado (julho/2026, R$ 1.970,00; de janeiro a junho foi R$ 1.876,00). Total registrado em 2026: R$ 13.226,00. Corrige os R$ 7.855,20 que vieram do levantamento de TI e que nenhuma nota fiscal sustenta. Fonte: Orçamento Marketing FMP.xlsm.',
       "atualizadoEm" = now()
 WHERE id = 'imp2_rd_station_rd_station_crm_conversas_marketing';
UPDATE rateio SET "vigenciaFim" = '2026-09-08', "atualizadoEm" = now()
 WHERE "itemCustoId" = 'imp2_rd_station_rd_station_crm_conversas_marketing' AND "vigenciaFim" IS NULL
   AND "setorId" = (SELECT id FROM setor WHERE codigo = 'TI');
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt13_imp2_rd_station_rd_station_crm_conversas_marketing_mkt','PERCENTUAL','imp2_rd_station_rd_station_crm_conversas_marketing',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- 4. Reclame Aqui — é mensal, não anual -----------------------------------
--
-- Entrou no 12 como R$ 600,00 ANUAL (R$ 50,00/mês). São R$ 600,00 MENSAIS:
-- a planilha de Marketing tem as parcelas numeradas de 1/12 a 9/12, de abril a
-- dezembro. Doze vezes mais do que o cadastrado.
UPDATE item_custo SET "valorPeriodo" = 600.00, "valorMensalNormalizado" = 600.00, "valorEmReais" = 600.00,
       periodicidade = 'MENSAL', comportamento = 'FIXO', status = 'ATIVO',
       descricao = 'Reclame Aqui - Plano Premium',
       "categoriaId" = (SELECT id FROM categoria WHERE codigo = 'MKT'),
       observacoes = 'Plano Premium, parcelas numeradas de 1/12 a 9/12 entre abril e dezembro de 2026, R$ 600,00 cada. R$ 5.400,00 registrados até setembro. Corrige o cadastro anterior, que trazia R$ 600,00 ANUAIS. Fonte: Orçamento Marketing FMP.xlsm.',
       "atualizadoEm" = now()
 WHERE id = 'imp2_obvio_reclame_aqui';
UPDATE rateio SET "vigenciaFim" = '2026-09-08', "atualizadoEm" = now()
 WHERE "itemCustoId" = 'imp2_obvio_reclame_aqui' AND "vigenciaFim" IS NULL
   AND "setorId" = (SELECT id FROM setor WHERE codigo = 'TI');
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt13_imp2_obvio_reclame_aqui_mkt','PERCENTUAL','imp2_obvio_reclame_aqui',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- 5. QR Code Fácil — a periodicidade era chute minha ----------------------
--
-- Entrou no 12 como R$ 959,04 ANUAL. Os dois lançamentos que existem são
-- R$ 99,90 em janeiro e R$ 959,04 em fevereiro, e a planilha de Marketing diz
-- textualmente que a periodicidade não pode ser inferida com segurança.
-- Dois valores diferentes em meses seguidos não formam anuidade.
--
-- Vira pendência explícita em vez de seguir afirmando um número que eu inventei.
UPDATE item_custo SET "valorPeriodo" = NULL, "valorMensalNormalizado" = NULL, "valorEmReais" = NULL,
       status = 'PENDENTE_APURACAO', periodicidade = 'MENSAL',
       observacoes = 'Periodicidade desconhecida. Dois lançamentos em 2026: R$ 99,90 em janeiro e R$ 959,04 em fevereiro, e nada depois. O cadastro anterior dizia R$ 959,04 anuais, o que era suposição minha e não consta de nenhuma fonte. Confirmar o plano com o fornecedor.',
       "atualizadoEm" = now()
 WHERE id = 'imp2_qr_code_facil_qr_code_facil';
UPDATE rateio SET "vigenciaFim" = '2026-09-08', "atualizadoEm" = now()
 WHERE "itemCustoId" = 'imp2_qr_code_facil_qr_code_facil' AND "vigenciaFim" IS NULL
   AND "setorId" = (SELECT id FROM setor WHERE codigo = 'TI');
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt13_imp2_qr_code_facil_qr_code_facil_mkt','PERCENTUAL','imp2_qr_code_facil_qr_code_facil',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

-- 6. ClickUp — está cancelado no banco e sendo pago na prática -------------
--
-- A primeira carga marcou CANCELADO, "substituído pelo Asana". O Marketing tem
-- sete lançamentos de janeiro a julho, R$ 6.708,81. Não foi cancelado: foi
-- reduzido — caiu de R$ 1.222,63 em janeiro para R$ 314,81 em julho, que é
-- corte de licenças, não encerramento.
--
-- Volta a ATIVO com o último valor e passa para Marketing, que é quem paga.
UPDATE item_custo SET status = 'ATIVO', periodicidade = 'MENSAL', comportamento = 'VARIAVEL',
       "valorPeriodo" = 314.81, "valorMensalNormalizado" = 314.81, "valorEmReais" = 314.81,
       descricao = 'ClickUp - Controle de pautas e demandas',
       "categoriaId" = (SELECT id FROM categoria WHERE codigo = 'TEC.LIC'),
       observacoes = 'Valor = último mês lançado (julho/2026, R$ 314,81). Caiu de R$ 1.222,63 em janeiro por redução de licenças — não foi cancelado, ao contrário do que a primeira carga registrou. R$ 6.708,81 lançados em 2026. Fonte: Orçamento Marketing FMP.xlsm.',
       "atualizadoEm" = now()
 WHERE id = 'imp_ti_fmp_035';
UPDATE rateio SET "vigenciaFim" = '2026-09-08', "atualizadoEm" = now()
 WHERE "itemCustoId" = 'imp_ti_fmp_035' AND "vigenciaFim" IS NULL
   AND "setorId" = (SELECT id FROM setor WHERE codigo = 'TI');
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt13_imp_ti_fmp_035_mkt','PERCENTUAL','imp_ti_fmp_035',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

COMMIT;
