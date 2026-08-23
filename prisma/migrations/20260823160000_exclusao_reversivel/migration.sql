-- Exclusão reversível de itens de custo.
--
-- Excluir de verdade apaga em cascata a série mensal inteira (lançamentos e
-- rateios). Com estas colunas o item some das listas na hora, continua 30 dias
-- na aba "Excluídos" e só então é expurgado — o que torna o botão "Desfazer"
-- verdadeiro em vez de decorativo.

ALTER TABLE "item_custo" ADD COLUMN "excluidoEm" TIMESTAMP(3);
ALTER TABLE "item_custo" ADD COLUMN "excluidoPorId" TEXT;

-- Contrato sem prazo é diferente de contrato cuja data ninguém preencheu:
-- sem esta marcação, sair da fila de pendências exigiria inventar uma data.
ALTER TABLE "item_custo" ADD COLUMN "semPrazoDeterminado" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "item_custo"
  ADD CONSTRAINT "item_custo_excluidoPorId_fkey"
  FOREIGN KEY ("excluidoPorId") REFERENCES "usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "item_custo_excluidoEm_idx" ON "item_custo"("excluidoEm");
