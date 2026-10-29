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
  combo_size?: "pequeno" | "grande" | null;
  combo_drink?: boolean;
  customizable?: boolean;
};
export const effectivePrice = (product: Product) =>
  product.sale_price ?? product.price;

export const comboPrices = { grande: 1500, pequeno: 1000 } as const;
export const pizzaIngredients = [
  { id: "carne", label: "Carne" },
  { id: "queijo", label: "Queijo" },
  { id: "frango", label: "Frango" },
  { id: "catupiry", label: "Catupiry" },
  { id: "palmito", label: "Palmito" },
  { id: "presunto", label: "Presunto" },
  { id: "mussarela", label: "Mussarela" },
  { id: "chocolate", label: "Chocolate" },
  { id: "goiabada", label: "Goiabada" },
] as const;
export type PizzaIngredient = (typeof pizzaIngredients)[number]["id"];
export const ingredientLabel = (id: string) =>
  pizzaIngredients.find((ingredient) => ingredient.id === id)?.label ?? id;

export function comboOfferPrice(pastel: Product, drink: Product) {
  const regular = effectivePrice(pastel) + effectivePrice(drink);
  return pastel.combo_size && drink.combo_drink
    ? Math.min(regular, comboPrices[pastel.combo_size])
    : regular;
}

// Prévia e cálculo do servidor usam a mesma regra; autorização e estoque ficam na API.
export function priceOrder(
  items: { productId: string; quantity: number }[],
  products: Product[],
) {
  const lines = items.flatMap((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product && item.quantity > 0
      ? [{ product, quantity: item.quantity }]
      : [];
  });
  const subtotal = lines.reduce(
    (sum, line) => sum + effectivePrice(line.product) * line.quantity,
    0,
  );
  // Pareia primeiro as unidades com maior economia; desempate estável por ID.
  const pastels = lines
    .filter(({ product }) => product.combo_size)
    .map((line) => ({ ...line }));
  const drinks = lines
    .filter(({ product }) => product.combo_drink)
    .map((line) => ({ ...line }));
  const benefit = (p: Product) =>
    effectivePrice(p) - comboPrices[p.combo_size!];
  pastels.sort(
    (a, b) =>
      benefit(b.product) - benefit(a.product) ||
      a.product.id.localeCompare(b.product.id),
  );
  drinks.sort(
    (a, b) =>
      effectivePrice(b.product) - effectivePrice(a.product) ||
      a.product.id.localeCompare(b.product.id),
  );
  let discount = 0,
    pastelIndex = 0,
    drinkIndex = 0;
  while (pastelIndex < pastels.length && drinkIndex < drinks.length) {
    const pastel = pastels[pastelIndex],
      drink = drinks[drinkIndex];
    const saving =
      effectivePrice(pastel.product) +
      effectivePrice(drink.product) -
      comboOfferPrice(pastel.product, drink.product);
    if (saving <= 0) break;
    const quantity = Math.min(pastel.quantity, drink.quantity);
    discount += saving * quantity;
    pastel.quantity -= quantity;
    drink.quantity -= quantity;
    if (!pastel.quantity) pastelIndex++;
    if (!drink.quantity) drinkIndex++;
  }
  return { subtotal, discount, total: subtotal - discount };
}
