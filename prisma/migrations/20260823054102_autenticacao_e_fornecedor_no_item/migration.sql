-- AlterTable
ALTER TABLE "item_custo" ADD COLUMN     "criadoPorId" TEXT,
ADD COLUMN     "fornecedorId" TEXT;

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "precisaTrocarSenha" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "senhaHash" TEXT;

-- AddForeignKey
ALTER TABLE "item_custo" ADD CONSTRAINT "item_custo_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_custo" ADD CONSTRAINT "item_custo_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
