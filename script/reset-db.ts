import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("Erro: DATABASE_URL nao definido no arquivo .env");
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production" && process.env.CONFIRM_RESET !== "true") {
    console.error("CUIDADO: voce esta tentando resetar o banco em PRODUCAO.");
    console.error("Para prosseguir, rode com CONFIRM_RESET=true.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log("Conectando ao banco de dados...");
    await pool.query("DROP SCHEMA public CASCADE;");
    await pool.query("CREATE SCHEMA public;");
    console.log("Banco resetado com sucesso.");
    console.log("Proximos passos:");
    console.log("  1. npm run db:push");
    console.log("  2. npm run dev");
  } catch (error) {
    console.error("Erro ao resetar banco:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
