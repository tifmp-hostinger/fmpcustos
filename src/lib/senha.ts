import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// promisify perde a sobrecarga com opções, então o wrapper é manual.
function derivar(
  senha: string,
  salt: Buffer,
  tamanho: number,
  opcoes: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha, salt, tamanho, opcoes, (erro, chave) => (erro ? reject(erro) : resolve(chave)));
  });
}

// Parâmetros do scrypt. N=16384 é o padrão recomendado para uso interativo.
const N = 16384;
const r = 8;
const p = 1;
const TAMANHO_CHAVE = 64;

/**
 * Gera o hash de uma senha no formato `scrypt$N$r$p$salt$hash`.
 * Usa apenas node:crypto — sem dependência nativa para compilar na imagem Alpine.
 */
export async function gerarHashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const derivada = await derivar(senha.normalize("NFKC"), salt, TAMANHO_CHAVE, { N, r, p });
  return ["scrypt", N, r, p, salt.toString("base64url"), derivada.toString("base64url")].join("$");
}

/** Compara em tempo constante. Retorna false para qualquer hash malformado. */
export async function conferirSenha(senha: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;

  const partes = hash.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;

  const [, nTexto, rTexto, pTexto, saltB64, hashB64] = partes;
  const custo = { N: Number(nTexto), r: Number(rTexto), p: Number(pTexto) };
  if (!Number.isFinite(custo.N) || !Number.isFinite(custo.r) || !Number.isFinite(custo.p)) {
    return false;
  }

  const esperado = Buffer.from(hashB64, "base64url");
  let derivada: Buffer;
  try {
    derivada = await derivar(
      senha.normalize("NFKC"),
      Buffer.from(saltB64, "base64url"),
      esperado.length,
      custo,
    );
  } catch {
    return false;
  }

  return derivada.length === esperado.length && timingSafeEqual(derivada, esperado);
}

/** Regras mínimas de senha. Retorna null quando aceita. */
export function validarSenha(senha: string): string | null {
  if (senha.length < 10) return "A senha precisa ter ao menos 10 caracteres.";
  if (!/[a-zA-Z]/.test(senha)) return "A senha precisa ter ao menos uma letra.";
  if (!/[0-9]/.test(senha)) return "A senha precisa ter ao menos um número.";
  return null;
}

/** Senha temporária legível, para o admin repassar a quem está criando. */
export function gerarSenhaTemporaria(): string {
  const alfabeto = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(14);
  let saida = "";
  for (const b of bytes) saida += alfabeto[b % alfabeto.length];
  return `${saida}7a`;
}
