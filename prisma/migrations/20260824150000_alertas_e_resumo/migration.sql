-- Alertas gerados e resumo semanal por e-mail.
--
-- O modelo Alerta existia desde o começo e nunca teve uma linha: o sistema
-- dependia de alguém lembrar de abri-lo. Uma renovação só era notada quando o
-- contrato já tinha renovado sozinho.

-- Moeda estrangeira sem cotação é um tipo próprio, e não DADO_INCOMPLETO, porque
-- a consequência é outra: não é um item incompleto, é um TOTAL incompleto.
ALTER TYPE "TipoAlerta" ADD VALUE IF NOT EXISTS 'CAMBIO_AUSENTE';

ALTER TABLE "usuario" ADD COLUMN "receberResumo" BOOLEAN NOT NULL DEFAULT true;

-- Leitor consulta, não altera. Mandar a ele uma lista de decisões que ele não
-- pode tomar é ruído com aparência de cobrança — e quem recebe cobrança que não
-- consegue resolver cria uma regra de caixa de entrada. Ele pode ligar sozinho,
-- na tela de alertas.
UPDATE "usuario" SET "receberResumo" = false WHERE "papel" = 'LEITOR';
ALTER TABLE "usuario" ADD COLUMN "resumoEnviadoEm" TIMESTAMP(3);

ALTER TABLE "alerta" ADD COLUMN "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "alerta_itemCustoId_status_idx" ON "alerta"("itemCustoId", "status");

-- Um alerta ABERTO de cada tipo por custo, garantido pelo banco.
--
-- A rotina roda todo dia. Sem esta restrição, trinta dias de execução deixariam
-- trinta alertas iguais para o mesmo contrato — e uma lista de alertas que
-- repete a mesma frase trinta vezes é uma lista que ninguém lê, o que é pior
-- que não ter alerta nenhum.
--
-- Parcial de propósito: alertas já resolvidos ou ignorados PODEM se repetir. Um
-- contrato renovado hoje volta a alertar no ano que vem, e essa segunda vez é
-- informação nova.
CREATE UNIQUE INDEX "alerta_aberto_unico"
  ON "alerta"("tipo", "itemCustoId")
  WHERE "status" IN ('ABERTO', 'RECONHECIDO') AND "itemCustoId" IS NOT NULL;
