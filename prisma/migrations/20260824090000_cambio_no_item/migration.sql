-- Moeda no cálculo.
--
-- Até aqui `valorMensalNormalizado` era comparável em periodicidade e cego em
-- moeda: um custo de US$ 500/mês entrava no total da FMP como R$ 500. O campo
-- passa a ser sempre em real, e a taxa aplicada fica gravada no item.
--
-- A taxa mora no item, e não numa tabela lida na hora de somar, pelo mesmo
-- motivo que o câmbio do lançamento mora no lançamento: o total de junho não
-- pode se reescrever sozinho porque o dólar mexeu em agosto.

ALTER TABLE "item_custo" ADD COLUMN "cambio" DECIMAL(14,6);
ALTER TABLE "item_custo" ADD COLUMN "cambioEm" DATE;

-- Cotação de referência: existe para que treze setores não digitem treze
-- dólares diferentes. É sugestão, nunca fonte da soma.
CREATE TABLE "cotacao_moeda" (
    "id" TEXT NOT NULL,
    "moeda" "Moeda" NOT NULL,
    "taxa" DECIMAL(14,6) NOT NULL,
    "data" DATE NOT NULL,
    "fonte" TEXT,
    "registradoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cotacao_moeda_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cotacao_moeda_moeda_data_key" ON "cotacao_moeda"("moeda", "data");
CREATE INDEX "cotacao_moeda_moeda_data_idx" ON "cotacao_moeda"("moeda", "data" DESC);

ALTER TABLE "cotacao_moeda"
  ADD CONSTRAINT "cotacao_moeda_registradoPorId_fkey"
  FOREIGN KEY ("registradoPorId") REFERENCES "usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Correção do que já está gravado.
--
-- Itens em moeda estrangeira têm hoje um `valorMensalNormalizado` que é o valor
-- em dólar ou euro com cara de real. Zerá-lo tira o item do total até alguém
-- informar a taxa — e é isso que se quer: o item vira pendência visível na
-- tela, com link direto, em vez de continuar somando errado em silêncio. O
-- `valorPeriodo` não é tocado: o que a pessoa digitou continua sendo o que a
-- fatura diz.
UPDATE "item_custo"
   SET "valorMensalNormalizado" = NULL
 WHERE "moeda" <> 'BRL'
   AND "valorMensalNormalizado" IS NOT NULL;
