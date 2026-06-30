import { useState } from "react";
import { Minus, Plus, Trash2, X, ShoppingBag } from "lucide-react";
import { useCart } from "../lib/cart-context";
import { formatBRL } from "../lib/products";
import { useNavigate } from "@tanstack/react-router";

export function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeItem, total } =
    useCart();
  const navigate = useNavigate();

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-40 bg-pink-950/30 backdrop-blur-sm transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl">Sua Sacola</h2>
          </div>
          <button
            onClick={closeCart}
            aria-label="Fechar sacola"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-pink-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="mt-20 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pink-50">
                <ShoppingBag className="h-7 w-7 text-primary" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Sua sacola está vazia. Bora escolher um look? 💕
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-2xl bg-pink-50/60 p-3"
                >
                  <img
                    src={item.images?.[0] || ""}
                    alt={item.name}
                    className="h-24 w-20 flex-none rounded-xl object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <h3 className="font-display text-base leading-tight">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label="Remover"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-primary">
                      {formatBRL(item.price)}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="grid h-7 w-7 place-items-center rounded-full hover:bg-pink-100"
                          aria-label="Diminuir"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                          className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Aumentar"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-medium">
                        {formatBRL(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-pink-100 bg-pink-50/40 px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total
            </span>
            <span className="font-display text-2xl text-primary">
              {formatBRL(total)}
            </span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => {
              closeCart();
              navigate({ to: "/checkout" });
            }}
            className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_25px_-10px_rgba(236,72,153,0.6)] transition hover:opacity-90 disabled:opacity-40"
          >
            Finalizar Compra
          </button>
        </div>
      </aside>
    </>
  );
}

