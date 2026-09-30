import "dotenv/config";
import { defineConfig, type PrismaConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
}) satisfies PrismaConfig;
