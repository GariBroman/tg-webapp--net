import { db } from "../src/server/db";
import { products } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

const command = process.argv[2];
const args = process.argv.slice(3);

async function addProduct(name: string, price: number, imageUrl: string, description?: string) {
  const product = await db.insert(products).values({
    name,
    price: price.toString(), // Convert number to string for decimal type
    images: [imageUrl],
    description,
    stock: 999999, // Unlimited for digital goods
    hidden: false,
    instantBuy: true,
    discount: "0"
  }).returning();

  console.log("Added product:", product);
}

async function listProducts() {
  const allProducts = await db.select().from(products);
  console.log("All products:", allProducts);
}

async function deleteProduct(id: number) {
  const deleted = await db.delete(products).where(eq(products.id, id)).returning();
  console.log("Deleted product:", deleted);
}

async function main() {
  switch (command) {
    case "add":
      if (args.length < 3) {
        console.log("Usage: pnpm tsx scripts/manage-products.ts add <name> <price> <imageUrl> [description]");
        process.exit(1);
      }
      const name = args[0];
      const priceStr = args[1];
      const imageUrl = args[2];
      const description = args.slice(3).join(" ") || undefined;

      if (!name || !imageUrl || !priceStr) {
        console.log("Error: name, price and imageUrl are required");
        process.exit(1);
      }

      const price = parseInt(priceStr);
      if (isNaN(price)) {
        console.log("Error: price must be a number");
        process.exit(1);
      }

      await addProduct(name, price, imageUrl, description);
      break;

    case "list":
      await listProducts();
      break;

    case "delete":
      if (!args[0]) {
        console.log("Usage: pnpm tsx scripts/manage-products.ts delete <id>");
        process.exit(1);
      }
      const id = parseInt(args[0]);
      if (isNaN(id)) {
        console.log("Error: id must be a number");
        process.exit(1);
      }
      await deleteProduct(id);
      break;

    default:
      console.log(`
Available commands:
  add <name> <price> <imageUrl> [description] - Add a new product
  list - List all products
  delete <id> - Delete a product by ID
      `);
  }

  process.exit(0);
}

main().catch(console.error); 