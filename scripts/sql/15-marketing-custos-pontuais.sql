-- ============================================================================
-- 15 · MARKETING — OS CUSTOS QUE NÃO SÃO SISTEMA
--
-- Roda DEPOIS do 14. Cento e setenta e dois custos: mídia off (rádio, outdoor,
-- painel), brindes, produção de material, patrocínio, evento e agência.
-- R$ 1.367.336,02 registrados em 2026 — mais que a aba de sistemas.
--
-- A planilha separou isso numa aba de "referência" porque não é sistema, e
-- nisso ela está certa. Mas é custo, e sem ele o painel de Marketing mostraria
-- R$ 1,0 milhão de um gasto real de R$ 2,38 milhões — parecendo completo, que
-- é o pior modo de falha desta plataforma.
--
-- TUDO entra como natureza PONTUAL. Essa é a decisão central deste script, e
-- ela é conservadora de propósito:
--
--  · A planilha dá o TOTAL REGISTRADO em 2026 por fornecedor e serviço, não um
--    valor mensal. Dezenove linhas estão marcadas como RECORRENTE / PARCELADO,
--    e seria tentador dividir o total pelo número de lançamentos para obter uma
--    mensalidade. Não faço isso: a Rádio Atlântida tem 21 lançamentos em 6
--    meses, então total dividido por lançamentos não é valor mensal — é média
--    de nota. Inventar uma mensalidade contaminaria o custo recorrente da
--    instituição com número que ninguém pode conferir.
--
--  · PONTUAL responde exatamente a pergunta que estes dados sustentam: quanto
--    o Marketing gastou em 2026. E pela decisão nº 2 do projeto, nenhuma
--    métrica soma PONTUAL com RECORRENTE por acidente — então isso entra sem
--    inflar o run-rate mensal.
--
--  · As dezenove parceladas podem ser promovidas a contrato depois, quando
--    alguém tiver as parcelas de verdade. Ficam listadas no fim deste arquivo.
--
-- Sobre a data: a planilha informa o MÊS de cada lançamento, não o dia. Uso o
-- primeiro dia do primeiro mês com lançamento e registro isso em observacoes.
-- O mês é fato; o dia é aproximação declarada, não dado inventado.
--
-- Idempotente e em transação.
-- ============================================================================

BEGIN;

-- 1. Fornecedores novos (79) ---------------------------------------------
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_abk_comercio_de_brindes_ltda','ABK Comercio de Brindes Ltda','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_action_day_a_d_marketing_e_consultoria_ltda','Action Day - A D MARKETING E CONSULTORIA LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_adef_grafica_e_designltda','ADEF GRAFICA E DESIGNLTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_adef_grafica_e_desing_ltda','Adef Gráfica e Desing LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_agencia_destra_ltda','Agência Destra LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_allure','Allure','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_a_marketing_promocional_ltda','A Marketing Promocional LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_arte_mensagem_comunicacao_ltda_midialand','ARTE & MENSAGEM COMUNICACAO LTDA - Midialand','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_athos_conteudos_editoriais_ltda','Athos Conteúdos Editoriais LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_banca_cafe_acores','Banca Café Açores','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_bendito_gastronomia','Bendito Gastronomia','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_bendito_gosto_eventos_ltda','Bendito gosto eventos ltda','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_bernadete_nunes_billo_ltda_gustavo_billo','Bernadete Nunes Billo LTDA - Gustavo Billo','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_casa_do_babinho_ltda','CASA DO BABINHO LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_celito_izolin_junior','Celito Izolin Junior','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_coffee_stage_maquinas_e_servicos','Coffee Stage Maquinas e Serviços','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_copy_mundi_ltda','Copy Mundi LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_cristian_antonio_carvalho_rodrigues','Cristian Antonio Carvalho Rodrigues','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_cv_midias_digittais_sa','CV Midias Digittais SA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_decolar','Decolar','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_destra','Destra','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_douglas_ignacio_de_souza','DOUGLAS IGNACIO DE SOUZA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_eccher_e_eccher_ltda','Eccher e Eccher Ltda','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_eduardo_alves_de_souza','Eduardo Alves de Souza','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_eduardo_prates_da_silva','Eduardo Prates da Silva','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_eduzamba_servicos_publicitarios_e_impressos_','Eduzamba Serviços Publicitarios e Impressos EIRELI','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_e_fiorenze_epp','E Fiorenze EPP','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_e_fioreze_epp','E Fioreze - EPP','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_e_floreze_epp','E Floreze EPP','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_elo_produtora','Elo Produtora','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_erica_lira_de_oliveira','Erica Lira de Oliveira','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_estacio_nievinski_filho','ESTACIO NIEVINSKI FILHO','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_etiquetas_chapeco_eireli','Etiquetas Chapecó Eireli','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_fabio_dias_vieira','Fabio Dias Vieira','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_f_m_v_s_brindes_ltda','F M V S BRINDES LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_fmvs_brindes_ltda_inovagfits','Fmvs Brindes LTDA - Inovagfits','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_gessica_da_silva_serafim_bitencourt','GESSICA DA SILVA SERAFIM BITENCOURT','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_grafica_e_editora_relampago_ltda','Gráfica e Editora Relâmpago LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_grafica_e_editora_relampago_ltda_epp','Gráfica e Editora Relâmpago LTDA - EPP','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_ibdfam','IBDFAM','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_ibdfan_instituto_brasileiro_de_direito_da_fa','IBDFAN - Instituto Brasileiro de Direito da Família','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_imobitarget_comunicacoes_visual_ltda','IMOBITARGET COMUNICAÇÕES VISUAL LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_inova_gifts_comercio_de_materiais_promociona','Inova Gifts Comercio de Materiais Promocionais LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_joao_leonardo_tridade_de_vargas_junior','Joao Leonardo Tridade de Vargas Junior','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_joao_leonardo_trindade_de_vargas_junior','João Leonardo Trindade de Vargas Junior','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_jv_locacoes','Jv locações','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_linna','Linna','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_loc_locadora_de_equipamentos_para_eventos_lt','Loc Locadora de Equipamentos para Eventos LTDA - Elo','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_marcelo_otavio_fachini','Marcelo Otavio Fachini','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_marcos_andre_de_bona_agencia_de_publicidade_','MARCOS ANDRE DE BONA AGENCIA DE PUBLICIDADE - Alpha Produtora','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_marisa_victoria_faria','Marisa Victória Faria','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_moving_eventos_ltda','Moving Eventos LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_ms_signs_comunicacao_visual_ltda','MS Signs Comunicação visual LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_newsstand','Newsstand','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_orildes_teresinha_perego','Orildes Teresinha Perego','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_paloma_estes_biton_rheinheimer','Paloma Estes Biton Rheinheimer','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_pisoni_queiroz_radio_e_tv_media_group_ltda','Pisoni & Queiroz Radio e TV Media Group LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_promox_ind_e_com_do_vestuaruio_ltda','Promox Ind. E Com. Do Vestuaruio LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_purana_velas_ltda','Purana Velas LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_radio_atlantida_de_porto_alegre_ltda','Radio Atlantida de Porto Alegre LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_radio_itapema_fm_de_porto_alegre','Radio Itapema FM de Porto Alegre','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_raizler_comercio_de_brindes_ltda','RAIZLER COMERCIO DE BRINDES LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_rbs_bola','RBS - Bola','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_rbs_zero_hora_editora_jornalistica_as','RBS - Zero Hora Editora Jornalística AS','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_r_l_da_silva_salgados','R.L da Silva - Salgados','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_r_pietrobon_comercio_de_artigos_personalizad','R Pietrobon Comercio de Artigos Personalizados','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_sandro_teixeira_maciel','Sandro Teixeira Maciel','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_serata_comercial_de_chocolates_ltda','Serata Comercial de chocolates LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_simone_leal_kosmalski_ltda','Simone Leal Kosmalski LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_sinergy_novas_midias_ltda','Sinergy Novas Mídias LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_south_summit_brasil_spe_ltda','South Summit Brasil SPE LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_sp_visual_print','Sp Visual Print','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_stilo_embalagens_personalizadas','Stilo Embalagens Personalizadas','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_tag_comunicacao','TAG COMUNICAÇÃO','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_terezinha_lucia_antunes_tarcitano','Terezinha Lucia Antunes Tarcitano','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_thayna_soares_soares','Thayna Soares Soares','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_thaytec_industria_de_brindes_personalizados_','THAYTEC INDUSTRIA DE BRINDES PERSONALIZADOS LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_thiago_pedroso_argiles_garbim_franco','Thiago Pedroso Argiles Garbim Franco','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;
INSERT INTO fornecedor (id,nome,"moedaPadrao",criticidade,ativo,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_you_touch_totens_e_servicos_ltda','You Touch Totens e Serviços LTDA','BRL',3,true,now(),now()) ON CONFLICT (nome) DO NOTHING;

-- 2. Os cento e setenta e dois custos pontuais -----------------------------
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_radio_atlantida_de_porto_a_veiculacao_de_patrocinio_n_1','Veiculação de Patrocínio na Rádio Atlântida - Bola nas Costas','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Radio Atlantida de Porto Alegre LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',130671.94,NULL,130671.94,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Mídia Off · Perfil: RECORRENTE / PARCELADO · 21 lançamento(s) · Meses: Abril, Maio, Junho, Julho, Agosto, Setembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_radio_atlantida_de_porto_a_veiculacao_de_patrocinio_n_1','PERCENTUAL','imp3p_radio_atlantida_de_porto_a_veiculacao_de_patrocinio_n_1',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_action_day_a_d_marketing_e_assessoramento_de_marketin_1','Assessoramento de Marketing Digital - Midia On','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Action Day - A D MARKETING E CONSULTORIA LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',110000,NULL,110000,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: RECORRENTE / PARCELADO · 11 lançamento(s) · Meses: Janeiro, Fevereiro, Março, Abril, Maio, Junho, Julho, Agosto, Setembro, Outubro, Novembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_action_day_a_d_marketing_e_assessoramento_de_marketin_1','PERCENTUAL','imp3p_action_day_a_d_marketing_e_assessoramento_de_marketin_1',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sp_visual_print_sinaletica_do_campus','Sinalética do campus','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sp Visual Print'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',66032.36,NULL,66032.36,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Produção de material · Perfil: RECORRENTE / PARCELADO · 5 lançamento(s) · Meses: Abril, Junho, Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Boletos para 09/04 | 08/05 | 09/06 | 07/07 · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sp_visual_print_sinaletica_do_campus','PERCENTUAL','imp3p_sp_visual_print_sinaletica_do_campus',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_agencia_destra_ltda_agencia_para_lancamento_da','Agência para lançamento da marca nova','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Agência Destra LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',64209.99,NULL,64209.99,'ATIVO','2026-02-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: RECORRENTE / PARCELADO · 11 lançamento(s) · Meses: Fevereiro, Março, Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: SERVIÇOS DE MARKETING REF HORAS EXTRAS (Paineis em vídeo formatos diversos) cada peça de arte leve 1h de criação + 1h de animação16h no total16x120=1.920 · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_agencia_destra_ltda_agencia_para_lancamento_da','PERCENTUAL','imp3p_agencia_destra_ltda_agencia_para_lancamento_da',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_action_day_a_d_marketing_e_assessoramento_de_marketin_2','Assessoramento de Marketing Digital - Midia On','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Action Day - A D MARKETING E CONSULTORIA LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',63554.19,NULL,63554.19,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Comissão · Perfil: RECORRENTE / PARCELADO · 7 lançamento(s) · Meses: Janeiro, Fevereiro, Março, Abril, Maio, Junho, Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Comissao sobre verba de impulsionamento de trafego · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_action_day_a_d_marketing_e_assessoramento_de_marketin_2','PERCENTUAL','imp3p_action_day_a_d_marketing_e_assessoramento_de_marketin_2',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_cv_midias_digittais_sa_mub_pi_aut_274234','MUB PI- Aut:274234','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'CV Midias Digittais SA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',40800,NULL,40800,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Mídia Off · Perfil: RECORRENTE / PARCELADO · 4 lançamento(s) · Meses: Maio, Junho, Julho, Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_cv_midias_digittais_sa_mub_pi_aut_274234','PERCENTUAL','imp3p_cv_midias_digittais_sa_mub_pi_aut_274234',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_radio_atlantida_de_porto_a_veiculacao_de_patrocinio_n_2','Veiculação de Patrocínio na Rádio Atlântida- Programa Tá Vazando POA','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Radio Atlantida de Porto Alegre LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',37500,NULL,37500,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Mídia Off · Perfil: RECORRENTE / PARCELADO · 12 lançamento(s) · Meses: Janeiro, Fevereiro, Março, Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_radio_atlantida_de_porto_a_veiculacao_de_patrocinio_n_2','PERCENTUAL','imp3p_radio_atlantida_de_porto_a_veiculacao_de_patrocinio_n_2',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_athos_conteudos_editoriais_patrocinio_programa_5_a_7','Patrocínio programa 5 a 7','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Athos Conteúdos Editoriais LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',35000,NULL,35000,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Mídia Off · Perfil: RECORRENTE / PARCELADO · 7 lançamento(s) · Meses: Janeiro, Fevereiro, Março, Abril, Maio, Junho, Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Dados bancários: Banrisul | AG: 0050 | CC: 06853287-0.5 · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_athos_conteudos_editoriais_patrocinio_programa_5_a_7','PERCENTUAL','imp3p_athos_conteudos_editoriais_patrocinio_programa_5_a_7',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_rbs_bola_sem_descricao_1','(Mídia Offline)','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'RBS - Bola'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',33214.94,NULL,33214.94,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Mídia Offline · Perfil: RECORRENTE / PARCELADO · 9 lançamento(s) · Meses: julho, Julho, Agosto, agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Rádio · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_rbs_bola_sem_descricao_1','PERCENTUAL','imp3p_rbs_bola_sem_descricao_1',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_radio_atlantida_de_porto_a_branded_content','branded content','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Radio Atlantida de Porto Alegre LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',32561.13,NULL,32561.13,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 9 lançamento(s) · Meses: Julho, Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_radio_atlantida_de_porto_a_branded_content','PERCENTUAL','imp3p_radio_atlantida_de_porto_a_branded_content',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_pisoni_queiroz_radio_e_tv__servico_patrocinio_program','Serviço: Patrocínio Programa Pingos de Café - Rádio Mix Praça Porto Alegre','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Pisoni & Queiroz Radio e TV Media Group LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',30112.2,NULL,30112.2,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Mídia Off · Perfil: RECORRENTE / PARCELADO · 3 lançamento(s) · Meses: Janeiro, Fevereiro, Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Veiculação: JAN/ FEV/ MAR · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_pisoni_queiroz_radio_e_tv__servico_patrocinio_program','PERCENTUAL','imp3p_pisoni_queiroz_radio_e_tv__servico_patrocinio_program',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sinergy_novas_midias_ltda_circuito_digital_71_faces','Circuito digital - 71 faces','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sinergy Novas Mídias LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',30000,NULL,30000,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Abril, Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sinergy_novas_midias_ltda_circuito_digital_71_faces','PERCENTUAL','imp3p_sinergy_novas_midias_ltda_circuito_digital_71_faces',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_inova_gifts_comercio_de_ma_ecobag_preta','Ecobag preta','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Inova Gifts Comercio de Materiais Promocionais LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',27000,NULL,27000,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Agosto, Setembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Cidade da Advocacia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_inova_gifts_comercio_de_ma_ecobag_preta','PERCENTUAL','imp3p_inova_gifts_comercio_de_ma_ecobag_preta',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_1','EXIBIÇÃO DE PUBLICIDADE EM PROJETO ESPECIAL TRIPLO. LOCALIZADO. ROTULA DAS CUIA. PERÍODO: 01/04/2026 A 31/05/2026.','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'IMOBITARGET COMUNICAÇÕES VISUAL LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',24000,NULL,24000,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Abril, Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_1','PERCENTUAL','imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_1',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_imobitarget_comunicacoes_v_ref_a_10_espacos_de_public','Ref a 10 espaços de publicidade em placas de esquina, para fins publicitários em Unidades Toponímicas','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'IMOBITARGET COMUNICAÇÕES VISUAL LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',20300,NULL,20300,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Mídia Off · Perfil: RECORRENTE / PARCELADO · 7 lançamento(s) · Meses: Janeiro, Fevereiro, Março, Abril, Maio, Junho, Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_imobitarget_comunicacoes_v_ref_a_10_espacos_de_public','PERCENTUAL','imp3p_imobitarget_comunicacoes_v_ref_a_10_espacos_de_public',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_banca_cafe_acores_locacao_de_espaco_publicit','Locação de Espaço Publicitário','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Banca Café Açores'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',20000,NULL,20000,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Mídia Off · Perfil: RECORRENTE / PARCELADO · 8 lançamento(s) · Meses: Janeiro, Fevereiro, Março, Abril, Maio, Junho, Julho, Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_banca_cafe_acores_locacao_de_espaco_publicit','PERCENTUAL','imp3p_banca_cafe_acores_locacao_de_espaco_publicit',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_imobitarget_comunicacoes_v_bandeira_digital_e_ramblas','Bandeira digital e ramblas em Atlântida (período do planeta e carnaval)','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'IMOBITARGET COMUNICAÇÕES VISUAL LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',20000,NULL,20000,'ATIVO','2026-02-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Fevereiro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_imobitarget_comunicacoes_v_bandeira_digital_e_ramblas','PERCENTUAL','imp3p_imobitarget_comunicacoes_v_bandeira_digital_e_ramblas',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_ibdfan_instituto_brasileir_patrocinio_prata_ibdfan','Patrocínio Prata IBDFAN','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'IBDFAN - Instituto Brasileiro de Direito da Família'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',19400,NULL,19400,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Patrocínio · Perfil: RECORRENTE / PARCELADO · 5 lançamento(s) · Meses: Março, Abril, Maio, Agosto, Setembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_ibdfan_instituto_brasileir_patrocinio_prata_ibdfan','PERCENTUAL','imp3p_ibdfan_instituto_brasileir_patrocinio_prata_ibdfan',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_inova_gifts_comercio_de_ma_brindes_mochila_caneca_can','Brindes - mochila, caneca, caneta, garrafa','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Inova Gifts Comercio de Materiais Promocionais LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',18174,NULL,18174,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Agosto, Setembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Cidade da Advocacia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_inova_gifts_comercio_de_ma_brindes_mochila_caneca_can','PERCENTUAL','imp3p_inova_gifts_comercio_de_ma_brindes_mochila_caneca_can',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_arte_mensagem_comunicacao__30_dias_de_contrato','30 dias de contrato','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'ARTE & MENSAGEM COMUNICACAO LTDA - Midialand'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',18000,NULL,18000,'ATIVO','2026-04-01',
       true,'Categoria na planilha: 3 outdoor na Borges · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Abril, Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_arte_mensagem_comunicacao__30_dias_de_contrato','PERCENTUAL','imp3p_arte_mensagem_comunicacao__30_dias_de_contrato',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sinergy_novas_midias_ltda_muro_da_maua','Muro da Mauá','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sinergy Novas Mídias LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',18000,NULL,18000,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Agosto, Setembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sinergy_novas_midias_ltda_muro_da_maua','PERCENTUAL','imp3p_sinergy_novas_midias_ltda_muro_da_maua',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_marcos_andre_de_bona_agenc_campanha_de_posicionamento','Campanha de posicionamento FMP','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'MARCOS ANDRE DE BONA AGENCIA DE PUBLICIDADE - Alpha Produtora'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',16666.66,NULL,16666.66,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Janeiro, Fevereiro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_marcos_andre_de_bona_agenc_campanha_de_posicionamento','PERCENTUAL','imp3p_marcos_andre_de_bona_agenc_campanha_de_posicionamento',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_radio_itapema_fm_de_porto__veiculacao_de_patrocinio_n','Veiculação de Patrocínio na Rádio Atlântida - Nota da 102.3','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Radio Itapema FM de Porto Alegre'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',15893.37,NULL,15893.37,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Mídia Off · Perfil: RECORRENTE / PARCELADO · 11 lançamento(s) · Meses: Junho, Julho, Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_radio_itapema_fm_de_porto__veiculacao_de_patrocinio_n','PERCENTUAL','imp3p_radio_itapema_fm_de_porto__veiculacao_de_patrocinio_n',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_r_l_da_silva_salgados_buffet_para_o_lancamento_d_1','Buffet para o lançamento da marca nova - Público externo','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'R.L da Silva - Salgados'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',15800,NULL,15800,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_r_l_da_silva_salgados_buffet_para_o_lancamento_d_1','PERCENTUAL','imp3p_r_l_da_silva_salgados_buffet_para_o_lancamento_d_1',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_ap','EXIBIÇÃO DE PUBLICIDADE. APROVEITAMENTO: CIRCUITO COMPLETO - MUBS DIGITAIS ORLA. LOCALIZADO. ROTULA DAS CUIA.','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'IMOBITARGET COMUNICAÇÕES VISUAL LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',15520,NULL,15520,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Abril, Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_ap','PERCENTUAL','imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_ap',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_agencia_destra_ltda_rebranding_da_marca_fmp','Rebranding da Marca FMP','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Agência Destra LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',15120,NULL,15120,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 3 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_agencia_destra_ltda_rebranding_da_marca_fmp','PERCENTUAL','imp3p_agencia_destra_ltda_rebranding_da_marca_fmp',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_erica_lira_de_oliveira_caixa_convite_para_lancame','Caixa convite para lançamento externo da marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Erica Lira de Oliveira'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',13920,NULL,13920,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Março, Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_erica_lira_de_oliveira_caixa_convite_para_lancame','PERCENTUAL','imp3p_erica_lira_de_oliveira_caixa_convite_para_lancame',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_allure_prestacao_de_servico_profi','Prestação de serviço profissional especializado para produção executiva de eventos (Posse do presidente e summit)','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Allure'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',13600,NULL,13600,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Janeiro, Fevereiro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_allure_prestacao_de_servico_profi','PERCENTUAL','imp3p_allure_prestacao_de_servico_profi',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_inova_gifts_comercio_de_ma_mochilas_de_brinde_para_se','Mochilas de brinde para ser presente de aniversário dos colaboradores','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Inova Gifts Comercio de Materiais Promocionais LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',11184,NULL,11184,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: São 3 boletos referente a mesma nota · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_inova_gifts_comercio_de_ma_mochilas_de_brinde_para_se','PERCENTUAL','imp3p_inova_gifts_comercio_de_ma_mochilas_de_brinde_para_se',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_agencia_destra_ltda_desdobramento_de_campanha','Desdobramento de campanha','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Agência Destra LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',10800,NULL,10800,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: RECORRENTE / PARCELADO · 3 lançamento(s) · Meses: Junho, Julho, Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_agencia_destra_ltda_desdobramento_de_campanha','PERCENTUAL','imp3p_agencia_destra_ltda_desdobramento_de_campanha',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_rbs_zero_hora_editora_jorn_veiculacao_de_patrocinio_n','Veiculação de Patrocínio na Rádio Atlântida - Bola nas Costas','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'RBS - Zero Hora Editora Jornalística AS'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',10792,NULL,10792,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Julho, Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_rbs_zero_hora_editora_jorn_veiculacao_de_patrocinio_n','PERCENTUAL','imp3p_rbs_zero_hora_editora_jorn_veiculacao_de_patrocinio_n',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_rbs_zero_hora_editora_jorn_branded_content_1','branded content','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'RBS - Zero Hora Editora Jornalística AS'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',10792,NULL,10792,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Produtos · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_rbs_zero_hora_editora_jorn_branded_content_1','PERCENTUAL','imp3p_rbs_zero_hora_editora_jorn_branded_content_1',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_grafica_e_editora_relampag_producao_de_pastas_institu','Produção de pastas institucionais','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Gráfica e Editora Relâmpago LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',10600,NULL,10600,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_grafica_e_editora_relampag_producao_de_pastas_institu','PERCENTUAL','imp3p_grafica_e_editora_relampag_producao_de_pastas_institu',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_grafica_e_editora_relampag_producao_de_bloquinhos_par','Produção de bloquinhos para brinde','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Gráfica e Editora Relâmpago LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',10560,NULL,10560,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Cidade da Advocacia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_grafica_e_editora_relampag_producao_de_bloquinhos_par','PERCENTUAL','imp3p_grafica_e_editora_relampag_producao_de_bloquinhos_par',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_radio_atlantida_de_porto_a_veiculacao_de_midia_na_rad','Veiculação de mídia na radio atlantida','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Radio Atlantida de Porto Alegre LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',10000,NULL,10000,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 3 lançamento(s) · Meses: Janeiro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: vencimento era 25/12, porém não havia sido encaminhado para controladoria · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_radio_atlantida_de_porto_a_veiculacao_de_midia_na_rad','PERCENTUAL','imp3p_radio_atlantida_de_porto_a_veiculacao_de_midia_na_rad',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_terezinha_lucia_antunes_ta_patrocinio_ouro_programa_a','Patrocínio Ouro Programa Âncora Livre','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Terezinha Lucia Antunes Tarcitano'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',9000,NULL,9000,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Mídia Off · Perfil: RECORRENTE / PARCELADO · 6 lançamento(s) · Meses: Janeiro, Fevereiro, Março, Abril, Maio, Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Dados bancários: Banco: 0260 (NuBank) | AG: 0001 | C/C: 67274459-1 | última parcela solicitação do dr luciano · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_terezinha_lucia_antunes_ta_patrocinio_ouro_programa_a','PERCENTUAL','imp3p_terezinha_lucia_antunes_ta_patrocinio_ouro_programa_a',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_fmvs_brindes_ltda_inovagfi_comrpa_de_brindes_moleskin','Comrpa de brindes - moleskine','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Fmvs Brindes LTDA - Inovagfits'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',8900,NULL,8900,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_fmvs_brindes_ltda_inovagfi_comrpa_de_brindes_moleskin','PERCENTUAL','imp3p_fmvs_brindes_ltda_inovagfi_comrpa_de_brindes_moleskin',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_gessica_da_silva_serafim_b_convite_para_o_lancamento__1','Convite para o lançamento interno da nova marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'GESSICA DA SILVA SERAFIM BITENCOURT'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',8700,NULL,8700,'ATIVO','2026-02-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Fevereiro, Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_gessica_da_silva_serafim_b_convite_para_o_lancamento__1','PERCENTUAL','imp3p_gessica_da_silva_serafim_b_convite_para_o_lancamento__1',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_south_summit_brasil_spe_lt_10_ingressos_para_o_south_','10 ingressos para o South Summit - Porto Alegre','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'South Summit Brasil SPE LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',7990,NULL,7990,'ATIVO','2026-02-01',
       true,'Categoria na planilha: Evento · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Fevereiro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_south_summit_brasil_spe_lt_10_ingressos_para_o_south_','PERCENTUAL','imp3p_south_summit_brasil_spe_lt_10_ingressos_para_o_south_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_bernadete_nunes_billo_ltda_rebranding_da_marca_fmp','Rebranding da Marca FMP','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Bernadete Nunes Billo LTDA - Gustavo Billo'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',7600,NULL,7600,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Janeiro, Fevereiro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_bernadete_nunes_billo_ltda_rebranding_da_marca_fmp','PERCENTUAL','imp3p_bernadete_nunes_billo_ltda_rebranding_da_marca_fmp',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_bernadete_nunes_billo_ltda_curadoria_da_marca_fmp','Curadoria da Marca FMP','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Bernadete Nunes Billo LTDA - Gustavo Billo'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',7500,NULL,7500,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: RECORRENTE / PARCELADO · 3 lançamento(s) · Meses: Janeiro, Fevereiro, Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_bernadete_nunes_billo_ltda_curadoria_da_marca_fmp','PERCENTUAL','imp3p_bernadete_nunes_billo_ltda_curadoria_da_marca_fmp',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_abk_comercio_de_brindes_lt_brinde_para_lancamento_ext','Brinde para lançamento externo da marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'ABK Comercio de Brindes Ltda'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',7154.9,NULL,7154.9,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_abk_comercio_de_brindes_lt_brinde_para_lancamento_ext','PERCENTUAL','imp3p_abk_comercio_de_brindes_lt_brinde_para_lancamento_ext',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_inova_gifts_comercio_de_ma_coletes_para_cidade_da_adv','Coletes para cidade da advocacia','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Inova Gifts Comercio de Materiais Promocionais LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',6996,NULL,6996,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Brindes · Perfil: RECORRENTE / PARCELADO · 3 lançamento(s) · Meses: Agosto, Setembro, Outubro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Cidade da Advocacia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_inova_gifts_comercio_de_ma_coletes_para_cidade_da_adv','PERCENTUAL','imp3p_inova_gifts_comercio_de_ma_coletes_para_cidade_da_adv',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_elo_produtora_locacao_de_som_e_estrutura','Locação de som e estrutura para o evento de lançamento da marc a externo','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Elo Produtora'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',6885,NULL,6885,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_elo_produtora_locacao_de_som_e_estrutura','PERCENTUAL','imp3p_elo_produtora_locacao_de_som_e_estrutura',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_imobitarget_comunicacoes_v_sem_descricao','(Mídia Off)','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'IMOBITARGET COMUNICAÇÕES VISUAL LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',6800,NULL,6800,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_imobitarget_comunicacoes_v_sem_descricao','PERCENTUAL','imp3p_imobitarget_comunicacoes_v_sem_descricao',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_promox_ind_e_com_do_vestua_camiseta_lancamento_da_mar','Camiseta lançamento da marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Promox Ind. E Com. Do Vestuaruio LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',6727.78,NULL,6727.78,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_promox_ind_e_com_do_vestua_camiseta_lancamento_da_mar','PERCENTUAL','imp3p_promox_ind_e_com_do_vestua_camiseta_lancamento_da_mar',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_agencia_destra_ltda_kv_insta_do_daniel','KV Insta do Daniel','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Agência Destra LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',6600,NULL,6600,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: RECORRENTE / PARCELADO · 5 lançamento(s) · Meses: Julho, Agosto, Setembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_agencia_destra_ltda_kv_insta_do_daniel','PERCENTUAL','imp3p_agencia_destra_ltda_kv_insta_do_daniel',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_thaytec_industria_de_brind_ecobag_para_o_ibdfam','Ecobag para o IBDFAM','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'THAYTEC INDUSTRIA DE BRINDES PERSONALIZADOS LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',6500,NULL,6500,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Abril, Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_thaytec_industria_de_brind_ecobag_para_o_ibdfam','PERCENTUAL','imp3p_thaytec_industria_de_brind_ecobag_para_o_ibdfam',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_grafica_e_editora_relampag_envelopes_grandes','Envelopes grandes','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Gráfica e Editora Relâmpago LTDA - EPP'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',6460,NULL,6460,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Acadêmico · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_grafica_e_editora_relampag_envelopes_grandes','PERCENTUAL','imp3p_grafica_e_editora_relampag_envelopes_grandes',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_2','Exibicao de Publicidade Em 10 Placas de Esquina - Dupla Face. Pi: 29072026030. Periodo: 23/07/2026 A 22/07/2027. Parcela: 02 de 12','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'IMOBITARGET COMUNICAÇÕES VISUAL LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',5800,NULL,5800,'ATIVO','2026-09-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Setembro, Outubro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_2','PERCENTUAL','imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_2',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_inova_gifts_comercio_de_ma_mochila_para_brinde_de_mat','Mochila para brinde de matrícula','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Inova Gifts Comercio de Materiais Promocionais LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',5792,NULL,5792,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Janeiro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_inova_gifts_comercio_de_ma_mochila_para_brinde_de_mat','PERCENTUAL','imp3p_inova_gifts_comercio_de_ma_mochila_para_brinde_de_mat',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_r_l_da_silva_salgados_buffet_para_o_lancamento_d_2','Buffet para o lançamento da marca nova - Público interno','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'R.L da Silva - Salgados'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',5200,NULL,5200,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Evento · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_r_l_da_silva_salgados_buffet_para_o_lancamento_d_2','PERCENTUAL','imp3p_r_l_da_silva_salgados_buffet_para_o_lancamento_d_2',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_you_touch_totens_e_servico_totem_roleta_e_carregador','Totem - roleta e carregador','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'You Touch Totens e Serviços LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',4800,NULL,4800,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Cidade da Advocacia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_you_touch_totens_e_servico_totem_roleta_e_carregador','PERCENTUAL','imp3p_you_touch_totens_e_servico_totem_roleta_e_carregador',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_e_floreze_epp_envelopres_institucional','Envelopres institucional','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'E Floreze EPP'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',4780,NULL,4780,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_e_floreze_epp_envelopres_institucional','PERCENTUAL','imp3p_e_floreze_epp_envelopres_institucional',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_rbs_zero_hora_editora_jorn_branded_content_2','branded content','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'RBS - Zero Hora Editora jornalística AS'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',4708,NULL,4708,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Junho, Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_rbs_zero_hora_editora_jorn_branded_content_2','PERCENTUAL','imp3p_rbs_zero_hora_editora_jorn_branded_content_2',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sandro_teixeira_maciel_cuia_e_bomba_de_chimarrao','Cuia e bomba de chimarrão','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sandro Teixeira Maciel'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',4600,NULL,4600,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Cidade da Advocacia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sandro_teixeira_maciel_cuia_e_bomba_de_chimarrao','PERCENTUAL','imp3p_sandro_teixeira_maciel_cuia_e_bomba_de_chimarrao',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_eduardo_alves_de_souza_servico_de_designer_free','Serviço de designer free','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Eduardo Alves de Souza'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',4500,NULL,4500,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_eduardo_alves_de_souza_servico_de_designer_free','PERCENTUAL','imp3p_eduardo_alves_de_souza_servico_de_designer_free',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_agencia_destra_ltda_servicos_de_marketing_ref__1','SERVIÇOS DE MARKETING REF ADESIVOS (MATERIAL OFF)6 PAREDES 2 A 3H CADA = TOTAL 12 A 18H4 CABINES 1H30 min cada= TOTAL 6H4 ESTUDIO 360 030H= TOTAL 2Hadaptações horas por peça 3 repetições (paredes igua','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Agência Destra LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',4320,NULL,4320,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_agencia_destra_ltda_servicos_de_marketing_ref__1','PERCENTUAL','imp3p_agencia_destra_ltda_servicos_de_marketing_ref__1',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_f_m_v_s_brindes_ltda_brinde_volta_as_aulas','Brinde volta as aulas','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'F M V S BRINDES LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',4174,NULL,4174,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_f_m_v_s_brindes_ltda_brinde_volta_as_aulas','PERCENTUAL','imp3p_f_m_v_s_brindes_ltda_brinde_volta_as_aulas',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_inova_gifts_comercio_de_ma_copos_para_acao_de_visitas','Copos para ação de visitas do comercial','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Inova Gifts Comercio de Materiais Promocionais LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',4130,NULL,4130,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Comercial · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_inova_gifts_comercio_de_ma_copos_para_acao_de_visitas','PERCENTUAL','imp3p_inova_gifts_comercio_de_ma_copos_para_acao_de_visitas',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_douglas_ignacio_de_souza_producao_de_video_linha_do','Produção de vídeo linha do tempo para lançamento da marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'DOUGLAS IGNACIO DE SOUZA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',4000,NULL,4000,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_douglas_ignacio_de_souza_producao_de_video_linha_do','PERCENTUAL','imp3p_douglas_ignacio_de_souza_producao_de_video_linha_do',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_loc_locadora_de_equipament_produtora_com_telao_e_ilum','Produtora com telão e iluminação para evento do dia 20 de lançamento da marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Loc Locadora de Equipamentos para Eventos LTDA - Elo'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',4000,NULL,4000,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_loc_locadora_de_equipament_produtora_com_telao_e_ilum','PERCENTUAL','imp3p_loc_locadora_de_equipament_produtora_com_telao_e_ilum',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_fmvs_brindes_ltda_inovagfi_brinde_de_boas_vindas_aos_','Brinde de boas-vindas aos novo colaboradores','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Fmvs Brindes LTDA - Inovagfits'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3964.5,NULL,3964.5,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Junho, Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: RH · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_fmvs_brindes_ltda_inovagfi_brinde_de_boas_vindas_aos_','PERCENTUAL','imp3p_fmvs_brindes_ltda_inovagfi_brinde_de_boas_vindas_aos_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_stilo_embalagens_personali_compra_de_sacolas_de_papel','Compra de sacolas de papel com aplicação da nova marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Stilo Embalagens Personalizadas'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3928.51,NULL,3928.51,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de Material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_stilo_embalagens_personali_compra_de_sacolas_de_papel','PERCENTUAL','imp3p_stilo_embalagens_personali_compra_de_sacolas_de_papel',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_destra_lp_daniel','LP Daniel','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Destra'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3890,NULL,3890,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_destra_lp_daniel','PERCENTUAL','imp3p_destra_lp_daniel',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_thiago_pedroso_argiles_gar_producao_de_lonas_mubs_de_','produção de lonas MUBS de Canoas','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Thiago Pedroso Argiles Garbim Franco'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3660,NULL,3660,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_thiago_pedroso_argiles_gar_producao_de_lonas_mubs_de_','PERCENTUAL','imp3p_thiago_pedroso_argiles_gar_producao_de_lonas_mubs_de_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_thiago_pedroso_argiles_gar_impressao_de_30_lonas_mubs','Impressão de 30 lonas - MUBS Canoas','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Thiago Pedroso Argiles Garbim Franco'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3660,NULL,3660,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_thiago_pedroso_argiles_gar_impressao_de_30_lonas_mubs','PERCENTUAL','imp3p_thiago_pedroso_argiles_gar_impressao_de_30_lonas_mubs',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_destra_servico_de_designer_free','Serviço de designer free','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Destra'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3600,NULL,3600,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_destra_servico_de_designer_free','PERCENTUAL','imp3p_destra_servico_de_designer_free',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_agencia_destra_ltda_trabalho_do_mes_de_agosto_','Trabalho do mês de agosto referente a horas (30h)','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Agência Destra LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3600,NULL,3600,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_agencia_destra_ltda_trabalho_do_mes_de_agosto_','PERCENTUAL','imp3p_agencia_destra_ltda_trabalho_do_mes_de_agosto_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_e_fioreze_epp_producao_de_bloquinhos_par','Produção de bloquinhos para brinde','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'E Fioreze - EPP'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3540,NULL,3540,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Cidade da Advocacia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_e_fioreze_epp_producao_de_bloquinhos_par','PERCENTUAL','imp3p_e_fioreze_epp_producao_de_bloquinhos_par',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_agencia_destra_ltda_insta_daniel','Insta Daniel','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Agência Destra LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3500,NULL,3500,'ATIVO','2026-09-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Setembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_agencia_destra_ltda_insta_daniel','PERCENTUAL','imp3p_agencia_destra_ltda_insta_daniel',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_fmvs_brindes_ltda_inovagfi_canetas','Canetas','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Fmvs Brindes LTDA - Inovagfits'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3487.8,NULL,3487.8,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_fmvs_brindes_ltda_inovagfi_canetas','PERCENTUAL','imp3p_fmvs_brindes_ltda_inovagfi_canetas',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_fmvs_brindes_ltda_inovagfi_canetas_lancamento_da_marc','Canetas - lançamento da marca e estoque','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Fmvs Brindes LTDA - Inovagfits'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3450,NULL,3450,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_fmvs_brindes_ltda_inovagfi_canetas_lancamento_da_marc','PERCENTUAL','imp3p_fmvs_brindes_ltda_inovagfi_canetas_lancamento_da_marc',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_casa_do_babinho_ltda_lanche_para_recepcao_dos_a','Lanche para recepção dos alunos','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'CASA DO BABINHO LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3315,NULL,3315,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: CC Graduação · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_casa_do_babinho_ltda_lanche_para_recepcao_dos_a','PERCENTUAL','imp3p_casa_do_babinho_ltda_lanche_para_recepcao_dos_a',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_agencia_destra_ltda_servicos_de_marketing_ref__2','SERVIÇOS DE MARKETING REF FOTOGRAFIA PUBLICITARIA 1 DIARIA DE PRODUÇÃO E FOTOGRAFIA 8 H (4/5 CAPTAÇÃO E 2/3 EDIÇÃO)PRODUÇÃO E DIREÇÃO ARTISTICA DAS CENAS.MOODBOARD E PALETA30 FOTOS AMBIENTADAS E EDITA','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Agência Destra LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3270,NULL,3270,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_agencia_destra_ltda_servicos_de_marketing_ref__2','PERCENTUAL','imp3p_agencia_destra_ltda_servicos_de_marketing_ref__2',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_eccher_e_eccher_ltda_producao_de_lonas_para_imo','Produção de lonas para Imobi - rótula das cuias','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Eccher e Eccher Ltda'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3240,NULL,3240,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_eccher_e_eccher_ltda_producao_de_lonas_para_imo','PERCENTUAL','imp3p_eccher_e_eccher_ltda_producao_de_lonas_para_imo',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_casa_do_babinho_ltda_locacao_de_mesas_toalhas_e','Locação de mesas, toalhas e sanduiches para o Mutirão','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Casa do Babinho LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3210,NULL,3210,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_casa_do_babinho_ltda_locacao_de_mesas_toalhas_e','PERCENTUAL','imp3p_casa_do_babinho_ltda_locacao_de_mesas_toalhas_e',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_marcos_andre_de_bona_agenc_criativos_nova_marca','Criativos nova marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'MARCOS ANDRE DE BONA AGENCIA DE PUBLICIDADE - Alpha Produtora'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3060,NULL,3060,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_marcos_andre_de_bona_agenc_criativos_nova_marca','PERCENTUAL','imp3p_marcos_andre_de_bona_agenc_criativos_nova_marca',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_bernadete_nunes_billo_ltda_aplicacoes_de_submarca','Aplicações de submarca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Bernadete Nunes Billo LTDA - Gustavo Billo'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',3000,NULL,3000,'ATIVO','2026-02-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Fevereiro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_bernadete_nunes_billo_ltda_aplicacoes_de_submarca','PERCENTUAL','imp3p_bernadete_nunes_billo_ltda_aplicacoes_de_submarca',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_purana_velas_ltda_brinde_para_o_dia_das_mulh','Brinde para o dia das mulheres','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Purana Velas LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2979.25,NULL,2979.25,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Evento · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_purana_velas_ltda_brinde_para_o_dia_das_mulh','PERCENTUAL','imp3p_purana_velas_ltda_brinde_para_o_dia_das_mulh',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_r_pietrobon_comercio_de_ar_100_canetas_com_embalagem','100 Canetas com embalagem','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'R Pietrobon Comercio de Artigos Personalizados'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2920,NULL,2920,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_r_pietrobon_comercio_de_ar_100_canetas_com_embalagem','PERCENTUAL','imp3p_r_pietrobon_comercio_de_ar_100_canetas_com_embalagem',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_3','Exibicao de Publicidade Em 10 Placas de Esquina - Dupla Face. Pi: 29072026030. Periodo: 23/07/2026 A 22/07/2027. Parcela: 01 de 12','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'IMOBITARGET COMUNICAÇÕES VISUAL LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2900,NULL,2900,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_3','PERCENTUAL','imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_3',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_4','Exibicao de Publicidade Em 10 Placas de Esquina - Dupla Face. Pi: 29072026030. Periodo: 23/07/2026 A 22/07/2027. Parcela: 04 de 12','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'IMOBITARGET COMUNICAÇÕES VISUAL LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2900,NULL,2900,'ATIVO','2026-11-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Novembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_4','PERCENTUAL','imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_4',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_5','Exibicao de Publicidade Em 10 Placas de Esquina - Dupla Face. Pi: 29072026030. Periodo: 23/07/2026 A 22/07/2027. Parcela: 05 de 12','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'IMOBITARGET COMUNICAÇÕES VISUAL LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2900,NULL,2900,'ATIVO','2026-12-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Dezembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_5','PERCENTUAL','imp3p_imobitarget_comunicacoes_v_exibicao_de_publicidade_em_5',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_destra_horas_extras','Horas extras','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Destra'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2880,NULL,2880,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_destra_horas_extras','PERCENTUAL','imp3p_destra_horas_extras',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_e_fioreze_epp_producao_de_calendario_do_','Produção de calendario do ano','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'E Fioreze - EPP'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2772,NULL,2772,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_e_fioreze_epp_producao_de_calendario_do_','PERCENTUAL','imp3p_e_fioreze_epp_producao_de_calendario_do_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_a_marketing_promocional_lt_promotoras_para_atendiment_1','Promotoras para atendimento na cidade e mochila pirulito','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'A Marketing Promocional LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2623.2,NULL,2623.2,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Cidade da Advocacia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_a_marketing_promocional_lt_promotoras_para_atendiment_1','PERCENTUAL','imp3p_a_marketing_promocional_lt_promotoras_para_atendiment_1',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_eccher_e_eccher_ltda_producao_de_3_lonas_para_p','Produção de 3 lonas para painel da Borges da Midialand','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Eccher e Eccher Ltda'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2592,NULL,2592,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_eccher_e_eccher_ltda_producao_de_3_lonas_para_p','PERCENTUAL','imp3p_eccher_e_eccher_ltda_producao_de_3_lonas_para_p',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_ibdfam_ibdfam','IBDFAM','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'IBDFAM'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2500,NULL,2500,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Patrocínio · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_ibdfam_ibdfam','PERCENTUAL','imp3p_ibdfam_ibdfam',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_decolar_patrocinio_no_evento_passa','Patrocinio no evento - passagem aerea. Autorização Dr. Luciano','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Decolar'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2479.68,NULL,2479.68,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Patrocínio · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_decolar_patrocinio_no_evento_passa','PERCENTUAL','imp3p_decolar_patrocinio_no_evento_passa',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_e_fiorenze_epp_brinde_para_boasvindas_dos','Brinde para boasvindas dos alunos - bloquinhos','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'E Fiorenze EPP'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2478,NULL,2478,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de Material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Acadêmico · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_e_fiorenze_epp_brinde_para_boasvindas_dos','PERCENTUAL','imp3p_e_fiorenze_epp_brinde_para_boasvindas_dos',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_rbs_bola_sem_descricao_2','(sem descrição)','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'RBS - Bola'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2354,NULL,2354,'ATIVO','2026-07-01',
       true,'Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_rbs_bola_sem_descricao_2','PERCENTUAL','imp3p_rbs_bola_sem_descricao_2',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_izadora_pires_da_silva_cobertura_fotografica_na_c','Cobertura fotográfica na colação de grau 2025/2','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Izadora Pires da Silva'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2300,NULL,2300,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Janeiro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Foi contratado de última hora porque o Caco ficou doente · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_izadora_pires_da_silva_cobertura_fotografica_na_c','PERCENTUAL','imp3p_izadora_pires_da_silva_cobertura_fotografica_na_c',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_thaytec_industria_de_brind_ecobag','Ecobag','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'THAYTEC INDUSTRIA DE BRINDES PERSONALIZADOS LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2293.32,NULL,2293.32,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_thaytec_industria_de_brind_ecobag','PERCENTUAL','imp3p_thaytec_industria_de_brind_ecobag',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_grafica_e_editora_relampag_producao_de_crachas','Produção de crachas','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Gráfica e Editora Relâmpago LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2225,NULL,2225,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_grafica_e_editora_relampag_producao_de_crachas','PERCENTUAL','imp3p_grafica_e_editora_relampag_producao_de_crachas',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_voucher_oab','Voucher OAB','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2040,NULL,2040,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Comercial · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_voucher_oab','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_voucher_oab',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_celito_izolin_junior_fotografo_para_lancamento_','Fotografo para lançamento externo da marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Celito Izolin Junior'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',2000,NULL,2000,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_celito_izolin_junior_fotografo_para_lancamento_','PERCENTUAL','imp3p_celito_izolin_junior_fotografo_para_lancamento_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_bendito_gastronomia_coffee_para_recepcao_aos_p','Coffee para recepção aos participantes da Aula | Mundo Digital e Proteção de Crianças e Adolescentes','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Bendito Gastronomia'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1950,NULL,1950,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Coffee break · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_bendito_gastronomia_coffee_para_recepcao_aos_p','PERCENTUAL','imp3p_bendito_gastronomia_coffee_para_recepcao_aos_p',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_fmvs_brindes_ltda_inovagfi_pedido_do_dr_luciano_posse','Pedido do Dr. Luciano - posse Dr. Fábio','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Fmvs Brindes LTDA - Inovagfits'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1850,NULL,1850,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_fmvs_brindes_ltda_inovagfi_pedido_do_dr_luciano_posse','PERCENTUAL','imp3p_fmvs_brindes_ltda_inovagfi_pedido_do_dr_luciano_posse',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_flyer_graduacao','Flyer Graduação','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1585,NULL,1585,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_flyer_graduacao','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_flyer_graduacao',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_paloma_estes_biton_rheinhe_recepcionistas_para_lancam','recepcionistas para lançamento externo da marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Paloma Estes Biton Rheinheimer'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1560,NULL,1560,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_paloma_estes_biton_rheinhe_recepcionistas_para_lancam','PERCENTUAL','imp3p_paloma_estes_biton_rheinhe_recepcionistas_para_lancam',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_eduzamba_servicos_publicit_producao_de_10_placas_de_e','PRODUÇÃO DE 10 PLACAS DE ESQUINA PARA IMOBI.','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Eduzamba Serviços Publicitarios e Impressos EIRELI'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1500,NULL,1500,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_eduzamba_servicos_publicit_producao_de_10_placas_de_e','PERCENTUAL','imp3p_eduzamba_servicos_publicit_producao_de_10_placas_de_e',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_moving_eventos_ltda_saxofonista_para_lancament','Saxofonista para lançamento externo da marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Moving Eventos LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1500,NULL,1500,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_moving_eventos_ltda_saxofonista_para_lancament','PERCENTUAL','imp3p_moving_eventos_ltda_saxofonista_para_lancament',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_bendito_gosto_eventos_ltda_coffee_para_evento_de_lanc','Coffee para evento de lançamento do curso livre com brasilcon','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Bendito gosto eventos ltda'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1500,NULL,1500,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_bendito_gosto_eventos_ltda_coffee_para_evento_de_lanc','PERCENTUAL','imp3p_bendito_gosto_eventos_ltda_coffee_para_evento_de_lanc',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_newsstand_impressao_muro_da_maua','Impressão muro da mauá','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Newsstand'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1500,NULL,1500,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Mídia Offline · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_newsstand_impressao_muro_da_maua','PERCENTUAL','imp3p_newsstand_impressao_muro_da_maua',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_tag_comunicacao_lona_mubs','Lona Mubs','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'TAG COMUNICAÇÃO'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1464,NULL,1464,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Mídia Offline · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_tag_comunicacao_lona_mubs','PERCENTUAL','imp3p_tag_comunicacao_lona_mubs',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_simone_leal_kosmalski_ltda_contratacao_de_massagem_pa','Contrataçao de massagem para ação dia da mulher','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Simone Leal Kosmalski LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1440,NULL,1440,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_simone_leal_kosmalski_ltda_contratacao_de_massagem_pa','PERCENTUAL','imp3p_simone_leal_kosmalski_ltda_contratacao_de_massagem_pa',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_raizler_comercio_de_brinde_porta_cartao','Porta cartão','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'RAIZLER COMERCIO DE BRINDES LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1400,NULL,1400,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: primeiro pagamento de 700 dia 06/03 o restante boleto para dia 20/03 · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_raizler_comercio_de_brinde_porta_cartao','PERCENTUAL','imp3p_raizler_comercio_de_brinde_porta_cartao',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_bendito_gastronomia_coffee_para_lancamento_de_','Coffee para lançamento de curso direito eleitoral','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Bendito Gastronomia'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1400,NULL,1400,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_bendito_gastronomia_coffee_para_lancamento_de_','PERCENTUAL','imp3p_bendito_gastronomia_coffee_para_lancamento_de_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_agencia_destra_ltda_horas_extras_de_trabalho_n','Horas extras de trabalho no mês','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Agência Destra LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1306,NULL,1306,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_agencia_destra_ltda_horas_extras_de_trabalho_n','PERCENTUAL','imp3p_agencia_destra_ltda_horas_extras_de_trabalho_n',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_etiquetas_chapeco_eireli_etiquetas_personalizadas_p','Etiquetas personalizadas para camisetas - nova marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Etiquetas Chapecó Eireli'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1268,NULL,1268,'ATIVO','2026-02-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Fevereiro, Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_etiquetas_chapeco_eireli_etiquetas_personalizadas_p','PERCENTUAL','imp3p_etiquetas_chapeco_eireli_etiquetas_personalizadas_p',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_coffee_stage_maquinas_e_se_cafe_para_stand','Café para stand','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Coffee Stage Maquinas e Serviços'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1200,NULL,1200,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Cidade da Advocacia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_coffee_stage_maquinas_e_se_cafe_para_stand','PERCENTUAL','imp3p_coffee_stage_maquinas_e_se_cafe_para_stand',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_bendito_gastronomia_cofffee_para_evento_do_con','Cofffee para evento do contrato com a ACADEPOL','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Bendito Gastronomia'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1192.5,NULL,1192.5,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Acadêmico · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_bendito_gastronomia_cofffee_para_evento_do_con','PERCENTUAL','imp3p_bendito_gastronomia_cofffee_para_evento_do_con',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sp_visual_print_placa_de_acrilico_da_nova_','Placa de acrílico da nova marca com os selos','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sp Visual Print'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1169.5,NULL,1169.5,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de Material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sp_visual_print_placa_de_acrilico_da_nova_','PERCENTUAL','imp3p_sp_visual_print_placa_de_acrilico_da_nova_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_serata_comercial_de_chocol_convite_para_o_lancamento_','Convite para o lançamento interno da nova marca - bombom - EXTERNO','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Serata Comercial de chocolates LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1163.08,NULL,1163.08,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_serata_comercial_de_chocol_convite_para_o_lancamento_','PERCENTUAL','imp3p_serata_comercial_de_chocol_convite_para_o_lancamento_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_ms_signs_comunicacao_visua_backdrop_para_lancamento_e','Backdrop para lançamento externo da marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'MS Signs Comunicação visual LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1140,NULL,1140,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_ms_signs_comunicacao_visua_backdrop_para_lancamento_e','PERCENTUAL','imp3p_ms_signs_comunicacao_visua_backdrop_para_lancamento_e',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sp_visual_print_qtd_1_chapa_ps_2mm_sem_imp','QTD 1 Chapa PS 2mm sem Impressao - PAREDE 10º ANDAR VALOR UNITÁRIO','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sp Visual Print'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1065.09,NULL,1065.09,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de Material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sp_visual_print_qtd_1_chapa_ps_2mm_sem_imp','PERCENTUAL','imp3p_sp_visual_print_qtd_1_chapa_ps_2mm_sem_imp',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_eduardo_alves_de_souza_prestacao_de_servicos_de_d','Prestação de serviços de design gráfico e comunicação visual 7h','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'EDUARDO ALVES DE SOUZA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1050,NULL,1050,'ATIVO','2026-09-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Setembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_eduardo_alves_de_souza_prestacao_de_servicos_de_d','PERCENTUAL','imp3p_eduardo_alves_de_souza_prestacao_de_servicos_de_d',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sp_visual_print_letras_pulpito_placa_presi','Letras pulpito, placa presidencia e secretaria, placas proibido fumar, placa em acrilico 7º andar','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sp Visual Print'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1044.57,NULL,1044.57,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de Material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sp_visual_print_letras_pulpito_placa_presi','PERCENTUAL','imp3p_sp_visual_print_letras_pulpito_placa_presi',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_radio_itapema_fm_de_porto__branded_content','branded content','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Radio Itapema FM de Porto Alegre'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1025.5,NULL,1025.5,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Mídia Off · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_radio_itapema_fm_de_porto__branded_content','PERCENTUAL','imp3p_radio_itapema_fm_de_porto__branded_content',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_flyer_para_ibdfam','Flyer para IBDFAM','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1020,NULL,1020,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_flyer_para_ibdfam','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_flyer_para_ibdfam',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_r_l_da_silva_salgados_salgados_para_o_cafe_com_o','Salgados para o café com o CEO','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'R.L da Silva - Salgados'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',1019.7,NULL,1019.7,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_r_l_da_silva_salgados_salgados_para_o_cafe_com_o','PERCENTUAL','imp3p_r_l_da_silva_salgados_salgados_para_o_cafe_com_o',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_fabio_dias_vieira_motorista_para_levar_e_bus','Motorista para levar e buscar equipe no IBDFAM','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Fabio Dias Vieira'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',990,NULL,990,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_fabio_dias_vieira_motorista_para_levar_e_bus','PERCENTUAL','imp3p_fabio_dias_vieira_motorista_para_levar_e_bus',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_fmvs_brindes_ltda_inovagfi_brinde_dia_das_maes','Brinde dia das mães','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Fmvs Brindes LTDA - Inovagfits'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',985,NULL,985,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_fmvs_brindes_ltda_inovagfi_brinde_dia_das_maes','PERCENTUAL','imp3p_fmvs_brindes_ltda_inovagfi_brinde_dia_das_maes',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_bendito_gosto_eventos_ltda_coffee_para_evento_com_os_','Coffee para evento com os professores sobre captação de recursos','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Bendito gosto eventos ltda'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',962.5,NULL,962.5,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_bendito_gosto_eventos_ltda_coffee_para_evento_com_os_','PERCENTUAL','imp3p_bendito_gosto_eventos_ltda_coffee_para_evento_com_os_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_promox_ind_e_com_do_vestua_compra_de_camisetas_para_o','Compra de camisetas para o Gramado Summit','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Promox Ind. E Com. Do Vestuaruio LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',951.6,NULL,951.6,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 2 lançamento(s) · Meses: Maio, Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_promox_ind_e_com_do_vestua_compra_de_camisetas_para_o','PERCENTUAL','imp3p_promox_ind_e_com_do_vestua_compra_de_camisetas_para_o',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_eccher_e_eccher_ltda_producao_de_1_lona_para_pa','Produção de 1 lona para painel da Borges da Midialand','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Eccher e Eccher Ltda'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',864,NULL,864,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_eccher_e_eccher_ltda_producao_de_1_lona_para_pa','PERCENTUAL','imp3p_eccher_e_eccher_ltda_producao_de_1_lona_para_pa',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_flyer_pos_graduacao_500','Flyer pós-graduação - 500','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',860,NULL,860,'ATIVO','2026-02-01',
       true,'Categoria na planilha: Materiais Gráficos · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Fevereiro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_flyer_pos_graduacao_500','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_flyer_pos_graduacao_500',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_raizler_comercio_de_brinde_adesivos','Adesivos','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'RAIZLER COMERCIO DE BRINDES LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',810,NULL,810,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_raizler_comercio_de_brinde_adesivos','PERCENTUAL','imp3p_raizler_comercio_de_brinde_adesivos',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_marcos_andre_de_bona_agenc_adesivos_para_os_armarios_','Adesivos para os armários e portas','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'MARCOS ANDRE DE BONA AGENCIA DE PUBLICIDADE - Alpha Produtora'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',800,NULL,800,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_marcos_andre_de_bona_agenc_adesivos_para_os_armarios_','PERCENTUAL','imp3p_marcos_andre_de_bona_agenc_adesivos_para_os_armarios_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_promox_ind_e_com_do_vestua_camiseta_para_south_summir','Camiseta para south summir','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Promox Ind. E Com. Do Vestuaruio LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',799.8,NULL,799.8,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_promox_ind_e_com_do_vestua_camiseta_para_south_summir','PERCENTUAL','imp3p_promox_ind_e_com_do_vestua_camiseta_para_south_summir',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_marisa_victoria_faria_contratacao_de_flores_para','Contratação de flores para lançamento externo da marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Marisa Victória Faria'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',780,NULL,780,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_marisa_victoria_faria_contratacao_de_flores_para','PERCENTUAL','imp3p_marisa_victoria_faria_contratacao_de_flores_para',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_eduardo_prates_da_silva_video_para_lancamento_da_m_1','Vídeo para lançamento da marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Eduardo Prates da Silva'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',750,NULL,750,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_eduardo_prates_da_silva_video_para_lancamento_da_m_1','PERCENTUAL','imp3p_eduardo_prates_da_silva_video_para_lancamento_da_m_1',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_inova_gifts_comercio_de_ma_canecas_de_dia_dos_pais','Canecas de Dia dos Pais','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Inova Gifts Comercio de Materiais Promocionais LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',749.5,NULL,749.5,'ATIVO','2026-09-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Setembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Marketing · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_inova_gifts_comercio_de_ma_canecas_de_dia_dos_pais','PERCENTUAL','imp3p_inova_gifts_comercio_de_ma_canecas_de_dia_dos_pais',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_joao_leonardo_tridade_de_v_producao_de_placa_para_hom','Produção de placa para homenagem Dr. Mauro','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Joao Leonardo Tridade de Vargas Junior'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',720,NULL,720,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Produção de Material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_joao_leonardo_tridade_de_v_producao_de_placa_para_hom','PERCENTUAL','imp3p_joao_leonardo_tridade_de_v_producao_de_placa_para_hom',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_500_envelopes_para_as_prov','500 ENVELOPES PARA AS PROVAS - 31X41','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',715,NULL,715,'ATIVO','2026-09-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Setembro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Graduação · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_500_envelopes_para_as_prov','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_500_envelopes_para_as_prov',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sp_visual_print_instalacao_banca_jornal','INSTALACAO BANCA JORNAL','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sp Visual Print'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',686.18,NULL,686.18,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sp_visual_print_instalacao_banca_jornal','PERCENTUAL','imp3p_sp_visual_print_instalacao_banca_jornal',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_cristian_antonio_carvalho__entrega_dos_convites_fisic','entrega dos convites físicos para lançamento externo da marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Cristian Antonio Carvalho Rodrigues'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',680,NULL,680,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_cristian_antonio_carvalho__entrega_dos_convites_fisic','PERCENTUAL','imp3p_cristian_antonio_carvalho__entrega_dos_convites_fisic',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sp_visual_print_arte_para_banca_de_jornal','Arte para banca de jornal','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sp Visual Print'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',679.53,NULL,679.53,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sp_visual_print_arte_para_banca_de_jornal','PERCENTUAL','imp3p_sp_visual_print_arte_para_banca_de_jornal',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_gessica_da_silva_serafim_b_convite_para_o_lancamento__2','Convite para o lançamento interno da nova marca - bombom','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'GESSICA DA SILVA SERAFIM BITENCOURT'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',658.8,NULL,658.8,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_gessica_da_silva_serafim_b_convite_para_o_lancamento__2','PERCENTUAL','imp3p_gessica_da_silva_serafim_b_convite_para_o_lancamento__2',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_promox_ind_e_com_do_vestua_11_camisetas_para_viagem_d','11 camisetas para viagem dr madalena','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Promox Ind. E Com. Do Vestuaruio LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',609.98,NULL,609.98,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Brindes · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_promox_ind_e_com_do_vestua_11_camisetas_para_viagem_d','PERCENTUAL','imp3p_promox_ind_e_com_do_vestua_11_camisetas_para_viagem_d',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_jv_locacoes_locacao_de_pulpito','locação de pulpito','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Jv locações'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',600,NULL,600,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_jv_locacoes_locacao_de_pulpito','PERCENTUAL','imp3p_jv_locacoes_locacao_de_pulpito',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_r_l_da_silva_salgados_coffee_cafe_com_ceo','Coffee Café com CEO','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'R.L da Silva - Salgados'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',519.1,NULL,519.1,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_r_l_da_silva_salgados_coffee_cafe_com_ceo','PERCENTUAL','imp3p_r_l_da_silva_salgados_coffee_cafe_com_ceo',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_marcelo_otavio_fachini_lanche_para_o_evento_lawco','Lanche para o evento LawConnetc - paçoca, bombom, pit stop','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Marcelo Otavio Fachini'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',509,NULL,509,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Lanche · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Acadêmico · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_marcelo_otavio_fachini_lanche_para_o_evento_lawco','PERCENTUAL','imp3p_marcelo_otavio_fachini_lanche_para_o_evento_lawco',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_estacio_nievinski_filho_mestre_de_cerimonia_para_l_1','Mestre de cerimónia para lançamento do curso direito eleitoral','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'ESTACIO NIEVINSKI FILHO'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',500,NULL,500,'ATIVO','2026-07-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Julho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_estacio_nievinski_filho_mestre_de_cerimonia_para_l_1','PERCENTUAL','imp3p_estacio_nievinski_filho_mestre_de_cerimonia_para_l_1',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_estacio_nievinski_filho_mestre_de_cerimonia_para_l_2','Mestre de cerimónia para lançamento do curso direito do consumidor','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'ESTACIO NIEVINSKI FILHO'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',500,NULL,500,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_estacio_nievinski_filho_mestre_de_cerimonia_para_l_2','PERCENTUAL','imp3p_estacio_nievinski_filho_mestre_de_cerimonia_para_l_2',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_estacio_nievinski_filho_mestre_de_cerimonia_para_l_3','Mestre de cerimónia para lançamento da marca - interno','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'ESTACIO NIEVINSKI FILHO'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',500,NULL,500,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_estacio_nievinski_filho_mestre_de_cerimonia_para_l_3','PERCENTUAL','imp3p_estacio_nievinski_filho_mestre_de_cerimonia_para_l_3',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_estacio_nievinski_filho_aula_mundo_digital_e_prote','Aula | Mundo Digital e Proteção de Crianças e Adolescentes','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Estacio Nievinski Filho'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',500,NULL,500,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Mestre de cerimônias · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_estacio_nievinski_filho_aula_mundo_digital_e_prote','PERCENTUAL','imp3p_estacio_nievinski_filho_aula_mundo_digital_e_prote',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_a_marketing_promocional_lt_promotoras_para_atendiment_2','Promotoras para atendimento na cidade 06/08','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'A Marketing Promocional LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',498,NULL,498,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Prestador de Serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Cidade da Advocacia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_a_marketing_promocional_lt_promotoras_para_atendiment_2','PERCENTUAL','imp3p_a_marketing_promocional_lt_promotoras_para_atendiment_2',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_flyer_do_mestrado_200','Flyer do mestrado - 200','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',490,NULL,490,'ATIVO','2026-01-01',
       true,'Categoria na planilha: Materiais Gráficos · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Janeiro · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_flyer_do_mestrado_200','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_flyer_do_mestrado_200',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_designltda_impresao_de_cartao_para_bo','Impresão de cartao para boas-vindas dos alunos','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'ADEF GRAFICA E DESIGNLTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',490,NULL,490,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_designltda_impresao_de_cartao_para_bo','PERCENTUAL','imp3p_adef_grafica_e_designltda_impresao_de_cartao_para_bo',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_cartao_de_aniversariantes','Cartão de aniversariantes','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',480,NULL,480,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_cartao_de_aniversariantes','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_cartao_de_aniversariantes',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_cartao_para_boas_vindas_do','Cartão para boas-vindas dos alunos 26/2','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',450,NULL,450,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Acadêmico · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_cartao_para_boas_vindas_do','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_cartao_para_boas_vindas_do',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_bilhete_premiado','Bilhete premiado','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',420,NULL,420,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Cidade da Advocacia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_bilhete_premiado','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_bilhete_premiado',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_joao_leonardo_trindade_de__placa_de_homenagem_ao_dr_d','Placa de homenagem ao Dr. Daniel','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'João Leonardo Trindade de Vargas Junior'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',420,NULL,420,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de Material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Financeiro · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_joao_leonardo_trindade_de__placa_de_homenagem_ao_dr_d','PERCENTUAL','imp3p_joao_leonardo_trindade_de__placa_de_homenagem_ao_dr_d',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_eduardo_prates_da_silva_video_para_lancamento_da_m_2','Vídeo para lançamento da marca - edição','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Eduardo Prates da Silva'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',250,NULL,250,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_eduardo_prates_da_silva_video_para_lancamento_da_m_2','PERCENTUAL','imp3p_eduardo_prates_da_silva_video_para_lancamento_da_m_2',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_flyer_para_acao_de_pascoa','Flyer para ação de Páscoa','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',200,NULL,200,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_flyer_para_acao_de_pascoa','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_flyer_para_acao_de_pascoa',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_cartoes_de_visita_para_o_n','Cartões de visita para o NPJ','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',190,NULL,190,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: NPJ · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_cartoes_de_visita_para_o_n','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_cartoes_de_visita_para_o_n',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sp_visual_print_adesivo_na_geladeira_da_sa','Adesivo na geladeira da sala dos professores','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sp Visual Print'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',185.92,NULL,185.92,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sp_visual_print_adesivo_na_geladeira_da_sa','PERCENTUAL','imp3p_sp_visual_print_adesivo_na_geladeira_da_sa',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sp_visual_print_placa_acrilico_sala_dos_pr','Placa Acrílico Sala dos Professores','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sp Visual Print'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',170.68,NULL,170.68,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sp_visual_print_placa_acrilico_sala_dos_pr','PERCENTUAL','imp3p_sp_visual_print_placa_acrilico_sala_dos_pr',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sp_visual_print_adesivo_no_estacionamento_','Adesivo no estacionamento com a nova marca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sp Visual Print'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',154.18,NULL,154.18,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sp_visual_print_adesivo_no_estacionamento_','PERCENTUAL','imp3p_sp_visual_print_adesivo_no_estacionamento_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_gessica_da_silva_serafim_b_convite_para_o_lancamento__3','Convite para o lançamento interno da nova marca - frete','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'GESSICA DA SILVA SERAFIM BITENCOURT'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',147.64,NULL,147.64,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_gessica_da_silva_serafim_b_convite_para_o_lancamento__3','PERCENTUAL','imp3p_gessica_da_silva_serafim_b_convite_para_o_lancamento__3',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_cartao_para_mochila_acao_p','Cartão para mochila - ação para alunos ingressantes 26/1','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',145,NULL,145,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_cartao_para_mochila_acao_p','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_cartao_para_mochila_acao_p',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_designltda_fichas_para_atendimento_do','fichas para atendimento do Mutirão','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'ADEF GRAFICA E DESIGNLTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',120,NULL,120,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_designltda_fichas_para_atendimento_do','PERCENTUAL','imp3p_adef_grafica_e_designltda_fichas_para_atendimento_do',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_thayna_soares_soares_locacao_de_toalhas','locação de toalhas','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Thayna Soares Soares'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',108,NULL,108,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_thayna_soares_soares_locacao_de_toalhas','PERCENTUAL','imp3p_thayna_soares_soares_locacao_de_toalhas',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_sp_visual_print_duas_placas_para_bibliotec','Duas placas para biblioteca','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Sp Visual Print'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',95.4,NULL,95.4,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de Material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_sp_visual_print_duas_placas_para_bibliotec','PERCENTUAL','imp3p_sp_visual_print_duas_placas_para_bibliotec',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_copy_mundi_ltda_producao_de_banner_para_o_','Produção de banner para o evento de lançamento direito do consumidor','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Copy Mundi LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',92,NULL,92,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_copy_mundi_ltda_producao_de_banner_para_o_','PERCENTUAL','imp3p_copy_mundi_ltda_producao_de_banner_para_o_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_cracha_para_ibdfam','Crachá para IBDFAM','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',80,NULL,80,'ATIVO','2026-06-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Junho · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_cracha_para_ibdfam','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_cracha_para_ibdfam',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_desing_ltda_cartao_de_aniversariantes_','Cartão de aniversariantes retroativo','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Adef Gráfica e Desing LTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',75,NULL,75,'ATIVO','2026-04-01',
       true,'Categoria na planilha: Produção de material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Abril · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_desing_ltda_cartao_de_aniversariantes_','PERCENTUAL','imp3p_adef_grafica_e_desing_ltda_cartao_de_aniversariantes_',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_adef_grafica_e_designltda_impressao_de_cartao_e_a4_p','Impressão de cartao e a4 para boa vinda dos professores','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'ADEF GRAFICA E DESIGNLTDA'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',66,NULL,66,'ATIVO','2026-03-01',
       true,'Categoria na planilha: Prestador de serviço · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Março · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_adef_grafica_e_designltda_impressao_de_cartao_e_a4_p','PERCENTUAL','imp3p_adef_grafica_e_designltda_impressao_de_cartao_e_a4_p',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_orildes_teresinha_perego_carimbo_para_cidade_da_adv','Carimbo para cidade da advocacia','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Orildes Teresinha Perego'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',60,NULL,60,'ATIVO','2026-08-01',
       true,'Categoria na planilha: Produção de Material · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Agosto · Data de aquisição aproximada: a planilha informa o mês, não o dia · Obs. da planilha: Cidade da Advocacia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_orildes_teresinha_perego_carimbo_para_cidade_da_adv','PERCENTUAL','imp3p_orildes_teresinha_perego_carimbo_para_cidade_da_adv',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO item_custo (id,descricao,natureza,"fornecedorId","categoriaId","modeloCobranca",comportamento,
       moeda,periodicidade,"valorPeriodo","valorMensalNormalizado","valorEmReais",status,"dataInicio",
       "semPrazoDeterminado",observacoes,"criadoEm","atualizadoEm")
VALUES ('imp3p_linna_varal_e_prendedor_para_aca','varal e prendedor para ação de dia das maes','PONTUAL',
       (SELECT id FROM fornecedor WHERE nome = 'Linna'),
       (SELECT id FROM categoria WHERE codigo = 'MKT'),
       'PONTUAL','FIXO','BRL','UNICO',46.55,NULL,46.55,'ATIVO','2026-05-01',
       true,'Categoria na planilha: Produtor · Perfil: PONTUAL / CURTO PRAZO · 1 lançamento(s) · Meses: Maio · Data de aquisição aproximada: a planilha informa o mês, não o dia · Fonte: Orçamento Marketing FMP.xlsm, aba de outros custos',now(),now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO rateio (id,metodo,"itemCustoId","setorId",percentual,"vigenciaInicio","criadoEm","atualizadoEm")
VALUES ('rt_imp3p_linna_varal_e_prendedor_para_aca','PERCENTUAL','imp3p_linna_varal_e_prendedor_para_aca',(SELECT id FROM setor WHERE codigo = 'MKT'),100,'2026-09-08',now(),now())
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================================
-- 172 itens pontuais · R$ 1.367.336,02 em 2026
--
--   RECORRENTE / PARCELADO: R$ 727.584,99
--   PONTUAL / CURTO PRAZO: R$ 639.751,03
--
-- 0 sem mês informado (entram sem data de aquisição, viram pendência)
-- 0 linhas sem valor, descartadas
-- 11 pares fornecedor+descrição repetidos, desempatados por índice
--
-- FICA PARA DECISÃO HUMANA:
--  · As linhas de perfil RECORRENTE / PARCELADO valem virar contrato com
--    parcelas de verdade. As maiores: Rádio Atlântida (Bola nas Costas,
--    R$ 130.671,94 em 21 lançamentos), Action Day (assessoramento de mídia,
--    R$ 110.000,00 em 11 parcelas), Sp Visual Print (sinalética do campus,
--    R$ 66.032,36), Agência Destra (lançamento da marca, R$ 64.209,99).
--  · A comissão da Action Day sobre verba de tráfego (R$ 63.554,19) é custo
--    derivado de outro custo — percentual sobre a verba de mídia. O modelo não
--    expressa isso hoje; entra como pontual até a revisão resolver.
--  · Categoria: tudo entrou em MKT, com a categoria da planilha (Mídia Off,
--    Brindes, Produção de material, Patrocínio, Evento…) preservada em
--    observacoes. Vale criar as subcategorias de Marketing na revisão.
-- ============================================================================
