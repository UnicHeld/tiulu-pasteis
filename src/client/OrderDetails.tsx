import { useEffect, useRef, useState } from "react";
import { CheckCircle2, QrCode, Camera } from "lucide-react";

export const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n / 100,
  );
export const labels: Record<string, string> = {
  awaiting_arrival: "Aguardando sua chegada",
  received: "Pedido recebido",
  preparing: "Em preparo",
  ready: "Pronto no balcão",
  completed: "Retirado",
  cancelled: "Cancelado",
  expired: "Prazo encerrado",
};
export type Order = {
  id: string;
  customer_name: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  discount_total?: number;
  scheduled_at: string | null;
  created_at: string;
  confirmed_at?: string | null;
  expires_at?: string | null;
  notes?: string;
  items?: {
    name: string;
    quantity: number;
    unit_price: number;
    ingredients?: string[];
  }[];
  events?: { status: string; created_at: string }[];
};
export const isClosed = (status: string) =>
  ["completed", "cancelled", "expired"].includes(status);
const instructions: Record<string, string> = {
  awaiting_arrival:
    "Vá ao balcão e apresente seu QR Code. Confirmamos os itens e o pagamento antes de fritar. Este registro não reserva estoque.",
  received:
    "Seu pedido está na fila de preparo. Acompanhe por aqui e vá ao Tiulu quando estiver pronto.",
  preparing:
    "Seu pedido está sendo preparado. Acompanhe por aqui para retirar assim que estiver pronto.",
  ready:
    "Está quentinho! Retire no Tiulu, nos fundos da ASTAIBILCE no IBILCE. Pague no balcão e informe seu pedido.",
  completed: "Retirada concluída. Obrigado por escolher o Tiulu!",
  cancelled: "Este pedido foi cancelado e não entrará em preparo.",
  expired:
    "O prazo para apresentar este pedido terminou. Monte um novo pedido para retirada.",
};
export function OrderQR({ id }: { id: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    import("@zxing/browser")
      .then(({ BrowserQRCodeSvgWriter }) => {
        if (!active || !container.current) return;
        const svg = new BrowserQRCodeSvgWriter().write(
          "tiulu:order:" + id,
          240,
          240,
        );
        container.current.replaceChildren(svg);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <div className="order-qr">
      <div
        ref={container}
        role="img"
        aria-label="QR Code para apresentar no balcão"
      />
      {failed && (
        <p>QR indisponível. Mostre o identificador abaixo ao atendente.</p>
      )}
      <strong>Identificação para retirada</strong>
      <small>
        Mostre este QR ou informe o pedido no balcão. Não é comprovante de
        pagamento.
      </small>
      <code>{id}</code>
    </div>
  );
}
export function OrderSummary({
  order: o,
  detailed = false,
  showQR = true,
}: {
  order: Order;
  detailed?: boolean;
  showQR?: boolean;
}) {
  const steps = [
    o.status === "awaiting_arrival" ? "awaiting_arrival" : "received",
    "preparing",
    "ready",
    "completed",
  ];
  const current = o.status === "received" ? 0 : steps.indexOf(o.status);
  return (
    <>
      <div className="order-title">
        <strong>#{o.id.slice(0, 8).toUpperCase()}</strong>
        <span className={"status " + o.status}>{labels[o.status]}</span>
      </div>
      <p className="order-date">
        {new Date(o.created_at).toLocaleString("pt-BR")}
      </p>
      <p className="order-instruction">{instructions[o.status]}</p>
      {o.status === "awaiting_arrival" && o.expires_at && (
        <p>
          Apresente até{" "}
          <strong>
            {new Date(o.expires_at).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </strong>{" "}
          de {new Date(o.expires_at).toLocaleDateString("pt-BR")}.
        </p>
      )}
      {detailed && showQR && !isClosed(o.status) && <OrderQR id={o.id} />}
      <ul className="order-items">
        {o.items?.map((item, i) => (
          <li key={i}>
            <span>
              <b>{item.quantity}×</b> {item.name}
              {Boolean(item.ingredients?.length) && (
                <small> · {item.ingredients?.join(", ")}</small>
              )}
            </span>
            <strong>{money(item.unit_price * item.quantity)}</strong>
          </li>
        ))}
      </ul>
      {Boolean(o.discount_total) && (
        <div className="order-discount">
          <p>
            Subtotal <strong>{money(o.total + (o.discount_total || 0))}</strong>
          </p>
          <p>
            Desconto dos combos <strong>−{money(o.discount_total || 0)}</strong>
          </p>
        </div>
      )}
      <div className="cart-total">
        Total <strong>{money(o.total)}</strong>
      </div>
      <p>
        {o.payment_method === "pix" ? "Pix" : "Cartão"} ·{" "}
        <strong>
          {o.payment_status === "paid"
            ? "Pagamento confirmado"
            : "Pagamento no balcão"}
        </strong>
      </p>
      {o.notes && <p>Observações: {o.notes}</p>}
      {detailed && (
        <>
          {!["cancelled", "expired"].includes(o.status) && (
            <ol className="order-progress" aria-label="Etapas do pedido">
              {steps.map((s, i) => (
                <li
                  key={s}
                  className={current >= i ? "done" : ""}
                  aria-current={i === current ? "step" : undefined}
                >
                  <CheckCircle2 size={19} />
                  {labels[s]}
                </li>
              ))}
            </ol>
          )}
          {o.events && (
            <details className="order-history">
              <summary>Histórico de atualizações</summary>
              {o.events.map((e, i) => (
                <p key={i}>
                  {labels[e.status]} ·{" "}
                  {new Date(e.created_at).toLocaleString("pt-BR")}
                </p>
              ))}
            </details>
          )}
        </>
      )}
    </>
  );
}
export function OrderActions({
  order: o,
  busy,
  update,
}: {
  order: Order;
  busy: boolean;
  update: (id: string, body: object) => void;
}) {
  return (
    <div className="order-actions">
      {o.status === "awaiting_arrival" && (
        <button
          className="primary"
          disabled={busy}
          onClick={() => update(o.id, { status: "preparing", paid: true })}
        >
          Confirmar presença, pagamento e preparar
        </button>
      )}
      {o.status === "received" && (
        <button
          disabled={busy}
          onClick={() => update(o.id, { status: "preparing" })}
        >
          Começar preparo
        </button>
      )}
      {o.status === "preparing" && (
        <button
          disabled={busy}
          onClick={() => update(o.id, { status: "ready" })}
        >
          Marcar pronto
        </button>
      )}
      {o.status === "ready" && (
        <button
          disabled={busy}
          onClick={() => update(o.id, { status: "completed" })}
        >
          Confirmar retirada
        </button>
      )}
      {o.status !== "awaiting_arrival" &&
        !isClosed(o.status) &&
        o.payment_status !== "paid" && (
          <button disabled={busy} onClick={() => update(o.id, { paid: true })}>
            Confirmar pagamento recebido
          </button>
        )}
      {["awaiting_arrival", "received"].includes(o.status) && (
        <button
          disabled={busy}
          onClick={() => update(o.id, { status: "cancelled" })}
        >
          Cancelar pedido
        </button>
      )}
    </div>
  );
}
export function QRScanner({ onRead }: { onRead: (id: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const callback = useRef(onRead);
  callback.current = onRead;
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!scanning) return;
    let active = true;
    let stop: (() => void) | undefined;
    import("@zxing/browser")
      .then(async ({ BrowserQRCodeReader }) => {
        if (!active || !video.current) return;
        const controls = await new BrowserQRCodeReader().decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } }, audio: false },
          video.current,
          (result, _error, controls) => {
            if (!active || !result) return;
            const match = /^tiulu:order:([a-f0-9-]{36})$/i.exec(
              result.getText(),
            );
            if (
              !match ||
              !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
                match[1],
              )
            ) {
              setError("Este QR não é de um pedido Tiulu.");
              return;
            }
            active = false;
            controls.stop();
            setScanning(false);
            callback.current(match[1]);
          },
        );
        stop = () => controls.stop();
        if (!active) controls.stop();
      })
      .catch(() => {
        if (!active) return;
        setError(
          "Não foi possível abrir a câmera. Permita o acesso, use HTTPS ou informe o identificador do pedido.",
        );
        setScanning(false);
      });
    return () => {
      active = false;
      stop?.();
    };
  }, [scanning]);
  return (
    <section className="qr-scanner" aria-label="Leitor de pedidos">
      <h2>
        <QrCode size={24} /> Atendimento no balcão
      </h2>
      <p>
        Leia o QR do cliente para conferir os itens. Confirme o recebimento do
        pagamento antes de liberar a retirada.
      </p>
      <button
        className="primary"
        onClick={() => {
          setError("");
          setScanning(!scanning);
        }}
      >
        <Camera size={18} />
        {scanning ? "Fechar câmera" : "Ler QR Code"}
      </button>
      {scanning && (
        <video
          ref={video}
          muted
          playsInline
          aria-label="Câmera para leitura do QR Code"
        />
      )}
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const id = String(new FormData(e.currentTarget).get("orderId"))
            .trim()
            .replace(/^tiulu:order:/i, "");
          if (
            !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
              id,
            )
          ) {
            setError("Informe o identificador completo do pedido.");
            return;
          }
          setScanning(false);
          onRead(id);
        }}
      >
        <label>
          Identificador do pedido
          <input
            name="orderId"
            required
            placeholder="Cole o identificador completo"
          />
        </label>
        <button className="outline">Consultar pedido</button>
      </form>
    </section>
  );
}
