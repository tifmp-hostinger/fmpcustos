import{randomUUID as U,randomBytes as B,scrypt as S}from"node:crypto";import pg from"pg";
const[,,e,s]=process.argv,u=process.env.DATABASE_URL;
if(!u){console.error("DATABASE_URL nao definida");process.exit(1)}
const c=new pg.Client({connectionString:u});await c.connect();
const{rows:L}=await c.query(`SELECT c.email,u.papel,u.ativo,(u."senhaHash" IS NOT NULL) AS s,u."precisaTrocarSenha" AS t,u."ultimoAcesso" AS a FROM usuario u JOIN colaborador c ON c.id=u."colaboradorId" ORDER BY u."criadoEm"`);
console.log("\n=====================================================");
console.log("USUARIOS NO BANCO: "+L.length);
for(const r of L)console.log(`  ${r.email} | ${r.papel} | ativo=${r.ativo} | tem_senha=${r.s} | troca_1o=${r.t} | ultimo=${r.a??"nunca"}`);
if(!L.length)console.log("  Nenhum. E por isso que o login recusa qualquer senha.");
console.log("=====================================================");
if(!e||!s){console.log("\nPara criar/redefinir:\n  node /app/a.mjs voce@fmp.com.br 'SuaSenhaForte2026'\n");await c.end();process.exit(0)}
if(s.length<10||!/[a-zA-Z]/.test(s)||!/[0-9]/.test(s)){console.error("\nSenha recusada: min 10 caracteres, com letra e numero.\n");await c.end();process.exit(1)}
const m=e.trim().toLowerCase(),sa=B(16);
const k=await new Promise((o,x)=>S(s.normalize("NFKC"),sa,64,{N:16384,r:8,p:1},(g,v)=>g?x(g):o(v)));
const h=["scrypt",16384,8,1,sa.toString("base64url"),k.toString("base64url")].join("$");
const{rows:X}=await c.query(`SELECT c.id AS ci,u.id AS ui FROM colaborador c LEFT JOIN usuario u ON u."colaboradorId"=c.id WHERE c.email=$1`,[m]);
let acao;
if(X[0]?.ui){await c.query(`UPDATE usuario SET "senhaHash"=$1,"precisaTrocarSenha"=false,ativo=true,papel='ADMIN',"atualizadoEm"=now() WHERE id=$2`,[h,X[0].ui]);acao="Senha redefinida (ADMIN garantido)."}
else if(X[0]){await c.query(`INSERT INTO usuario (id,"colaboradorId",papel,ativo,"senhaHash","precisaTrocarSenha","criadoEm","atualizadoEm") VALUES ($1,$2,'ADMIN',true,$3,false,now(),now())`,[U(),X[0].ci,h]);acao="Colaborador existia sem acesso; ADMIN criado."}
else{const i=U();await c.query(`INSERT INTO colaborador (id,nome,email,ativo,"criadoEm","atualizadoEm") VALUES ($1,$2,$3,true,now(),now())`,[i,m.split("@")[0],m]);await c.query(`INSERT INTO usuario (id,"colaboradorId",papel,ativo,"senhaHash","precisaTrocarSenha","criadoEm","atualizadoEm") VALUES ($1,$2,'ADMIN',true,$3,false,now(),now())`,[U(),i,h]);acao="Usuario ADMIN criado do zero."}
console.log("\n=====================================================");console.log(acao);console.log("  E-mail: "+m);console.log("  Senha:  a que voce informou (sem troca obrigatoria)");console.log("=====================================================\n");
await c.end();
