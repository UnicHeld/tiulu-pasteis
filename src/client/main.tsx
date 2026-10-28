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
  Store,
  Heart,
  CheckCircle2,
  LogOut,
  ChefHat,
  Smartphone,
  Flame,
  Ticket,
  ChevronRight,
} from "lucide-react";
import { effectivePrice, type Product } from "../domain/catalog";
import "./styles.css";
import { Modal } from "./Modal";
const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n / 100,
  );
const labels: Record<string, string> = {
  received: "Recebido",
  preparing: "Em preparo",
  ready: "Pronto para retirar",
  completed: "Entregue",
  cancelled: "Cancelado",
};
type Order = {
  id: string;
  customer_name: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  scheduled_at: string | null;
  created_at: string;
  notes?: string;
  items?: { name: string; quantity: number; unit_price: number }[];
};
type User = { name: string; isAdmin: boolean; points: number };
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Falha na conexão.");
  return body;
}
function App() {
  const [products, setProducts] = useState<Product[]>([]),
    [user, setUser] = useState<User | null>(null),
    [google, setGoogle] = useState(false),
    [category, setCategory] = useState("Todos"),
    [search, setSearch] = useState(""),
    [cart, setCart] = useState<Record<string, number>>({}),
    [modal, setModal] = useState<string | null>(null),
    [view, setView] = useState("menu"),
    [orders, setOrders] = useState<Order[]>([]),
    [tracking, setTracking] = useState(
      () => localStorage.getItem("tiulu-tracking") || "",
    ),
    [tracked, setTracked] = useState<Order | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [install, setInstall] = useState<
      (Event & { prompt: () => Promise<void> }) | null
    >(null);
  const count = Object.values(cart).reduce((a, b) => a + b, 0),
    total = products.reduce(
      (sum, p) => sum + effectivePrice(p) * (cart[p.id] || 0),
      0,
    );
  const refreshMenu = () =>
    api<{ products: Product[] }>("/menu").then((r) => setProducts(r.products));
  const refreshUser = () =>
    api<{ user: User | null; googleEnabled: boolean }>("/me").then((r) => {
      setUser(r.user);
      setGoogle(r.googleEnabled);
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
    if (!tracking) return;
    let active = true;
    const refresh = () =>
      api<Order>("/orders/track/" + encodeURIComponent(tracking))
        .then((r) => {
          if (active) setTracked(r);
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
  }, [tracking]);
  useEffect(() => {
    if (view !== "orders" && view !== "admin") return;
    const refresh = () =>
      api<Order[]>("/orders")
        .then(setOrders)
        .catch((e) => setError(e.message));
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, [view]);
  function add(p: Product, delta = 1) {
    setCart((old) => ({
      ...old,
      [p.id]: Math.max(0, Math.min(20, p.stock, (old[p.id] || 0) + delta)),
    }));
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
      const scheduled = data.get("scheduledAt") as string;
      const result = await api<{ token: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          items: Object.entries(cart)
            .filter(([, quantity]) => quantity > 0)
            .map(([productId, quantity]) => ({ productId, quantity })),
          notes: data.get("notes"),
          paymentMethod: data.get("paymentMethod"),
          ...(scheduled
            ? { scheduledAt: new Date(scheduled).toISOString() }
            : {}),
        }),
      });
      localStorage.setItem("tiulu-tracking", result.token);
      setTracking(result.token);
      setCart({});
      setModal("tracking");
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
    });
  }
  const filtered = products.filter(
    (p) =>
      (category === "Todos" ||
        (category === "Promoções"
          ? Boolean(p.sale_price)
          : category === "Favoritos"
            ? p.featured
            : p.category === category)) &&
      p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
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
          <button onClick={() => setModal("tracking")}>
            Acompanhar pedido
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
                  Peça por aqui e aproveite seu intervalo sem fila.
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
                    <CheckCircle2 size={16} /> Pedido sem cadastro
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
                <small>Retire direto no balcão</small>
              </span>
              <span>
                <Clock size={19} />
                <strong>Seg a sex · 9h às 21h</strong>
                <small>Confira o horário antes de pedir</small>
              </span>
              <span>
                <Ticket size={19} />
                <strong>Pix ou cartão na retirada</strong>
                <small>Simples, rápido e sem mensalidade</small>
              </span>
            </section>
            <section id="cardapio" className="menu-section">
              <div className="section-heading">
                <div>
                  <div className="eyebrow red">
                    ESCOLHA SEU PRÓXIMO FAVORITO
                  </div>
                  <h2>
                    O que vai ser hoje? <span>😋</span>
                  </h2>
                  <p>Tem um pastel perfeito para a sua fome.</p>
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
                  "Todos",
                  "Salgados",
                  "Doces",
                  "Bebidas",
                  "Favoritos",
                  "Promoções",
                ].map((c, i) => (
                  <button
                    key={c}
                    className={category === c ? "selected" : ""}
                    onClick={() => setCategory(c)}
                  >
                    {["✦", "🥟", "🍫", "🥤", "♡", "%"][i]}{" "}
                    {c === "Favoritos" ? "Mais pedidos" : c}
                  </button>
                ))}
              </div>
              <div className="product-grid">
                {filtered.map((p) => (
                  <article className="product" key={p.id}>
                    <div
                      className={
                        "product-art " +
                        (p.category === "Bebidas"
                          ? "drink"
                          : p.category === "Doces"
                            ? "sweet"
                            : "")
                      }
                    >
                      <span className="food-emoji">{p.emoji}</span>
                      {p.featured && (
                        <span className="popular">
                          <Flame size={12} /> QUERIDINHO
                        </span>
                      )}
                      {(!p.available || p.stock === 0) && (
                        <span className="sold-out">Esgotado</span>
                      )}
                    </div>
                    <div className="product-body">
                      <h3>{p.name}</h3>
                      <p>{p.description}</p>
                      <div className="product-bottom">
                        <strong>
                          {p.sale_price && (
                            <del className="original-price">
                              {money(p.price)}
                            </del>
                          )}
                          {money(effectivePrice(p))}
                        </strong>
                        {cart[p.id] ? (
                          <div className="quantity">
                            <button
                              aria-label={"Remover " + p.name}
                              onClick={() => add(p, -1)}
                            >
                              <Minus size={15} />
                            </button>
                            <span>{cart[p.id]}</span>
                            <button
                              aria-label={"Adicionar " + p.name}
                              onClick={() => add(p)}
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="add"
                            disabled={!p.available || p.stock === 0}
                            aria-label={"Adicionar " + p.name}
                            onClick={() => add(p)}
                          >
                            <Plus size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {!filtered.length && (
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
                <p>Atualização automática a cada 10 segundos.</p>
              </div>
              <button className="outline" onClick={() => setView("menu")}>
                Voltar ao cardápio
              </button>
            </div>
            {view === "admin" && (
              <>
                <div className="stats">
                  <div>
                    Pedidos ativos
                    <strong>
                      {
                        orders.filter(
                          (o) => !["completed", "cancelled"].includes(o.status),
                        ).length
                      }
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
            {orders.length === 0 && (
              <p className="empty">Os pedidos aparecerão aqui.</p>
            )}
            <div className="orders-grid">
              {orders.map((o) => (
                <article className="order-card" key={o.id}>
                  <div className="order-title">
                    <strong>#{o.id.slice(0, 8)}</strong>
                    <span className={"status " + o.status}>
                      {labels[o.status]}
                    </span>
                  </div>
                  <h3>{o.customer_name}</h3>
                  <p>
                    {new Date(o.created_at).toLocaleString("pt-BR")} ·{" "}
                    {money(o.total)}
                  </p>
                  <p>
                    {o.scheduled_at
                      ? "Agendado: " +
                        new Date(o.scheduled_at).toLocaleString("pt-BR")
                      : "Retirada assim que ficar pronto"}
                  </p>
                  <p>
                    {o.payment_method.toUpperCase()} ·{" "}
                    {o.payment_status === "paid"
                      ? "Pago"
                      : "Pagamento pendente na retirada"}
                  </p>
                  {o.notes && <p>Observações: {o.notes}</p>}
                  {view === "admin" && (
                    <>
                      <button
                        className="outline"
                        onClick={() =>
                          perform(async () => {
                            const items = await api<
                              NonNullable<Order["items"]>
                            >("/admin/orders/" + o.id + "/items");
                            setOrders((old) =>
                              old.map((x) =>
                                x.id === o.id ? { ...x, items } : x,
                              ),
                            );
                          })
                        }
                      >
                        Ver itens
                      </button>
                      {o.items?.map((i, index) => (
                        <p key={index}>
                          {i.quantity}× {i.name}
                        </p>
                      ))}
                      <div className="order-actions">
                        {o.payment_status !== "paid" &&
                          o.status !== "cancelled" && (
                            <button
                              disabled={busy}
                              onClick={() => updateOrder(o.id, { paid: true })}
                            >
                              Confirmar pagamento recebido
                            </button>
                          )}
                        {!["completed", "cancelled"].includes(o.status) && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              updateOrder(o.id, {
                                status: {
                                  received: "preparing",
                                  preparing: "ready",
                                  ready: "completed",
                                }[o.status],
                              })
                            }
                          >
                            {o.status === "received"
                              ? "Começar preparo"
                              : o.status === "preparing"
                                ? "Marcar pronto"
                                : "Entregar"}
                          </button>
                        )}
                        {o.status === "received" && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              updateOrder(o.id, { status: "cancelled" })
                            }
                          >
                            Cancelar pedido
                          </button>
                        )}
                      </div>
                    </>
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
        <button onClick={() => setModal("admin")}>Área do pasteleiro</button>
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
                  {products
                    .filter((p) => cart[p.id])
                    .map((p) => (
                      <div className="cart-line" key={p.id}>
                        <span>
                          {p.name}
                          <small>{money(effectivePrice(p))}</small>
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
                            onClick={() => add(p)}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
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
                  <label>
                    Agendar retirada (opcional)
                    <input name="scheduledAt" type="datetime-local" />
                    <small>
                      Sem agendamento: preparo assim que o pedido for recebido.
                      Seg a sex, 9h às 21h.
                    </small>
                  </label>
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
                  <button className="primary full" disabled={busy}>
                    {busy ? "Enviando…" : "Fazer pedido"}
                    <ArrowRight size={18} />
                  </button>
                </form>
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
                  setTracking(value);
                  localStorage.setItem("tiulu-tracking", value);
                }}
              >
                <label>
                  Código de acompanhamento
                  <input
                    name="token"
                    defaultValue={tracking}
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
                Entre para guardar seu histórico e acompanhar seus pedidos
                concluídos.
              </p>
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
                    Para pedir um pastel, você não precisa criar uma conta.
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
