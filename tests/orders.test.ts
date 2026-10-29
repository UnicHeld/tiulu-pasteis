import { describe, it, expect } from "vitest";
import {
  orderInput,
  totalOrder,
  assertSchedule,
  assertTransition,
  type Product,
} from "../src/domain/orders";
const product: Product = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Carne",
  description: "",
  price: 900,
  stock: 5,
  category: "Salgados",
  available: true,
  featured: true,
  emoji: "🥟",
};
describe("Pedidos", () => {
  it("permite confirmar chegada e expirar, mas bloqueia preparo após expiração", () => {
    expect(() =>
      assertTransition("awaiting_arrival", "preparing"),
    ).not.toThrow();
    expect(() => assertTransition("awaiting_arrival", "expired")).not.toThrow();
    expect(() => assertTransition("expired", "preparing")).toThrow();
    expect(() => assertTransition("awaiting_arrival", "ready")).toThrow();
  });
  it("exige aceite da retirada e rejeita agendamento no novo fluxo", () => {
    const input = {
      name: "Cliente",
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: "pix",
    };
    expect(orderInput.safeParse(input).success).toBe(false);
    expect(
      orderInput.safeParse({
        ...input,
        pickupAccepted: true,
        location: {
          latitude: -20.78551898,
          longitude: -49.35995068,
          accuracy: 10,
          timestamp: Date.now(),
        },
      }).success,
    ).toBe(true);
    expect(
      orderInput.safeParse({
        ...input,
        pickupAccepted: true,
        location: {
          latitude: -20.78551898,
          longitude: -49.35995068,
          accuracy: 10,
          timestamp: Date.now(),
        },
        scheduledAt: "2026-10-28T15:00:00Z",
      }).success,
    ).toBe(false);
  });
  it("aplica promoção definida no catálogo", () =>
    expect(
      totalOrder(
        [{ productId: product.id, quantity: 2 }],
        [{ ...product, sale_price: 700 }],
      ),
    ).toBe(1400));
  it("calcula preços exclusivamente pelo catálogo em centavos", () =>
    expect(
      totalOrder([{ productId: product.id, quantity: 3 }], [product]),
    ).toBe(2700));
  it("rejeita produto inexistente", () =>
    expect(() =>
      totalOrder([{ productId: "x", quantity: 1 }], [product]),
    ).toThrow());
  it("rejeita estoque insuficiente", () =>
    expect(() =>
      totalOrder([{ productId: product.id, quantity: 6 }], [product]),
    ).toThrow());
  it("rejeita produto desativado", () =>
    expect(() =>
      totalOrder(
        [{ productId: product.id, quantity: 1 }],
        [{ ...product, available: false }],
      ),
    ).toThrow());
  it("rejeita itens duplicados", () =>
    expect(() =>
      totalOrder(
        [
          { productId: product.id, quantity: 1 },
          { productId: product.id, quantity: 1 },
        ],
        [product],
      ),
    ).toThrow());
  it("rejeita quantidade negativa, fracionada e excessiva", () => {
    for (const quantity of [-1, 0, 1.5, 21])
      expect(
        orderInput.safeParse({
          name: "Aluno",
          items: [{ productId: product.id, quantity }],
          pickupAccepted: true,
          location: {
            latitude: -20.78551898,
            longitude: -49.35995068,
            accuracy: 10,
            timestamp: Date.now(),
          },
          paymentMethod: "pix",
        }).success,
      ).toBe(false);
  });
  it("rejeita sacola vazia", () =>
    expect(
      orderInput.safeParse({
        name: "Aluno",
        items: [],
        pickupAccepted: true,
        location: {
          latitude: -20.78551898,
          longitude: -49.35995068,
          accuracy: 10,
          timestamp: Date.now(),
        },
        paymentMethod: "pix",
      }).success,
    ).toBe(false));
  it("remove preço enviado pelo cliente", () => {
    const result = orderInput.parse({
      name: " Aluno ",
      items: [{ productId: product.id, quantity: 1, price: 1 }],
      pickupAccepted: true,
      location: {
        latitude: -20.78551898,
        longitude: -49.35995068,
        accuracy: 10,
        timestamp: Date.now(),
      },
      paymentMethod: "card",
      total: 1,
    });
    expect(result.name).toBe("Aluno");
    expect(result).not.toHaveProperty("total");
    expect(result.items[0]).not.toHaveProperty("price");
  });
  it("permite fluxo recebido → preparo → pronto → entregue", () => {
    expect(() => {
      assertTransition("received", "preparing");
      assertTransition("preparing", "ready");
      assertTransition("ready", "completed");
    }).not.toThrow();
  });
  it("bloqueia saltos e reabertura de estados finais", () => {
    expect(() => assertTransition("received", "completed")).toThrow();
    expect(() => assertTransition("completed", "preparing")).toThrow();
    expect(() => assertTransition("cancelled", "received")).toThrow();
  });
  it("permite cancelar somente antes do preparo", () => {
    expect(() => assertTransition("received", "cancelled")).not.toThrow();
    expect(() => assertTransition("preparing", "cancelled")).toThrow();
  });
  it("valida agendamento e horário de São Paulo", () => {
    const now = new Date("2026-10-27T15:00:00Z");
    expect(() => assertSchedule("2026-10-27T15:30:00Z", now)).not.toThrow();
    expect(() => assertSchedule("2026-10-27T15:05:00Z", now)).toThrow();
    expect(() => assertSchedule("2026-11-05T15:00:00Z", now)).toThrow();
    expect(() => assertSchedule("2026-10-31T15:00:00Z", now)).toThrow();
    expect(() => assertSchedule("2026-10-28T01:00:00Z", now)).toThrow();
  });
  it("libera expediente por opção sem remover limites de antecedência", () => {
    const now = new Date("2026-10-31T01:00:00Z");
    expect(() => assertSchedule(undefined, now, true)).not.toThrow();
    expect(() =>
      assertSchedule("2026-10-31T01:30:00Z", now, true),
    ).not.toThrow();
    expect(() => assertSchedule("2026-10-31T01:05:00Z", now, true)).toThrow(
      "Agende entre 15 minutos e 7 dias de antecedência.",
    );
    expect(() => assertSchedule("2026-11-08T01:00:00Z", now, true)).toThrow();
  });
  it("bloqueia pedido imediato fora do expediente", () =>
    expect(() =>
      assertSchedule(undefined, new Date("2026-10-31T15:00:00Z")),
    ).toThrow());
});
