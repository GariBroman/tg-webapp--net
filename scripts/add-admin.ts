import { db } from "../src/server/db";
import { users } from "../src/server/db/schema";
import { eq } from "drizzle-orm";
import { webcrypto as crypto } from "crypto";

async function addAdmin() {
  // Проверяем существует ли пользователь
  let user = await db.query.users.findFirst({
    where: eq(users.telegramId, "5980372600"),
  });

  if (user) {
    // Если пользователь существует, обновляем его роль
    console.log("Updating existing user to admin...");
    await db.update(users)
      .set({ role: "admin" })
      .where(eq(users.id, user.id));
  } else {
    // Если пользователь не существует, создаем нового админа
    console.log("Creating new admin user...");
    user = await db.insert(users).values({
      id: crypto.randomUUID(),
      telegramId: "5980372600",
      chatId: "5980372600",
      name: "Max",
      role: "admin"
    }).returning().then(users => users[0]);
  }

  console.log("Admin user updated/created successfully:", user);
}

addAdmin().catch(console.error); 