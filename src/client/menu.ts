import type { Product } from "../domain/catalog";

export type MenuProduct = {
  key: string;
  name: string;
  variants: Product[];
};

export function pastelSize(product: Product): "pequeno" | "grande" | null {
  if (product.category === "Bebidas") return null;
  const size = / · (pequeno|grande)$/.exec(product.name)?.[1];
  return size === "pequeno" || size === "grande" ? size : null;
}

export function groupMenuProducts(products: Product[]): MenuProduct[] {
  const groups = new Map<string, MenuProduct>();
  for (const product of products) {
    const size = pastelSize(product);
    const name = size
      ? product.name.replace(/ · (pequeno|grande)$/, "")
      : product.name;
    const key = size ? `${product.category}:${name}` : product.id;
    const group = groups.get(key) ?? { key, name, variants: [] };
    group.variants.push(product);
    groups.set(key, group);
  }
  for (const group of groups.values())
    group.variants.sort(
      (a, b) =>
        Number(pastelSize(a) === "grande") - Number(pastelSize(b) === "grande"),
    );
  const categoryOrder = [
    "Pastéis",
    "Salgados",
    "Mini pizza",
    "Doces",
    "Bebidas",
  ];
  return [...groups.values()].sort((a, b) => {
    const rank = (category: string) => {
      const index = categoryOrder.indexOf(category);
      return index < 0 ? categoryOrder.length : index;
    };
    return rank(a.variants[0].category) - rank(b.variants[0].category);
  });
}
