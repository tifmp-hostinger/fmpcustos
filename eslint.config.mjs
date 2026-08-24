// eslint-config-next 16 já exporta flat config — FlatCompat não é necessário.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/generated/**",
      "dados/**",
      "next-env.d.ts",
      // O sistema de design é referência, não código de produção: o kit roda
      // com Babel no navegador e resolve os componentes por `window`, então
      // todo JSX ali é "não definido" para o ESLint. Lintar a fonte do desenho
      // com as regras da aplicação só produziria ruído a cada `npm run lint`.
      "design-system/**",
    ],
  },
  ...coreWebVitals,
  ...typescript,
];

export default config;
