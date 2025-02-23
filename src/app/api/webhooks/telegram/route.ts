import { eq } from "drizzle-orm";
import type { Context } from "telegraf";
import type { Update } from "@telegraf/types";
import { getBaseUrl } from "~/lib/utils";
import { db } from "~/server/db";
import { products, users } from "~/server/db/schema";
import { bot } from "~/server/telegram";
import { webcrypto as crypto } from "crypto";
import { Markup } from "telegraf";
import { env } from "~/env.js";

const SECRET_HASH = "32e58fbahey833349df3383dc910e181";

// Состояние для добавления товара
interface ProductState {
  name?: string;
  price?: string;
  imageUrl?: string;
  description?: string;
  stock?: number;
  step: 'name' | 'price' | 'image' | 'description' | 'stock' | 'confirm' | 'edit';
  editField?: string;
  editProductId?: number;
}

const productStates = new Map<number, ProductState>();

// Функция для логирования с timestamp
function logWithTime(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Helper function to check if user is admin
async function isAdmin(ctx: Context): Promise<boolean> {
  if (!ctx.from?.id) {
    logWithTime("Error: Could not identify user in isAdmin check");
    await ctx.reply("Error: Could not identify user");
    return false;
  }

  const telegramId = ctx.from.id.toString();
  logWithTime(`Checking admin status for user ${telegramId}`);
  
  // Check if user's Telegram ID is in the admin list
  const adminIds = env.ADMIN_TELEGRAM_ID.split(',').map(id => id.trim());
  const isUserAdmin = adminIds.includes(telegramId);
  
  logWithTime(`Admin check result for ${telegramId}:`, { isAdmin: isUserAdmin });

  if (!isUserAdmin) {
    logWithTime(`User ${telegramId} is not admin`);
    await ctx.reply("Unauthorized: Only admins can manage products");
    return false;
  }

  // Ensure admin exists in database
  let user = await db.query.users.findFirst({
    where: eq(users.telegramId, telegramId),
  });

  if (!user) {
    // Create admin user if doesn't exist
    user = await db.insert(users).values({
      id: crypto.randomUUID(),
      telegramId: telegramId,
      chatId: ctx.chat?.id?.toString() ?? telegramId,
      name: ctx.from.first_name,
      role: "admin"
    }).returning().then(users => users[0]);
    logWithTime("Created new admin user", user);
  } else if (user.role !== "admin") {
    // Update user role to admin if needed
    await db.update(users)
      .set({ role: "admin" })
      .where(eq(users.id, user.id));
    logWithTime("Updated user role to admin", { userId: user.id });
  }

  return true;
}

// Функция для начала процесса добавления товара
async function startAddProduct(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  productStates.set(userId, { step: 'name' });
  
  await ctx.reply("Давайте добавим новый товар! Для начала, отправьте название товара:", 
    Markup.keyboard([['❌ Отменить']])
    .oneTime()
    .resize()
  );
}

// Функция для обработки шагов добавления товара
async function handleProductStep(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId || !ctx.message || !('text' in ctx.message)) return;

  const state = productStates.get(userId);
  if (!state) return;

  logWithTime("[ADD_PRODUCT] Processing step", { userId, state, messageText: ctx.message.text });

  if (ctx.message.text === '❌ Отменить') {
    productStates.delete(userId);
    await ctx.reply('Добавление товара отменено',
      Markup.removeKeyboard()
    );
    return;
  }

  switch (state.step) {
    case 'name':
      state.name = ctx.message.text;
      state.step = 'price';
      await ctx.reply('Отлично! Теперь укажите цену товара (только число):', 
        Markup.keyboard([['❌ Отменить']])
        .oneTime()
        .resize()
      );
      break;

    case 'price':
      const price = parseInt(ctx.message.text);
      if (isNaN(price) || price <= 0) {
        await ctx.reply('Пожалуйста, укажите корректную цену (положительное число):', 
          Markup.keyboard([['❌ Отменить']])
          .oneTime()
          .resize()
        );
        return;
      }
      state.price = price.toString();
      state.step = 'image';
      await ctx.reply('Теперь отправьте фотографию товара:', 
        Markup.keyboard([['❌ Отменить']])
        .oneTime()
        .resize()
      );
      break;

    case 'image':
      // Этот шаг обрабатывается в обработчике фото
      await ctx.reply('Пожалуйста, отправьте фотографию:', 
        Markup.keyboard([['❌ Отменить']])
        .oneTime()
        .resize()
      );
      break;

    case 'description':
      state.description = ctx.message.text;
      state.step = 'stock';
      await ctx.reply('Укажите количество товара (или 0 для безлимитного):', 
        Markup.keyboard([['❌ Отменить']])
        .oneTime()
        .resize()
      );
      break;

    case 'stock':
      const stock = parseInt(ctx.message.text);
      if (isNaN(stock) || stock < 0) {
        await ctx.reply('Пожалуйста, укажите корректное количество (положительное число или 0):', 
          Markup.keyboard([['❌ Отменить']])
          .oneTime()
          .resize()
        );
        return;
      }
      state.stock = stock === 0 ? 999999 : stock;
      state.step = 'confirm';
      await ctx.reply(
        `Проверьте данные товара:\n\nНазвание: ${state.name}\nЦена: ${state.price}\nОписание: ${state.description}\nКоличество: ${state.stock === 999999 ? "Безлимитно" : state.stock}\n\nВсё верно?`,
        Markup.keyboard([['✅ Подтвердить', '❌ Отменить']])
        .oneTime()
        .resize()
      );
      break;

    case 'confirm':
      if (ctx.message.text === '✅ Подтвердить' && state.name && state.price && state.imageUrl) {
        logWithTime("[ADD_PRODUCT] Adding new product", { 
          name: state.name,
          price: state.price,
          imageUrl: state.imageUrl,
          description: state.description,
          stock: state.stock
        });

        try {
          const product = await db.insert(products).values({
            name: state.name,
            price: state.price,
            images: [state.imageUrl],
            description: state.description || null,
            stock: state.stock || 999999,
            hidden: false,
            instantBuy: true,
            discount: "0"
          }).returning();

          if (!product[0]) {
            logWithTime("[ADD_PRODUCT] Error: Product not created");
            await ctx.reply(
              'Ошибка при добавлении товара: товар не был создан',
              Markup.removeKeyboard()
            );
            return;
          }

          logWithTime("[ADD_PRODUCT] Product added successfully", product[0]);
          await ctx.reply(
            `✅ Товар успешно добавлен!\n\nID: ${product[0].id}\nНазвание: ${state.name}\nЦена: ${state.price}\nКоличество: ${state.stock === 999999 ? "Безлимитно" : state.stock}`,
            Markup.removeKeyboard()
          );
        } catch (error) {
          logWithTime("[ADD_PRODUCT] Error adding product", error);
          await ctx.reply(
            `Ошибка при добавлении товара: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
            Markup.removeKeyboard()
          );
        }
        productStates.delete(userId);
      }
      break;

    case 'edit':
      if (!state.editField || !state.editProductId) return;

      try {
        const updateData: Partial<typeof products.$inferInsert> = {};
        
        switch (state.editField) {
          case 'name':
            updateData.name = ctx.message.text;
            break;
          case 'price':
            const price = parseInt(ctx.message.text);
            if (isNaN(price) || price <= 0) {
              await ctx.reply('Пожалуйста, укажите корректную цену (положительное число)');
              return;
            }
            updateData.price = price.toString();
            break;
          case 'stock':
            const stock = parseInt(ctx.message.text);
            if (isNaN(stock) || stock < 0) {
              await ctx.reply('Пожалуйста, укажите корректное количество (положительное число или 0 для безлимитного)');
              return;
            }
            updateData.stock = stock === 0 ? 999999 : stock;
            break;
          case 'description':
            updateData.description = ctx.message.text;
            break;
          case 'hidden':
            updateData.hidden = ctx.message.text.toLowerCase() === 'true';
            break;
        }

        logWithTime("[EDIT] Updating product", { productId: state.editProductId, updateData });
        
        const updated = await db.update(products)
          .set(updateData)
          .where(eq(products.id, state.editProductId))
          .returning();

        if (!updated[0]) {
          await ctx.reply('Ошибка: товар не найден');
          return;
        }

        logWithTime("[EDIT] Product updated successfully", updated[0]);
        
        await ctx.reply(
          `✅ Товар успешно обновлен!\n\nID: ${updated[0].id}\nНазвание: ${updated[0].name ?? "Без названия"}\nЦена: ${updated[0].price}\nКоличество: ${updated[0].stock === 999999 ? "Безлимитно" : updated[0].stock}`,
          Markup.removeKeyboard()
        );
      } catch (error) {
        logWithTime("[EDIT] Error updating product", error);
        await ctx.reply(
          `Ошибка при обновлении товара: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
          Markup.removeKeyboard()
        );
      }
      
      productStates.delete(userId);
      break;
  }
}

// Admin commands
bot.command("add_product", async (ctx) => {
  if (!await isAdmin(ctx)) return;
  await startAddProduct(ctx);
});

bot.command("edit_product", async (ctx) => {
  if (!await isAdmin(ctx)) return;

  const args = ctx.message.text.split(" ").slice(1);
  if (args.length < 3) {
    await ctx.reply(
      "Usage: /edit_product <id> <field> <value>\nAvailable fields: name, price, imageUrl, description, hidden\nExample: /edit_product 1 price 2000"
    );
    return;
  }

  try {
    const idStr = args[0] || "";
    const fieldName = args[1];
    const value = args.slice(2).join(" ");
    const productId = parseInt(idStr);

    if (isNaN(productId)) {
      await ctx.reply("Invalid product ID");
      return;
    }

    let updateData: Partial<typeof products.$inferInsert> = {};
    switch (fieldName) {
      case "name":
        if (!value) {
          await ctx.reply("Name cannot be empty");
          return;
        }
        updateData.name = value;
        break;
      case "price":
        const price = parseInt(value);
        if (isNaN(price)) {
          await ctx.reply("Invalid price value");
          return;
        }
        updateData.price = price.toString();
        break;
      case "imageUrl":
        if (!value) {
          await ctx.reply("Image URL cannot be empty");
          return;
        }
        updateData.images = [value];
        break;
      case "description":
        updateData.description = value || null;
        break;
      case "hidden":
        updateData.hidden = value === "true";
        break;
      default:
        await ctx.reply("Invalid field. Available fields: name, price, imageUrl, description, hidden");
        return;
    }

    const product = await db.update(products)
      .set(updateData)
      .where(eq(products.id, productId))
      .returning();

    if (!product[0]) {
      await ctx.reply("Product not found");
      return;
    }

    await ctx.reply(`Product updated successfully:\nID: ${product[0].id}\nField: ${fieldName}\nNew value: ${value}`);
  } catch (error) {
    await ctx.reply("Error updating product: " + (error as Error).message);
  }
});

bot.command("delete_product", async (ctx) => {
  if (!await isAdmin(ctx)) return;

  const args = ctx.message.text.split(" ").slice(1);
  if (args.length !== 1) {
    await ctx.reply("Usage: /delete_product <id>\nExample: /delete_product 1");
    return;
  }

  try {
    const idStr = args[0] || "";
    const id = parseInt(idStr);
    if (isNaN(id)) {
      await ctx.reply("Invalid product ID");
      return;
    }

    const deleted = await db.delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!deleted[0]) {
      await ctx.reply("Product not found");
      return;
    }

    await ctx.reply(`Product deleted successfully:\nID: ${deleted[0].id}\nName: ${deleted[0].name || "Unnamed product"}`);
  } catch (error) {
    await ctx.reply("Error deleting product: " + (error as Error).message);
  }
});

bot.command("list_products", async (ctx) => {
  if (!await isAdmin(ctx)) return;

  try {
    const allProducts = await db.select().from(products);
    const productList = allProducts.map(p => {
      const name = p.name ?? "Unnamed product";
      const productDescription = p.description ?? name;
      return `ID: ${p.id}\nName: ${name}\nPrice: ${p.price}\nHidden: ${p.hidden}\n${productDescription ? `Description: ${productDescription}\n` : ""}`;
    }).join("\n---\n");

    if (allProducts.length === 0) {
      await ctx.reply("No products found");
      return;
    }

    await ctx.reply(`Products list:\n\n${productList}`);
  } catch (error) {
    await ctx.reply("Error listing products: " + (error as Error).message);
  }
});

bot.command("help_admin", async (ctx) => {
  if (!await isAdmin(ctx)) return;

  await ctx.reply(`Available admin commands:

/add_product
Добавить новый товар (пошаговый процесс)

/edit_product <id> <field> <value>
Edit product field (name, price, imageUrl, description, hidden)

/delete_product <id>
Delete a product

/list_products
Show all products

/help_admin
Show this help message`);
});

// Regular bot commands
bot.command("start", async (ctx) => {
  logWithTime("[START] Command handler triggered", {
    updateType: ctx.updateType,
    command: ctx.message?.text,
    from: ctx.from,
    chat: ctx.chat
  });

  try {
    logWithTime("[START] Checking chat ID");
    const user = await checkChatId(ctx);
    
    if (!user) {
      logWithTime("[START] No user returned from checkChatId");
      return;
    }
    
    const isUserAdmin = user.role === "admin";
    logWithTime("[START] User role check", { 
      userId: user.id,
      telegramId: user.telegramId,
      role: user.role, 
      isAdmin: isUserAdmin 
    });
    
    if (isUserAdmin) {
      logWithTime("[START] Preparing admin welcome message");
      try {
        const replyResult = await ctx.reply("Добро пожаловать в панель администратора!", 
          Markup.keyboard([
            ["🛍 Открыть магазин"],
            ["➕ Добавить товар", "📋 Список товаров"],
            ["✏️ Редактировать товар", "❓ Помощь"]
          ])
          .resize()
        );
        logWithTime("[START] Admin welcome message sent successfully", { replyResult });
      } catch (error) {
        logWithTime("[START] Error sending admin welcome message", { 
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined 
        });
        throw error;
      }
      return;
    }

    logWithTime("[START] Preparing regular user welcome message");
    try {
      const baseUrl = getBaseUrl();
      logWithTime("[START] Generated base URL", { baseUrl });
      
      const replyResult = await ctx.reply("Добро пожаловать в наш магазин! 🎉\nПодпишитесь на наш канал, чтобы быть в курсе всех новостей и обновлений!", 
        Markup.keyboard([
          ["📢 Наш канал"],
          ["🛍 Открыть магазин"]
        ])
        .resize()
      );
      logWithTime("[START] Regular user welcome message sent successfully", { replyResult });
    } catch (error) {
      logWithTime("[START] Error sending regular user welcome message", { 
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined 
      });
      throw error;
    }
  } catch (error) {
    logWithTime("[START] Critical error in command handler", { 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined 
    });
    throw error;
  }
});

// Обработчик фотографий
bot.on("photo", async (ctx) => {
  const userId = ctx.from?.id;
  logWithTime("[PHOTO] Received photo", { userId, hasPhoto: !!ctx.message?.photo });
  
  if (!userId || !ctx.message?.photo) {
    logWithTime("[PHOTO] Missing userId or photo");
    return;
  }

  const state = productStates.get(userId);
  logWithTime("[PHOTO] Current state", { state });
  
  if (!state) {
    logWithTime("[PHOTO] No state found for user");
    return;
  }

  if (state.step !== 'image' && !(state.step === 'edit' && state.editField === 'image')) {
    logWithTime("[PHOTO] Invalid step for photo", { step: state.step, editField: state.editField });
    return;
  }

  try {
    const photos = ctx.message.photo;
    logWithTime("[PHOTO] Available photo sizes", photos);
    
    const photo = photos[photos.length - 1]; // Берем фото максимального размера
    if (!photo) {
      logWithTime("[PHOTO] No photo found in message");
      await ctx.reply('Ошибка при загрузке фото: фото не найдено');
      return;
    }
    
    logWithTime("[PHOTO] Selected photo", photo);
    const fileUrl = await ctx.telegram.getFileLink(photo.file_id);
    const imageUrl = fileUrl.toString();
    logWithTime("[PHOTO] Generated file URL", { fileUrl: imageUrl });

    if (state.step === 'edit' && state.editField === 'image' && state.editProductId) {
      // Обновляем фото существующего товара
      logWithTime("[PHOTO] Updating product image", { productId: state.editProductId, imageUrl });
      
      const updated = await db.update(products)
        .set({ images: [imageUrl] })
        .where(eq(products.id, state.editProductId))
        .returning();

      if (!updated[0]) {
        logWithTime("[PHOTO] Product not found for update");
        await ctx.reply('Ошибка: товар не найден');
        return;
      }

      logWithTime("[PHOTO] Product image updated successfully", updated[0]);
      
      await ctx.reply(
        `✅ Фото товара успешно обновлено!`,
        Markup.removeKeyboard()
      );
      productStates.delete(userId);
    } else {
      // Добавляем фото для нового товара
      logWithTime("[PHOTO] Adding photo for new product");
      state.imageUrl = imageUrl;
      state.step = 'description';
      await ctx.reply('Фото загружено! Теперь добавьте описание товара:');
    }
  } catch (error) {
    logWithTime("[PHOTO] Error processing photo", { 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined 
    });
    await ctx.reply(
      `Ошибка при загрузке фото: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    );
  }
});

// Обработчик текстовых сообщений для пошагового добавления товара
bot.on("message", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Если есть активное состояние добавления товара
  if (productStates.has(userId)) {
    await handleProductStep(ctx);
    return;
  }

  // Обработка кнопок админ-панели
  if ('text' in ctx.message) {
    switch (ctx.message.text) {
      case '📢 Наш канал':
        await ctx.reply('Наш официальный канал:', {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📢 Подписаться на канал",
                  url: "https://t.me/dontnetcoin"
                }
              ]
            ]
          }
        });
        return;

      case '🛍 Открыть магазин':
        const baseUrl = getBaseUrl();
        await ctx.reply('Переходим в магазин...', {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🛍 Открыть магазин",
                  web_app: {
                    url: baseUrl
                  }
                }
              ]
            ]
          }
        });
        return;

      case '➕ Добавить товар':
        if (!await isAdmin(ctx)) return;
        await startAddProduct(ctx);
        return;

      case '📋 Список товаров':
        if (!await isAdmin(ctx)) return;
        try {
          const allProducts = await db.select().from(products);
          const productList = allProducts.map(p => {
            const name = p.name ?? "Unnamed product";
            const productDescription = p.description ?? name;
            return `ID: ${p.id}\nName: ${name}\nPrice: ${p.price}\nHidden: ${p.hidden}\n${productDescription ? `Description: ${productDescription}\n` : ""}`;
          }).join("\n---\n");

          if (allProducts.length === 0) {
            await ctx.reply("Товаров пока нет");
            return;
          }

          await ctx.reply(`Список товаров:\n\n${productList}`);
        } catch (error) {
          await ctx.reply("Ошибка при получении списка товаров: " + (error as Error).message);
        }
        return;

      case '❓ Помощь':
        if (!await isAdmin(ctx)) return;
        await ctx.reply(`Доступные команды:

➕ Добавить товар - Добавить новый товар (пошаговый процесс)
📋 Список товаров - Показать все товары
🛍 Открыть магазин - Открыть веб-приложение магазина
❓ Помощь - Показать это сообщение`);
        return;

      case '✏️ Редактировать товар':
        if (!await isAdmin(ctx)) return;
        try {
          const allProducts = await db.select().from(products);
          if (allProducts.length === 0) {
            await ctx.reply("Товаров пока нет");
            return;
          }

          const keyboard = allProducts.map(p => [{
            text: `${p.name} (ID: ${p.id})`,
            callback_data: `edit:${p.id}`
          }]);

          await ctx.reply(
            "Выберите товар для редактирования:",
            Markup.inlineKeyboard(keyboard)
          );
        } catch (error) {
          logWithTime("[EDIT] Error getting products list", error);
          await ctx.reply("Ошибка при получении списка товаров: " + (error as Error).message);
        }
        return;
    }
  }

  // Пропускаем команды, так как они обрабатываются отдельно
  if ('text' in ctx.message && ctx.message.text?.startsWith('/')) {
    return;
  }
  
  logWithTime("Received message:", {
    from: ctx.from,
    chat: ctx.chat,
    text: 'text' in ctx.message ? ctx.message.text : undefined
  });
  await checkChatId(ctx);
});

bot.on("callback_query", async (ctx) => {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.callbackQuery.data) return;
  
  const data = ctx.callbackQuery.data;
  logWithTime("[CALLBACK] Received callback query", { data });

  try {
    if (data.startsWith('edit:')) {
      const [, idStr] = data.split(':');
      if (!idStr) {
        await ctx.answerCbQuery("Неверный формат данных");
        return;
      }
      const productId = parseInt(idStr);
      if (isNaN(productId)) {
        await ctx.answerCbQuery("Неверный ID товара");
        return;
      }

      const product = await db.query.products.findFirst({
        where: eq(products.id, productId)
      });

      if (!product) {
        await ctx.answerCbQuery("Товар не найден");
        return;
      }

      await ctx.answerCbQuery();
      await ctx.reply(
        `Выберите, что хотите изменить для товара "${product.name}":`,
        Markup.inlineKeyboard([
          [{ text: "Название", callback_data: `edit_field:${productId}:name` }],
          [{ text: "Цена", callback_data: `edit_field:${productId}:price` }],
          [{ text: "Описание", callback_data: `edit_field:${productId}:description` }],
          [{ text: "Фото", callback_data: `edit_field:${productId}:image` }],
          [{ text: "Количество", callback_data: `edit_field:${productId}:stock` }],
          [{ text: "Скрыть/Показать", callback_data: `edit_field:${productId}:hidden` }]
        ])
      );
      return;
    }

    if (data.startsWith('edit_field:')) {
      const [, productId, field] = data.split(':');
      if (!productId || !field) {
        await ctx.answerCbQuery("Неверные параметры");
        return;
      }

      await ctx.answerCbQuery();
      await ctx.reply(
        `Отправьте новое значение для поля "${field}":`,
        Markup.keyboard([['❌ Отменить']])
        .oneTime()
        .resize()
      );

      // Сохраняем состояние редактирования
      productStates.set(ctx.from.id, {
        step: 'edit',
        editField: field,
        editProductId: parseInt(productId)
      });
      return;
    }
  } catch (error) {
    logWithTime("[CALLBACK] Error processing callback query", error);
    await ctx.answerCbQuery("Произошла ошибка");
  }
});

bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

bot.on("successful_payment", async (ctx) => {
  const payment = ctx.update.message.successful_payment;
  logWithTime("[PAYMENT] Successful payment received", {
    currency: payment.currency,
    totalAmount: payment.total_amount,
    invoicePayload: payment.invoice_payload,
    orderInfo: payment.order_info,
    telegramPaymentChargeId: payment.telegram_payment_charge_id,
    providerPaymentChargeId: payment.provider_payment_charge_id
  });

  // Отправляем подтверждение покупателю
  await ctx.telegram.sendMessage(ctx.chat.id, "✅ Оплата прошла успешно! Спасибо за покупку! 🎉");

  // Уведомляем админов
  const adminUsers = await db.query.users.findMany({
    where: eq(users.role, "admin"),
  });

  for (const user of adminUsers) {
    if (user.chatId) {
      await ctx.telegram.sendMessage(
        user.chatId,
        `💫 Новая покупка!\n\nПокупатель: ${ctx.from?.first_name}\nСумма: ${payment.total_amount} ${payment.currency}\nID транзакции: ${payment.telegram_payment_charge_id}\n\nПроверить баланс можно через @TestStore командой /balance`
      );
    }
  }
});

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const setWebhook = searchParams.get("setWebhook");

  logWithTime("GET webhook request", { 
    url: req.url,
    setWebhook,
    baseUrl: "https://tg-webapp-net-production.up.railway.app"
  });

  if (setWebhook === "true") {
    const webhookUrl = "https://tg-webapp-net-production.up.railway.app/api/webhooks/telegram?secret_hash=" + SECRET_HASH;
    logWithTime("Setting webhook to", { webhookUrl });
    
    try {
      await bot.telegram.setWebhook(webhookUrl);
      logWithTime("Webhook set successfully");
      return Response.json({ ok: true, message: "Webhook set successfully" });
    } catch (error) {
      logWithTime("Error setting webhook", error);
      return Response.json({ error: "Failed to set webhook", details: error }, { status: 500 });
    }
  }

  try {
    const hookInfo = await bot.telegram.getWebhookInfo();
    logWithTime("Got webhook info", hookInfo);
    return Response.json({
      ...hookInfo,
      url: hookInfo.url?.replace(SECRET_HASH, "SECRET_HASH"),
    });
  } catch (error) {
    logWithTime("Error getting webhook info", error);
    return Response.json({ error: "Failed to get webhook info", details: error }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const secretHash = searchParams.get("secret_hash");

  logWithTime("POST webhook request", { 
    url: req.url,
    hasSecretHash: !!secretHash,
    isValidHash: secretHash === SECRET_HASH
  });

  if (secretHash !== SECRET_HASH) {
    logWithTime("Unauthorized webhook request");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json() as Update;
    logWithTime("Webhook update received", { 
      updateId: body.update_id,
      messageText: 'message' in body && body.message && 'text' in body.message ? body.message.text : undefined,
      callbackData: 'callback_query' in body && body.callback_query && 'data' in body.callback_query ? body.callback_query.data : undefined,
      from: 'message' in body ? body.message?.from : 'callback_query' in body ? body.callback_query?.from : undefined
    });
    
    await bot.handleUpdate(body);
    logWithTime("Update handled successfully");
    return new Response("OK");
  } catch (error) {
    logWithTime("Error handling webhook update", {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
    return new Response(JSON.stringify({ error: "Failed to handle update", details: error }), { status: 500 });
  }
};

async function checkChatId(ctx: Context) {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;

  logWithTime("Checking chat ID", { chatId, userId });

  if (!chatId || !userId) {
    logWithTime("Missing chatId or userId");
    return;
  }

  try {
    let user = await db.query.users.findFirst({
      where: eq(users.telegramId, userId.toString()),
    });

    logWithTime("Found user", user);

    if (!user) {
      logWithTime("Creating new user", { userId, chatId, firstName: ctx.from.first_name });
      user = await db.insert(users).values({
        id: crypto.randomUUID(),
        telegramId: userId.toString(),
        chatId: chatId.toString(),
        name: ctx.from.first_name,
      }).returning().then(users => users[0]);
      logWithTime("New user created", user);
    } else if (user.chatId !== chatId.toString()) {
      logWithTime("Updating user chat ID", { oldChatId: user.chatId, newChatId: chatId });
      await db
        .update(users)
        .set({
          chatId: chatId.toString(),
        })
        .where(eq(users.id, user.id));
      logWithTime("Chat ID updated successfully");
    }
    
    return user;
  } catch (error) {
    logWithTime("Error in checkChatId", error);
    throw error;
  }
}
