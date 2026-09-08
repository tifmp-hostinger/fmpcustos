-- ============================================================================
-- 17 · ALINHAR A VIGÊNCIA DO RATEIO AO INÍCIO REAL DO CUSTO
--
-- Não carrega nada. Corrige um defeito das cargas 12, 14 e 15: elas gravaram
-- `vigenciaInicio` com a data em que o script rodou, e não com a data em que o
-- custo passou a existir.
--
-- Hoje isso não aparece em tela nenhuma, porque toda consulta da aplicação lê
-- rateio por `vigenciaFim IS NULL` — nenhuma lê por intervalo de data. Mas o
-- plano de revisão prevê exatamente essa leitura, para que fechar uma
-- competência congele o rateio daquele mês. No dia em que ela existir:
--
--   · 174 itens pontuais com aquisição entre janeiro e agosto ficariam sem dono
--     em seu próprio mês de compra;
--   · os 16 itens que têm lançamento ficariam sem dono em janeiro a agosto,
--     porque o rateio só começa em 08/09.
--
-- A nova `vigenciaInicio` é a mais antiga entre a data de aquisição do item e a
-- primeira competência em que ele tem lançamento. `least` no PostgreSQL ignora
-- nulo, então serve para item que só tem uma das duas.
--
-- FICA DE FORA, DE PROPÓSITO: os cinco itens que têm DOIS rateios — ClickUp,
-- QR Code Fácil, RD Station, Reclame Aqui e WhatsApp API. Neles o script 13
-- encerrou a fatia de TI e abriu a de Marketing. Recuar a fatia de Marketing
-- para janeiro criaria sobreposição real com a de TI, que também começa em
-- janeiro — e a pergunta por baixo disso não é técnica: se a atribuição a TI
-- foi erro da primeira carga, o histórico deve ser reescrito e a fatia de TI
-- some; se TI era de fato o setor responsável até setembro, o histórico está
-- certo como está. Isso é decisão de quem responde pelo dado, não minha.
--
-- Idempotente: o UPDATE só age onde a vigência é POSTERIOR ao início real.
-- ============================================================================

BEGIN;

WITH primeira_competencia AS (
  SELECT l."itemCustoId" AS iid, min(make_date(c.ano, c.mes, 1)) AS data
  FROM lancamento_custo l
  JOIN competencia c ON c.id = l."competenciaId"
  GROUP BY 1
),
um_rateio_so AS (
  SELECT "itemCustoId" AS iid FROM rateio GROUP BY 1 HAVING count(*) = 1
),
alvo AS (
  SELECT r.id AS rateio_id,
         least(pc.data, i."dataInicio") AS inicio_real
  FROM rateio r
  JOIN item_custo i    ON i.id  = r."itemCustoId"
  JOIN um_rateio_so u  ON u.iid = r."itemCustoId"
  LEFT JOIN primeira_competencia pc ON pc.iid = r."itemCustoId"
  WHERE i."excluidoEm" IS NULL
    AND r."vigenciaFim" IS NULL
    AND least(pc.data, i."dataInicio") IS NOT NULL
)
UPDATE rateio
   SET "vigenciaInicio" = alvo.inicio_real,
       "atualizadoEm"   = now()
  FROM alvo
 WHERE rateio.id = alvo.rateio_id
   AND rateio."vigenciaInicio" > alvo.inicio_real;

COMMIT;

-- ============================================================================
-- CONFERÊNCIA — rode depois e me mande a saída.
-- Os dois primeiros números devem ser 0. O terceiro deve ser 5.
-- ============================================================================
-- WITH pc AS (SELECT l."itemCustoId" iid, min(make_date(c.ano,c.mes,1)) d
--             FROM lancamento_custo l JOIN competencia c ON c.id=l."competenciaId" GROUP BY 1)
-- SELECT count(*) FILTER (WHERE r."vigenciaInicio" > pc.d)            AS lancamento_antes_do_rateio,
--        count(*) FILTER (WHERE i.natureza='PONTUAL'
--                           AND r."vigenciaInicio" > i."dataInicio")  AS pontual_desalinhado,
--        (SELECT count(*) FROM (SELECT "itemCustoId" FROM rateio
--           GROUP BY 1 HAVING count(*)=1) x
--         WHERE false) + (SELECT count(*) FROM (SELECT "itemCustoId" FROM rateio
--           GROUP BY 1 HAVING count(*)>1) y)                          AS itens_com_dois_rateios
-- FROM item_custo i
-- JOIN rateio r ON r."itemCustoId"=i.id AND r."vigenciaFim" IS NULL
-- LEFT JOIN pc ON pc.iid=i.id
-- WHERE i."excluidoEm" IS NULL;
