import { chromium } from "playwright";

/**
 * Teste de ponta a ponta no telefone.
 *
 * Existe por causa de um bug que nenhuma das outras oito suítes pegava, porque
 * todas rodam a 1440px: um `<span class="sr-only">Ações</span>` — invisível, de
 * um pixel — era `position:absolute` dentro de uma faixa `overflow-x-auto` que
 * não era o bloco de contenção dele. O span ia parar em x=861, esticava o
 * DOCUMENTO para 862px, e num iPhone de 390px a página inteira rolava 472px de
 * lado. O cabeçalho saía da tela; a lista ficava impossível de usar.
 *
 * A regra que este arquivo protege é uma só e não tem exceção:
 *
 *   NENHUMA tela rola na horizontal. O que for largo demais rola DENTRO da
 *   própria faixa.
 *
 * Uma tabela de sete colunas legitimamente não cabe em 390px — e é por isso que
 * a faixa dela rola. O que não pode é a página inteira ir junto.
 *
 * A largura não é a de um aparelho da moda: 390px é o iPhone 13/14/15, e 360px
 * é o Android mediano. Se passa nos dois, passa no que existe.
 */
const URL = process.env.E2E_URL ?? "http://127.0.0.1:3000";
const registro = [];
function ok(nome, condicao, extra = "") {
  registro.push({ nome, condicao, extra });
  console.log(`${condicao ? "  ok  " : " FALHA"}  ${nome}${extra ? "  → " + extra : ""}`);
}

/** As telas que uma pessoa abre no telefone. Se uma delas rola de lado, falha. */
const TELAS = [
  ["o painel", "/"],
  ["a lista de custos", "/custos"],
  ["a lista agrupada", "/custos?g=categoria"],
  ["a lista em lote", "/custos?f=pendencia"],
  ["um investimento", "/custos?nat=investimento&ano=todos"],
  ["os alertas", "/alertas"],
  ["cadastrar custo", "/custos/novo"],
  ["colar da planilha", "/custos/colar"],
  ["o detalhe de um custo", "/custos/__ID__"],
  ["o rateio de um custo", "/custos/__ID__/rateio"],
  ["a administração", "/admin"],
  ["os setores", "/admin/setores"],
  ["as categorias", "/admin/categorias"],
  ["o câmbio", "/admin/cambio"],
  ["os usuários", "/admin/usuarios"],
];

const navegador = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});

/**
 * Mede sem `isMobile`.
 *
 * Com emulação de telefone ligada, o Chromium reescala a página para caber
 * quando o conteúdo transborda — foi exatamente o que a captura do usuário
 * mostrou, tudo minúsculo com um vazio à direita. Nessa condição
 * `window.innerWidth` já vem contaminado (862 em vez de 390) e a medição mente.
 * Sem `isMobile`, o transbordo aparece cru.
 */
async function medir(largura) {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(`${URL}/login`);
  await p.fill('input[name="email"]', "admin@fmp.com.br");
  await p.fill('input[name="senha"]', "teste12345");
  await p.click('form button[type="submit"]');
  await p.waitForURL((u) => !u.pathname.includes("login"), { timeout: 20000 });

  // As telas de um custo específico precisam de um id real. Sem elas a varredura
  // deixava de fora justamente o rateio, que é a tela mais densa do sistema.
  //
  // O id sai do `href`, não de clicar e esperar a navegação: num telefone há
  // botões flutuantes por cima da lista, e um teste de LAYOUT que depende de um
  // clique não interceptado falha por um motivo que não é o que ele mede.
  await p.goto(`${URL}/custos`);
  await p.waitForSelector('[data-celula="descricao"] a');
  const href = await p.locator('[data-celula="descricao"] a').first().getAttribute("href");
  const id = (href ?? "").split("/").pop();
  if (!id) throw new Error("não achei o id de um custo para varrer as telas dele");

  console.log(`\n═══ ${largura}px ═══`);
  for (const [nome, bruto] of TELAS) {
    const rota = bruto.replace("__ID__", id);
    await p.goto(URL + rota);
    await p.waitForLoadState("networkidle");
    await p.waitForTimeout(200);

    const m = await p.evaluate(() => {
      // A prova de fogo: tentar rolar de lado. Se rolou, rolou.
      window.scrollTo(2000, 0);
      const rolou = Math.round(window.scrollX);
      window.scrollTo(0, 0);

      // E quem seria o culpado, para o erro dizer onde mexer.
      const janela = document.documentElement.clientWidth;
      const culpados = [...document.querySelectorAll("body *")]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          if (r.width === 0 || r.right <= janela + 1) return false;
          // Um filho dentro de uma faixa que rola está fazendo o trabalho dele.
          for (let a = e.parentElement; a; a = a.parentElement) {
            const ox = getComputedStyle(a).overflowX;
            if (ox === "auto" || ox === "scroll" || ox === "hidden") {
              if (getComputedStyle(a).position !== "static") return false;
            }
          }
          return true;
        })
        .slice(0, 4)
        .map((e) => {
          const c =
            typeof e.className === "string"
              ? e.className.trim().split(/\s+/).slice(0, 3).join(".")
              : "";
          return `${e.tagName.toLowerCase()}${c ? "." + c : ""}=${Math.round(e.getBoundingClientRect().width)}px`;
        });
      return { rolou, doc: document.documentElement.scrollWidth, janela, culpados };
    });

    ok(
      `${nome} não rola de lado`,
      m.rolou === 0,
      m.rolou === 0
        ? ""
        : `rolou ${m.rolou}px · documento ${m.doc} · ${m.culpados.join(" ") || "sem culpado óbvio"}`,
    );
  }

  // A faixa da tabela DEVE rolar por dentro: é a exceção que prova a regra.
  await p.goto(`${URL}/custos`);
  await p.waitForSelector("table");
  const faixa = await p.evaluate(() => {
    const d = document.querySelector("table")?.closest("div");
    return d ? { rola: d.scrollWidth > d.clientWidth, client: d.clientWidth } : null;
  });
  ok(
    "a faixa da tabela rola por dentro, e não a página",
    faixa !== null && faixa.client <= largura,
    faixa ? `faixa ${faixa.client}px em janela de ${largura}px` : "faixa não encontrada",
  );

  await ctx.close();
}

await medir(390);
await medir(360);

const falhas = registro.filter((r) => !r.condicao);
console.log(
  `\n${falhas.length === 0 ? "✓" : "✗"} ${registro.length - falhas.length}/${registro.length} verificações passaram`,
);
if (falhas.length)
  falhas.forEach((f) => console.log(`   ✗ ${f.nome}${f.extra ? " → " + f.extra : ""}`));
await navegador.close();
process.exit(falhas.length === 0 ? 0 : 1);
