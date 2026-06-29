import { useState, useEffect } from "react";
import {
  ShoppingBag, Home, Settings, ArrowLeft, Plus, Minus, X, Check,
  MessageCircle, MapPin, User, Sparkles, Truck, Gift, Search,
  Receipt, Shirt, Trash2, Send, PieChart, Megaphone, CreditCard,
  RefreshCw, LogOut, ChevronRight, Package,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────
const API = "https://web-production-f2fae.up.railway.app";

// ─── Types ────────────────────────────────────────────────
type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isNew?: boolean;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  images: string[];
  quantity: number;
};

type ScreenName = "home" | "product" | "cart" | "checkout" | "success" | "admin";

// ─── Helpers ─────────────────────────────────────────────
const R = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtWA = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

// ─── API ─────────────────────────────────────────────────
async function api(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).detail || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

function parseImages(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [raw];
    } catch { return raw.startsWith("http") ? [raw] : []; }
  }
  return [];
}

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.nome || p.name || "Sem nome",
    price: p.preco ?? p.price ?? 0,
    stock: p.estoque ?? p.stock ?? 0,
    category: p.categoria?.nome || p.category || "Geral",
    images: parseImages(p.imagem_url ?? p.images),
    isNew: p.is_new || p.isNew || false,
  };
}

// ─── App Root ────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<ScreenName>("home");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [adminToken, setAdminToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("admin_token") : null
  );

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToCart = (p: Product, qty = 1) =>
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, images: p.images, quantity: qty }];
    });

  const updateQty = (id: string, qty: number) =>
    qty <= 0
      ? setCart(prev => prev.filter(i => i.id !== id))
      : setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));

  const setToken = (t: string | null) => {
    if (t) localStorage.setItem("admin_token", t);
    else localStorage.removeItem("admin_token");
    setAdminToken(t);
  };

  const showBottomNav = screen === "home" || screen === "admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-200 via-rose-100 to-emerald-100 p-4">
      <div
        className="relative flex flex-col overflow-hidden rounded-[2.5rem] bg-background"
        style={{
          width: 390,
          height: 844,
          boxShadow: "0 40px 100px -15px rgba(236,72,153,0.35), 0 20px 60px -10px rgba(0,0,0,0.18)",
        }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 z-50 h-7 w-28 -translate-x-1/2 rounded-b-2xl bg-black" />

        {/* Status bar */}
        <div className="absolute top-1.5 left-5 z-50 text-[11px] font-semibold text-foreground/50" style={{ paddingTop: 2 }}>9:41</div>
        <div className="absolute top-1.5 right-5 z-50 flex items-center gap-1.5" style={{ paddingTop: 2 }}>
          <div className="flex items-end gap-px">
            {[3, 5, 7, 9, 11].map(h => (
              <div key={h} className="w-1 rounded-sm bg-foreground/50" style={{ height: h }} />
            ))}
          </div>
          <div className="h-2.5 w-5 rounded-sm border border-foreground/50 p-px">
            <div className="h-full w-3/4 rounded-[1px] bg-foreground/50" />
          </div>
        </div>

        {/* Screen content */}
        <div className="flex flex-1 flex-col overflow-hidden" style={{ paddingTop: 28 }}>
          {screen === "home" && (
            <HomeScreen
              onProduct={p => { setActiveProduct(p); setScreen("product"); }}
              onCart={() => setScreen("cart")}
              cartCount={cartCount}
              addToCart={addToCart}
            />
          )}
          {screen === "product" && activeProduct && (
            <ProductScreen
              product={activeProduct}
              onBack={() => setScreen("home")}
              onCart={() => setScreen("cart")}
              addToCart={addToCart}
              cartCount={cartCount}
            />
          )}
          {screen === "cart" && (
            <CartScreen
              items={cart}
              total={cartTotal}
              onBack={() => setScreen("home")}
              onCheckout={() => setScreen("checkout")}
              updateQty={updateQty}
            />
          )}
          {screen === "checkout" && (
            <CheckoutScreen
              items={cart}
              total={cartTotal}
              onBack={() => setScreen("cart")}
              onSuccess={order => { setCart([]); setSuccessOrder(order); setScreen("success"); }}
            />
          )}
          {screen === "success" && successOrder && (
            <SuccessScreen order={successOrder} onHome={() => setScreen("home")} />
          )}
          {screen === "admin" && (
            <AdminScreen token={adminToken} setToken={setToken} />
          )}
        </div>

        {/* Bottom Nav */}
        {showBottomNav && (
          <nav className="flex items-center justify-around border-t border-border bg-white/95 px-6 pb-7 pt-3 backdrop-blur-sm">
            <NavBtn
              icon={<Home className="h-[22px] w-[22px]" />}
              label="Loja"
              active={screen === "home"}
              onClick={() => setScreen("home")}
            />
            <button
              onClick={() => setScreen("cart")}
              className="flex flex-col items-center gap-0.5"
            >
              <div className="relative">
                <ShoppingBag className="h-[22px] w-[22px] text-muted-foreground" />
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">Sacola</span>
            </button>
            <NavBtn
              icon={<Settings className="h-[22px] w-[22px]" />}
              label="Admin"
              active={screen === "admin"}
              onClick={() => setScreen("admin")}
            />
          </nav>
        )}

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 z-50 h-1 w-32 -translate-x-1/2 rounded-full bg-foreground/20" />
      </div>
    </div>
  );
}

// ─── NavBtn ───────────────────────────────────────────────
function NavBtn({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5">
      <div className={active ? "text-primary" : "text-muted-foreground"}>{icon}</div>
      <span className={`text-[10px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
    </button>
  );
}

// ─── HomeScreen ──────────────────────────────────────────
function HomeScreen({ onProduct, onCart, cartCount, addToCart }: {
  onProduct: (p: Product) => void;
  onCart: () => void;
  cartCount: number;
  addToCart: (p: Product) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [banner, setBanner] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/produtos").then(d => setProducts(Array.isArray(d) ? d.map(mapProduct) : [])),
      api("/categorias").then(d => setCategories(Array.isArray(d) ? d : [])),
      api("/banners").then(d => {
        const active = (Array.isArray(d) ? d : []).filter((b: any) => b?.ativo);
        if (active.length) setBanner(active[0]);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    const matchCat =
      activeCategory === "Todos" ||
      (activeCategory === "Novidades" && p.isNew) ||
      p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const b = banner || {
    badge_text: "Drop de Primavera ✨",
    title_highlight: "Coleção Nova:",
    title_main: "Seja Você Mesma!",
    image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=780&h=500&fit=crop&auto=format",
    cor_destaque: "#ec4899",
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pb-3 pt-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Bem-vinda à</p>
          <h1 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-xl font-bold text-primary leading-tight">
            Annalicia Modas
          </h1>
        </div>
        <button onClick={onCart} className="relative rounded-full bg-pink-50 p-2.5">
          <ShoppingBag className="h-5 w-5 text-foreground/80" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Banner */}
        <div className="relative mx-4 mb-4 overflow-hidden rounded-3xl" style={{ height: 160 }}>
          <img src={b.image_url} alt="Banner" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
          <div className="relative p-4">
            <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              {b.badge_text}
            </span>
            <h2 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-2xl font-bold text-white leading-snug">
              {b.title_highlight}
              <br />
              <span style={{ color: b.cor_destaque || "#ec4899" }}>{b.title_main}</span>
            </h2>
          </div>
          <div className="absolute bottom-3 right-4 flex items-center gap-1 text-[10px] font-semibold text-white/80">
            <Truck className="h-3 w-3" /> Entrega rápida
          </div>
        </div>

        {/* Search */}
        <div className="mx-4 mb-3">
          <div className="flex items-center gap-2 rounded-2xl border border-pink-100 bg-pink-50/70 px-4 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar looks..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="scrollbar-hide mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {["Todos", "Novidades", ...categories.map((c: any) => c.nome)].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-[0_4px_12px_-4px_rgba(236,72,153,0.5)]"
                  : "bg-pink-50 text-foreground/70 hover:bg-pink-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="px-4 pb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {filtered.length} looks
            </p>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse rounded-2xl bg-pink-100/60" style={{ height: 220 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nenhum look encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} onClick={() => onProduct(p)} onAdd={() => addToCart(p)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onClick, onAdd }: {
  product: Product; onClick: () => void; onAdd: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="overflow-hidden rounded-2xl bg-white shadow-sm border border-pink-50/80 cursor-pointer active:scale-95 transition-transform"
    >
      <div className="relative bg-pink-50" style={{ height: 165 }}>
        <img
          src={product.images[0] || ""}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        {product.isNew && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white">NOVO</span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white">Esgotado</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">{product.name}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span style={{ fontFamily: "Quicksand, sans-serif" }} className="text-sm font-bold text-primary">
            {R(product.price)}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onAdd(); }}
            disabled={product.stock === 0}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-sm disabled:opacity-40 active:scale-90 transition-transform"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ProductScreen ───────────────────────────────────────
function ProductScreen({ product, onBack, onCart, addToCart, cartCount }: {
  product: Product; onBack: () => void; onCart: () => void;
  addToCart: (p: Product, qty: number) => void; cartCount: number;
}) {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="relative flex-shrink-0 bg-pink-100" style={{ height: 370 }}>
        <img
          src={product.images[activeImg] || ""}
          alt={product.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={onCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm"
          >
            <ShoppingBag className="h-5 w-5 text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
        {product.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {product.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-6 bg-primary" : "w-1.5 bg-white/70"}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide -mt-5 rounded-t-[2rem] bg-background px-5 pt-5 pb-2">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{product.category}</div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <h2 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-xl font-bold text-foreground leading-snug">
            {product.name}
          </h2>
          <span style={{ fontFamily: "Quicksand, sans-serif" }} className="shrink-0 text-2xl font-bold text-primary">
            {R(product.price)}
          </span>
        </div>

        <div className="mb-5">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            product.stock === 0 ? "bg-red-100 text-red-600" :
            product.stock <= 3 ? "bg-yellow-100 text-yellow-700" :
            "bg-mint text-emerald-700"
          }`}>
            {product.stock === 0 ? "Esgotado" :
             product.stock <= 3 ? `⚡ Últimas ${product.stock} unidades!` :
             `${product.stock} em estoque`}
          </span>
        </div>

        {product.stock > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Quantidade</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span style={{ fontFamily: "Quicksand, sans-serif" }} className="w-6 text-center text-xl font-bold">{qty}</span>
              <button
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-primary" /> Entrega na porta</span>
          <span className="flex items-center gap-1.5"><Gift className="h-3.5 w-3.5 text-primary" /> Brinde no pedido</span>
        </div>
      </div>

      <div className="border-t border-border/50 bg-background px-5 pb-8 pt-3">
        <button
          disabled={product.stock === 0}
          onClick={() => { addToCart(product, qty); onCart(); }}
          className="w-full rounded-full bg-primary py-4 text-sm font-bold text-white disabled:opacity-40 transition-opacity active:opacity-80"
          style={{ boxShadow: "0 8px 25px -8px rgba(236,72,153,0.6)" }}
        >
          {product.stock === 0 ? "Esgotado" : `Adicionar à Sacola · ${R(product.price * qty)}`}
        </button>
      </div>
    </div>
  );
}

// ─── CartScreen ──────────────────────────────────────────
function CartScreen({ items, total, onBack, onCheckout, updateQty }: {
  items: CartItem[]; total: number; onBack: () => void;
  onCheckout: () => void; updateQty: (id: string, qty: number) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border/50 px-5 pb-4 pt-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-xl font-bold">Minha Sacola</h1>
        <span className="ml-auto text-xs text-muted-foreground">{items.length} {items.length === 1 ? "item" : "itens"}</span>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-50">
            <ShoppingBag className="h-9 w-9 text-primary/30" />
          </div>
          <h2 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-xl font-bold">Sacola vazia 💕</h2>
          <p className="text-sm text-muted-foreground">Adicione alguns looks para continuar</p>
          <button
            onClick={onBack}
            className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-white"
          >
            Ver Looks
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide px-4 py-4">
            {items.map(item => (
              <div key={item.id} className="flex gap-3 rounded-2xl border border-pink-50 bg-white p-3 shadow-sm">
                <img
                  src={item.images[0] || ""}
                  alt={item.name}
                  className="h-20 w-16 flex-shrink-0 rounded-xl object-cover bg-pink-50"
                />
                <div className="flex flex-1 flex-col justify-between py-0.5">
                  <div className="flex items-start justify-between gap-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.name}</p>
                    <button onClick={() => updateQty(item.id, 0)} className="ml-1 flex-shrink-0 text-muted-foreground hover:text-red-500 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "Quicksand, sans-serif" }} className="text-base font-bold text-primary">
                      {R(item.price * item.quantity)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 bg-background px-5 pb-8 pt-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span style={{ fontFamily: "Quicksand, sans-serif" }} className="text-xl font-bold text-primary">{R(total)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full rounded-full bg-primary py-4 text-sm font-bold text-white"
              style={{ boxShadow: "0 8px 25px -8px rgba(236,72,153,0.6)" }}
            >
              Finalizar Pedido
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── CheckoutScreen ──────────────────────────────────────
function CheckoutScreen({ items, total, onBack, onSuccess }: {
  items: CartItem[]; total: number; onBack: () => void; onSuccess: (order: any) => void;
}) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [deliveryType, setDeliveryType] = useState<"entrega" | "retirada">("entrega");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api("/zonas-entrega").then(d => setZones(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const zone = zones.find(z => z.bairro?.toLowerCase() === bairro.toLowerCase());
  const deliveryFee = deliveryType === "entrega" ? (zone?.taxa ?? 0) : 0;
  const bairroUnknown = deliveryType === "entrega" && bairro && !zone;
  const finalTotal = total + deliveryFee;

  const lookupCep = async () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const d = await (await fetch(`https://viacep.com.br/ws/${clean}/json/`)).json();
      if (!d.erro) { setRua(d.logradouro || ""); setBairro(d.bairro || ""); setCidade(d.localidade || ""); }
    } catch {}
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Informe seu nome completo";
    if (whatsapp.replace(/\D/g, "").length < 10) errs.whatsapp = "WhatsApp inválido";
    if (deliveryType === "entrega") {
      if (cep.replace(/\D/g, "").length !== 8) errs.cep = "CEP inválido";
      if (!numero) errs.numero = "Informe o número";
      if (!rua) errs.address = "Busque o CEP primeiro";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const address =
      deliveryType === "entrega"
        ? `${rua}, ${numero}${complemento ? " - " + complemento : ""} - ${bairro}, ${cidade} - CEP: ${cep}`
        : "Retirada na Loja";

    setLoading(true);
    try {
      const order = await api("/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_nome: name.trim(),
          cliente_whatsapp: whatsapp.replace(/\D/g, ""),
          cliente_endereco: address,
          tipo_entrega: deliveryType,
          taxa_entrega: deliveryFee,
          bairro_entrega: deliveryType === "entrega" ? bairro : undefined,
          itens: items.map(i => ({ produto_id: i.id, quantidade: i.quantity })),
        }),
      });
      onSuccess(order);
    } catch (e: any) {
      alert("Erro ao finalizar pedido: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border/50 px-5 pb-4 pt-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-xl font-bold">Finalizar Pedido</h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto scrollbar-hide px-4 py-4">
        {/* Dados pessoais */}
        <section className="rounded-2xl border border-pink-50 bg-white p-4 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
            <StepBadge n={1} /> Dados Pessoais
          </h2>
          <div className="space-y-3">
            <Field label="Nome completo" icon={<User className="h-3 w-3" />} value={name} onChange={setName} placeholder="Ana Souza" error={errors.name} />
            <Field label="WhatsApp" icon={<MessageCircle className="h-3 w-3" />} value={whatsapp} onChange={v => setWhatsapp(fmtWA(v))} placeholder="(11) 91234-5678" inputMode="tel" error={errors.whatsapp} />
          </div>
        </section>

        {/* Entrega */}
        <section className="rounded-2xl border border-pink-50 bg-white p-4 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
            <StepBadge n={2} /> Forma de Entrega
          </h2>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {(["entrega", "retirada"] as const).map(type => (
              <button
                key={type}
                onClick={() => setDeliveryType(type)}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  deliveryType === type ? "border-primary bg-pink-50/50" : "border-border"
                }`}
              >
                <div className="mb-1 text-lg">{type === "entrega" ? "🛵" : "🏪"}</div>
                <div className="text-xs font-bold">{type === "entrega" ? "Em Casa" : "Retirar"}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{type === "entrega" ? "Entrega na porta" : "Na loja"}</div>
              </button>
            ))}
          </div>

          {deliveryType === "entrega" && (
            <div className="space-y-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Field label="CEP" icon={<MapPin className="h-3 w-3" />} value={cep} onChange={v => { const c = v.replace(/\D/g, "").slice(0, 8); setCep(c); if (c.length === 8) setTimeout(lookupCep, 150); }} placeholder="00000-000" inputMode="tel" error={errors.cep} />
                </div>
                <button onClick={lookupCep} className="h-[38px] flex-shrink-0 rounded-full bg-pink-100 px-4 text-xs font-bold text-pink-800">
                  Buscar
                </button>
              </div>
              {rua && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2"><Field label="Rua" icon={null} value={rua} onChange={() => {}} readonly /></div>
                    <Field label="Nº" icon={null} value={numero} onChange={setNumero} placeholder="123" error={errors.numero} />
                  </div>
                  <Field label="Complemento" icon={null} value={complemento} onChange={setComplemento} placeholder="Apto, Bloco..." />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Bairro" icon={null} value={bairro} onChange={() => {}} readonly />
                    <Field label="Cidade" icon={null} value={cidade} onChange={() => {}} readonly />
                  </div>
                  {bairroUnknown && (
                    <p className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700">
                      Taxa para <b>{bairro}</b> será combinada pelo WhatsApp.
                    </p>
                  )}
                </div>
              )}
              {errors.address && !rua && <p className="text-xs text-red-500">{errors.address}</p>}
            </div>
          )}
          {deliveryType === "retirada" && (
            <p className="rounded-xl border border-pink-100 bg-pink-50 p-3 text-center text-xs text-muted-foreground">
              Endereço da loja enviado pelo WhatsApp após confirmação 💖
            </p>
          )}
        </section>

        {/* Resumo */}
        <section className="rounded-2xl border border-pink-50 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold">Resumo do Pedido</h2>
          <div className="mb-2 max-h-28 space-y-1 overflow-y-auto scrollbar-hide">
            {items.map(i => (
              <div key={i.id} className="flex justify-between text-xs text-muted-foreground">
                <span className="mr-2 truncate">{i.name} ×{i.quantity}</span>
                <span className="flex-shrink-0">{R(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border/50 pt-2 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Entrega</span>
              <span>{deliveryType === "retirada" ? "Grátis" : bairroUnknown ? "A combinar" : R(deliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-bold text-primary">Total</span>
              <span style={{ fontFamily: "Quicksand, sans-serif" }} className="text-xl font-bold text-primary">{R(finalTotal)}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="border-t border-border/50 bg-background px-5 pb-8 pt-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-full bg-primary py-4 text-sm font-bold text-white disabled:opacity-50"
          style={{ boxShadow: "0 8px 25px -8px rgba(236,72,153,0.6)" }}
        >
          {loading ? "Processando..." : "Confirmar Pedido"}
        </button>
      </div>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-primary">{n}</span>
  );
}

function Field({ label, icon, value, onChange, placeholder, error, inputMode, readonly }: {
  label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string; inputMode?: "tel" | "text" | "email"; readonly?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}{label}
      </span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        readOnly={readonly}
        className={`w-full rounded-full border px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary ${
          error ? "border-red-400" : "border-border"
        } ${readonly ? "bg-gray-50 text-muted-foreground" : "bg-white"}`}
      />
      {error && <span className="mt-0.5 block text-[10px] text-red-500">{error}</span>}
    </label>
  );
}

// ─── SuccessScreen ───────────────────────────────────────
function SuccessScreen({ order, onHome }: { order: any; onHome: () => void }) {
  const [copied, setCopied] = useState(false);
  const num = order.numero ? String(order.numero).padStart(4, "0") : order.id?.slice(0, 8);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.pix_copia_cola);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { alert("Código PIX:\n" + order.pix_copia_cola); }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto scrollbar-hide bg-background">
      <div className="px-5 pb-4 pt-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h1 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-2xl font-bold text-primary">Pedido confirmado! 💖</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pedido #{num}</p>
      </div>

      <div className="mx-5 mb-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
        <h2 className="mb-1 text-sm font-bold text-yellow-800">Pague via PIX</h2>
        <p className="mb-4 text-xs text-yellow-700">Escaneie o QR Code ou copie o código no seu banco</p>
        <div className="mb-4 flex justify-center">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <img
              src={`https://quickchart.io/qr?text=${encodeURIComponent(order.pix_copia_cola || "pix")}&size=140`}
              alt="QR Code PIX"
              className="h-32 w-32 object-contain"
            />
          </div>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-white p-3 mb-2">
          <p className="break-all font-mono text-[10px] leading-relaxed text-foreground/70 line-clamp-3">
            {order.pix_copia_cola}
          </p>
        </div>
        <button
          onClick={copy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-yellow-400 py-2.5 text-xs font-bold text-yellow-900 active:bg-yellow-500 transition-colors"
        >
          {copied ? <><Check className="h-3.5 w-3.5" /> Copiado!</> : "Copiar Código PIX"}
        </button>
      </div>

      <div className="space-y-3 px-5 pb-10">
        <a
          href={`https://wa.me/5595991475736?text=${encodeURIComponent(`Olá! Acabei de realizar o pagamento do pedido #${num}. Segue o comprovante:`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-green-500 py-4 text-sm font-bold text-white active:bg-green-600 transition-colors"
        >
          <MessageCircle className="h-4 w-4" /> Enviar Comprovante
        </a>
        <button
          onClick={onHome}
          className="w-full rounded-full bg-pink-100 py-3.5 text-sm font-semibold text-pink-800 active:bg-pink-200 transition-colors"
        >
          Continuar Comprando
        </button>
      </div>
    </div>
  );
}

// ─── AdminScreen ─────────────────────────────────────────
type AdminTab = "dashboard" | "products" | "orders" | "marketing" | "settings";

function AdminScreen({ token, setToken }: {
  token: string | null; setToken: (t: string | null) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<AdminTab>("dashboard");

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      setToken(res.access_token);
    } catch (e: any) {
      alert(e.message || "Credenciais inválidas");
    } finally { setLoading(false); }
  };

  if (!token) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <form onSubmit={login} className="w-full max-w-xs">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-2xl font-bold text-primary">Painel Admin</h2>
          </div>
          <div className="space-y-3">
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuário" className="w-full rounded-full border border-border px-5 py-3 text-sm outline-none focus:border-primary" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" className="w-full rounded-full border border-border px-5 py-3 text-sm outline-none focus:border-primary" />
            <button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-white disabled:opacity-50" style={{ boxShadow: "0 8px 20px -8px rgba(236,72,153,0.5)" }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  const tabs: { id: AdminTab; icon: React.ReactNode; label: string }[] = [
    { id: "dashboard", icon: <PieChart className="h-3.5 w-3.5" />, label: "Dashboard" },
    { id: "products", icon: <Shirt className="h-3.5 w-3.5" />, label: "Catálogo" },
    { id: "orders", icon: <Receipt className="h-3.5 w-3.5" />, label: "Pedidos" },
    { id: "marketing", icon: <Megaphone className="h-3.5 w-3.5" />, label: "Marketing" },
    { id: "settings", icon: <Settings className="h-3.5 w-3.5" />, label: "Config" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/50 px-5 pb-2 pt-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Painel</p>
          <h2 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-base font-bold text-primary">Annalicia Admin</h2>
        </div>
        <button onClick={() => setToken(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>

      <div className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-border/50 px-3 py-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
              tab === t.id ? "bg-primary text-white shadow-[0_4px_12px_-4px_rgba(236,72,153,0.5)]" : "text-muted-foreground hover:bg-pink-50"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {tab === "dashboard" && <AdminDashboard token={token} />}
        {tab === "products" && <AdminProducts token={token} />}
        {tab === "orders" && <AdminOrders token={token} />}
        {tab === "marketing" && <AdminMarketing token={token} />}
        {tab === "settings" && <AdminSettings token={token} />}
      </div>
    </div>
  );
}

// ─── Admin: Dashboard ────────────────────────────────────
function AdminDashboard({ token }: { token: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/pedidos", { headers: { Authorization: `Bearer ${token}` } }).then(d => setOrders(Array.isArray(d) ? d : [])),
      api("/produtos").then(d => setProducts(Array.isArray(d) ? d.map(mapProduct) : [])),
    ]).finally(() => setLoading(false));
  }, [token]);

  const revenue = orders.filter(o => o.status !== "cancelado").reduce((s, o) => s + (o.total || 0), 0);
  const pending = orders.filter(o => o.status === "pendente").length;
  const lowStock = products.filter(p => p.stock <= 3).length;

  if (loading) return <LoadingPulse />;

  return (
    <div className="space-y-4 p-4">
      <h2 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-lg font-bold">Dashboard</h2>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Receita" value={R(revenue)} icon="💰" bg="bg-green-50" />
        <StatCard label="Pendentes" value={String(pending)} icon="📦" bg="bg-yellow-50" />
        <StatCard label="Produtos" value={String(products.length)} icon="👗" bg="bg-pink-50" />
        <StatCard label="Estoque Baixo" value={String(lowStock)} icon="⚠️" bg="bg-red-50" />
      </div>
      {orders.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Últimos Pedidos</p>
          <div className="space-y-2">
            {orders.slice(0, 4).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-pink-50 bg-white px-4 py-3 shadow-sm">
                <div>
                  <p className="font-mono text-xs font-bold">#{String(o.numero || "").padStart(4, "0") || o.id?.slice(0, 6)}</p>
                  <p className="text-sm font-semibold">{o.cliente?.nome}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{R(o.total)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin: Products ─────────────────────────────────────
function AdminProducts({ token }: { token: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api("/produtos").then(d => setProducts(Array.isArray(d) ? d.map(mapProduct) : [])).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const del = async (id: string, name: string) => {
    if (!confirm(`Deletar "${name}"?`)) return;
    try {
      await api(`/produtos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <LoadingPulse />;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-lg font-bold">Catálogo</h2>
        <span className="text-xs text-muted-foreground">{products.length} produtos</span>
      </div>
      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl border border-pink-50 bg-white p-3 shadow-sm">
            <div className="h-12 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-pink-50">
              <img src={p.images[0] || ""} alt={p.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">{R(p.price)}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  p.stock === 0 ? "bg-red-100 text-red-600" :
                  p.stock <= 3 ? "bg-yellow-100 text-yellow-700" :
                  "bg-mint text-emerald-700"
                }`}>{p.stock} un.</span>
              </div>
            </div>
            <button onClick={() => del(p.id, p.name)} className="text-muted-foreground transition-colors hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {products.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</p>}
      </div>
    </div>
  );
}

// ─── Admin: Orders ───────────────────────────────────────
function AdminOrders({ token }: { token: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api("/pedidos", { headers: { Authorization: `Bearer ${token}` } })
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api(`/pedidos/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const nextAction: Record<string, { label: string; status: string; cls: string }> = {
    pendente: { label: "Confirmar", status: "confirmado", cls: "bg-blue-100 text-blue-700" },
    confirmado: { label: "Enviado", status: "enviado", cls: "bg-purple-100 text-purple-700" },
    enviado: { label: "Entregue", status: "entregue", cls: "bg-green-100 text-green-700" },
  };

  if (loading) return <LoadingPulse />;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-lg font-bold">Pedidos</h2>
        <button onClick={load} className="text-muted-foreground hover:text-primary">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido ainda.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o: any) => {
            const num = String(o.numero || "").padStart(4, "0") || o.id?.slice(0, 6);
            const next = nextAction[o.status];
            return (
              <div key={o.id} className="rounded-2xl border border-pink-50 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[11px] font-bold text-muted-foreground">#{num}</p>
                    <p className="text-sm font-bold">{o.cliente?.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{o.cliente?.whatsapp}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{R(o.total)}</p>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
                {next && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(o.id, next.status)} className={`flex-1 rounded-full py-2 text-[11px] font-bold ${next.cls}`}>
                      {next.label}
                    </button>
                    <button onClick={() => { if (confirm("Cancelar este pedido?")) updateStatus(o.id, "cancelado"); }} className="rounded-full bg-red-50 px-3 py-2 text-[11px] font-bold text-red-600">
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Admin: Marketing ────────────────────────────────────
function AdminMarketing({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    api("/clientes", { headers: { Authorization: `Bearer ${token}` } })
      .then(d => setCustomers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token]);

  const validWA = new Set(
    customers.filter(c => c.whatsapp?.length >= 10).map(c => c.whatsapp)
  ).size;

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await api("/disparos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mensagem: message }),
      });
      alert("Disparo iniciado! Mensagens sendo enviadas.");
      setMessage("");
    } catch (e: any) { alert(e.message); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-4 p-5">
      <h2 style={{ fontFamily: "Quicksand, sans-serif" }} className="text-lg font-bold">Marketing</h2>

      <div className="rounded-2xl border border-pink-50 bg-white p-5 text-center shadow-sm">
        <p className="text-5xl font-bold text-primary" style={{ fontFamily: "Quicksand, sans-serif" }}>{validWA}</p>
        <p className="mt-1 text-xs text-muted-foreground">contatos no WhatsApp</p>
      </div>

      <div className="rounded-2xl border border-pink-50 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold">Nova Campanha</h3>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
          placeholder="Ex: Olá! Temos novidades na Annalicia Modas 🌸"
          className="w-full resize-none rounded-xl border border-pink-100 bg-pink-50/30 p-3 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={send}
          disabled={sending || !message.trim()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {sending ? "Enviando..." : "Enviar em Massa"}
        </button>
      </div>
    </div>
  );
}

// ─── Admin: Settings ─────────────────────────────────────
function AdminSettings({ token }: { token: string }) {
  const [whatsapp, setWhatsapp] = useState("");
  const [pixChave, setPixChave] = useState("");
  const [pixTipo, setPixTipo] = useState("");
  const [pixNome, setPixNome] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/configuracoes", { headers: { Authorization: `Bearer ${token}` } })
      .then(d => {
        setWhatsapp(d.whatsapp_loja || "");
        setPixChave(d.pix_chave || "");
        setPixTipo(d.pix_tipo || "");
        setPixNome(d.pix_nome_recebedor || "");
        setInstagram(d.link_instagram || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          whatsapp_loja: whatsapp.replace(/\D/g, ""),
          pix_chave: pixChave,
          pix_tipo: pixTipo,
          pix_nome_recebedor: pixNome,
          link_instagram: instagram,
        }),
      });
      alert("Configurações salvas!");
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingPulse />;

  return (
    <div className="p-5">
      <h2 style={{ fontFamily: "Quicksand, sans-serif" }} className="mb-4 text-lg font-bold">Configurações</h2>
      <form onSubmit={save} className="space-y-4">
        <div className="rounded-2xl border border-pink-50 bg-white p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold">Contato</h3>
          <Field label="WhatsApp da Loja" icon={<MessageCircle className="h-3 w-3" />} value={whatsapp} onChange={setWhatsapp} placeholder="(95) 99999-9999" inputMode="tel" />
          <Field label="Instagram" icon={null} value={instagram} onChange={setInstagram} placeholder="https://instagram.com/..." />
        </div>
        <div className="rounded-2xl border border-pink-50 bg-white p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-bold">Chave PIX</h3>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <CreditCard className="h-3 w-3" /> Tipo
            </span>
            <select value={pixTipo} onChange={e => setPixTipo(e.target.value)} className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary">
              <option value="">Selecione...</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="aleatoria">Chave Aleatória</option>
            </select>
          </label>
          <Field label="Chave PIX" icon={null} value={pixChave} onChange={setPixChave} placeholder="Sua chave PIX" />
          <Field label="Nome do Titular" icon={null} value={pixNome} onChange={setPixNome} placeholder="Annalicia Modas" />
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-white disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </form>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-700",
    confirmado: "bg-blue-100 text-blue-700",
    enviado: "bg-purple-100 text-purple-700",
    entregue: "bg-green-100 text-green-700",
    cancelado: "bg-red-100 text-red-600",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, icon, bg }: { label: string; value: string; icon: string; bg: string }) {
  return (
    <div className={`rounded-2xl border border-white/80 ${bg} p-4`}>
      <div className="mb-1 text-2xl">{icon}</div>
      <p style={{ fontFamily: "Quicksand, sans-serif" }} className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function LoadingPulse() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse rounded-2xl bg-pink-50" style={{ height: 72 }} />
      ))}
    </div>
  );
}
