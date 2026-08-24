import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Um servidor SMTP de mentira, para conferir o resumo semanal de verdade.
 *
 * Sem isto, a única forma de saber se o e-mail sai e se ele fica legível é
 * apontar o sistema para o SMTP da FMP e mandar mensagem real para pessoas
 * reais — o que ninguém faz durante o desenvolvimento, e é por isso que o
 * primeiro e-mail de produção costuma chegar quebrado.
 *
 * Aceita qualquer autenticação, guarda o que recebeu em `dados/emails/` e
 * imprime o assunto. Nada aqui roda em produção.
 *
 *   node scripts/dev/smtp-de-mentira.mjs
 *
 *   SMTP_HOST=127.0.0.1 SMTP_PORTA=2525 SMTP_USUARIO=teste SMTP_SENHA=teste \
 *     DATABASE_URL=... npm run rotina resumo
 */
const PORTA = Number(process.env.PORTA_FALSA ?? 2525);
const DESTINO = process.env.PASTA_EMAILS ?? "dados/emails";
mkdirSync(DESTINO, { recursive: true });

let contador = 0;

const servidor = new SMTPServer({
  authOptional: true,
  disabledCommands: ["STARTTLS"],
  onAuth(_credenciais, _sessao, feito) {
    feito(null, { user: "teste" });
  },
  onData(fluxo, _sessao, feito) {
    simpleParser(fluxo)
      .then((email) => {
        contador++;
        const base = join(DESTINO, String(contador).padStart(3, "0"));
        writeFileSync(`${base}.html`, email.html || "");
        writeFileSync(`${base}.txt`, email.text || "");
        writeFileSync(
          `${base}.json`,
          JSON.stringify(
            {
              de: email.from?.text,
              para: email.to?.text,
              assunto: email.subject,
              temHtml: Boolean(email.html),
              temTexto: Boolean(email.text),
            },
            null,
            2,
          ),
        );
        console.log(`[${contador}] ${email.to?.text} — ${email.subject}`);
        feito();
      })
      .catch(feito);
  },
});

servidor.listen(PORTA, "127.0.0.1", () => {
  console.log(`SMTP de mentira em 127.0.0.1:${PORTA} · salvando em ${DESTINO}/`);
});
