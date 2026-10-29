import { useState } from "react";
import { Flame, Minus, Plus } from "lucide-react";
import { effectivePrice, type Product } from "../domain/catalog";
import { money } from "./OrderDetails";
import { pastelSize, type MenuProduct } from "./menu";
import { productPhoto } from "./photos";

export function MenuProductCard({
  product,
  cart,
  add,
  onConfigure,
}: {
  product: MenuProduct;
  cart: Record<string, number>;
  add: (product: Product, delta?: number) => void;
  onConfigure: (product: Product) => void;
}) {
  const [selectedId, setSelectedId] = useState(
    () =>
      (
        product.variants.find((p) => p.available && p.stock > 0) ??
        product.variants[0]
      ).id,
  );
  const p =
    product.variants.find((p) => p.id === selectedId) ?? product.variants[0];
  const unavailable = !p.available || p.stock === 0;
  const photo = productPhoto(p);
  const isPizza = p.category === "Mini pizza";
  const name = isPizza
    ? product.name.replace(/^Mini pizza(?: de)? /i, "")
    : product.name;
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  return (
    <article className={"product" + (isPizza ? " mini-pizza" : "")}>
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
        {photo ? (
          <img
            className="product-photo"
            src={photo.src}
            alt={photo.alt}
            loading="lazy"
            width="640"
            height="480"
          />
        ) : (
          <span className="food-emoji">{p.emoji}</span>
        )}
        {photo && <small className="photo-note">Foto ilustrativa</small>}
        {isPizza && (
          <button
            type="button"
            className="photo-choice"
            aria-label={"Escolher " + p.name}
            disabled={unavailable && !cart[p.id]}
            onClick={() => onConfigure(p)}
          />
        )}
        {p.featured && (
          <span className="popular">
            <Flame size={12} /> QUERIDINHO
          </span>
        )}
        {unavailable && <span className="sold-out">Esgotado</span>}
      </div>
      <div className="product-body">
        <h3>{displayName}</h3>
        <p>{p.description}</p>
        {product.variants.some((variant) => pastelSize(variant)) && (
          <label className="size-choice">
            Tamanho
            <select
              aria-label={"Tamanho de " + product.name}
              value={p.id}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {pastelSize(variant) === "pequeno" ? "Pequeno" : "Grande"} ·{" "}
                  {money(effectivePrice(variant))}
                  {!variant.available || variant.stock === 0
                    ? " · Esgotado"
                    : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="product-bottom">
          <strong>
            {p.sale_price && (
              <del className="original-price">{money(p.price)}</del>
            )}
            {money(effectivePrice(p))}
          </strong>
          {isPizza ? (
            <button
              className="choose-product"
              disabled={unavailable && !cart[p.id]}
              onClick={() => onConfigure(p)}
            >
              Escolher <Plus size={16} />
            </button>
          ) : cart[p.id] ? (
            <div className="quantity">
              <button
                aria-label={"Remover " + p.name}
                onClick={() => add(p, -1)}
              >
                <Minus size={15} />
              </button>
              <span>{cart[p.id]}</span>
              <button
                disabled={unavailable || cart[p.id] >= Math.min(20, p.stock)}
                aria-label={"Adicionar " + p.name}
                onClick={() => add(p)}
              >
                <Plus size={15} />
              </button>
            </div>
          ) : (
            <button
              className="add"
              disabled={unavailable}
              aria-label={"Adicionar " + p.name}
              onClick={() => add(p)}
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
