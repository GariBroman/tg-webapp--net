import { InferSelectModel, relations, sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  integer,
  json,
  pgTableCreator,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `ffmemes_${name}`);

export const users = createTable("user", {
  id: text("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  chatId: text("chat_id").notNull(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
  tapCount: integer("tap_count").notNull().default(0),
  karma: integer("karma").notNull().default(0),
  referralCode: varchar("referral_code", { length: 255 }),
  referralCount: integer("referral_count").notNull().default(0),
  activatedCodes: json("activated_codes").$type<string[]>(),
  usedCodes: json("used_codes").$type<string[]>(),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  cartItems: many(cartItems),
}));

export const promocodes = createTable("promocodes", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 255 })
    .$type<"promocode" | "referral">()
    .notNull(),
  code: varchar("code", { length: 255 }).notNull(),
  // amount will remove N stars from the price or add N free taps
  amount: integer("amount").notNull().default(0),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const products = createTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Unnamed product"),
  description: text("description"),
  price: decimal("price").notNull(),
  discount: decimal("discount").default("0").notNull(),
  images: text("images").array(),
  stock: integer("stock").default(999999).notNull(),
  hidden: boolean("hidden").default(false).notNull(),
  instantBuy: boolean("instant_buy").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export const cartItems = createTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export type Product = InferSelectModel<typeof products>;
export type CartItem = InferSelectModel<typeof cartItems>;
