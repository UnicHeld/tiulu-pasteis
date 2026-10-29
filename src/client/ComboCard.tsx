import { ArrowUpRight } from "lucide-react";

export function ComboCard({
  onChoose,
  available,
}: {
  onChoose: () => void;
  available: boolean;
}) {
  return (
    <article
      className="offer-card"
      aria-label="Promoção pastel com refrigerante"
    >
      <button
        type="button"
        className="offer-photo"
        onClick={onChoose}
        disabled={!available}
        aria-label="Escolher combo de pastel com refrigerante"
      >
        <img
          src="/images/pastel.jpg"
          alt="Pastéis dourados e crocantes em um prato"
          fetchPriority="high"
        />
        <div className="offer-drink" aria-hidden="true">
          <img src="/images/guarana.jpg" alt="" />
        </div>
        <span className="offer-sticker">
          O PAR
          <br />
          PERFEITO.
        </span>
        <span className="offer-photo-note">Foto ilustrativa</span>
      </button>
      <div className="offer-copy">
        <span className="eyebrow">SEU INTERVALO PEDE ESSE COMBO</span>
        <h3>
          Crocante.
          <br />
          Geladinho.
          <br />
          <em>Do seu jeito.</em>
        </h3>
        <p>
          Pastel de qualquer sabor + Guaraná 200 ml.
          <br />
          Seu intervalo com mais crocância e refrescância.
        </p>
        <div className="offer-prices">
          <span>
            COM PASTEL GRANDE
            <strong>
              <small>R$</small> 15<small>,00</small>
            </strong>
          </span>
          <span>
            COM PASTEL PEQUENO
            <strong>
              <small>R$</small> 10<small>,00</small>
            </strong>
          </span>
        </div>
        <button className="primary" onClick={onChoose} disabled={!available}>
          {available ? "Quero meu combo" : "Combo indisponível no momento"}{" "}
          <ArrowUpRight size={20} />
        </button>
        <small>Escolha o sabor e o refri na sacola. Fotos ilustrativas.</small>
      </div>
    </article>
  );
}
