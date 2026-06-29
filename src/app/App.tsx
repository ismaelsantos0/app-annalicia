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

// ─── App Root & Admin Auth ────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("admin_token") : null
  );

  const saveToken = (t: string | null) => {
    if (t) localStorage.setItem("admin_token", t);
    else localStorage.removeItem("admin_token");
    setToken(t);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 font-sans text-slate-900">
      {!token ? (
        <AdminLogin onLogin={saveToken} />
      ) : (
        <AdminLayout token={token} onLogout={() => saveToken(null)} />
      )}
    </div>
  );
}

// ─── Admin Login ──────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: (t: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);
      
      const res = await api("/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });
      onLogin(res.access_token);
    } catch (e: any) {
      alert(e.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl transition-all hover:bg-white/15">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Annalícia</h2>
          <p className="mt-2 text-sm text-pink-100">Painel Administrativo</p>
        </div>
        
        <form onSubmit={login} className="space-y-4">
          <div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuário"
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-white placeholder-white/60 outline-none backdrop-blur-sm transition-all focus:border-white/50 focus:bg-white/20"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-white placeholder-white/60 outline-none backdrop-blur-sm transition-all focus:border-white/50 focus:bg-white/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-2xl bg-white py-4 text-sm font-bold uppercase tracking-wider text-purple-600 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-white/20 disabled:opacity-50"
          >
            {loading ? "Autenticando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Admin Layout ─────────────────────────────────────────────────
type AdminTab = "dashboard" | "products" | "orders" | "marketing" | "settings";

function AdminLayout({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>("dashboard");

  const tabs: { id: AdminTab; icon: React.ReactNode; label: string }[] = [
    { id: "dashboard", icon: <PieChart className="h-4 w-4" />, label: "Dashboard" },
    { id: "products", icon: <Shirt className="h-4 w-4" />, label: "Catálogo" },
    { id: "orders", icon: <Receipt className="h-4 w-4" />, label: "Pedidos" },
    { id: "marketing", icon: <Megaphone className="h-4 w-4" />, label: "Marketing" },
    { id: "settings", icon: <Settings className="h-4 w-4" />, label: "Config" },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* Topbar */}
      <header className="flex flex-none items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Annalícia Admin</h1>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Gestão Exclusiva</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </header>

      {/* Tabs */}
      <div className="flex-none border-b border-slate-200 bg-white px-4">
        <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          {tab === "dashboard" && <AdminDashboard token={token} />}
          {tab === "products" && <AdminProducts token={token} />}
          {tab === "orders" && <AdminOrders token={token} />}
          {tab === "marketing" && <AdminMarketing token={token} />}
          {tab === "settings" && <AdminSettings token={token} />}
        </div>
      </main>
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

