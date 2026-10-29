import { describe, expect, it } from "vitest";
import type { Product } from "../src/domain/catalog";
import {
  chooseCombo,
  replaceCartUnit,
  validCombo,
  type Bag,
} from "../src/client/cart";

const large: Product = {
  id: "large",
  name: "Carne · grande",
  description: "Pastel grande",
  category: "Pastéis",
  price: 1400,
  stock: 10,
  available: true,
  featured: false,
  emoji: "🥟",
  combo_size: "grande",
};
const small: Product = {
  ...large,
  id: "small",
  name: "Carne · pequeno",
  price: 800,
  combo_size: "pequeno",
};
const guarana: Product = {
  ...large,
  id: "guarana",
  name: "Guaraná 200 ml",
  category: "Bebidas",
  price: 400,
  combo_size: null,
  combo_drink: true,
};
const cola: Product = {
  ...guarana,
  id: "cola",
  name: "Coca-Cola 200 ml",
};
const catalog = [small, cola, large, guarana];
const emptyBag = (): Bag => ({ items: {}, combo: null, pizzaId: null });

describe("Escolha do combo na sacola", () => {
  it("abre com grande e Guaraná disponíveis independentemente da ordem do catálogo", () => {
    expect(chooseCombo(emptyBag(), catalog)).toEqual({
      items: { large: 1, guarana: 1 },
      combo: { pastelId: "large", drinkId: "guarana" },
      pizzaId: null,
    });
  });

  it("reabre o combo escolhido sem duplicar componentes, avulsos ou pizza", () => {
    const bag: Bag = {
      items: { small: 3, cola: 2, pizza: 1 },
      combo: { pastelId: "small", drinkId: "cola" },
      pizzaId: "pizza",
    };
    expect(chooseCombo(bag, catalog)).toBe(bag);
    expect(bag.items).toEqual({ small: 3, cola: 2, pizza: 1 });
  });

  it("adiciona outro combo apenas explicitamente, preservando as escolhas atuais", () => {
    const bag: Bag = {
      items: { small: 3, cola: 2, pizza: 1 },
      combo: { pastelId: "small", drinkId: "cola" },
      pizzaId: "pizza",
    };
    expect(chooseCombo(bag, catalog, true)).toEqual({
      items: { small: 4, cola: 3, pizza: 1 },
      combo: { pastelId: "small", drinkId: "cola" },
      pizzaId: "pizza",
    });
    expect(bag.items).toEqual({ small: 3, cola: 2, pizza: 1 });
  });

  it("usa opções disponíveis quando o grande ou o Guaraná estão esgotados", () => {
    const products = [
      { ...large, stock: 0 },
      { ...guarana, available: false },
      small,
      cola,
    ];
    expect(chooseCombo(emptyBag(), products)?.combo).toEqual({
      pastelId: "small",
      drinkId: "cola",
    });
  });

  it.each([
    ["sem pastel", [guarana]],
    ["sem refrigerante", [large]],
    ["sem estoque de bebida", [large, { ...guarana, stock: 0 }]],
    ["com pastel indisponível", [{ ...large, available: false }, guarana]],
    ["com bebida não elegível", [large, { ...guarana, combo_drink: false }]],
  ])("recusa combo incompleto %s sem alterar a sacola", (_case, products) => {
    const bag: Bag = {
      items: { pizza: 2 },
      combo: null,
      pizzaId: "pizza",
    };
    expect(chooseCombo(bag, products)).toBeNull();
    expect(bag).toEqual({
      items: { pizza: 2 },
      combo: null,
      pizzaId: "pizza",
    });
  });

  it("não acrescenta unidade acima de vinte nem do estoque restante", () => {
    const bag: Bag = {
      items: { large: 20, guarana: 1 },
      combo: { pastelId: "large", drinkId: "guarana" },
      pizzaId: null,
    };
    expect(
      chooseCombo(bag, [{ ...large, stock: 100 }, guarana], true),
    ).toBeNull();
    expect(
      chooseCombo(
        { ...bag, items: { large: 1, guarana: 1 } },
        [large, { ...guarana, stock: 1 }],
        true,
      ),
    ).toBeNull();
    expect(bag.items).toEqual({ large: 20, guarana: 1 });
  });

  it("recria marcador de produto removido do catálogo somente com par completo disponível", () => {
    const bag: Bag = {
      items: { removed: 1, guarana: 1, pizza: 1 },
      combo: { pastelId: "removed", drinkId: "guarana" },
      pizzaId: "pizza",
    };
    expect(chooseCombo(bag, catalog)).toEqual({
      items: { removed: 1, guarana: 2, pizza: 1, large: 1 },
      combo: { pastelId: "large", drinkId: "guarana" },
      pizzaId: "pizza",
    });
    expect(chooseCombo(bag, [guarana])).toBeNull();
    expect(bag.items).toEqual({ removed: 1, guarana: 1, pizza: 1 });
  });
});

describe("Troca da unidade em edição", () => {
  it("troca uma unidade e preserva avulsos, outros combos e quantidades do destino", () => {
    const items = { large: 4, small: 2, guarana: 3, pizza: 1 };
    expect(replaceCartUnit(items, large.id, small)).toEqual({
      large: 3,
      small: 3,
      guarana: 3,
      pizza: 1,
    });
    expect(items).toEqual({ large: 4, small: 2, guarana: 3, pizza: 1 });
  });

  it("remove somente a linha que fica sem unidades após trocar", () => {
    expect(replaceCartUnit({ large: 1, guarana: 2 }, large.id, small)).toEqual({
      small: 1,
      guarana: 2,
    });
  });

  it.each([
    ["esgotado", { ...small, stock: 0 }, { large: 2, guarana: 1 }],
    ["indisponível", { ...small, available: false }, { large: 2, guarana: 1 }],
    ["no limite de estoque", { ...small, stock: 2 }, { large: 2, small: 2 }],
    [
      "no limite de quantidade",
      { ...small, stock: 100 },
      { large: 2, small: 20 },
    ],
  ])(
    "recusa destino %s sem decrementar a origem",
    (_case, destination, items) => {
      const before = { ...items };
      expect(replaceCartUnit(items, large.id, destination)).toBeNull();
      expect(items).toEqual(before);
    },
  );

  it("mantém a mesma unidade como no-op inclusive após o estoque mudar", () => {
    const items = { large: 1, guarana: 1 };
    expect(
      replaceCartUnit(items, large.id, {
        ...large,
        stock: 0,
        available: false,
      }),
    ).toBe(items);
  });

  it("invalida a edição quando a unidade antiga foi removida", () => {
    const items = { guarana: 1, pizza: 1 };
    expect(replaceCartUnit(items, large.id, small)).toBeNull();
    expect(validCombo(items, { pastelId: large.id, drinkId: guarana.id })).toBe(
      false,
    );
    expect(items).toEqual({ guarana: 1, pizza: 1 });
  });
});

describe("Validade do marcador de combo", () => {
  it("exige marcador e quantidade positiva dos dois componentes", () => {
    const combo = { pastelId: large.id, drinkId: guarana.id };
    expect(validCombo({ large: 1, guarana: 1 }, combo)).toBe(true);
    expect(validCombo({ large: 3, guarana: 2, pizza: 1 }, combo)).toBe(true);
    expect(validCombo({ large: 1, guarana: 1 }, null)).toBe(false);
    expect(validCombo({ large: 0, guarana: 1 }, combo)).toBe(false);
    expect(validCombo({ large: 1 }, combo)).toBe(false);
  });
});
