# Ferramentas de desenvolvimento

Nada aqui roda em produção. São dois scripts para conferir o sistema numa base
descartável, antes de subir qualquer coisa para o EasyPanel.

## `semear-demo.ts` — base de demonstração

Apaga tudo e recria 13 setores, 5 usuários (um de cada perfil), 4 categorias e
27 custos representativos — mensais, anuais, trimestrais, por consumo, com e sem
data de renovação, dois em dólar (um convertido, um sem cotação de propósito) e
alguns já com lançamentos de competência. É a base que o teste de ponta a ponta
espera encontrar.

Os números que as suítes conferem moram em `semente.mjs`, num lugar só. Mudou a
carga, muda ali — e não em quatro arquivos, que é como uma asserção frouxa
("menos que o total") acaba sendo escrita para não precisar mexer, e como um
gestor de setor enxergando a lista inteira da FMP passou por uma revisão sem ser
visto.

```bash
DATABASE_URL="postgresql://…" npm run dev:semear
```

Todos os usuários usam a senha `teste12345`:

| e-mail | perfil |
|---|---|
| `admin@fmp.com.br` | Administrador |
| `ti@fmp.com.br` | Gestor do setor de TI |
| `mkt@fmp.com.br` | Gestor de Comunicação e Marketing |
| `controladoria@fmp.com.br` | Controladoria |
| `leitor@fmp.com.br` | Leitor |

**Nunca aponte para o banco de produção.** A primeira instrução do script é um
`TRUNCATE`.

## `e2e.mjs` — teste de ponta a ponta

Sobe um navegador de verdade e percorre o sistema pelos quatro perfis,
verificando o que a interface promete: os atalhos da linha, o desfazer, a
lixeira, o rateio com setor âncora, a proposta e o aceite, o que o leitor não
pode fazer e a navegação por teclado.

```bash
# 1. build de produção e servidor
npm run build && node .next/standalone/server.js

# 2. base limpa
DATABASE_URL="postgresql://…" npm run dev:semear

# 3. teste
E2E_URL=http://127.0.0.1:3000 npm run dev:e2e
```

Sai com código 1 se qualquer verificação falhar.

## `e2e-memoria.mjs` — memória e prevenção

Cobre o que impede dado sujo de nascer: o aviso de fornecedor duplicado
("Microsoft Brasil" quando já existe "Microsoft"), a colagem da planilha com
uma linha estragada de propósito, os modelos de rateio e a entrega da senha
temporária — inclusive a recusa de resetar a própria senha.

```bash
E2E_URL=http://127.0.0.1:3000 npm run dev:e2e-memoria
```

## `e2e-lote.mjs` — lote e fila de pendências

Cobre a seleção com Shift+clique, a soma vinda do servidor, a fricção que
cresce com o tamanho do lote (age direto até 4, confirma a partir de 5), o
desfazer que devolve cada item ao seu próprio estado, a exportação completa
em CSV e a revisão em sequência no painel lateral.

```bash
E2E_URL=http://127.0.0.1:3000 npm run dev:e2e-lote
```

> **Nota sobre seletores.** Os testes de navegador usam `data-celula`,
> `data-coluna` e `data-barra` em vez de contar posições de coluna. A tabela
> muda de forma conforme o perfil — a caixa de seleção e a coluna Setor só
> existem para quem pode — e um teste que conta `td:nth-child` quebra a cada
> ajuste sem que nada esteja errado no sistema.

## `e2e-moeda.mjs` — moeda no cálculo

Cobre a pergunta que originou a mudança: um custo em dólar entra no total pelo
real ou pelo número da fatura? Verifica a conversão na lista, a procedência da
taxa, o custo sem cotação aparecendo como pendência em vez de sumir, a recusa
do cadastro sem taxa legível, o formulário que preserva o que foi digitado
depois de uma recusa, a conversão em lote pela Administração e as colunas de
moeda no CSV exportado.

```bash
E2E_URL=http://127.0.0.1:3000 npm run dev:e2e-moeda
```

## `e2e-alertas.mjs` — alertas e resumo semanal

Cobre a pergunta que originou a mudança: o sistema avisa, ou espera alguém
lembrar de olhar? Verifica o guarda da rota de rotina (sem token, token errado,
token certo, e que GET não escreve), a varredura que não duplica ao rodar todo
dia, o alerta que carrega o dinheiro em jogo, o escopo por setor, reconhecer que
não é resolver, e o alerta que some sozinho quando o dado que faltava é
preenchido.

```bash
E2E_ROTINAS_TOKEN=... E2E_URL=http://127.0.0.1:3000 npm run dev:e2e-alertas
```

O servidor precisa estar rodando com `ROTINAS_TOKEN` igual ao `E2E_ROTINAS_TOKEN`.

## `smtp-de-mentira.mjs` — conferir o e-mail de verdade

Um servidor SMTP falso que aceita qualquer autenticação e guarda o que recebe em
`dados/emails/`. Sem ele, a única forma de saber se o resumo sai e se ele fica
legível é apontar o sistema para o SMTP da FMP e mandar mensagem real para
pessoas reais — o que ninguém faz durante o desenvolvimento, e é por isso que o
primeiro e-mail de produção costuma chegar quebrado.

```bash
npm run dev:smtp   # numa aba

# noutra
export SMTP_HOST=127.0.0.1 SMTP_PORTA=2525 SMTP_USUARIO=teste SMTP_SENHA=teste \
       SMTP_SEGURO=false SMTP_REMETENTE="Custos FMP <custos@fmp.com.br>" \
       APP_URL=http://127.0.0.1:3000
DATABASE_URL="postgresql://…" npm run rotina alertas
DATABASE_URL="postgresql://…" npm run rotina resumo

ls dados/emails/     # .html, .txt e .json de cada mensagem
```

Abra o `.html` no navegador para ver o e-mail como ele chega.

## Rodar tudo de uma vez

```bash
npm run dev:e2e-tudo    # as seis suítes de navegador, em sequência
npm run testar          # as cinco suítes de unidade
```

Cada suíte espera a base recém-semeada. Entre uma e outra, rode
`npm run dev:semear` de novo.

## Testes de unidade — sem banco, sem navegador

```bash
npm run testar             # roda os cinco de uma vez
npm run testar:rateio      # aritmética do rateio
npm run testar:fornecedores # identidade de fornecedor
npm run testar:planilha    # leitura da colagem
npm run testar:dinheiro    # periodicidade, moeda e câmbio
npm run testar:rotinas     # guarda do token e leitura do SMTP
```

## `testar-rateio.ts` — aritmética do rateio

Roda sem banco e sem navegador. Cobre o caso que originou o desenho da tela
(100% num setor, entra outro com 10%, o primeiro cai para 90%), os terços que
precisam somar exatamente 100%, o centavo do arredondamento e os formatos que
as pessoas realmente digitam.

```bash
npm run testar:rateio
```

## `e2e-navegacao.mjs` — todo número é uma porta

Verifica a promessa central do painel: clicar num número abre a lista cujo
total é **exatamente** aquele número. Também cobre ordenação por coluna, chips
de filtro removíveis, a busca global do cabeçalho (`/` e `Ctrl+K`) e o escopo
do panorama por setor.

```bash
E2E_URL=http://127.0.0.1:3000 npm run dev:e2e-navegacao
```
