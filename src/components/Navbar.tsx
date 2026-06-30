import { Link } from "@tanstack/react-router";
import { ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "../lib/cart-context";

export function Navbar() {
  const { count, openCart } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-pink-100 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-xl text-primary sm:text-2xl">
            Annalicia <span className="text-foreground">Modas</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-foreground/70 md:flex">
          <Link to="/" className="transition hover:text-primary">Início</Link>
          <a href="#looks" className="transition hover:text-primary">Looks</a>
          <a href="#novidades" className="transition hover:text-primary">Novidades</a>
        </nav>

        <div className="flex items-center gap-3">

          <button
            onClick={openCart}
            aria-label="Abrir sacola"
            className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-[0_8px_20px_-8px_rgba(236,72,153,0.35)] transition hover:scale-105"
          >
            <ShoppingBag className="h-5 w-5 text-primary" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      <nav className="flex justify-center gap-6 border-t border-pink-100 px-4 py-2 text-xs font-medium text-foreground/70 md:hidden">
        <Link to="/">Início</Link>
        <a href="#looks">Looks</a>
        <a href="#novidades">Novidades</a>

      </nav>
    </header>
  );
}
