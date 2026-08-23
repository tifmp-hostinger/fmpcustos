-- Restrições que o Prisma não expressa no schema, mas que impedem estados
-- inválidos de dinheiro e rateio de entrarem por qualquer caminho (UI, SQL
-- direto, importação com bug).

-- Rateio: percentual dentro de 0-100, sempre ancorado em item OU lançamento,
-- e com pelo menos uma forma de cálculo quando o método a exige.
ALTER TABLE "rateio"
  ADD CONSTRAINT "rateio_percentual_faixa"
    CHECK (percentual IS NULL OR (percentual >= 0 AND percentual <= 100)),
  ADD CONSTRAINT "rateio_tem_alvo"
    CHECK ("itemCustoId" IS NOT NULL OR "lancamentoId" IS NOT NULL);

-- Competência: mês de calendário real.
ALTER TABLE "competencia"
  ADD CONSTRAINT "competencia_mes_valido" CHECK (mes >= 1 AND mes <= 12);

-- Dinheiro nunca negativo. Custo negativo não existe neste domínio; um
-- estorno é um lançamento próprio, não um valor com sinal trocado.
ALTER TABLE "item_custo"
  ADD CONSTRAINT "item_valor_periodo_nao_negativo"
    CHECK ("valorPeriodo" IS NULL OR "valorPeriodo" >= 0),
  ADD CONSTRAINT "item_valor_mensal_nao_negativo"
    CHECK ("valorMensalNormalizado" IS NULL OR "valorMensalNormalizado" >= 0);

ALTER TABLE "lancamento_custo"
  ADD CONSTRAINT "lancamento_previsto_nao_negativo"
    CHECK ("valorPrevisto" IS NULL OR "valorPrevisto" >= 0),
  ADD CONSTRAINT "lancamento_realizado_nao_negativo"
    CHECK ("valorRealizado" IS NULL OR "valorRealizado" >= 0);
