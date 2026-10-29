import { describe, expect, it } from "vitest";
import {
  priceOrder,
  comboOfferPrice,
  type Product,
} from "../src/domain/catalog";
import { orderInput, totalOrder } from "../src/domain/orders";
const large: Product = {
  id: "large",
  name: "Carne · grande",
  description: "",
  price: 1400,
  category: "Pastéis",
  available: true,
  stock: 20,
  featured: false,
  emoji: "🥟",
  combo_size: "grande",
};
const small: Product = {
  ...large,
  id: "small",
  name: "Chocolate · pequeno",
  category: "Doces",
  price: 800,
  combo_size: "pequeno",
};
const drink: Product = {
  ...large,
  id: "drink",
  name: "Guaraná 200 ml",
  category: "Bebidas",
  price: 400,
  combo_size: null,
  combo_drink: true,
};
const products = [large, small, drink];
describe("Combos do intervalo", () => {
  it("calcula grande1500 e pequeno1000 incluindo sabores doces", () => {
    expect(comboOfferPrice(large, drink)).toBe(1500);
    expect(comboOfferPrice(small, drink)).toBe(1000);
  });
  it("prioriza maior economia e preserva sobras avulsas com quantidades mistas", () => {
    const items = [
      { productId: "large", quantity: 2 },
      { productId: "small", quantity: 2 },
      { productId: "drink", quantity: 3 },
    ];
    expect(priceOrder(items, products)).toEqual({
      subtotal: 5600,
      discount: 800,
      total: 4800,
    });
    expect(priceOrder([...items].reverse(), [...products].reverse())).toEqual(
      priceOrder(items, products),
    );
    expect(items[0].quantity).toBe(2);
  });
  it("não dá desconto a salgados, mini pizzas, águas ou refrigerante lata", () => {
    const other = {
      ...large,
      id: "snack",
      price: 800,
      category: "Salgados",
      combo_size: null,
    };
    const water = { ...drink, id: "water", combo_drink: false };
    expect(
      priceOrder(
        [
          { productId: other.id, quantity: 1 },
          { productId: drink.id, quantity: 1 },
        ],
        [other, drink],
      ).discount,
    ).toBe(0);
    expect(
      priceOrder(
        [
          { productId: large.id, quantity: 1 },
          { productId: water.id, quantity: 1 },
        ],
        [large, water],
      ).discount,
    ).toBe(0);
  });
  it("mantém promoções avulsas mais baratas e escolhe o melhor par restante", () => {
    const cheap = { ...large, sale_price: 900 };
    expect(
      priceOrder(
        [
          { productId: "large", quantity: 1 },
          { productId: "small", quantity: 1 },
          { productId: "drink", quantity: 1 },
        ],
        [cheap, small, drink],
      ),
    ).toEqual({ subtotal: 2100, discount: 200, total: 1900 });
    expect(comboOfferPrice({ ...small, sale_price: 400 }, drink)).toBe(800);
  });
  it("cobra componentes sem par pelo preço avulso", () => {
    expect(
      priceOrder(
        [
          { productId: "large", quantity: 1 },
          { productId: "drink", quantity: 3 },
        ],
        products,
      ),
    ).toEqual({ subtotal: 2600, discount: 300, total: 2300 });
    expect(priceOrder([{ productId: "large", quantity: 3 }], products)).toEqual(
      { subtotal: 4200, discount: 0, total: 4200 },
    );
  });
  it("estoque e disponibilidade continuam obrigatórios mesmo com desconto", () => {
    const items = [
      { productId: "large", quantity: 1 },
      { productId: "drink", quantity: 1 },
    ];
    expect(() => totalOrder(items, [large, { ...drink, stock: 0 }])).toThrow(
      "estoque",
    );
    expect(() =>
      totalOrder(items, [{ ...large, available: false }, drink]),
    ).toThrow("indisponível");
  });
});
describe("Mini pizza personalizada", () => {
  const input = {
    name: "Aluno",
    items: [
      {
        productId: "10000000-0000-4000-8000-000000000037",
        quantity: 1,
        ingredients: ["carne", "queijo", "palmito"],
      },
    ],
    paymentMethod: "pix",
    pickupAccepted: true,
    location: {
      latitude: -20.78551898,
      longitude: -49.35995068,
      accuracy: 10,
      timestamp: Date.now(),
    },
  };
  it("aceita até3 ingredientes conhecidos e rejeita repetidos, desconhecidos ou excesso", () => {
    expect(orderInput.safeParse(input).success).toBe(true);
    for (const ingredients of [
      ["carne", "queijo", "palmito", "frango"],
      ["queijo", "queijo"],
      ["inexistente"],
    ])
      expect(
        orderInput.safeParse({
          ...input,
          items: [{ ...input.items[0], ingredients }],
        }).success,
      ).toBe(false);
  });
  it("não permite ingredientes extras em um produto comum", () => {
    expect(() =>
      totalOrder(
        [{ productId: large.id, quantity: 1, ingredients: ["carne"] }],
        [large],
      ),
    ).toThrow("personalizada");
    expect(
      totalOrder(
        [{ productId: large.id, quantity: 1, ingredients: [] }],
        [large],
      ),
    ).toBe(1400);
  });
});
