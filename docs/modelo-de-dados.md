# Modelo de dados

Cada separação abaixo existe para resolver um problema concreto da planilha
atual. Nenhuma está aqui por gosto de complexidade.

## As quatro decisões estruturais

### 1. Contrato ≠ Item de custo ≠ Lançamento

| Entidade | Responde | Exemplo |
| --- | --- | --- |
| `Contrato` | O acordo comercial | Contrato com a Espectra, vigência, multa, reajuste |
| `ItemCusto` | O que é cobrado | "Callsys — telefonia e chat", R$ 9.238,00/mês |
| `LancamentoCusto` | Quanto foi naquele mês | Competência 08/2026, previsto e realizado |

Na planilha, os três eram a mesma linha. Por isso não havia onde colocar
vigência, quantidade nem variação mensal — e por isso Primus TI ocupava 6 linhas
e Rubeus 4.

### 2. `natureza` em todo fato

```
RECORRENTE | PONTUAL | CAPEX | PESSOAL
```

`CAPEX` e `PESSOAL` já estão no enum mas ainda não têm entidades próprias: a
decisão de construir ou integrar com o TOTVS está em aberto. Declarar agora
evita migration de enum quando ela for tomada.

Nenhuma métrica em `src/lib/metricas/` soma naturezas diferentes por padrão.
`FiltroMetrica.naturezas` é obrigatório.

### 3. `valorMensalNormalizado` é derivado

`ItemCusto` guarda `valorPeriodo` + `periodicidade`. O equivalente mensal é
calculado por `valorMensalNormalizado()` em `src/lib/dinheiro.ts` e **nunca**
digitado.

`UNICO` e `SOB_DEMANDA` retornam `null` — não existe equivalente mensal para
pagamento único nem para consumo variável, e fingir que existe é como a planilha
chegou a um "total mensal" que não era mensal.

### 4. Rateio é entidade versionada

`Rateio` pode estar no item (regra padrão) ou no lançamento (exceção daquela
competência). O rateio do lançamento vence o do item.

- `metodo = PERCENTUAL` na v1; o enum já aceita `POR_USUARIO`, `IGUALITARIO` e `MANUAL`
- `vigenciaInicio` / `vigenciaFim` impedem que mudar o rateio reescreva o histórico
- `aprovadoPor` / `aprovadoEm` registram quem decidiu — rateio é decisão política, não técnica
- Lançamento sem rateio cai em **"Não rateado"** nas métricas: visível, nunca descartado

## Separação que torna a expansão possível

`Contrato.setorGestorId` é **quem administra** o contrato.
`Rateio.setorId` é **quem consome e paga**.

O TI continua administrando a Rubeus; o custo é alocado ao Comercial. Sem essa
separação, todo custo que passa pelo TI vira "custo de TI" para sempre — que é
exatamente o problema da planilha atual.

## Controle de acesso

`AcessoSetor` combina `setorId` **e** `naturezas[]`. Ver o custo recorrente do
Comercial e ver o custo de pessoal do Comercial são duas autorizações separadas.

## Governança

| Entidade | Papel |
| --- | --- |
| `Auditoria` | Append-only. Tabela, registro, ação, autor, diff, timestamp. |
| `Importacao` | Rastreia a origem de cada dado carregado por planilha. |
| `Alerta` | Renovação, reajuste acima do índice, estouro de orçamento, ociosidade, rateio incompleto. |

## Preparação para a IA

Três campos existem hoje só para a Fase 4, e são baratos agora e caros depois:

- `Documento.textoExtraido` — base do RAG contratual
- `Capacidade` + `ServicoCapacidade` — sobreposição funcional detectada por
  consulta, não adivinhada pelo modelo
- `AtribuicaoLicenca.ultimoAcesso` — sem ele, "licença ociosa" é palpite

## Diagrama textual

```
Fornecedor ──< Contrato ──< ItemCusto ──< LancamentoCusto ──< Rateio >── Setor
                  │            │                                          │
                  │            ├──< FaixaPreco                     CentroCusto
                  │            └──── Licenca ──< AtribuicaoLicenca >── Colaborador
                  ├──< Aditivo
                  └──< Documento

Categoria (árvore) ──< ItemCusto
Servico ──< ServicoCapacidade >── Capacidade
Orcamento >── Setor, Categoria, natureza, ano
```
