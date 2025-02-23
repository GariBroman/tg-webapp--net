import { db } from "~/server/db";
import { createTRPCRouter, procedure } from "../trpc";
import { z } from "zod";
import { cartItems, products } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { bot } from "~/server/telegram";
import { TRPCError } from "@trpc/server";

// Функция для логирования с timestamp
function logWithTime(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

const adminProcedure = procedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next();
});

export const shopRouter = createTRPCRouter({
  cart: procedure.query(async ({ ctx }) => {
    logWithTime("[SHOP] Getting cart items for user", { userId: ctx.user.id });
    try {
      const cart = await db.query.cartItems.findMany({
        where: eq(cartItems.userId, ctx.user.id),
        with: { product: true },
      });
      logWithTime("[SHOP] Cart items retrieved successfully", { itemsCount: cart.length });
      return cart;
    } catch (error) {
      logWithTime("[SHOP] Error getting cart items", { error });
      throw error;
    }
  }),
  products: procedure.query(async ({ ctx }) => {
    logWithTime("[SHOP] Getting all products");
    try {
      const allProducts = await db.query.products.findMany();
      logWithTime("[SHOP] Products retrieved successfully", { count: allProducts.length });

      const itemsWithLinks = await Promise.all(
        allProducts.map(async (i) => {
          try {
            logWithTime("[SHOP] Creating invoice link for product", { productId: i.id });
            const productName = i.name ?? 'Unnamed product';
            const productDescription = i.description ?? productName;
            const link = await bot.telegram.createInvoiceLink({
              title: productName,
              description: productDescription,
              payload: `${i.id}-${ctx.user.id}`,
              provider_token: "",
              currency: "XTR",
              prices: [
                {
                  label: productName,
                  amount: Math.round(parseFloat(i.price))
                }
              ]
            });
            logWithTime("[SHOP] Invoice link created successfully", { productId: i.id, link });
            return { ...i, link };
          } catch (error) {
            logWithTime("[SHOP] Error creating invoice link", { productId: i.id, error });
            return i;
          }
        }),
      );

      logWithTime("[SHOP] All products processed", { count: itemsWithLinks.length });
      return itemsWithLinks;
    } catch (error) {
      logWithTime("[SHOP] Error getting products", { error });
      throw error;
    }
  }),
  addProduct: adminProcedure
    .input(
      z.object({
        name: z.string(),
        price: z.string(),
        imageUrl: z.string(),
        description: z.string().optional(),
        stock: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      logWithTime("[SHOP] Adding new product", input);
      try {
        const product = await db.insert(products).values({
          name: input.name,
          price: input.price,
          images: [input.imageUrl],
          description: input.description,
          stock: input.stock || 999999,
          hidden: false,
          instantBuy: true,
        }).returning();
        logWithTime("[SHOP] Product added successfully", product[0]);
        return product;
      } catch (error) {
        logWithTime("[SHOP] Error adding product", { error });
        throw error;
      }
    }),
  productItem: procedure.input(z.coerce.string()).query(async ({ input }) => {
    return db.query.products.findFirst({
      where: eq(products.id, +input),
    });
  }),
  addToCart: procedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { productId, quantity } = input;
      const existingCartItem = await db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.productId, productId),
          eq(cartItems.userId, ctx.user.id),
        ),
      });

      if (existingCartItem) {
        return db
          .update(cartItems)
          .set({
            quantity: existingCartItem.quantity + quantity,
          })
          .where(eq(cartItems.id, existingCartItem.id));
      }

      return db.insert(cartItems).values({
        productId: input.productId,
        quantity: input.quantity,
        userId: ctx.user.id,
      });
    }),
  removeFromCart: procedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      console.log("Remove", input);
      return db
        .delete(cartItems)
        .where(
          and(
            eq(cartItems.productId, input),
            eq(cartItems.userId, ctx.user.id),
          ),
        );
    }),
  updateCartItem: procedure
    .input(z.object({ id: z.number(), quantity: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return db
        .update(cartItems)
        .set({ quantity: input.quantity })
        .where(
          and(
            eq(cartItems.productId, input.id),
            eq(cartItems.userId, ctx.user.id),
          ),
        );
    }),

  getCartPaymentLink: procedure
    .input(z.object({ id: z.number() }).optional())
    .mutation(async ({ ctx }) => {
      const cart = await db.query.cartItems.findMany({
        where: eq(cartItems.userId, ctx.user.id),
        with: { product: true, user: true },
      });

      if (cart.length === 0) {
        return null;
      }

      const user = cart[0]?.user;

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const totalAmount = Math.round(cart.reduce(
        (acc, i) =>
          acc + (parseFloat(i.product.price) - parseFloat(i.product.discount)) * i.quantity,
        0,
      ));

      const invoiceLink = await bot.telegram.createInvoiceLink({
        currency: "XTR",
        payload: `cart-${user.telegramId}-${Date.now()}`,
        provider_token: "",
        prices: [
          {
            label: `Cart Total`,
            amount: totalAmount,
          },
        ],
        title: `Purchase ${cart.length} item(s)`,
        description: `Items: ${cart.map((i) => `${i.product.name} (x${i.quantity})`).join(", ")}`,
      });

      return invoiceLink;
    }),
  updateProduct: procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return db
        .update(products)
        .set({ images: [] })
        .where(eq(products.id, input.id));
    }),
});
