-- Modelos de rateio: um critério de divisão que se repete, guardado com nome.
--
-- A Controladoria decide uma vez que a infraestrutura compartilhada é 70% TI e
-- 30% Infra, e aplica isso a doze contratos. Sem modelo, é redigitar a mesma
-- divisão doze vezes — e basta uma distração para o décimo ficar 70/25 sem
-- ninguém perceber, porque a soma continua fechando pela âncora.

CREATE TABLE "modelo_rateio" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "criadoPorId" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "modelo_rateio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "modelo_rateio_nome_key" ON "modelo_rateio"("nome");

CREATE TABLE "modelo_rateio_parcela" (
  "id" TEXT NOT NULL,
  "modeloId" TEXT NOT NULL,
  "setorId" TEXT NOT NULL,
  "percentual" DECIMAL(7,4) NOT NULL,
  CONSTRAINT "modelo_rateio_parcela_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "modelo_rateio_parcela_modeloId_setorId_key"
  ON "modelo_rateio_parcela"("modeloId", "setorId");

ALTER TABLE "modelo_rateio"
  ADD CONSTRAINT "modelo_rateio_criadoPorId_fkey"
  FOREIGN KEY ("criadoPorId") REFERENCES "usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "modelo_rateio_parcela"
  ADD CONSTRAINT "modelo_rateio_parcela_modeloId_fkey"
  FOREIGN KEY ("modeloId") REFERENCES "modelo_rateio"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "modelo_rateio_parcela"
  ADD CONSTRAINT "modelo_rateio_parcela_setorId_fkey"
  FOREIGN KEY ("setorId") REFERENCES "setor"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- A mesma trava que já protege `rateio`: percentual fora de 0–100 não existe.
ALTER TABLE "modelo_rateio_parcela"
  ADD CONSTRAINT "modelo_rateio_parcela_percentual_valido"
  CHECK ("percentual" > 0 AND "percentual" <= 100);
