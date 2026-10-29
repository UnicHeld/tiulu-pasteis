import type { Product } from "../domain/catalog";

export type CartItems = Record<string, number>;
export type ComboSelection = { pastelId: string; drinkId: string };
export type Bag = {
  items: CartItems;
  combo: ComboSelection | null;
  pizzaId: string | null;
};

export const canAddUnit = (items: CartItems, product: Product) =>
  product.available && (items[product.id] || 0) < Math.min(20, product.stock);

export function validCombo(items: CartItems, combo: ComboSelection | null) {
  return Boolean(
    combo && items[combo.pastelId] > 0 && items[combo.drinkId] > 0,
  );
}

// Troca somente a unidade em edição; mantém avulsos e outros combos da mesma linha.
export function replaceCartUnit(
  items: CartItems,
  previousId: string,
  next: Product,
): CartItems | null {
  if (!items[previousId]) return null;
  if (previousId === next.id) return items;
  if (!canAddUnit(items, next)) return null;
  const updated = {
    ...items,
    [previousId]: items[previousId] - 1,
    [next.id]: (items[next.id] || 0) + 1,
  };
  if (!updated[previousId]) delete updated[previousId];
  return updated;
}

export function chooseCombo(
  bag: Bag,
  products: Product[],
  another = false,
): Bag | null {
  if (
    !another &&
    validCombo(bag.items, bag.combo) &&
    products.some((p) => p.id === bag.combo!.pastelId && p.combo_size) &&
    products.some((p) => p.id === bag.combo!.drinkId && p.combo_drink)
  )
    return bag;
  const pastels = products.filter(
    (p) => p.combo_size && canAddUnit(bag.items, p),
  );
  const drinks = products.filter(
    (p) => p.combo_drink && canAddUnit(bag.items, p),
  );
  const pastel =
    (another && pastels.find((p) => p.id === bag.combo?.pastelId)) ||
    pastels.find((p) => p.combo_size === "grande") ||
    pastels[0];
  const drink =
    (another && drinks.find((p) => p.id === bag.combo?.drinkId)) ||
    drinks.find((p) => p.name === "Guaraná 200 ml") ||
    drinks[0];
  if (!pastel || !drink) return null;
  return {
    ...bag,
    items: {
      ...bag.items,
      [pastel.id]: (bag.items[pastel.id] || 0) + 1,
      [drink.id]: (bag.items[drink.id] || 0) + 1,
    },
    combo: { pastelId: pastel.id, drinkId: drink.id },
  };
}
