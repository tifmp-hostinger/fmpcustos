"use client";

import { useActionState, useState } from "react";
import { atualizarUsuario, criarUsuario, resetarSenha } from "./acoes";
import { Aviso, Campo, Enviar, Selecao } from "@/components/campos";
import { useAviso } from "@/components/avisos";
import { PAPEIS } from "@/lib/opcoes";
import { IconeCheck, IconeCopiar, IconeFechar } from "@/components/icones";
import type { Resultado, SenhaTemporaria } from "@/lib/acoes";

type Opcao = { valor: string; rotulo: string };

export function NovoUsuario({ setores }: { setores: Opcao[] }) {
  const [senha, setSenha] = useState<SenhaTemporaria | null>(null);
  const [resultado, acao] = useActionState<Resultado | null, FormData>(async (anterior, dados) => {
    const r = await criarUsuario(anterior, dados);
    if (r.ok && r.senhaTemporaria) setSenha(r.senhaTemporaria);
    return r;
  }, null);

  return (
    <div className="space-y-3">
      <form
        action={acao}
        className="space-y-4 rounded-xl border border-[var(--rule)] bg-[var(--surface)] p-5"
      >
        <h2 className="text-sm font-semibold tracking-[0.11em] text-[var(--ink-3)] uppercase">
          Novo usuário
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome" nome="nome" obrigatorio placeholder="Nome completo" />
          <Campo
            rotulo="E-mail"
            nome="email"
            tipo="email"
            obrigatorio
            placeholder="pessoa@fmp.com.br"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Selecao rotulo="Perfil" nome="papel" opcoes={PAPEIS} valor="GESTOR_SETOR" obrigatorio />
          <Selecao
            rotulo="Setor"
            nome="setorId"
            opcoes={setores}
            vazio="Sem setor (só para Admin e Controladoria)"
          />
        </div>
        {resultado && !resultado.ok && <Aviso resultado={resultado} />}
        <Enviar>Criar usuário</Enviar>
      </form>

      {senha && <PainelDeSenha senha={senha} aoFechar={() => setSenha(null)} />}
    </div>
  );
}

/**
 * A entrega da senha temporária.
 *
 * Antes, ela vinha no meio de uma frase de aviso. Quem criava o usuário tinha
 * que selecionar caracteres embolados num parágrafo, e o aviso sumia sozinho
 * em oito segundos — se a pessoa piscasse, a única saída era resetar de novo.
 *
 * Aqui a senha é o conteúdo, não um detalhe da frase: monoespaçada, espaçada,
 * com botão de copiar e com um rascunho de e-mail pronto. E ela **não some
 * sozinha** — só sai quando o admin diz que já repassou, porque só ele sabe
 * quando isso aconteceu.
 */
function PainelDeSenha({ senha, aoFechar }: { senha: SenhaTemporaria; aoFechar: () => void }) {
  const avisar = useAviso();
  const [copiado, setCopiado] = useState(false);

  const corpoDoEmail = [
    `Olá, ${senha.nome.split(" ")[0]}.`,
    "",
    "Seu acesso à plataforma de custos da FMP está pronto.",
    "",
    `E-mail: ${senha.email}`,
    `Senha temporária: ${senha.senha}`,
    "",
    "No primeiro acesso o sistema pede que você defina uma senha própria.",
  ].join("\n");

  async function copiar(texto: string, oQue: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
      avisar({ mensagem: `${oQue} copiado.`, tom: "neutro", duracao: 3000 });
    } catch {
      // Área de transferência bloqueada (contexto sem HTTPS, permissão negada):
      // a senha continua na tela para ser selecionada à mão, que é o que
      // importa. Falhar em silêncio aqui faria a pessoa colar o nada.
      avisar({
        mensagem: "O navegador não deixou copiar. Selecione a senha na tela.",
        tom: "erro",
      });
    }
  }

  return (
    <section
      role="status"
      className="rounded-xl border-2 border-[var(--accent)]/40 bg-[var(--accent)]/[0.04] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold tracking-[0.11em] text-[var(--accent)] uppercase">
            Senha temporária de {senha.nome}
          </h3>
          <p className="mt-1 text-[12px] text-[var(--ink-3)]">
            Aparece uma vez só. Repasse por um canal seguro — ela será trocada no primeiro acesso.
          </p>
        </div>
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Já repassei — fechar"
          title="Já repassei"
          className="-mt-1 -mr-1 shrink-0 rounded-lg p-1.5 text-[var(--ink-3)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
        >
          <IconeFechar className="size-[18px]" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* `select-all` para um clique triplo pegar a senha inteira, e
            `tracking-wider` para não confundir l com 1 nem O com 0 na leitura. */}
        <code className="flex-1 rounded-lg border border-[var(--rule)] bg-[var(--ground)] px-3 py-2.5 font-mono text-[16px] tracking-wider select-all">
          {senha.senha}
        </code>
        <button
          type="button"
          onClick={() => copiar(senha.senha, "Senha")}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2.5 text-[13px] font-semibold text-white"
        >
          {copiado ? <IconeCheck className="size-4" /> : <IconeCopiar className="size-4" />}
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[12.5px]">
        <button
          type="button"
          onClick={() => copiar(corpoDoEmail, "Texto do e-mail")}
          className="text-[var(--ink-2)] underline-offset-2 hover:text-[var(--accent)] hover:underline"
        >
          Copiar o e-mail pronto
        </button>
        <a
          href={`mailto:${senha.email}?subject=${encodeURIComponent("Seu acesso à plataforma de custos da FMP")}&body=${encodeURIComponent(corpoDoEmail)}`}
          className="text-[var(--ink-2)] no-underline underline-offset-2 hover:text-[var(--accent)] hover:underline"
        >
          Abrir no cliente de e-mail
        </a>
        <button
          type="button"
          onClick={aoFechar}
          className="ml-auto font-medium text-[var(--ink-3)] underline-offset-2 hover:underline"
        >
          Já repassei
        </button>
      </div>
    </section>
  );
}

export function EditarUsuario({
  usuario,
  setores,
}: {
  usuario: {
    id: string;
    nome: string;
    email: string;
    papel: string;
    setorId: string | null;
    ativo: boolean;
    /** ISO, ou null quando a pessoa nunca entrou. */
    ultimoAcesso: string | null;
    precisaTrocarSenha: boolean;
    criadoEm: string;
  };
  setores: Opcao[];
}) {
  const [resultado, acao] = useActionState<Resultado | null, FormData>(atualizarUsuario, null);
  const [senha, setSenha] = useState<SenhaTemporaria | null>(null);
  const [resetando, setResetando] = useState(false);
  const [resultadoSenha, acaoSenha] = useActionState<Resultado | null, FormData>(
    async (anterior, dados) => {
      const r = await resetarSenha(anterior, dados);
      if (r.ok && r.senhaTemporaria) {
        setSenha(r.senhaTemporaria);
        setResetando(false);
      }
      return r;
    },
    null,
  );

  const situacao = descreverAcesso(usuario);

  return (
    <details className="rounded-xl border border-[var(--rule)] bg-[var(--surface)]">
      <summary className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5">
        <span>
          <span className="font-medium">{usuario.nome}</span>
          <span className="block text-[12px] text-[var(--ink-3)]">
            {usuario.email}
            {/* O acesso já era consultado e nunca exibido. É o que responde
                "criei o usuário e a pessoa nunca entrou — a senha se perdeu?" */}
            <span className={situacao.alerta ? "text-[var(--accent)]" : ""}>
              {" "}
              · {situacao.texto}
            </span>
          </span>
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${
            usuario.ativo
              ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
              : "bg-[var(--accent)]/12 text-[var(--accent)]"
          }`}
        >
          {usuario.ativo ? "Ativo" : "Inativo"}
        </span>
      </summary>

      <div className="space-y-5 border-t border-[var(--rule)] px-5 py-5">
        <form action={acao} className="space-y-4">
          <input type="hidden" name="id" value={usuario.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Selecao
              rotulo="Perfil"
              nome="papel"
              opcoes={PAPEIS}
              valor={usuario.papel}
              obrigatorio
            />
            <Selecao
              rotulo="Setor"
              nome="setorId"
              opcoes={setores}
              valor={usuario.setorId}
              vazio="Sem setor (só para Admin e Controladoria)"
            />
          </div>
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" name="ativo" defaultChecked={usuario.ativo} className="size-4" />
            Usuário ativo — desmarque para revogar o acesso sem apagar o histórico
          </label>
          <Aviso resultado={resultado} />
          <Enviar>Salvar</Enviar>
        </form>

        <div className="border-t border-[var(--rule)] pt-4">
          {senha ? (
            <PainelDeSenha senha={senha} aoFechar={() => setSenha(null)} />
          ) : resetando ? (
            <form action={acaoSenha} className="space-y-3">
              <input type="hidden" name="id" value={usuario.id} />
              <p className="text-[13px] leading-snug text-[var(--ink-2)]">
                Resetar derruba a sessão de <strong>{usuario.nome}</strong> na hora e a deixa sem
                acesso até você repassar a senha nova. A senha atual não é recuperável.
              </p>
              <Campo
                rotulo="Digite RESETAR para confirmar"
                nome="confirmacao"
                placeholder="RESETAR"
                autoFocus
                erro={
                  resultadoSenha && !resultadoSenha.ok && resultadoSenha.campo === "confirmacao"
                    ? resultadoSenha.erro
                    : undefined
                }
              />
              {resultadoSenha && !resultadoSenha.ok && !resultadoSenha.campo && (
                <Aviso resultado={resultadoSenha} />
              )}
              <div className="flex items-center gap-3">
                <Enviar>Resetar senha</Enviar>
                <button
                  type="button"
                  onClick={() => setResetando(false)}
                  className="text-[13px] text-[var(--ink-3)] hover:underline"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setResetando(true)}
              className="text-sm text-[var(--accent)] underline underline-offset-4"
            >
              Gerar nova senha temporária
            </button>
          )}
        </div>
      </div>
    </details>
  );
}

/**
 * Traduz as datas de acesso na frase que o admin precisa ler.
 *
 * "Nunca entrou" é a informação que importa: um usuário criado há três dias
 * que nunca acessou quase sempre significa senha temporária perdida no meio
 * do caminho, e é a hora de gerar outra.
 */
function descreverAcesso(u: {
  ultimoAcesso: string | null;
  precisaTrocarSenha: boolean;
  criadoEm: string;
}): { texto: string; alerta: boolean } {
  const dias = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

  if (!u.ultimoAcesso) {
    const desde = dias(u.criadoEm);
    if (desde >= 3) {
      return {
        texto: `nunca entrou — criado há ${desde} dias`,
        alerta: true,
      };
    }
    return { texto: "nunca entrou", alerta: false };
  }

  const desde = dias(u.ultimoAcesso);
  const quando =
    desde === 0 ? "hoje" : desde === 1 ? "ontem" : `há ${desde} ${desde === 1 ? "dia" : "dias"}`;
  return {
    texto: u.precisaTrocarSenha ? `entrou ${quando}, senha ainda temporária` : `entrou ${quando}`,
    alerta: false,
  };
}
