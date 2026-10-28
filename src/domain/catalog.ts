export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price?: number | null;
  category: string;
  available: boolean;
  featured: boolean;
  emoji: string;
  stock: number;
};
export const effectivePrice = (product: Product) =>
  product.sale_price ?? product.price;
