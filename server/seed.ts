import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./auth";
import { randomUUID } from "crypto";

export async function seedDatabase() {
  const adminUsername = process.env.ADMIN_USERNAME || "adm@v3nexus.com.br";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (process.env.NODE_ENV === "production" && !adminPassword) {
    throw new Error("ADMIN_PASSWORD precisa estar definido para sincronizar o usuário inicial em produção.");
  }

  const password = adminPassword || "raya-dev-password";
  const hashed = await hashPassword(password);
  await db.insert(users)
    .values([{ id: randomUUID(), username: adminUsername, password: hashed }])
    .onConflictDoUpdate({ target: users.username, set: { password: hashed } });
  console.log(`  Raya Studio — usuário principal sincronizado: ${adminUsername}`);
}
