import { CartItem, Product } from "~/server/db/schema";
import { Button, buttonVariants } from "../ui/button";
import Image from "next/image";
import { blurImage, cn, formatPrice } from "~/lib/utils";
import { BookDashed, Minus, Plus, Trash } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import Link from "next/link";
import posthog from "posthog-js";
import { env } from "~/env";

const ProductImage: React.FC<{
  product: Product;
  single?: boolean;
}> = ({ product, single }) => (
  <div
    className={`relative h-40 w-full overflow-hidden rounded-md ${single ? "h-96" : ""}`}
  >
    {product.images?.[0] ? (
      <Image
        className="rounded"
        src={product.images[0]}
        alt={product.name ?? ""}
        blurDataURL={blurImage(product.images[0], 150, 150)}
        placeholder="blur"
        fill
        sizes="100vw"
        style={{
          objectFit: "cover",
        }}
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center rounded bg-slate-100">
        <p className="text-lg font-bold text-slate-400">
          <BookDashed className="h-16 w-16 rotate-12" />
        </p>
      </div>
    )}
  </div>
);

type ProductListItemProps = {
  product: Product;
  single?: boolean;
};

export const useProductActions = (product: Product) => {
  const utils = api.useUtils();

  const { data: cart } = api.shop.cart.useQuery();
  const cartItem = cart?.find((item) => item.productId === product.id);

  const addToCart = api.shop.addToCart.useMutation({
    onError(error) {
      toast.error(`Failed to add to cart: ${error.message}`);
    },
    onSuccess: () => {
      if (env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.capture("add-to-cart", {
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
        });
      }
      void utils.shop.products.invalidate();
      void utils.shop.cart.invalidate();
    },
  });
  const removeFromCart = api.shop.removeFromCart.useMutation({
    onSuccess: () => {
      if (env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.capture("remove-from-cart", {
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
        });
      }
    },
    onError(error) {
      toast.error(`Failed to remove from cart: ${error.message}`);
    },
    onSettled: () => {
      void utils.shop.products.invalidate();
      void utils.shop.cart.invalidate();
    },
  });
  const updateCartItem = api.shop.updateCartItem.useMutation({
    onSuccess: () => {
      if (env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.capture("update-cart-item", {
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          quantity: cartItem?.quantity,
        });
      }
    },
    onError(error) {
      toast.error(`Failed to update cart item: ${error.message}`);
    },
    onSettled: () => {
      void utils.shop.products.invalidate();
      void utils.shop.cart.invalidate();
    },
  });

  return {
    cartItem,
    addToCart,
    removeFromCart,
    updateCartItem,
  };
};

const ProductItemActions: React.FC<{
  product: Product & { link?: string };
}> = ({ product }) => {
  const { cartItem, addToCart, removeFromCart, updateCartItem } =
    useProductActions(product);

  return (
    <div className="mt-2 flex items-center gap-2">
      <Button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return addToCart.mutate({ productId: product.id, quantity: 1 });
        }}
        disabled={product.stock === 0}
        className={cn(buttonVariants({ variant: "default" }), "w-full")}
      >
        Instant Buy
      </Button>
    </div>
  );
};

const ProductListItem = ({ product, single }: ProductListItemProps) => {
  const content = (
    <div className="flex flex-col">
      <ProductImage product={product} single={single} />
      <p className="mt-2 h-8 overflow-hidden text-sm font-medium leading-tight text-muted-foreground">
        {product.name}
      </p>

      <div
        className={cn(
          "flex",
          single ? "flex-row items-center justify-between" : "flex-col",
        )}
      >
        <div className="mt-2 flex items-center">
          <p className="text-lg font-medium text-muted-foreground">
            ⭐ {formatPrice((parseFloat(product.price) - parseFloat(product.discount)).toString())}
          </p>
          {parseFloat(product.discount) > 0 && (
            <p className="ml-2 rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-500 line-through">
              {formatPrice(product.price)}
            </p>
          )}
        </div>
        <ProductItemActions product={product} />
      </div>
    </div>
  );

  const containerClassNames = cn(
    "mt-4 w-full overflow-hidden rounded-md bg-card",
    single ? "p-0" : "p-2 border border-border shadow-sm",
  );

  return single ? (
    <div className={containerClassNames}>{content}</div>
  ) : (
    <Link
      href={`/product/${product.id}`}
      key={product.id}
      className={containerClassNames}
    >
      {content}
    </Link>
  );
};

export default ProductListItem;
