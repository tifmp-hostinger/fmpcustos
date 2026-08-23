# PLANO DE DESIGN — Sistema de Custos FMP
**Documento de direção. Decisões tomadas, não alternativas.**

---

## A) PRINCÍPIOS

**1. A soma fecha sozinha.**
Rateio não é um teste de aritmética. Uma das fatias é sempre a âncora e absorve o restante por construção, então o estado "110%" deixa de existir em vez de ser validado. É o que a folha de pagamento americana e o Salesforce Opportunity Splits fazem: transformam N variáveis com restrição global em N−1 variáveis livres.
*Teste: se o usuário precisa somar de cabeça, a tela está errada.*

**2. Nada muda em silêncio.**
Todo número alterado pelo sistema é anunciado três vezes: preview antes, destaque âmbar de 2s durante, delta inline até salvar. Change blindness é literal — o gestor não descobre a alteração na hora, descobre no fechamento do mês, e a partir daí confere tudo na planilha.
*Teste: nenhum valor na tela pode ter mudado sem que a pessoa consiga apontar quando.*

**3. Grava-se só o que foi tocado.**
Mudar situação atualiza situação. Ponto. Hoje `salvarCusto` reescreve 14 campos e converte CAPEX em RECORRENTE porque o `<select>` caiu na primeira opção — o sistema corrompe classificação contábil quando a pessoa achou que só mexeu no status.
*Teste: toda ação tem uma server action que escreve o mínimo, e o diff da auditoria cabe em uma linha.*

**4. Toda ação diz o que fez — e oferece o caminho de volta.**
Com o objeto pelo nome ("Adobe Creative Cloud foi excluído") e com Desfazer quando for reversível. Hoje cadastrar, editar, cancelar e excluir produzem a mesma tela: `/custos`, sem faixa, sem destaque. A interface literalmente não distingue sucesso de destruição.
*Teste: cobrir a tela e ler só a mensagem — dá para saber o que aconteceu?*

**5. O sistema não oferece o que já sabe que vai negar.**
O botão "Excluir este custo" aparece para itens com 14 lançamentos, e só depois do clique o sistema informa que é impossível. Permissão, histórico e regra de negócio são conhecidos na renderização: quando bloqueiam, a ação muda de nome ou vem desabilitada com o motivo escrito ao lado, nunca desabilitada muda.
*Teste: nenhuma mensagem de erro pode dizer algo que a tela sabia antes do clique.*

**6. Todo número é uma porta.**
"Marketing R$ 12.400/mês" e "12 itens sem data de término" são diagnósticos sem tratamento: não são links, e a lista nem sabe filtrar por setor ou por dado faltante. Métrica que não leva à lista que a compõe é decoração.
*Teste: clicar em qualquer número do painel abre a lista filtrada cujo total é exatamente aquele número.*

**7. Todo percentual anda com o seu real.**
"60%" não é discutível numa reunião; "R$ 744,00/mês" é. Gestor aceita ou recusa dinheiro, não fração. Onde houver percentual — rateio, participação, gráfico — o valor em reais aparece na mesma linha.
*Teste: nenhuma tela pede uma decisão sobre um percentual sem mostrar quanto ele custa.*

---

## B) DECISÕES CONCRETAS

### B.1 Rateio auto-balanceado

**Decisão central: setor âncora (residual), não rebalanceamento proporcional.**

O pedido do dono do produto ("tenho 100 num setor, adiciono outro de 10, vira 90+10") é atendido *exatamente* pelo modelo residual — e melhor do que pelo rebalanceamento proporcional, que geraria dízimas (33,33 → 29,997) sobre números que o gestor já considerava fechados, não é reversível quando uma fatia chega a 0% e quebra por divisão por zero. O residual é a mecânica dos splits de folha de pagamento e do Salesforce, e é a única em que a soma não pode quebrar.

**Onde vive:** painel lateral aberto pela linha da lista ou pelo topo da página do custo, ao lado do valor. Não é mais uma página no rodapé de um formulário de 14 campos.

**Mecânica, passo a passo, com números reais** (custo: Microsoft Dynamics CRM, R$ 1.240,00/mês, dono TI):

1. **Abre.** Uma linha: `TI · âncora · 100,00% · R$ 1.240,00/mês`. O campo de percentual da âncora é somente leitura, fundo cinza, ícone de âncora e o rótulo "absorve o restante".
2. **Adicionar setor.** Chip "Adicionar setor" cria a linha com o select focado. Escolhe Comercial; o foco pula para o campo de percentual, vazio, placeholder "0,00". **Nenhum indicador de erro aparece** — a linha ainda não teve chance de estar errada (hoje o contador pisca vermelho acusando 60% antes de a pessoa digitar).
3. **Digita 60.** Ao vivo: `Comercial 60,00% · R$ 744,00` e `TI 34,50%`... não: `TI 40,00% (−60) · R$ 496,00`. Só a linha da TI recebe o flash âmbar de 2s, porque só ela foi alterada pelo sistema. O delta `(−60)` fica visível até salvar.
4. **Adiciona Acadêmico com 5,5%.** `Acadêmico 5,50% · R$ 68,20`; `TI 34,50% (−65,5) · R$ 427,80`. Comercial **não se move** — essa é a diferença que importa: adicionar uma fatia nunca toca outra fatia digitada.
5. **Remover uma linha** devolve o percentual à âncora, com flash e delta.
6. **Erro possível, único e local.** Digitar 96 no Comercial com Acadêmico em 5,5: as livres somam 101,50 e a âncora iria a −1,50. A mensagem nasce na linha culpada: *"Comercial não pode receber 96%. Restam 94,50% em TI."* O botão Salvar continua habilitado e, ao ser clicado, repete o erro e foca a linha — botão desabilitado mudo é hostil.
7. **Trocar a âncora** é um item do menu da linha ("Este setor absorve o restante"). A âncora antiga congela no percentual atual e vira valor digitado.

**Aritmética (decidida no design, não no bug report):**
- Percentual é armazenado com **4 casas** (`Rateio.percentual` já é `Decimal(7,4)`), **editado e exibido com 2**. Internamente tudo é inteiro em unidades de 0,0001pp — 100% = 1.000.000.
- A âncora recebe `1.000.000 − soma(demais)`. Nunca sobra e nunca falta.
- **Reais:** as fatias livres são calculadas e arredondadas a 2 casas; **a âncora recebe a subtração exata** (`valor do custo − soma das demais`). O centavo tem dono por definição, e a tela diz isso: *"TI absorve o arredondamento (R$ 0,01)."*
- **Maior resto (Hamilton)** entra apenas onde o sistema gera percentuais: o chip "Dividir igualmente" entre 3 setores escreve 33,3334 / 33,3333 / 33,3333 (exibidos como 33,33%), com o resto indo para a âncora. Nunca se aplica maior resto sobre número que a pessoa digitou.
- **Fatia mínima 0,50%.** Abaixo disso, a linha é removida em vez de virar 0%.

**Travas:** não existe cadeado. No modelo residual toda linha não-âncora já é imutável pelo sistema — a trava implícita vem de graça, sem o usuário precisar descobrir o conceito. Cadeado é UI morta para gestor administrativo.

**Chips acima da lista** (nesta ordem, com "Dividir igualmente" deliberadamente sem destaque): `Voltar a um setor só` · `Dividir igualmente` · `Arredondar` (só aparece quando a diferença para múltiplos de 5% é menor que 1pp: 59,7/40,3 → 60/40) · `Descartar alterações` (volta ao estado salvo, distinto de desfazer).

**Entrada dupla R$ ↔ %:** as duas colunas na mesma linha, ambas editáveis, e a **fonte da verdade persistida é sempre o percentual** — custo recorrente reajusta e a proporção sobrevive. Digitar R$ 744,00 grava 60,0000%. Rateio por valor fixo em reais (`metodo = MANUAL`) e rateio por driver (nº de licenças, headcount) ficam para depois; exigem política de recálculo e congelamento do passado, e o sistema ainda não sabe confirmar um salvamento.

**Proposta e aceite deixam de ser beco sem saída:** `cancelarProposta` já está implementada em `rateio/acoes.ts` e nenhuma tela a chama. Passa a existir "Cancelar proposta" e "Corrigir e reenviar" para quem propôs, botões de aceite também na página do custo (hoje só na Início), o `comentario` da recusa renderizado, e aviso ao proponente quando alguém decide — hoje uma proposta recusada some da tela sem nota. E o texto do botão Recusar diz a verdade: *"recusar devolve a proposta inteira ao Marketing — as outras fatias caem junto."*

---

### B.2 Ações de linha na lista

**Decisão: as duas ações mais frequentes não vão para a coluna de ações — viram edição na própria célula.** Situação e data de renovação são as tarefas 1 e 10 da auditoria, as mais repetitivas. Colocá-las num kebab seria pagar dois cliques por 90% do trabalho real.

- **Célula Situação** — o selo colorido é o gatilho. Um clique (não duplo, domínio fechado de 6 opções) abre popover com as situações; escolha aplica otimista. Rótulo textual sempre junto da cor: relatório de fundação é impresso em P&B e daltonismo existe.
- **Célula "Renova em"** — clique transforma em `input[type=date]`; Enter grava e **o foco pula para a próxima linha pendente**; Esc cancela. Doze datas em doze digitações.
- **Valor: nunca inline na lista.** Exige contexto (nota fiscal, competência, contradição com quantidade × unitário). Edita-se no painel lateral, onde o equivalente mensal recalcula ao vivo e o sistema aponta *"12 licenças × R$ 66,30 = R$ 795,60, não bate com o valor informado"*.
- **Coluna de ações à direita, largura fixa de 44px: só o kebab.** Sempre renderizado, opacidade 0,55 em repouso, 1,0 em `:hover`, `:focus-within` e `:focus-visible`. Nunca hover-only — WCAG 1.4.13, e o auditor que entra duas vezes por ano não vai varrer a tela com o mouse procurando affordance.
- **Conteúdo do kebab, no máximo 7, com texto:** Editar · Duplicar · Dividir entre setores · Encerrar custo · Ver histórico · Copiar link · *(separador)* Excluir.
- **Clique com o botão direito na `<tr>`** abre o mesmo menu. Custo zero de tela, ganho grande no fluxo de varredura, e é o gesto que a pessoa já traz do Excel.
- **Clique na linha abre o painel lateral** (side peek, 440px, redimensionável; overlay abaixo de 1200px porque máquinas administrativas de 1366px existem). ↑/↓ trocam o registro sem fechar o painel — é assim que se revisa 20 itens no fechamento.
- **Vermelho é a cor da FMP, não a cor do perigo.** `--accent` é o vermelho institucional e já pinta o botão primário. Excluir nunca é vermelho na linha; é texto no menu, e só ganha peso de alerta dentro do modal.
- **Ações negadas não somem, explicam.** Custo compartilhado para gestor de setor: item do menu desabilitado com "Custo compartilhado — alterações pela Controladoria" no próprio item.
- **Mobile:** abaixo de 768px a tabela vira cards com descrição, valor mensal, setor e situação; kebab persistente abrindo bottom sheet com rótulos textuais; alvos de 44px. Modo consulta primeiro — o diretor abre no celular para conferir um número em reunião, não para lançar custo. Sem swipe, sem long-press: são invisíveis e não têm equivalente por teclado.

---

### B.3 Ações destrutivas e undo

Escada de fricção calibrada por reversibilidade real, porque a eficácia do modal depende diretamente da sua raridade — quem vê modal em tudo clica "Sim" por reflexo.

| Ação | Fricção | Janela |
|---|---|---|
| Mudar situação (inclusive Cancelado) | Nenhuma. Otimista + toast com Desfazer | 8s |
| Preencher/alterar data, categoria, setor | Nenhuma. Toast com Desfazer | 8s |
| Alterar valor | Nenhuma. Toast com delta: "de R$ 1.240,00 para R$ 1.490,00 · +20% · Desfazer" | 8s |
| Excluir 1 custo **sem lançamentos** | Nenhuma. **Soft delete** + toast com Desfazer | 10s + aba "Excluídos (30 dias)" |
| Excluir custo **com lançamentos** | Não existe. O botão se chama **"Encerrar custo"** e faz o que promete | — |
| Lote de 2 a 4 itens | Toast agregado único com Desfazer | 10s |
| Lote de 5+ itens | Modal com contagem e soma: "Encerrar 14 custos, total R$ 187.320,00/mês?" | — |
| Todos-os-filtrados + excluir | Modal com digitação da quantidade ("digite 213") | — |
| Excluir setor, fechar competência | Modal com digitação do nome | — |

**Soft delete é pré-requisito, não detalhe.** Undo sem `excluidoEm` no banco é mentira: o `tx.itemCusto.delete` já foi commitado e o botão não tem o que desfazer. Migration nova em `ItemCusto` (`excluidoEm`, `excluidoPorId`), filtro em `escopoDeItens` (`src/lib/consultas.ts`), expurgo físico por rotina após 30 dias.

**Regras do toast:** um por vez; canto inferior direito com `padding-bottom` dinâmico para não cobrir paginação nem o botão "Cadastrar custo"; `role="status"` + `aria-live="polite"`; pausa o auto-dismiss em hover e foco; **nunca rouba foco**; o Desfazer é alcançável por Tab. E o toast nunca é o único caminho: a aba "Excluídos (30 dias)" e o histórico do item também restauram, para quem só percebe o erro no dia seguinte.

**A linha não some sob os olhos da pessoa.** Cancelar um item com o filtro "Ativos" ativo esmaece a linha e escreve "não aparece mais em Ativos" — ela sai só no próximo carregamento. Perder a posição da varredura é o custo escondido que ninguém mede.

---

### B.4 Feedback e estado

- **Nenhum `redirect()` em caminho de sucesso.** Os três atuais (`custos/acoes.ts` em `salvarCusto` e `excluirCusto`, `rateio/acoes.ts` em `proporRateio`) descartam o `Resultado` e são a causa raiz da cegueira geral. Ação retorna `Resultado`; a navegação, quando necessária, é do cliente.
- **`Resultado` ganha carga útil:** `sucesso(mensagem, { destaqueId, desfazer })` em `src/lib/acoes.ts`. `destaqueId` faz a linha piscar âmbar por 600ms; `desfazer` alimenta o botão do toast.
- **Volta-se para onde se estava.** Salvar vindo da lista devolve à lista, com filtro, busca, ordenação e posição de scroll intactos. Salvar vindo da Início devolve à Início com a pendência riscada. Nunca a um destino fixo.
- **Otimista com rollback barulhento.** Chips de situação e células de data atualizam antes da resposta; se a action falhar, a célula volta ao valor anterior **e** um toast de erro explica. Rollback silencioso é pior que erro visível — a pessoa acredita que salvou.
- **Pendência mora na célula**, não numa tela cinza: opacidade 0,6 e `aria-busy` na célula que está gravando. Com 80 a 500 linhas carregadas no cliente, filtro e ordenação são instantâneos e não precisam de skeleton.
- **`falha()` sempre com `valores`.** O mecanismo existe, está documentado em `src/lib/acoes.ts` com o comentário "inaceitável num formulário de vinte campos" e é usado só no login. Com React 19 resetando forms não controlados, um erro de validação hoje apaga 14 campos preenchidos.

---

### B.5 Formulários

- **Punish late, reward early.** O primeiro erro de um campo aparece só no `blur`. Depois que o campo errou uma vez, revalida a cada tecla, para o erro sumir no instante em que for corrigido.
- **Moeda sem máscara durante a digitação** — máscara reposiciona cursor e briga com quem cola da planilha. `dinheiro()` já aceita "1.234,56", "1234.56" e "R$ 1.234,56"; formata-se no `blur`. Abaixo do campo, o equivalente mensal ao vivo: *"R$ 1.490,00 anual = R$ 124,17/mês"*. E a mensagem de erro deixa de ser "Informe o valor" com o campo visivelmente preenchido — passa a ser "Não consegui ler «1,2,3». Use 1.234,56".
- **Fornecedor vira combobox** sobre os fornecedores existentes, com sugestão por similaridade normalizada (minúsculas, sem acento, sem LTDA/S.A.) antes de permitir criar: *"Já existe Microsoft — usar esse?"*. Hoje "Microsoft", "Microsoft Brasil" e "MS" viram três fornecedores e o gráfico de concentração por fornecedor morre na origem, em silêncio.
- **Divulgação progressiva.** Bloco visível: descrição, fornecedor, valor, periodicidade, setor. Atrás de "Mais detalhes": quantidade, unitário, comportamento, moeda, observações. São 3 campos obrigatórios em 14 apresentados com o mesmo peso.
- **Select nunca inventa valor.** Duas correções que andam juntas: `NATUREZAS` em `src/lib/opcoes.ts` passa a ter as 4 naturezas do enum, e as constantes de validação em `custos/acoes.ts` derivam dessa mesma lista — divergência entre a lista que valida e a que exibe passa a ser impossível. Além disso, `Selecao` em `src/components/campos.tsx` detecta valor fora das opções, injeta a opção marcada como legada e recusa gravar sem escolha explícita.
- **"Salvar e cadastrar outro"**, com fornecedor, categoria e periodicidade preservados, e foco já no campo descrição. Quem cadastra 30 custos cadastra em blocos parecidos.

---

### B.6 Navegação e busca

- **Estado de leitura inteiro na URL:** `?setor=&status=&pend=&q=&sort=&dir=&pagina=`. `pushState` para mudanças deliberadas de filtro (o Voltar desfaz filtro por filtro), `replaceState` com debounce de 300ms para digitação de busca. `pagina=1` sempre que um filtro muda. Fora da URL: seleção de linhas e estado de painel.
- **Filtros novos e indispensáveis:** por **setor** (hoje inexistente, o `where` só combina status e texto) e por **pendência** (sem data, sem valor, sem categoria, sem fornecedor). É o que converte "12 itens sem data de término" em fila de trabalho.
- **Chips de filtro ativo** acima da tabela com X individual, "Limpar filtros" e o contador honesto "Exibindo 213 de 487 custos". Filtro não persiste entre sessões — voltar depois de três dias e não achar os próprios custos é armadilha clássica.
- **Views salvas** são só URLs com rótulo. Três prontas: "Fechamento do mês", "Sem data de renovação", "Acima de R$ 10 mil".
- **Ordenação client-side** (500 linhas cabem em memória; ordenar sobre paginação server-side ordena só a página e mente em silêncio). Ciclo de 3 estados, `aria-sort` no `<th>`, nulos sempre no fim, `tabular-nums` e alinhamento à direita em dinheiro. Default permanece valor mensal desc — a pergunta de negócio é "onde está o dinheiro"; o problema real de "a linha editada mudou de lugar" se resolve com destaque e confirmação, não trocando o default.
- **Busca no cabeçalho**, disponível de qualquer tela, atalho `/` e `Ctrl+K`, incremental sobre descrição, fornecedor, categoria, setor e observações, com X para limpar. Quando há resultado fora do filtro corrente, o sistema diz em vez de negar: *"2 em Ativos · mais 3 em Encerrados"*, clicável e **preservando o termo** — hoje o link de socorro do estado vazio descarta o `q` e leva mais longe do erro.
- **Teclado em camadas.** Camada 1, obrigatória porque é acessibilidade: Tab percorrendo linhas e ações, foco visível forte, Enter abre o painel, Esc fecha. Camada 2, barata: `/` e `?`. Camada 3 (j/k, x, paleta de comandos): só depois de medir que existem 2 ou 3 pessoas lançando em volume. Toda tecla única checa se o foco está em input, textarea ou contenteditable.

---

### B.7 O que deveria existir e hoje não existe

1. **Histórico do custo renderizado.** Toda alteração já é gravada em `Auditoria` com autor, data e diff, a página promete "alterações ficam registradas na auditoria" e nenhuma tela mostra. Seção no painel lateral: quem mudou o quê, quando, de qual valor para qual.
2. **Página do setor** (`/setores/[id]`): total, evolução dos últimos meses, maiores itens, o que vence em 90 dias, pendências. É o destino natural do clique na barra do painel e dá ao gestor a referência comparativa que hoje ele não tem.
3. **Fila de pendências com modo revisão:** painel lateral percorrido por ↑/↓, contador que desce a cada gravação ("faltam 7") e mensagem de conclusão que diz o que o trabalho comprou: *"Todos os custos têm data de renovação. O alerta de vencimento agora cobre a área inteira."*
4. **"Sem prazo determinado"** como marcação explícita (campo novo), para sair da pendência sem inventar dado falso.
5. **Aba "Excluídos (30 dias)"** com Restaurar — a âncora persistente que o toast sozinho não dá.
6. **Reconciliação declarada.** `custoPorSetor` soma lançamentos com rateio aplicado; o cabeçalho de `/custos` soma `valorMensalNormalizado` dos itens ATIVO e EM_ANALISE. Os dois vão divergir. Cada total ganha uma nota do que mede e um link para a lista equivalente. Duas telas com duas verdades e nenhuma explicação destroem a confiança nas duas.
7. **Templates de rateio nomeados** ("TI–Comercial 60/40", "Por nº de licenças"), depois rateio por driver com congelamento obrigatório do que já foi contabilizado.
8. **Colar da planilha.** Para quem tem 30 custos numa aba do Excel, importação por colagem vale mais que qualquer melhoria de formulário.
9. **Entrega da senha temporária resolvida dentro do sistema:** painel isolado, fonte monoespaçada, botão Copiar, envio por e-mail, e `ultimoAcesso` — que já é consultado em `admin/usuarios/page.tsx` e nunca renderizado — exibido como "nunca entrou / senha pendente há 3 dias / último acesso ontem".

---

## C) ETAPAS DE IMPLEMENTAÇÃO

### Etapa 1 — Fundação da resposta
**Entrega:** o sistema passa a dizer o que fez, a gravar só o que foi tocado e a poder ser desfeito.
- Toast provider e `useToast` em `src/components/avisos.tsx`, montado em `src/app/(app)/layout.tsx`.
- `src/lib/acoes.ts`: `sucesso(mensagem, { destaqueId, desfazer })`; `falha()` passando `valores` em todos os formulários.
- Remoção dos `redirect()` de sucesso em `src/app/(app)/custos/acoes.ts` e `src/app/(app)/custos/[id]/rateio/acoes.ts`.
- Novo `src/app/(app)/custos/acoes-rapidas.ts`: `alterarSituacao`, `definirDataFim`, `alterarValor`, `duplicarCusto`, `encerrarCusto`, `restaurarCusto` — cada uma escrevendo um campo, com auditoria.
- Migration de soft delete em `prisma/schema.prisma` (`ItemCusto.excluidoEm`, `excluidoPorId`) + filtro em `src/lib/consultas.ts`.
- Unificação de `NATUREZAS` entre `src/lib/opcoes.ts` e `custos/acoes.ts` + guarda de valor legado em `src/components/campos.tsx`.

**Por que primeiro:** nada acima disso é confiável enquanto uma ação não puder confirmar o que fez nem ser revertida, e edição inline é impossível sem actions de gravação parcial. Além disso, a correção da natureza CAPEX é urgente: hoje qualquer edição corrompe classificação contábil, e as etapas seguintes vão multiplicar o número de edições.

### Etapa 2 — A linha ganha mãos
**Entrega:** o pedido nº 2 do dono do produto, inteiro. Situação e data editáveis na célula, kebab sempre visível, menu de contexto, painel lateral, undo real.
- `src/app/(app)/custos/page.tsx` (server) + novos `tabela.tsx`, `linha.tsx`, `painel-custo.tsx`.
- Novos `src/components/menu.tsx` (kebab acessível + `contextmenu`) e `src/components/painel.tsx` (side peek genérico).
- Ícones novos em `src/components/icones.tsx`.
- Aba "Excluídos (30 dias)" nos filtros.

**Por que segunda:** resolve as duas tarefas mais frequentes (situação e data), que hoje custam 5 e ~90 cliques, e usa toda a infraestrutura da etapa 1 — é onde o investimento anterior vira tempo devolvido.

### Etapa 3 — O rateio que fecha sozinho
**Entrega:** o pedido nº 1 do dono do produto. Âncora residual, R$ ao lado do %, chips, maior resto, proposta cancelável e corrigível.
- Novo `src/lib/rateio.ts` — matemática pura em inteiros (âncora, maior resto, validação), sem React, testável isoladamente.
- `src/app/(app)/custos/[id]/rateio/formulario.tsx` reescrito como painel; `page.tsx` vira rota de fallback.
- `rateio/acoes.ts`: `salvarRateio`, ligação de `cancelarProposta`, aviso ao proponente, `comentario` renderizado.
- `src/app/(app)/custos/[id]/page.tsx` e `src/app/(app)/aceites.tsx`: aceite disponível também na página do custo.

**Por que terceira e não primeira:** o rateio precisa do painel lateral e do toast com desfazer da etapa 2 para ser "intuitivo e fluido"; construído antes, viraria outra tela isolada com redirect mudo. E a matemática do rateio é a parte mais delicada do sistema — merece entrar depois que o ciclo de feedback estiver estável.

### Etapa 4 — Todo número é uma porta
**Entrega:** o diagnóstico do painel vira trabalho executável.
- Filtro por setor e por pendência, estado na URL, ordenação e chips de filtro ativo em `src/app/(app)/custos/page.tsx`.
- `href` nas barras de `src/components/graficos.tsx` e nos cartões de `src/app/(app)/page.tsx` (`PendenciaResumo`, `BarrasRanqueadas`).
- Nova `src/app/(app)/setores/[id]/page.tsx`.
- Novo `src/components/busca.tsx` no cabeçalho (`src/components/nav.tsx`), com `/` e `Ctrl+K`.
- Notas de reconciliação nos totais (`src/lib/metricas/*`).

**Por que quarta:** só faz sentido levar a pessoa a uma lista filtrada depois que a lista sabe resolver a pendência ali mesmo. Invertido, o clique entrega a fila de trabalho e o formulário de 14 campos.

### Etapa 5 — Lote e fila de pendências
**Entrega:** fechamento mensal deixa de ser item a item.
- Checkbox, `Shift+clique`, barra flutuante com "12 custos selecionados · R$ 84.310,00/mês", select-all com escopo explícito (página vs. todos os filtrados).
- Ações em lote: alterar situação, alterar setor, exportar seleção.
- Modo revisão sequencial no painel com contador decrescente e mensagem de conclusão.
- Campo "sem prazo determinado" (migration) e marcação em lote.

**Por que quinta:** ação em lote sem undo, sem preview e sem contagem é a receita clássica de estrago irreversível em massa — precisa da etapa 1 madura e da seleção só faz sentido com os filtros da etapa 4.

### Etapa 6 — Memória e prevenção
**Entrega:** o sistema para de perder informação que já tem e para de criar dado sujo.
- Histórico do custo renderizado a partir de `Auditoria` (novo `src/app/(app)/custos/[id]/historico.tsx`).
- Combobox de fornecedor com detecção de similaridade em `custos/formulario.tsx` + `acharOuCriarFornecedor`.
- Divulgação progressiva e "Salvar e cadastrar outro" em `custos/novo/page.tsx`.
- Templates de rateio nomeados.
- Correções de `admin/usuarios` (painel de senha com copiar/enviar, `ultimoAcesso` exibido, confirmação no reset).

**Por que por último:** são melhorias de qualidade de dado e de memória institucional, valiosas e não bloqueantes. Cada uma entrega sozinha e nenhuma outra etapa depende delas.

---

## D) O QUE NÃO FAZER

**1. Não implementar rebalanceamento proporcional como comportamento padrão.**
É a leitura mais óbvia do pedido do dono do produto e é a errada. Mexer numa fatia recalcularia todas as outras, gerando 33,33 → 29,997 em cima de números que o gestor considerava fechados — em contexto contábil isso parece defeito, não recurso. Além disso não é reversível (fatia em 0% nunca recebe de volta) e quebra por divisão por zero quando as demais somam 0. O modelo residual entrega literalmente o "100 + 10 vira 90 + 10" pedido, sem nenhuma dessas armadilhas. Se um dia for necessário (adicionar setor a um rateio já fechado preservando a razão 3:2), entra como ação pontual com preview e desfazer, nunca como default.

**2. Não usar slider, pizza ou barra arrastável como entrada de rateio.**
Com 13 setores, uma fatia de 2% ocupa poucos pixels: inatingível no toque, impossível por teclado, invisível para leitor de tela, e frustrante para quem tem motricidade fina reduzida. A barra 100% empilhada entra como **visualização** permanente na listagem e na página do custo — reconhecer 60/40 de relance vale muito. A entrada é numérica, sempre.

**3. Não usar modal de confirmação como resposta padrão a risco.**
A eficácia do modal depende diretamente da sua raridade: exibido em toda exclusão, ele vira ruído e a pessoa clica "Sim" por reflexo, o que aumenta os erros. Confirmação também é fricção mal alocada — pune 100% das ações corretas para prevenir 2% de enganos. Aqui o modal fica reservado a lote de 5+, exclusão de setor e fechamento de competência. E nada de botão desabilitado sem mensagem: o Salvar continua clicável e explica por que recusou.

**4. Não esconder ações em hover puro, nem usar ícone sem rótulo fora do par lápis/lixeira.**
Esconder navegação corta a descoberta quase pela metade e viola a WCAG 1.4.13 — e este sistema tem leitores esporádicos (auditor, contador, substituto de férias) que não vão varrer 500 linhas com o mouse procurando affordance. Fora dos ícones universalmente reconhecidos, a previsão correta do usuário cai de 88% para 60%, e para 34% em ícones próprios do produto. Todo o resto vive no kebab, onde há texto.

**5. Não adotar "dividir igualmente" nem pesos/partes como caminho principal.**
Dividir R$ 12.400 igualmente entre 13 setores é a alocação linear arbitrária que qualquer prática de rateio de TI critica — ofereça o chip, nunca como default e nunca como o botão mais proeminente. E pesos ("2 partes") não são auditáveis: o que vai para a prestação de contas da fundação é "40%". Se o modo proporção existir um dia, o percentual efetivo continua sendo o que se persiste no lançamento contábil.

**6. Não construir mais nada que fique desligado.**
Três funcionalidades já existem sem tela: `cancelarProposta` implementada e nunca chamada, `comentario` de recusa gravado e nunca renderizado, `ultimoAcesso` consultado e nunca exibido. Nenhuma etapa deste plano é considerada concluída enquanto houver caminho de dados sem caminho de tela — dado que o sistema guarda e não mostra é dívida, não recurso.
