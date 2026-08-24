-- Visões salvas: um recorte da lista, com nome.
--
-- É a alternativa à pasta. Uma árvore obriga a escolher UMA hierarquia por
-- custo, e um custo pertence a várias ao mesmo tempo — setor, categoria,
-- fornecedor, natureza — e, com rateio, a vários setores simultaneamente. Além
-- disso o custo da pasta não é o clique: é a decisão de arquivar, tomada uma vez
-- e sofrida para sempre por quem procura depois.
--
-- A visão salva inverte a relação: o custo fica onde está e o que se guarda é a
-- pergunta. O recorte é a própria query string da tela, e não uma estrutura
-- paralela — assim a visão é sempre exatamente o que a lista mostra, e um filtro
-- novo passa a poder ser salvo sem migração nenhuma.
CREATE TABLE "visao_salva" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "recorte" TEXT NOT NULL,
    "donoId" TEXT NOT NULL,
    "institucional" BOOLEAN NOT NULL DEFAULT false,
    "posicao" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visao_salva_pkey" PRIMARY KEY ("id")
);

-- O mesmo nome duas vezes na mesma conta é confusão, não organização.
CREATE UNIQUE INDEX "visao_salva_donoId_nome_key" ON "visao_salva"("donoId", "nome");
CREATE INDEX "visao_salva_institucional_idx" ON "visao_salva"("institucional");

-- Em cascata: uma visão sem dono não tem para quem aparecer.
ALTER TABLE "visao_salva"
  ADD CONSTRAINT "visao_salva_donoId_fkey"
  FOREIGN KEY ("donoId") REFERENCES "usuario"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
