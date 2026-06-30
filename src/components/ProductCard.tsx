import { useState, useEffect } from "react";
import { useCart } from "../lib/cart-context";
import { formatBRL, type Product } from "../lib/products";
import { Heart } from "lucide-react";

export function ProductCard({ product }: { product: Product & { variants?: Product[] } }) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(product);

  useEffect(() => {
    setSelectedVariant(product);
  }, [product]);

  const displayProduct = selectedVariant;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_15px_40px_-25px_rgba(236,72,153,0.35)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(236,72,153,0.45)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-pink-50">
        <img
          src={displayProduct.images?.[0] || ""}
          alt={displayProduct.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-700 ${displayProduct.images?.length > 1 ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
        />
        {displayProduct.images?.length > 1 && (
          <img
            src={displayProduct.images[1]}
            alt={displayProduct.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        )}
        {displayProduct.isNew ? (
          <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md flex items-center gap-1">
            🔥 Novo
          </span>
        ) : displayProduct.tag ? (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
            {displayProduct.tag}
          </span>
        ) : null}
        <button
          aria-label="Favoritar"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-primary backdrop-blur transition hover:bg-white hover:scale-110"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {displayProduct.category}
        </p>
        <h3 className="mt-1 font-display text-lg leading-snug">
          {displayProduct.name}
        </h3>
        
        {product.variants && product.variants.length > 1 && (
          <div className="mt-3 flex gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVariant(v);
                }}
                className={`h-8 w-8 rounded-full border-[3px] shadow-sm ${
                  selectedVariant.id === v.id ? "border-primary scale-110" : "border-transparent"
                } bg-cover bg-center transition-all hover:scale-110`}
                style={{ backgroundImage: `url(${v.images?.[0] || ""})` }}
                aria-label={`Variação de ${displayProduct.name}`}
              />
            ))}
          </div>
        )}

        <p className="mt-3 text-lg font-bold text-primary">
          {formatBRL(displayProduct.price)}
        </p>
        <button
          onClick={() => addItem(displayProduct)}
          disabled={displayProduct.stock === 0}
          className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_-10px_rgba(236,72,153,0.6)] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {displayProduct.stock === 0 ? "Esgotado" : "Comprar"}
        </button>
      </div>
    </article>
  );
}
