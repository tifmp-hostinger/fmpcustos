-- CreateEnum
CREATE TYPE "StatusProposta" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusAceite" AS ENUM ('PENDENTE', 'ACEITO', 'REJEITADO');

-- CreateTable
CREATE TABLE "proposta_rateio" (
    "id" TEXT NOT NULL,
    "itemCustoId" TEXT NOT NULL,
    "status" "StatusProposta" NOT NULL DEFAULT 'PENDENTE',
    "justificativa" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "decididaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposta_rateio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposta_rateio_parcela" (
    "id" TEXT NOT NULL,
    "propostaId" TEXT NOT NULL,
    "setorId" TEXT NOT NULL,
    "percentual" DECIMAL(7,4) NOT NULL,
    "aceite" "StatusAceite" NOT NULL DEFAULT 'PENDENTE',
    "comentario" TEXT,
    "decididoPorId" TEXT,
    "decididoEm" TIMESTAMP(3),

    CONSTRAINT "proposta_rateio_parcela_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proposta_rateio_itemCustoId_status_idx" ON "proposta_rateio"("itemCustoId", "status");

-- CreateIndex
CREATE INDEX "proposta_rateio_parcela_setorId_aceite_idx" ON "proposta_rateio_parcela"("setorId", "aceite");

-- CreateIndex
CREATE UNIQUE INDEX "proposta_rateio_parcela_propostaId_setorId_key" ON "proposta_rateio_parcela"("propostaId", "setorId");

-- AddForeignKey
ALTER TABLE "proposta_rateio" ADD CONSTRAINT "proposta_rateio_itemCustoId_fkey" FOREIGN KEY ("itemCustoId") REFERENCES "item_custo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposta_rateio" ADD CONSTRAINT "proposta_rateio_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposta_rateio_parcela" ADD CONSTRAINT "proposta_rateio_parcela_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "proposta_rateio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposta_rateio_parcela" ADD CONSTRAINT "proposta_rateio_parcela_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposta_rateio_parcela" ADD CONSTRAINT "proposta_rateio_parcela_decididoPorId_fkey" FOREIGN KEY ("decididoPorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Fatia de proposta sempre entre mais-que-zero e 100.
ALTER TABLE "proposta_rateio_parcela"
  ADD CONSTRAINT "parcela_percentual_faixa"
    CHECK (percentual > 0 AND percentual <= 100);
