-- ============================================================================
-- 00 · DIAGNÓSTICO
--
-- Só faz leitura. Não altera nada, não abre transação e não usa nenhuma
-- construção que cliente gráfico costume quebrar. Se algum destes comandos
-- falhar, o problema é de conexão ou permissão, não do script.
--
-- Rode este primeiro e me mande a saída.
-- ============================================================================

-- 1. Onde eu estou conectado, com qual usuário e qual versão do PostgreSQL.
--    A versão importa: gen_random_uuid() só é nativa a partir da 13.
SELECT current_database() AS banco,
       current_user       AS usuario,
       version()          AS versao;

-- 2. O esquema já existe neste banco?
SELECT to_regclass('public.setor')      IS NOT NULL AS tem_tabela_setor,
       to_regclass('public.categoria')  IS NOT NULL AS tem_tabela_categoria,
       to_regclass('public.usuario')    IS NOT NULL AS tem_tabela_usuario;

-- 3. Quantas tabelas existem no schema public.
SELECT count(*) AS tabelas_no_public
FROM information_schema.tables
WHERE table_schema = 'public';

-- 4. Se as tabelas existirem, o que já está carregado.
--    (Se der erro aqui dizendo que a relação não existe, o esquema não foi
--     aplicado — é essa a resposta.)
SELECT (SELECT count(*) FROM setor)      AS setores,
       (SELECT count(*) FROM categoria)  AS categorias,
       (SELECT count(*) FROM capacidade) AS capacidades,
       (SELECT count(*) FROM usuario)    AS usuarios;
