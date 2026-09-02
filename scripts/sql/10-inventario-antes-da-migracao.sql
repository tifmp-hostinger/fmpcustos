-- ============================================================================
-- 10 · INVENTÁRIO ANTES DA MIGRAÇÃO
--
-- Só faz leitura. Não altera nada, não abre transação, não cria nem apaga.
-- Serve para responder uma pergunta antes de qualquer carga nova:
-- o que JÁ está no banco, e o que da planilha nova é repetido.
--
-- Rode e me mande a saída. A consulta 3 é a que mais importa — é a lista
-- contra a qual eu comparo linha por linha a planilha nova. Ela pode passar
-- de 80 linhas; se ficar ruim de copiar, gere em CSV:
--
--   psql "$DATABASE_URL" -f scripts/sql/10-inventario-antes-da-migracao.sql
--   psql "$DATABASE_URL" --csv -c "<a consulta 3 sozinha>" > inventario-ti.csv
-- ============================================================================

-- 1. Os setores, e quanto cada um tem hoje.
--    Escopo de setor mora no rateio vigente — é assim que a aplicação conta.
SELECT s.codigo,
       s.nome,
       count(DISTINCT i.id)                                    AS itens,
       coalesce(sum(i."valorMensalNormalizado"), 0)            AS mensal_bruto
FROM setor s
LEFT JOIN rateio r     ON r."setorId" = s.id AND r."vigenciaFim" IS NULL
LEFT JOIN item_custo i ON i.id = r."itemCustoId" AND i."excluidoEm" IS NULL
GROUP BY s.codigo, s.nome
ORDER BY itens DESC, s.codigo;

-- 2. Panorama por status e natureza. Mostra se a primeira carga deixou muita
--    coisa em PENDENTE_APURACAO, e quanto disso é dinheiro sem equivalente.
SELECT i.natureza,
       i.status,
       count(*)                                     AS itens,
       count(i."valorPeriodo")                      AS com_valor,
       coalesce(sum(i."valorMensalNormalizado"), 0)  AS mensal_normalizado
FROM item_custo i
WHERE i."excluidoEm" IS NULL
GROUP BY i.natureza, i.status
ORDER BY i.natureza, i.status;

-- 3. ***A PRINCIPAL*** — o inventário do setor de TI, item por item.
--    É contra esta lista que eu decido, para cada linha da planilha nova:
--    já existe / existe e mudou de valor / é novo.
SELECT i.id,
       coalesce(f.nome, '(sem fornecedor)') AS fornecedor,
       i.descricao,
       i.natureza,
       i.status,
       i.periodicidade,
       i.moeda,
       i."valorPeriodo",
       i."valorMensalNormalizado",
       i."valorEmReais",
       i."dataInicio",
       i."dataFim",
       i."semPrazoDeterminado",
       c.codigo                             AS categoria,
       r.percentual                         AS pct_ti,
       (SELECT count(*) FROM lancamento_custo l WHERE l."itemCustoId" = i.id) AS lancamentos,
       left(coalesce(i.observacoes, ''), 120) AS obs
FROM item_custo i
JOIN rateio r      ON r."itemCustoId" = i.id AND r."vigenciaFim" IS NULL
JOIN setor  s      ON s.id = r."setorId" AND s.codigo = 'TI'
LEFT JOIN fornecedor f ON f.id = i."fornecedorId"
LEFT JOIN categoria  c ON c.id = i."categoriaId"
WHERE i."excluidoEm" IS NULL
ORDER BY i."valorMensalNormalizado" DESC NULLS LAST, f.nome, i.descricao;

-- 4. Os 47 fornecedores da planilha nova × o que já existe no banco.
--    Diz de quais eu preciso criar cadastro e quais eu já posso referenciar.
--    O casamento é por nome normalizado: minúsculo, sem acento e sem
--    pontuação. `translate` em vez da extensão `unaccent` de propósito — não
--    dá para assumir que a extensão está instalada no banco de produção.
WITH planilha(nome) AS (
  VALUES ('America NET (Vero)'), ('Anydesk'), ('Apple'), ('Asana'), ('Astrea'),
         ('Biblioteca Digital ProView'), ('Blue3'), ('Cirion'), ('Creativa'),
         ('Debarry'), ('Decodificar'), ('Docpipe'), ('Editora ABEC / DOI'),
         ('Eduvem'), ('Eduzz'), ('Espectra'), ('Fulltel'), ('Gamma'),
         ('Google Ads'), ('Guarda Fila'), ('HeinOnline'), ('JusBrasil'),
         ('KingHost'), ('Klimos'), ('LXP'), ('META'), ('Minha Biblioteca'),
         ('Multimídia'), ('N4B'), ('Neo Tagus'), ('Obvio'), ('Pergamum'),
         ('Primus TI'), ('QR Code Fácil'), ('RD Station'), ('RT Online'),
         ('Revista ABEU'), ('Rubeus'), ('Startech'), ('StayBox'), ('TOTVS'),
         ('Telium'), ('VIVO'), ('VerdanaTech'), ('Vigia Virtual'), ('WeCom'),
         ('Yogh')
)
SELECT p.nome                        AS na_planilha,
       f.nome                        AS no_banco,
       CASE WHEN f.id IS NULL THEN 'CRIAR' ELSE 'JÁ EXISTE' END AS acao
FROM planilha p
LEFT JOIN fornecedor f
  ON regexp_replace(
       lower(translate(f.nome, 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
                               'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),
       '[^a-z0-9]', '', 'g')
   = regexp_replace(
       lower(translate(p.nome, 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
                               'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),
       '[^a-z0-9]', '', 'g')
ORDER BY acao DESC, p.nome;

-- 4-b. A lista crua de fornecedores do banco, com quantos itens cada um tem.
--      Serve de rede: nome que a consulta 4 não casou por escrita diferente
--      ("VIVO" × "Vivo S.A.", "Multimídia" × "Multimidia Ltda") eu caso aqui,
--      olhando a lista.
SELECT f.nome, f.ativo, count(i.id) AS itens
FROM fornecedor f
LEFT JOIN item_custo i ON i."fornecedorId" = f.id AND i."excluidoEm" IS NULL
GROUP BY f.nome, f.ativo
ORDER BY f.nome;

-- 5. Itens que já têm lançamento mensal. Importa porque item com histórico
--    NÃO pode ser excluído (só cancelado) — isso limita o que eu posso
--    corrigir da primeira carga sem apagar série histórica.
SELECT count(*) FILTER (WHERE l.n > 0) AS itens_com_lancamento,
       count(*) FILTER (WHERE l.n = 0) AS itens_sem_lancamento,
       coalesce(sum(l.n), 0)           AS lancamentos_no_total
FROM (
  SELECT i.id, (SELECT count(*) FROM lancamento_custo l WHERE l."itemCustoId" = i.id) AS n
  FROM item_custo i WHERE i."excluidoEm" IS NULL
) l;

-- 6. As categorias disponíveis, para eu classificar as linhas novas em vez de
--    deixar tudo sem categoria.
SELECT codigo, nome FROM categoria ORDER BY codigo;

-- 7. Itens de TI sem data de término — a lacuna que impede alerta de renovação.
--    A planilha nova traz prazo em texto livre para 23 linhas; esta consulta
--    diz quantos itens ganhariam data se eu extrair aquele texto.
SELECT count(*) AS itens_ti_sem_data_fim
FROM item_custo i
JOIN rateio r ON r."itemCustoId" = i.id AND r."vigenciaFim" IS NULL
JOIN setor  s ON s.id = r."setorId" AND s.codigo = 'TI'
WHERE i."excluidoEm" IS NULL
  AND i."dataFim" IS NULL
  AND i."semPrazoDeterminado" = false
  AND i.natureza IN ('RECORRENTE', 'PESSOAL');

-- 8. Rateios que não fecham 100%. Se aparecer algo aqui, a primeira carga
--    deixou item órfão ou dividido errado, e isso precisa ser resolvido ANTES
--    de entrar carga nova em cima.
SELECT i.id, i.descricao, sum(r.percentual) AS soma_pct
FROM item_custo i
JOIN rateio r ON r."itemCustoId" = i.id AND r."vigenciaFim" IS NULL
WHERE i."excluidoEm" IS NULL
GROUP BY i.id, i.descricao
HAVING sum(r.percentual) IS DISTINCT FROM 100
ORDER BY soma_pct NULLS FIRST
LIMIT 50;
