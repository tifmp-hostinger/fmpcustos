-- O valor da cobrança em real, derivado.
--
-- `valorMensalNormalizado` responde "quanto por mês" e é nulo para pagamento
-- único e por consumo — que não têm equivalente mensal. Compra avulsa e
-- investimento, porém, têm um total muito concreto, e a pergunta que se faz
-- deles é "quanto gastamos este ano".
--
-- Sem esta coluna esse total só poderia ser somado em memória, sobre as linhas
-- já carregadas, e passaria a mentir no dia em que a lista ficasse maior que o
-- teto de exibição. Aqui ele soma no banco — e soma em real, porque somar
-- `valorPeriodo` cru repetiria numa segunda coluna o defeito de moeda que a
-- migração anterior corrigiu.
ALTER TABLE "item_custo" ADD COLUMN "valorEmReais" DECIMAL(14,2);

-- Carga do que já existe. Em real: o item estrangeiro só recebe valor quando
-- tem câmbio, pela mesma regra do valor mensal — sem taxa, fica fora do total e
-- aparece como pendência, em vez de entrar somado errado.
UPDATE "item_custo"
   SET "valorEmReais" = CASE
     WHEN "valorPeriodo" IS NULL THEN NULL
     WHEN "moeda" = 'BRL' THEN ROUND("valorPeriodo", 2)
     WHEN "cambio" IS NULL THEN NULL
     ELSE ROUND("valorPeriodo" * "cambio", 2)
   END;
