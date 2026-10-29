import {
  comboOfferPrice,
  comboPrices,
  pizzaIngredients,
  type Product,
} from "../domain/catalog";
import { money } from "./OrderDetails";

const canChoose = (
  product: Product,
  cart: Record<string, number>,
  currentId: string,
) =>
  product.id === currentId ||
  (product.available && (cart[product.id] || 0) < Math.min(20, product.stock));

const flavorName = (product: Product) =>
  product.name.replace(/ · (grande|pequeno)$/, "");

export function CartComboOptions({
  products,
  cart,
  combo,
  onChange,
  onAddAnother,
}: {
  products: Product[];
  cart: Record<string, number>;
  combo: { pastelId: string; drinkId: string };
  onChange: (pastel: Product, drink: Product) => void;
  onAddAnother: () => void;
}) {
  const pastel = products.find((product) => product.id === combo.pastelId);
  const drink = products.find((product) => product.id === combo.drinkId);
  if (!pastel?.combo_size || !drink?.combo_drink) return null;

  const size = pastel.combo_size;
  const pastels = products.filter((product) => product.combo_size === size);
  const drinks = products.filter((product) => product.combo_drink);
  const canAddAnother = [pastel, drink].every(
    (product) =>
      product.available &&
      (cart[product.id] || 0) < Math.min(20, product.stock),
  );
  return (
    <fieldset className="cart-config">
      <legend>Seu combo</legend>
      <div className="cart-config-heading">
        <p>Escolha seu pastel. O refri já vai junto.</p>
        <strong className="cart-config-price">
          {money(comboOfferPrice(pastel, drink))}
        </strong>
      </div>
      <div className="choice-grid">
        <label>
          Tamanho do combo
          <select
            value={size}
            onChange={(event) => {
              const choices = products.filter(
                (product) =>
                  product.combo_size === event.target.value &&
                  canChoose(product, cart, pastel.id),
              );
              const next =
                choices.find(
                  (product) => flavorName(product) === flavorName(pastel),
                ) ?? choices[0];
              if (next) onChange(next, drink);
            }}
          >
            {(["grande", "pequeno"] as const).map((option) => (
              <option
                key={option}
                value={option}
                disabled={
                  !products.some(
                    (product) =>
                      product.combo_size === option &&
                      canChoose(product, cart, pastel.id),
                  )
                }
              >
                {option === "grande" ? "Grande" : "Pequeno"} ·{" "}
                {money(comboPrices[option])}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sabor do pastel
          <select
            value={pastel.id}
            onChange={(event) => {
              const next = pastels.find(
                (product) => product.id === event.target.value,
              );
              if (next && canChoose(next, cart, pastel.id))
                onChange(next, drink);
            }}
          >
            {pastels.map((product) => {
              const available = canChoose(product, cart, pastel.id);
              return (
                <option
                  key={product.id}
                  value={product.id}
                  disabled={!available}
                >
                  {flavorName(product)}
                  {!available ? " · Indisponível" : ""}
                </option>
              );
            })}
          </select>
        </label>
        <label>
          Refrigerante do combo
          <select
            value={drink.id}
            onChange={(event) => {
              const next = drinks.find(
                (product) => product.id === event.target.value,
              );
              if (next && canChoose(next, cart, drink.id))
                onChange(pastel, next);
            }}
          >
            {drinks.map((product) => {
              const available = canChoose(product, cart, drink.id);
              return (
                <option
                  key={product.id}
                  value={product.id}
                  disabled={!available}
                >
                  {product.name}
                  {!available ? " · Indisponível" : ""}
                </option>
              );
            })}
          </select>
        </label>
      </div>
      <button
        type="button"
        className="outline"
        disabled={!canAddAnother}
        onClick={onAddAnother}
      >
        Adicionar outro combo
      </button>
    </fieldset>
  );
}

export function CartPizzaOptions({
  products,
  cart,
  pizza,
  onChange,
  ingredients,
  setIngredients,
}: {
  products: Product[];
  cart: Record<string, number>;
  pizza: Product;
  onChange: (product: Product) => void;
  ingredients: string[];
  setIngredients: (values: string[]) => void;
}) {
  const pizzas = products.filter(
    (product) => product.category === "Mini pizza",
  );
  return (
    <fieldset className="cart-config">
      <legend>Sua mini pizza</legend>
      <p className="cart-config-note">Molho de tomate incluso.</p>
      <label>
        Sabor da mini pizza
        <select
          value={pizza.id}
          onChange={(event) => {
            const next = pizzas.find(
              (product) => product.id === event.target.value,
            );
            if (next && canChoose(next, cart, pizza.id)) onChange(next);
          }}
        >
          {pizzas.map((product) => {
            const available = canChoose(product, cart, pizza.id);
            return (
              <option key={product.id} value={product.id} disabled={!available}>
                {product.name}
                {!available ? " · Indisponível" : ""}
              </option>
            );
          })}
        </select>
      </label>
      {pizza.customizable && (
        <>
          <p className="cart-config-note">
            Escolha até 3 ingredientes. A escolha vale para todas as unidades
            desta pizza na sacola.
          </p>
          <div
            className="choice-grid"
            role="group"
            aria-label="Ingredientes da mini pizza"
          >
            {pizzaIngredients.map((ingredient) => {
              const checked = ingredients.includes(ingredient.id);
              return (
                <label className="ingredient-chip" key={ingredient.id}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && ingredients.length >= 3}
                    onChange={() =>
                      setIngredients(
                        checked
                          ? ingredients.filter(
                              (value) => value !== ingredient.id,
                            )
                          : [...ingredients, ingredient.id],
                      )
                    }
                  />
                  <span>{ingredient.label}</span>
                </label>
              );
            })}
          </div>
          <p className="selection-count" role="status">
            {ingredients.length} de 3 ingredientes
          </p>
        </>
      )}
    </fieldset>
  );
}
