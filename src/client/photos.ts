import type { Product } from "../domain/catalog";

// Fotografias de referência; créditos públicos em /images/creditos.html.
export function productPhoto(
  product: Product,
): { src: string; alt: string } | null {
  if (product.category === "Mini pizza")
    return {
      src: "/images/mini-pizzas.jpg",
      alt: "Mini pizza assada; foto ilustrativa",
    };
  const snacks: Record<string, string> = {
    Kibe: "kibe",
    Empada: "empada",
    Coxinha: "coxinha",
    "Espetinho de frango": "espetinho-frango",
  };
  if (snacks[product.name])
    return {
      src: `/images/${snacks[product.name]}.jpg`,
      alt: `${product.name}; foto ilustrativa`,
    };
  if (product.category === "Pastéis" || product.category === "Doces")
    return {
      src: product.name.startsWith("Queijo ·")
        ? "/images/pastel-queijo.jpg"
        : "/images/pastel.jpg",
      alt: "Pastel frito; foto ilustrativa do produto",
    };
  return null;
}
