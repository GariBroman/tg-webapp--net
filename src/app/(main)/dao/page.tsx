"use client";

import * as React from "react";
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import DefaultError from "~/components/layouts/error-page";
import ProductListItem from "~/components/shared/product-list-item";
import { CartDropdown } from "~/components/layouts/cart-dropdown";

const DaoPage = () => {
  const { data: user } = api.tg.getUser.useQuery();

  return (
    <>
      {/* Шапка DAO с балансами */}
      <div className="border-b">
        <div className="flex h-16 items-center justify-between bg-card px-4">
          <div className="flex items-center gap-4">
            <span>MAXTON: {user?.tapCount ?? 0}</span>
            <span>KARMA: {user?.karma ?? 0}</span>
          </div>
          <CartDropdown />
        </div>
      </div>

      <div className="mt-4 text-center text-lg">
        Покупайте товары и услуги за ваши токены
      </div>

      {/* Список товаров */}
      <ProductList />
    </>
  );
};

export default DaoPage;

const ProductList = () => {
  const { data, isLoading } = api.shop.products.useQuery();

  if (isLoading)
    return (
      <div className="grid grid-cols-2 gap-4 pt-4">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );

  if (!data) return <DefaultError error={{ message: "No products" }} />;

  if (data.length === 0) return <div>No products</div>;
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {data.map((product) => {
        return <ProductListItem key={product.id} product={product} />;
      })}
    </div>
  );
}; 