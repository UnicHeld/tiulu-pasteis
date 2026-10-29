import { priceOrder, pizzaIngredients, type Product } from "./catalog.js";
export { effectivePrice, type Product } from "./catalog.js";
import { z } from "zod";
import { locationInput } from "./campus.js";
export const statuses = [
  "awaiting_arrival",
  "received",
  "preparing",
  "ready",
  "completed",
  "cancelled",
  "expired",
] as const;
export type Status = (typeof statuses)[number];
export const orderInput = z.object({
  name: z.string().trim().min(2).max(80),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
        ingredients: z
          .array(z.enum(pizzaIngredients.map((ingredient) => ingredient.id)))
          .max(3)
          .default([])
          .refine(
            (values) => new Set(values).size === values.length,
            "Ingrediente repetido.",
          ),
      }),
    )
    .min(1)
    .max(30),
  scheduledAt: z.never().optional(),
  pickupAccepted: z.literal(true),
  location: locationInput,
  paymentMethod: z.enum(["pix", "card", "verocard"]),
  notes: z.string().trim().max(300).default(""),
});
export type OrderInput = z.infer<typeof orderInput>;
export class DomainError extends Error {}
export function totalOrder(
  items: { productId: string; quantity: number; ingredients?: string[] }[],
  products: Product[],
) {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.productId)) throw new DomainError("Produto repetido.");
    ids.add(item.productId);
    const p = products.find((p) => p.id === item.productId);
    if (!p?.available || p.stock < item.quantity)
      throw new DomainError("Produto indisponível ou estoque insuficiente.");
    const ingredients = item.ingredients ?? [];
    if (ingredients.length && !p.customizable)
      throw new DomainError(
        "Ingredientes personalizados só são permitidos na mini pizza personalizada.",
      );
  }
  return priceOrder(items, products).total;
}
export function assertTransition(from: Status, to: Status) {
  const allowed: Record<Status, Status[]> = {
    awaiting_arrival: ["preparing", "cancelled", "expired"],
    received: ["preparing", "cancelled"],
    preparing: ["ready"],
    ready: ["completed"],
    completed: [],
    cancelled: [],
    expired: [],
  };
  if (!allowed[from].includes(to))
    throw new DomainError("Transição de pedido inválida.");
}
export function assertSchedule(
  scheduledAt: string | undefined,
  now = new Date(),
  allowOutsideBusinessHours = false,
) {
  const date = scheduledAt ? new Date(scheduledAt) : now;
  if (
    scheduledAt &&
    (date.getTime() < now.getTime() + 15 * 60000 ||
      date.getTime() > now.getTime() + 7 * 86400000)
  )
    throw new DomainError("Agende entre 15 minutos e 7 dias de antecedência.");
  if (allowOutsideBusinessHours) return;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  if (
    ["Sat", "Sun"].includes(get("weekday") || "") ||
    minutes < 9 * 60 ||
    minutes >= 21 * 60
  )
    throw new DomainError(
      "Atendemos de segunda a sexta, das 9h às 21h. Agende para um horário de funcionamento.",
    );
}
