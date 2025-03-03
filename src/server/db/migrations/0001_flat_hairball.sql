CREATE TABLE IF NOT EXISTS "ffmemes_promocodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(255) NOT NULL,
	"code" varchar(255) NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ffmemes_cart_items" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ffmemes_cart_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "ffmemes_cart_items" ALTER COLUMN "quantity" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ffmemes_cart_items" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ffmemes_products" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ffmemes_products" ALTER COLUMN "name" SET DEFAULT 'Unnamed product';--> statement-breakpoint
ALTER TABLE "ffmemes_products" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ffmemes_products" ALTER COLUMN "price" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "ffmemes_products" ALTER COLUMN "stock" SET DEFAULT 999999;--> statement-breakpoint
ALTER TABLE "ffmemes_products" ALTER COLUMN "stock" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ffmemes_products" ALTER COLUMN "discount" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "ffmemes_products" ALTER COLUMN "discount" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "ffmemes_products" ALTER COLUMN "images" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "ffmemes_products" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "ffmemes_products" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "ffmemes_user" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ffmemes_user" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ffmemes_user" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ffmemes_user" ALTER COLUMN "telegram_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ffmemes_user" ALTER COLUMN "chat_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ffmemes_user" ALTER COLUMN "chat_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ffmemes_user" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ffmemes_cart_items" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "ffmemes_products" ADD COLUMN "instant_buy" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ffmemes_user" ADD COLUMN "karma" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ffmemes_user" ADD COLUMN "referral_code" varchar(255);--> statement-breakpoint
ALTER TABLE "ffmemes_user" ADD COLUMN "referral_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ffmemes_user" ADD COLUMN "activated_codes" json;--> statement-breakpoint
ALTER TABLE "ffmemes_user" ADD COLUMN "used_codes" json;--> statement-breakpoint
ALTER TABLE "ffmemes_user" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ffmemes_promocodes" ADD CONSTRAINT "ffmemes_promocodes_user_id_ffmemes_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ffmemes_user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ffmemes_cart_items" ADD CONSTRAINT "ffmemes_cart_items_product_id_ffmemes_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."ffmemes_products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
