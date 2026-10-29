import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ShoppingBag,
  Clock,
  ArrowRight,
  Plus,
  Minus,
  X,
  Search,
  Heart,
  CheckCircle2,
  LogOut,
  ChefHat,
  Smartphone,
  Store,
  Ticket,
  Flame,
  ChevronRight,
} from "lucide-react";
import {
  effectivePrice,
  priceOrder,
  pizzaIngredients,
  ingredientLabel,
  type Product,
} from "../domain/catalog";
import "./styles.css";
import { Modal } from "./Modal";
import { MenuProductCard } from "./MenuProductCard";
import { ComboCard } from "./ComboCard";
import { CartComboOptions, CartPizzaOptions } from "./CartChoices";
import {
  chooseCombo,
  replaceCartUnit,
  validCombo,
  canAddUnit,
  type Bag,
  type CartItems,
} from "./cart";
import { groupMenuProducts } from "./menu";
import {
  money,
  labels,
  isClosed,
  OrderSummary,
  OrderActions,
  QRScanner,
  type Order,
} from "./OrderDetails";
const managementPath =
  window.location.pathname.replace(/\/$/, "") === "/gestao";
function savedCart(): Record<string, number> {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("tiulu-cart") || "{}",
    );
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([id, quantity]) =>
          /^[a-f0-9-]{36}$/i.test(id) &&
          typeof quantity === "number" &&
          Number.isInteger(quantity) &&
          quantity > 0 &&
          quantity <= 20,
      ),
    );
  } catch {
    return {};
  }
}
function savedBag(): Bag {
  const items = savedCart();
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem("tiulu-cart-config") || "null",
    );
    if (!saved || typeof saved !== "object")
      return { items, combo: null, pizzaId: null };
    const value = saved as {
      combo?: { pastelId?: unknown; drinkId?: unknown };
      pizzaId?: unknown;
    };
    const combo =
      value.combo &&
      typeof value.combo.pastelId === "string" &&
      typeof value.combo.drinkId === "string"
        ? { pastelId: value.combo.pastelId, drinkId: value.combo.drinkId }
        : null;
    const pizzaId =
      typeof value.pizzaId === "string" && items[value.pizzaId] > 0
        ? value.pizzaId
        : null;
    return { items, combo: validCombo(items, combo) ? combo : null, pizzaId };
  } catch {
    return { items, combo: null, pizzaId: null };
  }
}
function savedPizzaChoices(): Record<string, string[]> {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem("tiulu-pizza-ingredients") || "{}",
    );
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([, choices]) =>
          Array.isArray(choices) &&
          choices.length <= 3 &&
          new Set(choices).size === choices.length &&
          choices.every((id) =>
            pizzaIngredients.some((ingredient) => ingredient.id === id),
          ),
      ),
    );
  } catch {
    return {};
  }
}
function savedTracking(): string {
  try {
    const value = localStorage.getItem("tiulu-tracking") || "";
    return /^[a-f0-9]{64}$/.test(value) ? value : "";
  } catch {
    return "";
  }
}
class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
type User = { name: string; isAdmin: boolean; points: number };
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await response.json();
  if (!response.ok)
    throw new ApiError(body.error || "Falha na conexão.", response.status);
  return body;
}
function App() {
  const [products, setProducts] = useState<Product[]>([]),
    [user, setUser] = useState<User | null>(null),
    [google, setGoogle] = useState(false),
    [category, setCategory] = useState("Promoções"),
    [search, setSearch] = useState(""),
    [bag, setBag] = useState(savedBag),
    [pizzaChoices, setPizzaChoices] = useState(savedPizzaChoices),
    [modal, setModal] = useState<string | null>(null),
    [view, setView] = useState("menu"),
    [orders, setOrders] = useState<Order[]>([]),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [selectedOrder, setSelectedOrder] = useState<Order | null>(null),
    [orderFilter, setOrderFilter] = useState("active"),
    [trackingInput, setTrackingInput] = useState(savedTracking),
    [tracking, setTracking] = useState(""),
    [trackingRequest, setTrackingRequest] = useState(0),
    [tracked, setTracked] = useState<Order | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [install, setInstall] = useState<
      (Event & { prompt: () => Promise<void> }) | null
    >(null);
  const cart = bag.items;
  const activePizza = products.find(
    (p) => p.id === bag.pizzaId && p.category === "Mini pizza" && cart[p.id],
  );
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const { subtotal, discount, total } = priceOrder(
    Object.entries(cart).map(([productId, quantity]) => ({
      productId,
      quantity,
    })),
    products,
  );
  const refreshMenu = () =>
    api<{ products: Product[] }>("/menu").then((r) => setProducts(r.products));
  const refreshUser = () =>
    api<{ user: User | null; googleEnabled: boolean }>("/me").then((r) => {
      setUser(r.user);
      setGoogle(r.googleEnabled);
      if (managementPath) {
        if (r.user?.isAdmin) {
          setView("admin");
          setModal(null);
        } else setModal("admin");
      }
    });
  useEffect(() => {
    Promise.all([refreshMenu(), refreshUser()]).catch((e) =>
      setError(e.message),
    );
    const handler = (event: Event) => {
      event.preventDefault();
      setInstall(event as Event & { prompt: () => Promise<void> });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  useEffect(() => {
    if (!tracking || modal !== "tracking") return;
    let active = true;
    const refresh = () =>
      api<Order>("/orders/track/" + encodeURIComponent(tracking))
        .then((r) => {
          if (!active) return;
          setTracked(r);
          try {
            localStorage.setItem("tiulu-tracking", tracking);
          } catch {
            /* A consulta continua disponível sem persistência no navegador. */
          }
        })
        .catch((e) => {
          if (!active) return;
          if (e instanceof ApiError && e.status === 404) {
            setTracked(null);
            setTracking("");
            setTrackingInput("");
            try {
              localStorage.removeItem("tiulu-tracking");
            } catch {
              /* A referência inválida também foi removida da memória. */
            }
            setError(
              "Pedido não encontrado. O código antigo foi removido deste navegador. Consulte seus pedidos pela conta ou informe outro código.",
            );
          } else setError(e.message);
        });
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [tracking, trackingRequest, modal]);
  useEffect(() => {
    if (view !== "orders" && view !== "admin") return;
    let active = true;
    const refresh = () =>
      api<Order[]>("/orders")
        .then((value) => {
          if (active) setOrders(value);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [view]);
  useEffect(() => {
    try {
      localStorage.setItem("tiulu-cart", JSON.stringify(cart));
      localStorage.setItem(
        "tiulu-cart-config",
        JSON.stringify({ combo: bag.combo, pizzaId: bag.pizzaId }),
      );
      localStorage.setItem(
        "tiulu-pizza-ingredients",
        JSON.stringify(pizzaChoices),
      );
    } catch {
      /* Navegadores podem desabilitar persistência. A sacola segue em memória. */
    }
  }, [cart, bag.combo, bag.pizzaId, pizzaChoices]);
  useEffect(() => {
    if (!selectedId || !user || modal !== "order") return;
    let active = true;
    const refresh = () =>
      api<Order>("/orders/" + selectedId)
        .then((o) => {
          if (active) setSelectedOrder(o);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selectedId, user, modal]);
  function showOrder(id: string) {
    setSelectedOrder(null);
    setSelectedId(id);
    setModal("order");
  }
  function updateItems(change: (items: CartItems) => CartItems) {
    setBag((old) => {
      const items = change(old.items);
      return {
        ...old,
        items,
        combo: validCombo(items, old.combo) ? old.combo : null,
        pizzaId: old.pizzaId && items[old.pizzaId] > 0 ? old.pizzaId : null,
      };
    });
  }
  function add(p: Product, delta = 1) {
    updateItems((old) =>
      delta > 0 && !canAddUnit(old, p)
        ? old
        : { ...old, [p.id]: Math.max(0, (old[p.id] || 0) + delta) },
    );
  }
  function openCombo(another = false) {
    if (!chooseCombo(bag, products, another)) {
      setError("Não há estoque dos dois itens para montar este combo agora.");
      return;
    }
    setBag((old) => chooseCombo(old, products, another) ?? old);
    setModal("cart");
  }
  function changeCombo(pastel: Product, drink: Product) {
    setBag((old) => {
      if (!old.combo || !validCombo(old.items, old.combo)) return old;
      const withPastel = replaceCartUnit(old.items, old.combo.pastelId, pastel);
      const items =
        withPastel && replaceCartUnit(withPastel, old.combo.drinkId, drink);
      return items
        ? { ...old, items, combo: { pastelId: pastel.id, drinkId: drink.id } }
        : old;
    });
  }
  function openPizza(product: Product) {
    if (!cart[product.id] && !canAddUnit(cart, product)) return;
    setBag((old) => ({
      ...old,
      items: old.items[product.id]
        ? old.items
        : { ...old.items, [product.id]: 1 },
      pizzaId: product.id,
    }));
    setModal("cart");
  }
  function changePizza(product: Product) {
    setBag((old) => {
      if (!old.pizzaId) return old;
      const items = replaceCartUnit(old.items, old.pizzaId, product);
      return items ? { ...old, items, pizzaId: product.id } : old;
    });
  }
  async function perform(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }
  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await perform(async () => {
      if (!user) {
        setModal("login");
        return;
      }
      const location = await new Promise<{
        latitude: number;
        longitude: number;
        accuracy: number;
        timestamp: number;
      }>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(
            new Error(
              "Este navegador não oferece localização. Use um navegador com localização para pedir no campus.",
            ),
          );
          return;
        }
        navigator.geolocation.getCurrentPosition(
          ({ coords, timestamp }) =>
            resolve({
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy,
              timestamp,
            }),
          (error) =>
            reject(
              new Error(
                error.code === 1
                  ? "Permita o acesso à localização nas configurações do navegador para pedir no campus."
                  : "Não foi possível obter sua localização. Ative a localização precisa e tente novamente.",
              ),
            ),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
        );
      });
      const result = await api<{ id: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          items: Object.entries(cart)
            .filter(([, quantity]) => quantity > 0)
            .map(([productId, quantity]) => ({
              productId,
              quantity,
              ingredients: pizzaChoices[productId] || [],
            })),
          notes: data.get("notes"),
          paymentMethod: data.get("paymentMethod"),
          pickupAccepted: data.get("pickupAccepted") === "on",
          location,
        }),
      });
      setBag({ items: {}, combo: null, pizzaId: null });
      setPizzaChoices({});
      setView("orders");
      showOrder(result.id);
      await refreshMenu();
    });
  }
  async function updateOrder(id: string, body: object) {
    await perform(async () => {
      await api("/admin/orders/" + id, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setOrders(await api<Order[]>("/orders"));
      if (selectedId)
        setSelectedOrder(await api<Order>("/orders/" + selectedId));
      await refreshMenu();
    });
  }
  const filtered = groupMenuProducts(products).filter((group) =>
    group.variants.some(
      (p) =>
        (category === "Todos" ||
          (category === "Promoções"
            ? Boolean(p.sale_price)
            : category === "Favoritos"
              ? p.featured
              : p.category === category)) &&
        p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    ),
  );
  const showCombo =
    category === "Promoções" &&
    !search.trim() &&
    products.some((p) => p.combo_size);
  return (
    <>
      <div className="topline">
        Feito na hora, com carinho. Do primeiro ao último pedacinho.{" "}
        <Heart size={12} />
      </div>
      <header>
        <a className="brand" href="/" aria-label="Tiulu início">
          <span className="brand-icon">◒</span>
          <span>
            tiulu<span className="brand-sub">PASTÉIS & BONS MOMENTOS</span>
          </span>
        </a>
        <nav aria-label="Menu principal">
          <button
            className={view === "menu" ? "active" : ""}
            onClick={() => setView("menu")}
          >
            Cardápio
          </button>
          <button
            onClick={() =>
              user
                ? setView(user.isAdmin ? "admin" : "orders")
                : setModal("login")
            }
          >
            Meus pedidos
          </button>
          <button onClick={() => setModal("loyalty")}>
            Fidelidade <span className="new">NOVO</span>
          </button>
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <button
                className="login"
                onClick={() => setView(user.isAdmin ? "admin" : "orders")}
              >
                {user.isAdmin ? <ChefHat size={18} /> : <Heart size={18} />}{" "}
                {user.isAdmin ? "Painel" : user.name.split(" ")[0]}
              </button>
              <button
                aria-label="Sair"
                onClick={() =>
                  perform(async () => {
                    await api("/auth/logout", { method: "POST" });
                    setUser(null);
                    setOrders([]);
                    setSelectedId(null);
                    setSelectedOrder(null);
                    setModal(null);
                    setView("menu");
                  })
                }
              >
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <button className="login" onClick={() => setModal("login")}>
              Entrar <ArrowRight size={16} />
            </button>
          )}
          <button
            className="bag"
            onClick={() => setModal("cart")}
            aria-label={`Sacola com ${count} itens`}
          >
            <ShoppingBag size={19} />
            <span>{count}</span>
          </button>
        </div>
      </header>
      <main>
        {view === "menu" ? (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span /> SEU INTERVALO FICOU MAIS GOSTOSO
                </div>
                <h1>
                  Tá na hora
                  <br />
                  de um <span>pastel.</span>
                  <svg viewBox="0 0 250 15" aria-hidden="true">
                    <path d="M3 10Q120 -4 245 9" />
                  </svg>
                </h1>
                <p>
                  Crocante, quentinho e com recheio de verdade.
                  <br />
                  Peça de onde estiver no IBILCE e passe para retirar quando
                  estiver pronto.
                </p>
                <a className="primary" href="#cardapio">
                  Bora escolher o meu <ArrowRight size={18} />
                </a>
                <div className="hero-details">
                  <span>
                    <Clock size={16} /> Retirada no balcão
                  </span>
                  <i />{" "}
                  <span>
                    <CheckCircle2 size={16} /> Preparo antes da sua chegada
                  </span>
                </div>
              </div>
              <div
                className="hero-art"
                role="img"
                aria-label="Ilustração de pastéis dourados em um prato vermelho"
              >
                <span className="scribble">
                  massa crocante,
                  <br />
                  recheio caprichado! ↴
                </span>
                <div className="plate">
                  <div className="pastry pastry-back" />
                  <div className="pastry pastry-front" />
                </div>
                <span className="spark spark-one">✦</span>
                <span className="spark spark-two">✧</span>
                <div className="fresh">
                  <Flame size={20} />
                  <span>
                    FEITO NA HORA<strong>Bom demais!</strong>
                  </span>
                </div>
                <span className="art-caption">
                  O clássico que salva o seu dia.
                </span>
              </div>
            </section>
            <section className="info-bar">
              <span>
                <Store size={19} />
                <strong>Seu ponto de encontro</strong>
                <small>Peça no campus e acompanhe o preparo</small>
              </span>
              <span>
                <Clock size={19} />
                <strong>Seg a sex · 9h às 21h</strong>
                <small>Confira o horário antes de pedir</small>
              </span>
              <span>
                <Ticket size={19} />
                <strong>Pix ou cartão na retirada</strong>
                <small>Pague no balcão ao retirar</small>
              </span>
            </section>
            <section id="cardapio" className="menu-section">
              <div className="section-heading">
                <div>
                  <h2>
                    {category === "Promoções"
                      ? "Promoções"
                      : category === "Todos"
                        ? "Nosso cardápio"
                        : category === "Favoritos"
                          ? "Mais pedidos"
                          : category}
                  </h2>
                  <p>
                    {category === "Promoções"
                      ? "Uma dupla boa demais para deixar passar."
                      : "Escolha o que combina com a sua fome."}
                  </p>
                </div>
                <label className="search">
                  <Search size={18} />
                  <input
                    aria-label="Buscar no cardápio"
                    placeholder="Buscar um sabor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              <div className="filters" role="group" aria-label="Categorias">
                {[
                  ["Promoções", "%"],
                  ["Todos", "✦"],
                  ["Pastéis", "🥟"],
                  ["Salgados", "🍗"],
                  ["Mini pizza", "🍕"],
                  ["Doces", "🍫"],
                  ["Bebidas", "🥤"],
                  ["Favoritos", "♡"],
                ].map(([c, icon]) => (
                  <button
                    key={c}
                    className={category === c ? "selected" : ""}
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                  >
                    {icon} {c === "Favoritos" ? "Mais pedidos" : c}
                  </button>
                ))}
              </div>
              {showCombo && (
                <ComboCard
                  available={Boolean(chooseCombo(bag, products))}
                  onChoose={() => openCombo()}
                />
              )}
              <div className="product-grid">
                {filtered.map((product) => (
                  <MenuProductCard
                    key={product.key}
                    product={product}
                    cart={cart}
                    add={add}
                    onConfigure={openPizza}
                  />
                ))}
              </div>
              {!filtered.length && !showCombo && (
                <p className="empty">
                  Nenhum sabor encontrado. Tente outra busca.
                </p>
              )}
            </section>
            <section className="loyalty-banner">
              <span className="loyalty-icon">
                <Heart size={32} />
              </span>
              <div>
                <span className="eyebrow">QUEM VOLTA, GANHA CARINHO</span>
                <h2>Seu pastel pode render mais.</h2>
                <p>Entre na sua conta e acompanhe os pedidos concluídos.</p>
              </div>
              <button onClick={() => setModal("loyalty")}>
                Conhecer a fidelidade <ArrowRight size={18} />
              </button>
            </section>
          </>
        ) : (
          <section className="workspace">
            <div className="section-heading">
              <div>
                <div className="eyebrow red">
                  {view === "admin" ? "ÁREA DO PASTELEIRO" : "SUA CONTA"}
                </div>
                <h1>
                  {view === "admin" ? "Cozinha em movimento." : "Seus pedidos."}
                </h1>
                <p>
                  {view === "admin"
                    ? "Prepare os pedidos recebidos e confirme o pagamento na retirada. "
                    : "Peça pelo campus e acompanhe até ficar pronto para retirar. "}
                  Atualizamos a cada 10 segundos.
                </p>
              </div>
              <button className="outline" onClick={() => setView("menu")}>
                Voltar ao cardápio
              </button>
            </div>
            {view === "admin" && (
              <>
                <QRScanner onRead={showOrder} />
                <div className="stats">
                  <div>
                    Pedidos ativos
                    <strong>
                      {orders.filter((o) => !isClosed(o.status)).length}
                    </strong>
                  </div>
                  <div>
                    Recebido · últimos 100 pedidos
                    <strong>
                      {money(
                        orders
                          .filter(
                            (o) =>
                              o.payment_status === "paid" &&
                              o.status !== "cancelled",
                          )
                          .reduce((s, o) => s + o.total, 0),
                      )}
                    </strong>
                  </div>
                  <div>
                    Prontos para retirar
                    <strong>
                      {orders.filter((o) => o.status === "ready").length}
                    </strong>
                  </div>
                </div>
                <details className="inventory">
                  <summary>Gerenciar estoque e promoções</summary>
                  {products.map((p) => (
                    <form
                      key={p.id}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        perform(async () => {
                          await api("/admin/products/" + p.id, {
                            method: "PATCH",
                            body: JSON.stringify({
                              available: data.get("available") === "on",
                              stock: Number(data.get("stock")),
                              salePrice: data.get("salePrice")
                                ? Math.round(
                                    Number(data.get("salePrice")) * 100,
                                  )
                                : null,
                            }),
                          });
                          await refreshMenu();
                          setNotice("Estoque atualizado.");
                        });
                      }}
                    >
                      <strong>{p.name}</strong>
                      <label>
                        <input
                          type="checkbox"
                          name="available"
                          defaultChecked={p.available}
                        />{" "}
                        Disponível
                      </label>
                      <label>
                        Estoque{" "}
                        <input
                          type="number"
                          min="0"
                          max="10000"
                          name="stock"
                          defaultValue={p.stock}
                        />
                      </label>
                      <label>
                        Promoção R${" "}
                        <input
                          name="salePrice"
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={(p.price - 1) / 100}
                          defaultValue={p.sale_price ? p.sale_price / 100 : ""}
                          placeholder="Sem"
                        />
                      </label>
                      <button className="outline" disabled={busy}>
                        Salvar
                      </button>
                    </form>
                  ))}
                </details>
              </>
            )}
            <div
              className="filters order-filters"
              role="group"
              aria-label="Filtrar pedidos"
            >
              {[
                ["active", "Em andamento"],
                ["closed", "Finalizados"],
                ["all", "Todos"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={orderFilter === value ? "selected" : ""}
                  onClick={() => setOrderFilter(value)}
                >
                  {label} ·{" "}
                  {
                    orders.filter(
                      (o) =>
                        value === "all" ||
                        (value === "closed"
                          ? isClosed(o.status)
                          : !isClosed(o.status)),
                    ).length
                  }
                </button>
              ))}
            </div>
            {orders.filter(
              (o) =>
                orderFilter === "all" ||
                (orderFilter === "closed"
                  ? isClosed(o.status)
                  : !isClosed(o.status)),
            ).length === 0 && (
              <p className="empty">
                Nenhum pedido nesta lista. Escolha seu pastel no cardápio e
                envie seu pedido para retirada.
              </p>
            )}
            <div className="orders-grid">
              {orders
                .filter(
                  (o) =>
                    orderFilter === "all" ||
                    (orderFilter === "closed"
                      ? isClosed(o.status)
                      : !isClosed(o.status)),
                )
                .map((o) => (
                  <article className="order-card" key={o.id}>
                    {view === "admin" && <h3>{o.customer_name}</h3>}
                    <OrderSummary order={o} />
                    <button
                      className="outline full"
                      onClick={() => showOrder(o.id)}
                    >
                      {o.status === "awaiting_arrival"
                        ? "Ver pedido e QR Code"
                        : "Ver detalhes do pedido"}
                    </button>
                    {view === "admin" && (
                      <OrderActions
                        order={o}
                        busy={busy}
                        update={updateOrder}
                      />
                    )}
                  </article>
                ))}
            </div>
          </section>
        )}
      </main>
      <footer>
        <a className="brand" href="/">
          ◒ tiulu<span className="brand-sub">PASTÉIS & BONS MOMENTOS</span>
        </a>
        <p>Um bom pastel. Um intervalo melhor.</p>
        <a
          className="photo-credits"
          href="/images/creditos.html"
          target="_blank"
          rel="noreferrer"
        >
          Créditos das fotos
        </a>
        <button
          onClick={() =>
            install
              ? install.prompt()
              : setNotice(
                  "No navegador, use “Instalar aplicativo” ou “Adicionar à tela inicial”.",
                )
          }
        >
          <Smartphone size={16} /> Instalar Tiulu
        </button>
      </footer>
      {count > 0 && (
        <button className="floating-cart" onClick={() => setModal("cart")}>
          <ShoppingBag size={18} /> Ver sacola · {count}{" "}
          {count === 1 ? "item" : "itens"}
          <strong>{money(total)}</strong>
          <ChevronRight size={18} />
        </button>
      )}
      {error && (
        <div className="toast error" role="alert">
          {error}
          <button aria-label="Fechar erro" onClick={() => setError("")}>
            <X size={17} />
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="Fechar aviso" onClick={() => setNotice("")}>
            <X size={17} />
          </button>
        </div>
      )}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal === "cart" && (
            <>
              <span className="eyebrow red">QUASE NA HORA DO PASTEL</span>
              <h2>Sua sacola</h2>
              {count === 0 ? (
                <p>Sua sacola está esperando um pastel. Escolha no cardápio!</p>
              ) : (
                <form onSubmit={checkout}>
                  {bag.combo && validCombo(cart, bag.combo) && (
                    <CartComboOptions
                      products={products}
                      cart={cart}
                      combo={bag.combo}
                      onChange={changeCombo}
                      onAddAnother={() => openCombo(true)}
                    />
                  )}
                  {activePizza && (
                    <CartPizzaOptions
                      products={products}
                      cart={cart}
                      pizza={activePizza}
                      onChange={changePizza}
                      ingredients={pizzaChoices[activePizza.id] || []}
                      setIngredients={(choices) =>
                        setPizzaChoices((old) => ({
                          ...old,
                          [activePizza.id]: choices,
                        }))
                      }
                    />
                  )}
                  {products
                    .filter((p) => cart[p.id])
                    .map((p) => (
                      <div className="cart-line" key={p.id}>
                        <span>
                          {p.name}
                          <small>{money(effectivePrice(p))}</small>
                          {p.category === "Mini pizza" && (
                            <button
                              type="button"
                              className="edit-item"
                              onClick={() =>
                                setBag((old) => ({ ...old, pizzaId: p.id }))
                              }
                            >
                              Editar mini pizza
                            </button>
                          )}
                          {p.customizable && (
                            <small>
                              Molho de tomate
                              {pizzaChoices[p.id]?.length
                                ? " + " +
                                  pizzaChoices[p.id]
                                    .map(ingredientLabel)
                                    .join(", ")
                                : " (sem ingredientes extras)"}
                            </small>
                          )}
                        </span>
                        <div className="quantity">
                          <button
                            type="button"
                            aria-label="Diminuir"
                            onClick={() => add(p, -1)}
                          >
                            <Minus size={15} />
                          </button>
                          {cart[p.id]}
                          <button
                            type="button"
                            aria-label="Aumentar"
                            disabled={!canAddUnit(cart, p)}
                            onClick={() => add(p)}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {discount > 0 && (
                    <div className="order-discount">
                      <p>
                        Subtotal <strong>{money(subtotal)}</strong>
                      </p>
                      <p>
                        Desconto dos combos <strong>−{money(discount)}</strong>
                      </p>
                    </div>
                  )}
                  <div className="cart-total">
                    Total <strong>{money(total)}</strong>
                  </div>
                  <label>
                    Nome para retirada
                    <input
                      name="name"
                      required
                      minLength={2}
                      maxLength={80}
                      defaultValue={user?.name}
                      autoComplete="name"
                    />
                  </label>
                  <div className="counter-notice">
                    <strong>Peça agora e retire quando estiver pronto</strong>
                    <p>
                      O preparo pode começar após o envio. Retire no Tiulu
                      Pastéis, nos fundos da ASTAIBILCE, no IBILCE/UNESP em São
                      José do Rio Preto.
                    </p>
                    <p>
                      Ao enviar, permita sua localização para confirmar que está
                      no campus. Sua posição é usada apenas nesta verificação e
                      não é armazenada.
                    </p>
                  </div>
                  <label>
                    Pagamento na retirada
                    <select name="paymentMethod">
                      <option value="pix">Pix no balcão</option>
                      <option value="card">Cartão na maquininha</option>
                    </select>
                  </label>
                  <label>
                    Alguma observação?
                    <textarea
                      name="notes"
                      maxLength={300}
                      placeholder="Ex.: sem azeitona"
                    />
                  </label>
                  <p className="muted">
                    Nenhum valor será cobrado pelo site. Confirme o pagamento
                    diretamente no balcão.
                  </p>
                  <label className="pickup-accept">
                    <input name="pickupAccepted" type="checkbox" required />
                    Estou ciente de que a retirada é pessoal no balcão dentro do
                    campus, sem entrega ou retirada por motofrete.
                  </label>
                  {user ? (
                    <button className="primary full" disabled={busy}>
                      {busy
                        ? "Verificando localização e enviando…"
                        : "Fazer pedido para retirada"}
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="primary full"
                      onClick={() => setModal("login")}
                    >
                      Entrar para registrar o pedido
                      <ArrowRight size={18} />
                    </button>
                  )}
                </form>
              )}
            </>
          )}
          {modal === "order" && (
            <>
              <span className="eyebrow red">
                SEU INTERVALO COM PASTEL QUENTINHO
              </span>
              <h2>{user?.isAdmin ? "Conferir pedido" : "Seu pedido"}</h2>
              {selectedOrder ? (
                <>
                  {user?.isAdmin && <h3>{selectedOrder.customer_name}</h3>}
                  <OrderSummary
                    order={selectedOrder}
                    detailed
                    showQR={!user?.isAdmin}
                  />
                  {user?.isAdmin && (
                    <OrderActions
                      order={selectedOrder}
                      busy={busy}
                      update={updateOrder}
                    />
                  )}
                </>
              ) : (
                <p role="status">Carregando pedido…</p>
              )}
            </>
          )}
          {modal === "tracking" && (
            <>
              <span className="eyebrow red">
                DO PREPARO AO PRIMEIRO PEDACINHO
              </span>
              <h2>Acompanhe seu pedido</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = String(
                    new FormData(e.currentTarget).get("token"),
                  ).trim();
                  if (!/^[a-f0-9]{64}$/.test(value)) {
                    setError("Informe o código completo de acompanhamento.");
                    return;
                  }
                  setError("");
                  setTracked(null);
                  setTracking(value);
                  setTrackingRequest((request) => request + 1);
                }}
              >
                <label>
                  Código de acompanhamento
                  <input
                    name="token"
                    value={trackingInput}
                    onChange={(event) => setTrackingInput(event.target.value)}
                    required
                    maxLength={64}
                  />
                </label>
                <button className="outline">Consultar</button>
              </form>
              {tracked && (
                <>
                  <h3>
                    Pedido #{tracked.id.slice(0, 8)} · {tracked.customer_name}
                  </h3>
                  <p>
                    {money(tracked.total)} ·{" "}
                    {tracked.payment_status === "paid"
                      ? "Pagamento confirmado"
                      : "Pague na retirada"}
                  </p>
                  {Boolean(tracked.discount_total) && (
                    <p>
                      Desconto dos combos: −{money(tracked.discount_total || 0)}
                    </p>
                  )}
                  {tracked.scheduled_at && (
                    <p>
                      Retirada:{" "}
                      {new Date(tracked.scheduled_at).toLocaleString("pt-BR")}
                    </p>
                  )}
                  <div className="timeline">
                    {["received", "preparing", "ready", "completed"].map(
                      (s, i) => (
                        <div
                          key={s}
                          className={
                            [
                              "received",
                              "preparing",
                              "ready",
                              "completed",
                            ].indexOf(tracked.status) >= i
                              ? "done"
                              : ""
                          }
                        >
                          <CheckCircle2 size={21} />
                          {labels[s]}
                        </div>
                      ),
                    )}
                  </div>
                  {tracked.status === "cancelled" && (
                    <p>Este pedido foi cancelado.</p>
                  )}
                  {tracked.items?.map((i, index) => (
                    <p key={index}>
                      {i.quantity}× {i.name}
                      {Boolean(i.ingredients?.length) && (
                        <small> · {i.ingredients?.join(", ")}</small>
                      )}
                    </p>
                  ))}
                  <button
                    className="outline"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(tracking)
                        .then(() =>
                          setNotice(
                            "Código copiado. Guarde para acompanhar em outro aparelho.",
                          ),
                        )
                        .catch(() =>
                          setError("Copie o código pelo campo acima."),
                        );
                    }}
                  >
                    Copiar código de acompanhamento
                  </button>
                  <p className="muted">
                    Guarde este código em segurança. Quem tiver acesso a ele
                    poderá consultar o pedido. Atualizamos a cada 10 segundos.
                  </p>
                </>
              )}
            </>
          )}
          {(modal === "login" || modal === "loyalty") && (
            <>
              <div className="modal-symbol">
                <Heart size={34} />
              </div>
              <h2>
                {modal === "loyalty"
                  ? "Bom te ver por aqui."
                  : "Seu intervalo, do seu jeito."}
              </h2>
              <p>
                Entre para fazer pedidos no campus, retirar no Tiulu e
                acompanhar o preparo.
              </p>
              <button className="outline" onClick={() => setModal("tracking")}>
                Consultar pedido antigo por código
              </button>
              {user ? (
                <>
                  <p className="points">
                    {user.points} <span>pedidos concluídos e pagos</span>
                  </p>
                  <p>
                    A contagem de fidelidade já está disponível. Regras de
                    resgate e recompensas serão definidas pelo Tiulu.
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      setModal(null);
                      setView(user.isAdmin ? "admin" : "orders");
                    }}
                  >
                    Ver meus pedidos
                  </button>
                </>
              ) : (
                <>
                  <a
                    className={"google " + (!google ? "disabled" : "")}
                    href={google ? "/api/auth/google" : undefined}
                  >
                    G{" "}
                    <span>
                      {google
                        ? "Continuar com Google"
                        : "Google ainda não configurado"}
                    </span>
                  </a>
                  <p className="muted">
                    Entre para registrar seu pedido. Sua sacola fica guardada
                    neste aparelho durante o login.
                  </p>
                </>
              )}
            </>
          )}
          {modal === "admin" && (
            <>
              <ChefHat className="red" size={36} />
              <h2>Área do pasteleiro</h2>
              <p>
                Use sua conta Google autorizada ou a senha de gestão configurada
                no servidor.
              </p>
              {google && (
                <a className="google" href="/api/auth/google">
                  Continuar com Google
                </a>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const password = new FormData(e.currentTarget).get(
                    "password",
                  );
                  perform(async () => {
                    await api("/auth/admin", {
                      method: "POST",
                      body: JSON.stringify({ password }),
                    });
                    await refreshUser();
                    setView("admin");
                    setModal(null);
                  });
                }}
              >
                <label>
                  Senha de gestão
                  <input
                    type="password"
                    name="password"
                    required
                    autoComplete="current-password"
                  />
                </label>
                <button className="primary full" disabled={busy}>
                  Entrar no painel <ArrowRight size={17} />
                </button>
              </form>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
if ("serviceWorker" in navigator && import.meta.env.PROD)
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => console.warn("Service worker indisponível."));
  });
