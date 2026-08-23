import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7: a URL de conexão vive aqui, não no schema.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
