import { describe, expect, it } from "vitest";
import { groupMenuProducts, pastelSize } from "../src/client/menu";
import { effectivePrice, type Product } from "../src/domain/catalog";
const large: Product = {
  id: "large",
  name: "Carne · grande",
  category: "Salgados",
  price: 1400,
  stock: 7,
  available: true,
  description: "Grande",
  emoji: "🥟",
  featured: true,
};
const small: Product = {
  ...large,
  id: "small",
  name: "Carne · pequeno",
  price: 800,
  stock: 2,
  description: "Pequeno",
};
describe("Cardápio por sabor", () => {
  it("agrupa tamanhos num sabor sem perder ID, preço ou estoque", () => {
    const [group] = groupMenuProducts([large, small]);
    expect(group.name).toBe("Carne");
    expect(
      group.variants.map((p) => [p.id, effectivePrice(p), p.stock]),
    ).toEqual([
      ["small", 800, 2],
      ["large", 1400, 7],
    ]);
  });
  it("mantém promoções e indisponibilidade independentes por tamanho", () => {
    const [group] = groupMenuProducts([
      { ...large, available: false },
      { ...small, sale_price: 600 },
    ]);
    expect(effectivePrice(group.variants[0])).toBe(600);
    expect(group.variants[1].available).toBe(false);
  });
  it("mantém bebidas e produtos sem tamanho como cartões individuais", () => {
    const drink = {
      ...large,
      id: "drink",
      name: "Coca-Cola lata",
      category: "Bebidas",
    };
    const plain = { ...large, id: "plain", name: "Especial" };
    expect(groupMenuProducts([large, small, drink, plain])).toHaveLength(3);
    expect(pastelSize({ ...drink, name: "Bebida · grande" })).toBeNull();
  });
  it("não mistura sabores ou categorias e aceita sabor com um único tamanho", () => {
    const products = [
      small,
      { ...large, id: "sweet", name: "Chocolate · grande", category: "Doces" },
      { ...large, id: "other", category: "Doces" },
    ];
    expect(groupMenuProducts(products)).toHaveLength(3);
    expect(groupMenuProducts([small])[0].variants).toEqual([small]);
  });
  it("ordena pastéis, salgados, mini pizza, doces e bebidas", () => {
    const categories = [
      "Bebidas",
      "Doces",
      "Mini pizza",
      "Salgados",
      "Pastéis",
    ];
    const products = categories.map((category, index) => ({
      ...large,
      id: String(index),
      name: category,
      category,
    }));
    expect(
      groupMenuProducts(products).map((group) => group.variants[0].category),
    ).toEqual(["Pastéis", "Salgados", "Mini pizza", "Doces", "Bebidas"]);
    expect(products.map((p) => p.category)).toEqual(categories);
  });
  it("preserva a ordem de entrada original e retorna vazio sem catálogo", () => {
    const input = [large, small];
    groupMenuProducts(input);
    expect(input).toEqual([large, small]);
    expect(groupMenuProducts([])).toEqual([]);
  });
});
