import type { Product, Category, SortOption } from "../data/products.ts";

export interface Filters {
  category: Category | null;
  maxPrice: number;
  minRating: number | null;
  inStockOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  category: null,
  maxPrice: 500,
  minRating: null,
  inStockOnly: false,
};

export function filterProducts(products: Product[], filters: Filters): Product[] {
  return products.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (p.price > filters.maxPrice) return false;
    if (filters.minRating !== null && p.rating < filters.minRating) return false;
    if (filters.inStockOnly && !p.inStock) return false;
    return true;
  });
}

export function sortProducts(products: Product[], sort: SortOption | null): Product[] {
  if (!sort) return products;
  const sorted = [...products];
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price_desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating_desc":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "name_asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
}
