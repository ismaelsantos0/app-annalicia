import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shirt,
  Boxes,
  Receipt,
  Plus,
  ArrowLeft,
  Sparkles,
  Search,
  Megaphone,
  Send,
  Users,
  Trash2,
  Settings,
  MessageCircle,
  CreditCard,
  X,
  Minus,
  Check,
  Image as ImageIcon,
  MousePointerClick,
  MonitorSmartphone,
  PieChart
} from "lucide-react";
import Cropper from "react-easy-crop";
import { fetchProdutos, fetchClientes, fetchPedidosAdmin, updateOrderStatus, loginAdmin, createProduto, deleteProduto, fetchCategorias, createCategoria, deleteCategoria, updateEstoqueProduto, fetchConfiguracoes, updateConfiguracoes, fetchWhatsAppStatus, fetchWhatsAppQRCode, logoutWhatsApp, importFromInstagram, fetchZonasEntrega, createZonaEntrega, updateZonaEntrega, deleteZonaEntrega, seedBoaVista, fetchBanners, createBanner, updateBanner, deleteBanner, fetchDashboardStats, enviarDisparo } from "../lib/api";
import { formatBRL } from "../lib/products";
import { formatWhatsApp } from "../lib/whatsapp";



type Tab = "dashboard" | "catalogo" | "pedidos" | "marketing" | "configuracoes";

const navItems = [
  { id: "dashboard" as Tab, label: "Dashboard", icon: PieChart },
  { id: "catalogo" as Tab, label: "Catálogo", icon: Shirt },
  { id: "pedidos" as Tab, label: "Pedidos", icon: Receipt },
  { id: "marketing" as Tab, label: "Marketing", icon: Megaphone },
  { id: "configuracoes" as Tab, label: "Configurações", icon: Settings },
];

export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_token");
    }
    return null;
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");

  const loginMutation = useMutation({
    mutationFn: () => loginAdmin(username, password),
    onSuccess: (data) => {
      localStorage.setItem("admin_token", data.access_token);
      setToken(data.access_token);
    },
    onError: (error) => alert(error.message || "Erro ao fazer login")
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50 p-4">
        <form 
          onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(); }}
          className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl"
        >
          <div className="mb-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary text-white">
              <Sparkles className="h-6 w-6" />
            </span>
            <h1 className="mt-4 font-display text-2xl text-primary">Admin Loja</h1>
          </div>
          <div className="space-y-4">
            <input
              placeholder="Usuário"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary"
            />
            <button 
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition hover:opacity-90"
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-pink-100 bg-white md:w-64 md:border-b-0 md:border-r">
        <div className="border-b border-pink-100 px-6 py-6">
          <a href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg text-primary">Annalicia</span>
          </a>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Painel Admin
          </p>
        </div>
        <nav className="flex gap-2 overflow-x-auto p-4 md:flex-col">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_rgba(236,72,153,0.55)]"
                    : "text-foreground/70 hover:bg-pink-50 hover:text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>
        <div className="hidden border-t border-pink-100 p-4 md:block">
          <a
            href="/"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar à loja
          </a>
          <button 
            onClick={() => { localStorage.removeItem("admin_token"); setToken(null); }}
            className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-400 hover:text-red-500"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-8 sm:px-8">
        {tab === "dashboard" ? (
          <DashboardPanel token={token} />
        ) : tab === "pedidos" ? (
          <OrdersPanel token={token} />
        ) : tab === "marketing" ? (
          <MarketingTabs token={token} />
        ) : tab === "configuracoes" ? (
          <ConfiguracoesTabs token={token} />
        ) : (
          <CatalogoTabs token={token} />
        )}
      </main>
    </div>
  );
}

function ProductsPanel({ token }: { token: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [precoCusto, setPrecoCusto] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  
  // Imagens
  const [imagens, setImagens] = useState<string[]>([]);
  const [cropOpen, setCropOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: fetchProdutos,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: fetchCategorias,
  });

  const mutation = useMutation({
    mutationFn: () => createProduto(token, {
      nome,
      preco_custo: parseFloat(precoCusto.replace(",", ".") || "0"),
      preco: parseFloat(preco.replace(",", ".")),
      estoque: parseInt(estoque, 10),
      categoria_id: (categoriaId && categoriaId !== "new") ? categoriaId : undefined,
      imagem_url: imagens.length > 0 ? JSON.stringify(imagens) : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      setModalOpen(false);
      setNome("");
      setPrecoCusto("");
      setPreco("");
      setEstoque("");
      setImagens([]);
      alert("Produto salvo com sucesso!");
    },
    onError: (e) => alert(e.message)
  });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    
    const MAX_SIZE = 1200;
    let width = pixelCrop.width;
    let height = pixelCrop.height;
    
    if (width > height) {
      if (width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      }
    } else {
      if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      width,
      height
    );
    
    return canvas.toDataURL("image/webp", 0.85);
  };



  const deleteProdMutation = useMutation({
    mutationFn: (id: string) => deleteProduto(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      alert("Produto deletado com sucesso!");
    },
    onError: (e) => alert(e.message)
  });

  const createCatMutation = useMutation({
    mutationFn: (nome: string) => createCategoria(token, nome),
    onSuccess: (novaCat) => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      setCategoriaId(novaCat.id);
      setNovaCategoria("");
      alert("Categoria criada com sucesso!");
    },
    onError: (e) => alert(e.message)
  });

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Dashboard</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">Gestão de Peças</h1>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_25px_-10px_rgba(236,72,153,0.55)] transition hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Adicionar Nova Peça
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_15px_40px_-25px_rgba(236,72,153,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-pink-50/50 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Foto</th>
                <th className="px-6 py-3 font-semibold">Nome</th>
                <th className="px-6 py-3 font-semibold">Preço</th>
                <th className="px-6 py-3 font-semibold">Categoria</th>
                <th className="px-6 py-3 font-semibold">Estoque</th>
                <th className="px-6 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
              ) : products.map((p: any) => (
                <tr key={p.id} className="border-t border-pink-50 hover:bg-pink-50/40">
                  <td className="px-6 py-4">
                    <img src={p.images?.[0] || ""} alt={p.name} className="h-14 w-12 rounded-xl object-cover bg-pink-50" />
                  </td>
                  <td className="px-6 py-4 font-display text-base">{p.name}</td>
                  <td className="px-6 py-4 font-semibold text-primary">{formatBRL(p.price)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-pink-100/50 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${p.stock < 10 ? "bg-pink-100 text-primary" : "bg-mint text-emerald-700"}`}>
                      {p.stock} un.
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Deletar o produto ${p.name}?`)) {
                          deleteProdMutation.mutate(p.id);
                        }
                      }}
                      className="text-muted-foreground hover:text-red-500 transition"
                      title="Deletar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl text-primary">Nova Peça ✨</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-full bg-pink-50 p-2 text-primary hover:bg-pink-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">Nome da Peça</label>
                <input required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Cropped Rosa" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/80">Preço de Custo (R$)</label>
                  <input type="number" step="0.01" value={precoCusto} onChange={e => setPrecoCusto(e.target.value)} placeholder="0.00" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/80">Preço de Venda (R$)</label>
                  <input required type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} placeholder="0.00" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/80">Estoque</label>
                  <input required type="number" value={estoque} onChange={e => setEstoque(e.target.value)} placeholder="0" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                </div>
              </div>
              
              {parseFloat(preco) > 0 && parseFloat(precoCusto) > 0 && (
                <div className="rounded-xl bg-green-50 p-3 border border-green-100 text-sm flex gap-6">
                  <div>
                    <span className="block text-green-700/70 mb-0.5 text-xs">Lucro Bruto</span>
                    <span className="font-semibold text-green-700">
                      R$ {(parseFloat(preco) - parseFloat(precoCusto)).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-green-700/70 mb-0.5 text-xs" title="Percentual sobre o preço de venda">Margem</span>
                    <span className="font-semibold text-green-700">
                      {(((parseFloat(preco) - parseFloat(precoCusto)) / parseFloat(preco)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-green-700/70 mb-0.5 text-xs" title="Percentual sobre o custo">Markup</span>
                    <span className="font-semibold text-green-700">
                      {(((parseFloat(preco) - parseFloat(precoCusto)) / parseFloat(precoCusto)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">Categoria</label>
                <div className="flex gap-2">
                  <select 
                    value={categoriaId} 
                    onChange={e => setCategoriaId(e.target.value)} 
                    className="flex-1 rounded-xl border border-pink-100 p-3 outline-none focus:border-primary bg-transparent"
                  >
                    <option value="">Geral</option>
                    {categorias.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                    <option value="new">+ Criar Nova Categoria</option>
                  </select>
                </div>
              </div>
              {categoriaId === "new" && (
                <div className="flex gap-2 items-end bg-pink-50 p-3 rounded-xl border border-pink-100">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-foreground/80">Nome da Nova Categoria</label>
                    <input 
                      value={novaCategoria} 
                      onChange={e => setNovaCategoria(e.target.value)} 
                      placeholder="Ex: Biquínis" 
                      className="w-full rounded-xl border border-pink-200 p-2 text-sm outline-none focus:border-primary" 
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (novaCategoria.trim()) {
                        createCatMutation.mutate(novaCategoria.trim());
                      }
                    }}
                    disabled={createCatMutation.isPending || !novaCategoria.trim()}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
                  >
                    {createCatMutation.isPending ? "..." : "Criar"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCategoriaId("")}
                    className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">Imagens da Peça ({imagens.length})</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = (event) => {
                      setImageToCrop(event.target?.result as string);
                      setCropOpen(true);
                      e.target.value = ""; // limpa o input para poder enviar a mesma imagem dnv
                    };
                  }}
                  className="w-full rounded-xl border border-pink-100 p-2 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-pink-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-pink-100" 
                />
                
                {imagens.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {imagens.map((img, idx) => (
                      <div key={idx} className="relative h-24 w-20 flex-shrink-0">
                        <img src={img} className="h-full w-full rounded-xl object-cover shadow-sm" />
                        <button 
                          type="button"
                          onClick={() => setImagens(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button disabled={mutation.isPending} type="submit" className="mt-4 w-full rounded-full bg-primary py-3 font-semibold text-white shadow-lg transition hover:opacity-90">
                {mutation.isPending ? "Salvando..." : "Salvar Peça"}
              </button>
            </form>
          </div>
        </div>
      )}

      {cropOpen && imageToCrop && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="flex h-full w-full max-w-lg flex-col rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-primary">Recortar Foto</h2>
              <button onClick={() => setCropOpen(false)} className="rounded-full bg-pink-50 p-2 text-primary hover:bg-pink-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="relative flex-1 rounded-xl bg-black/5 overflow-hidden">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={4 / 5} // Proporção padrão para moda
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              />
            </div>
            
            <button 
              type="button"
              onClick={async () => {
                const cropped = await getCroppedImg(imageToCrop, croppedAreaPixels);
                setImagens(prev => [...prev, cropped]);
                setCropOpen(false);
                setImageToCrop(null);
              }}
              className="mt-6 w-full rounded-full bg-primary py-3.5 font-semibold text-white transition hover:opacity-90"
            >
              Confirmar Recorte
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function OrdersPanel({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["pedidos"],
    queryFn: () => fetchPedidosAdmin(token),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => updateOrderStatus(token, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: (e: any) => {
      alert("Erro ao atualizar status: " + e.message);
    }
  });

  const handleStatusChange = (id: string, currentStatus: string, newStatus: string) => {
    if (currentStatus === "cancelado" || currentStatus === "entregue") {
      alert(`Não é possível alterar um pedido ${currentStatus}`);
      return;
    }
    if (newStatus === "cancelado") {
      if (!confirm("Tem certeza que deseja cancelar este pedido? O estoque será devolvido.")) return;
    }
    statusMutation.mutate({ id, status: newStatus });
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Vendas</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Pedidos</h1>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_15px_40px_-25px_rgba(236,72,153,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-pink-50/50 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Pedido ID</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum pedido ainda.</td></tr>
              ) : orders.map((o: any) => (
                <tr key={o.id} className="border-t border-pink-50 hover:bg-pink-50/40">
                  <td className="px-6 py-4 font-mono text-xs">#{o.numero ? String(o.numero).padStart(4, '0') : o.id.split('-')[0]}</td>
                  <td className="px-6 py-4 font-display">{o.cliente?.nome}<br/><span className="text-xs text-muted-foreground">{o.cliente?.whatsapp}</span></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold
                      ${o.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                        o.status === 'confirmado' ? 'bg-blue-100 text-blue-700' :
                        o.status === 'enviado' ? 'bg-purple-100 text-purple-700' :
                        o.status === 'entregue' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'}`}>
                      {o.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-primary">{formatBRL(o.total)}</td>
                  <td className="px-6 py-4">
                    {o.status !== 'cancelado' && o.status !== 'entregue' && (
                      <div className="flex flex-wrap items-center gap-2">
                        {o.status === 'pendente' && (
                          <button onClick={() => handleStatusChange(o.id, o.status, 'confirmado')} className="rounded-lg bg-blue-100 px-3 py-1 text-[10px] font-bold text-blue-700 transition hover:bg-blue-200">Confirmar</button>
                        )}
                        {o.status === 'confirmado' && (
                          <button onClick={() => handleStatusChange(o.id, o.status, 'enviado')} className="rounded-lg bg-purple-100 px-3 py-1 text-[10px] font-bold text-purple-700 transition hover:bg-purple-200">Marcar Enviado</button>
                        )}
                        {o.status === 'enviado' && (
                          <button onClick={() => handleStatusChange(o.id, o.status, 'entregue')} className="rounded-lg bg-green-100 px-3 py-1 text-[10px] font-bold text-green-700 transition hover:bg-green-200">Marcar Entregue</button>
                        )}
                        <button onClick={() => handleStatusChange(o.id, o.status, 'cancelado')} className="rounded-lg bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600 transition hover:bg-red-100">Cancelar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function MarketingPanel({ token }: { token: string }) {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => fetchClientes(token),
  });

  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const apagarBase = async () => {
    if (!confirm("Tem certeza que deseja apagar TODOS os clientes e TODOS os pedidos? Essa ação não tem volta!")) return;
    try {
      setEnviando(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/clientes/todos`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Falha ao apagar base");
      alert("Base apagada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleDisparo = async () => {
    if (!mensagem.trim()) return;
    try {
      setEnviando(true);
      await enviarDisparo(token, mensagem);
      alert("Disparo iniciado com sucesso! As mensagens estão sendo enviadas em segundo plano.");
      setMensagem("");
    } catch (err: any) {
      alert(err.message || "Falha ao iniciar disparo");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Engajamento</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Marketing & Disparos</h1>
      </div>

      <div className="mb-8 overflow-hidden rounded-3xl bg-white p-6 shadow-[0_15px_40px_-25px_rgba(236,72,153,0.3)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl">Nova Campanha (WhatsApp)</h2>
          <button
            onClick={apagarBase}
            disabled={enviando}
            className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            Zerar Base
          </button>
        </div>
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Digite a mensagem promocional. Ex: 'Olá! Temos novidades na Annalicia Modas!'"
          className="min-h-[120px] w-full resize-y rounded-xl border border-pink-100 bg-pink-50/30 p-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleDisparo}
            disabled={enviando || !mensagem.trim()}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-pink-500/20 transition hover:bg-pink-600 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {enviando ? "Iniciando..." : "Enviar Disparo em Massa"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white p-8 text-center shadow-[0_15px_40px_-25px_rgba(236,72,153,0.3)]">
        <h3 className="font-display text-lg text-muted-foreground">Base de Clientes (Disparo)</h3>
        {isLoading ? (
          <p className="mt-4 text-2xl font-bold text-primary animate-pulse">Carregando...</p>
        ) : (
          <>
            <p className="mt-4 text-6xl font-display text-primary">
              {new Set(customers.filter((c: any) => c.whatsapp && c.whatsapp.length >= 10).map((c: any) => c.whatsapp)).size}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              números de WhatsApp válidos e únicos prontos para receber suas campanhas.
            </p>
          </>
        )}
      </div>
    </>
  );
}

function CategoriasPanel({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  
  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ["categorias"],
    queryFn: fetchCategorias,
  });

  const createMutation = useMutation({
    mutationFn: (nome: string) => createCategoria(token, nome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      setNome("");
      alert("Categoria criada com sucesso!");
    },
    onError: (e) => alert(e.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategoria(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      alert("Categoria deletada com sucesso!");
    },
    onError: (e) => alert(e.message)
  });

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Organização</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Categorias</h1>
      </div>

      <div className="mb-8 flex gap-4">
        <input 
          value={nome} 
          onChange={e => setNome(e.target.value)} 
          placeholder="Nome da Categoria (Ex: Biquínis)" 
          className="w-full max-w-sm rounded-full border border-pink-100 px-6 py-3 outline-none focus:border-primary" 
        />
        <button 
          onClick={() => {
            if (nome.trim()) {
              createMutation.mutate(nome.trim());
            }
          }}
          disabled={createMutation.isPending || !nome.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_25px_-10px_rgba(236,72,153,0.55)] transition hover:scale-105 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {createMutation.isPending ? "Criando..." : "Criar"}
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_15px_40px_-25px_rgba(236,72,153,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-pink-50/50 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Nome</th>
                <th className="px-6 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={2} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
              ) : categorias.length === 0 ? (
                <tr><td colSpan={2} className="p-6 text-center text-muted-foreground">Nenhuma categoria cadastrada.</td></tr>
              ) : categorias.map((c: any) => (
                <tr key={c.id} className="border-t border-pink-50 hover:bg-pink-50/40">
                  <td className="px-6 py-4 font-display text-base">{c.nome}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Deletar a categoria ${c.nome}?`)) {
                          deleteMutation.mutate(c.id);
                        }
                      }}
                      className="text-muted-foreground hover:text-red-500 transition"
                      title="Deletar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function EstoquePanel({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: fetchProdutos,
  });

  const { data: config } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: () => fetchConfiguracoes(token),
  });

  const mutation = useMutation({
    mutationFn: ({ id, estoque }: { id: string; estoque: number }) => updateEstoqueProduto(token, id, estoque),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
    },
    onError: (e) => alert(e.message)
  });

  const handleUpdate = (id: string, current: number, change: number) => {
    const newStock = Math.max(0, current + change);
    mutation.mutate({ id, estoque: newStock });
  };

  const handleDirectUpdate = (id: string, value: string) => {
    const newStock = parseInt(value, 10);
    if (!isNaN(newStock) && newStock >= 0) {
      mutation.mutate({ id, estoque: newStock });
    }
  };

  const critico = config?.estoque_critico ?? 1;
  const atencao = config?.estoque_atencao ?? 3;

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Operacional</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Controle de Estoque</h1>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_15px_40px_-25px_rgba(236,72,153,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-pink-50/50 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-semibold">Foto</th>
                <th className="px-6 py-3 font-semibold">Produto</th>
                <th className="px-6 py-3 font-semibold">Qtd. Atual</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-center">Ajuste Rápido</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum produto cadastrado.</td></tr>
              ) : products.map((p: any) => {
                let badgeClass = "bg-mint text-emerald-700";
                let statusText = "Seguro";
                
                if (p.stock <= critico) {
                  badgeClass = "bg-red-100 text-red-700";
                  statusText = "Crítico";
                } else if (p.stock <= atencao) {
                  badgeClass = "bg-yellow-100 text-yellow-700";
                  statusText = "Atenção";
                }

                return (
                  <tr key={p.id} className="border-t border-pink-50 hover:bg-pink-50/40">
                    <td className="px-6 py-4">
                      <img src={p.images?.[0] || ""} alt={p.name} className="h-10 w-8 rounded-lg object-cover bg-pink-50" />
                    </td>
                    <td className="px-6 py-4 font-display text-base">{p.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                        {p.stock} un.
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold uppercase tracking-wider ${badgeClass.replace('bg-', 'text-').replace('text-', '')}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleUpdate(p.id, p.stock, -1)}
                          disabled={mutation.isPending || p.stock === 0}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-50 text-primary transition hover:bg-pink-100 disabled:opacity-50"
                        >
                          -1
                        </button>
                        <input
                          type="number"
                          defaultValue={p.stock}
                          key={p.stock} // força re-render quando o estoque muda
                          onBlur={(e) => handleDirectUpdate(p.id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleDirectUpdate(p.id, (e.target as HTMLInputElement).value)}
                          className="w-16 rounded-xl border border-pink-100 bg-transparent p-1.5 text-center text-sm outline-none focus:border-primary"
                        />
                        <button 
                          onClick={() => handleUpdate(p.id, p.stock, 1)}
                          disabled={mutation.isPending}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-50 text-primary transition hover:bg-pink-100 disabled:opacity-50"
                        >
                          +1
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ConfiguracoesPanel({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const [critico, setCritico] = useState("1");
  const [atencao, setAtencao] = useState("3");
  const [whatsappLoja, setWhatsappLoja] = useState("");
  const [linkInstagram, setLinkInstagram] = useState("");
  const [linkTiktok, setLinkTiktok] = useState("");
  const [popupAtivo, setPopupAtivo] = useState(false);
  const [popupTitulo, setPopupTitulo] = useState("");
  const [popupTexto, setPopupTexto] = useState("");
  const [popupImagem, setPopupImagem] = useState("");
  const [popupBotaoTexto, setPopupBotaoTexto] = useState("");
  const [popupBotaoLink, setPopupBotaoLink] = useState("");
  const [textoFrete, setTextoFrete] = useState("Frete grátis acima de R$ 199");
  const [textoBrinde, setTextoBrinde] = useState("Brinde fofo no pedido");

  const { data: config, isLoading } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: () => fetchConfiguracoes(token),
  });

  if (config && !isLoading && !queryClient.isMutating()) {
    if (config.estoque_critico.toString() !== critico) setCritico(config.estoque_critico.toString());
    if (config.estoque_atencao.toString() !== atencao) setAtencao(config.estoque_atencao.toString());
    if (config.whatsapp_loja && config.whatsapp_loja !== whatsappLoja) setWhatsappLoja(config.whatsapp_loja);
    if (config.link_instagram && config.link_instagram !== linkInstagram) setLinkInstagram(config.link_instagram);
    if (config.link_tiktok && config.link_tiktok !== linkTiktok) setLinkTiktok(config.link_tiktok);
    if (config.popup_ativo !== popupAtivo) setPopupAtivo(config.popup_ativo);
    if (config.popup_titulo && config.popup_titulo !== popupTitulo) setPopupTitulo(config.popup_titulo);
    if (config.popup_texto && config.popup_texto !== popupTexto) setPopupTexto(config.popup_texto);
    if (config.popup_imagem && config.popup_imagem !== popupImagem) setPopupImagem(config.popup_imagem);
    if (config.popup_botao_texto && config.popup_botao_texto !== popupBotaoTexto) setPopupBotaoTexto(config.popup_botao_texto);
    if (config.popup_botao_link && config.popup_botao_link !== popupBotaoLink) setPopupBotaoLink(config.popup_botao_link);
    if (config.texto_frete && config.texto_frete !== textoFrete) setTextoFrete(config.texto_frete);
    if (config.texto_brinde && config.texto_brinde !== textoBrinde) setTextoBrinde(config.texto_brinde);
  }

  const mutation = useMutation({
    mutationFn: () => updateConfiguracoes(token, {
      estoque_critico: parseInt(critico, 10),
      estoque_atencao: parseInt(atencao, 10),
      whatsapp_loja: whatsappLoja.replace(/\D/g, ""),
      link_instagram: linkInstagram,
      link_tiktok: linkTiktok,
      popup_ativo: popupAtivo,
      popup_titulo: popupTitulo,
      popup_texto: popupTexto,
      popup_imagem: popupImagem,
      popup_botao_texto: popupBotaoTexto,
      popup_botao_link: popupBotaoLink,
      texto_frete: textoFrete,
      texto_brinde: textoBrinde
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes"] });
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      alert("Configurações salvas com sucesso!");
    },
    onError: (e) => alert(e.message)
  });

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sistema</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Configurações</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-[0_15px_40px_-25px_rgba(236,72,153,0.3)]">
          <h2 className="font-display text-xl mb-6">Níveis de Alerta de Estoque</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Defina quando o sistema deve classificar o estoque de um produto como crítico ou merecedor de atenção.
          </p>

          <form 
            onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-semibold text-red-600">Estoque Crítico (&lt;=)</label>
              <input
                type="number"
                min="0"
                value={critico}
                onChange={e => setCritico(e.target.value)}
                className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-red-400"
              />
              <p className="mt-1 text-xs text-muted-foreground">Estoque ficará vermelho se for igual ou menor que este valor.</p>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-semibold text-yellow-600">Estoque Atenção (&lt;=)</label>
              <input
                type="number"
                min="0"
                value={atencao}
                onChange={e => setAtencao(e.target.value)}
                className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-yellow-400"
              />
              <p className="mt-1 text-xs text-muted-foreground">Estoque ficará amarelo se for igual ou menor que este valor, mas maior que o crítico.</p>
            </div>

            <div className="pt-4 border-t border-pink-50">
              <label className="mb-1 block text-sm font-semibold text-primary">WhatsApp da Loja</label>
              <input
                type="tel"
                value={whatsappLoja}
                onChange={e => setWhatsappLoja(e.target.value)}
                placeholder="(95) 99999-9999"
                className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary"
              />
              <p className="mt-1 text-xs text-muted-foreground">Número (com DDD) que receberá os comprovantes de PIX. Apenas números.</p>
            </div>

            <div className="pt-4 border-t border-pink-50 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-primary">Link do Instagram</label>
                <input
                  type="url"
                  value={linkInstagram}
                  onChange={e => setLinkInstagram(e.target.value)}
                  placeholder="https://instagram.com/sua.loja"
                  className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-primary">Link do TikTok</label>
                <input
                  type="url"
                  value={linkTiktok}
                  onChange={e => setLinkTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@sua.loja"
                  className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-pink-50 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-primary">Texto Destaque (Esquerda)</label>
                <input
                  type="text"
                  value={textoFrete}
                  onChange={e => setTextoFrete(e.target.value)}
                  placeholder="Ex: Frete grátis acima de R$ 199"
                  className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-primary">Texto Destaque (Direita)</label>
                <input
                  type="text"
                  value={textoBrinde}
                  onChange={e => setTextoBrinde(e.target.value)}
                  placeholder="Ex: Brinde fofo no pedido"
                  className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="pt-8 border-t border-pink-50">
              <h3 className="mb-4 text-lg font-display text-pink-900 flex items-center justify-between">
                Popup Promocional
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={popupAtivo} onChange={e => setPopupAtivo(e.target.checked)} className="h-5 w-5 accent-primary" />
                  <span className="text-sm font-medium">Ativar Popup</span>
                </label>
              </h3>
              
              {popupAtivo && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Título do Popup</label>
                    <input type="text" value={popupTitulo} onChange={e => setPopupTitulo(e.target.value)} placeholder="Ex: Ganhe 10% OFF!" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Texto do Popup</label>
                    <textarea value={popupTexto} onChange={e => setPopupTexto(e.target.value)} rows={3} placeholder="Insira seu e-mail para receber o cupom..." className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary resize-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">URL da Imagem (Opcional)</label>
                    <input type="url" value={popupImagem} onChange={e => setPopupImagem(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-semibold">Texto do Botão</label>
                      <input type="text" value={popupBotaoTexto} onChange={e => setPopupBotaoTexto(e.target.value)} placeholder="Pegar Cupom" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold">Link do Botão</label>
                      <input type="text" value={popupBotaoLink} onChange={e => setPopupBotaoLink(e.target.value)} placeholder="/colecao-nova" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={mutation.isPending}
              className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white transition hover:opacity-90"
            >
              {mutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function WhatsAppPanel({ token }: { token: string }) {
  const { data: statusData, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["whatsapp_status"],
    queryFn: () => fetchWhatsAppStatus(token),
    refetchInterval: (query) => {
      // Polling if not open
      const st = query.state.data?.status;
      if (st && st !== "open") return 3000;
      return false;
    }
  });

  const { data: qrData, isLoading: isLoadingQr, error: qrError } = useQuery({
    queryKey: ["whatsapp_qrcode"],
    queryFn: () => fetchWhatsAppQRCode(token),
    enabled: statusData?.status !== "open",
    retry: false
  });

  const logoutMut = useMutation({
    mutationFn: () => logoutWhatsApp(token),
    onSuccess: () => {
      refetchStatus();
    }
  });

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Integrações</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">WhatsApp API</h1>
      </div>

      <div className="max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_15px_40px_-25px_rgba(236,72,153,0.3)]">
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl">Status da Conexão</h2>
            {isLoadingStatus ? (
              <span className="inline-flex items-center rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-600">
                Carregando...
              </span>
            ) : statusData?.status === "open" ? (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Conectado
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                Desconectado
              </span>
            )}
          </div>

          {statusData?.status === "open" ? (
            <div className="text-center py-8">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500">
                <MessageCircle className="h-8 w-8" />
              </span>
              <p className="mt-4 text-sm text-muted-foreground">O WhatsApp está conectado e enviando mensagens de confirmação automaticamente.</p>
              <button
                onClick={() => {
                  if (confirm("Tem certeza que deseja desconectar? O sistema deixará de enviar mensagens automáticas.")) {
                    logoutMut.mutate();
                  }
                }}
                disabled={logoutMut.isPending}
                className="mt-6 rounded-full bg-red-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {logoutMut.isPending ? "Desconectando..." : "Desconectar WhatsApp"}
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="mb-6 text-sm text-muted-foreground">
                Para o sistema conseguir enviar os comprovantes com código PIX automaticamente, leia o QR Code abaixo usando o <b>WhatsApp da Loja</b>.
              </p>
              
              <div className="mx-auto mb-4 flex min-h-[256px] w-64 items-center justify-center rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 p-2">
                {isLoadingQr ? (
                  <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                ) : qrError ? (
                  <p className="text-sm text-muted-foreground text-red-500 font-semibold p-4 text-center">{qrError.message}</p>
                ) : qrData?.base64 ? (
                  <img src={qrData.base64} alt="WhatsApp QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                ) : (
                  <p className="text-sm text-muted-foreground text-red-500">Falha ao carregar QR Code. O servidor pode estar indisponível.</p>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mt-4">
                Abra o WhatsApp no celular {">"} Dispositivos Conectados {">"} Conectar um Aparelho.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PagamentosPanel({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const [pixChave, setPixChave] = useState("");
  const [pixTipo, setPixTipo] = useState("");
  const [pixNome, setPixNome] = useState("");
  const [pixCidade, setPixCidade] = useState("");

  const { data: config, isLoading } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: () => fetchConfiguracoes(token),
  });

  if (config && !isLoading && !queryClient.isMutating()) {
    if (pixChave === "" && config.pix_chave) setPixChave(config.pix_chave);
    if (pixTipo === "" && config.pix_tipo) setPixTipo(config.pix_tipo);
    if (pixNome === "" && config.pix_nome_recebedor) setPixNome(config.pix_nome_recebedor);
    if (pixCidade === "" && config.pix_cidade_recebedor) setPixCidade(config.pix_cidade_recebedor);
  }

  const mutation = useMutation({
    mutationFn: () => updateConfiguracoes(token, {
      pix_chave: pixChave,
      pix_tipo: pixTipo,
      pix_nome_recebedor: pixNome,
      pix_cidade_recebedor: pixCidade
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes"] });
      alert("Configurações de Pagamento salvas com sucesso!");
    },
    onError: (e) => alert(e.message)
  });
  // Zonas de Entrega
  const { data: zonas = [], isLoading: loadingZonas } = useQuery({
    queryKey: ["zonas-entrega"],
    queryFn: fetchZonasEntrega,
  });

  const [novoBairro, setNovoBairro] = useState("");
  const [novaTaxa, setNovaTaxa] = useState("");
  
  const createZonaMutation = useMutation({
    mutationFn: () => createZonaEntrega(token, { bairro: novoBairro.trim(), taxa: parseFloat(novaTaxa.replace(",", ".")), ativo: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zonas-entrega"] });
      setNovoBairro("");
      setNovaTaxa("");
    },
    onError: (e: any) => alert(e.message)
  });

  const updateZonaMutation = useMutation({
    mutationFn: ({ id, taxa, ativo }: { id: string; taxa?: number; ativo?: boolean }) => updateZonaEntrega(token, id, { taxa, ativo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["zonas-entrega"] }),
    onError: (e: any) => alert(e.message)
  });

  const deleteZonaMutation = useMutation({
    mutationFn: (id: string) => deleteZonaEntrega(token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["zonas-entrega"] }),
    onError: (e: any) => alert(e.message)
  });

  const seedMutation = useMutation({
    mutationFn: () => seedBoaVista(token),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["zonas-entrega"] });
      alert(data.message);
    },
    onError: (e: any) => alert(e.message)
  });

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Financeiro</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Pagamentos (PIX)</h1>
      </div>

      <div className="mb-6 rounded-2xl bg-yellow-50 border border-yellow-200 p-4">
        <div className="flex gap-3">
          <div className="mt-1 font-semibold text-yellow-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-yellow-800">Pagamentos 100% via PIX</h3>
            <p className="mt-1 text-sm text-yellow-700">
              O sistema gera um código "Copia e Cola" válido com o valor exato do pedido utilizando a sua chave PIX configurada abaixo. 
              <br/> A integração com <b>Mercado Pago</b> para baixa automática do pedido está prevista para as próximas atualizações!
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-[0_15px_40px_-25px_rgba(236,72,153,0.3)]">
        <h2 className="font-display text-xl mb-6">Configurar Chave Recebedora</h2>
        
        <form 
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">Tipo da Chave</label>
              <select 
                value={pixTipo} 
                onChange={e => setPixTipo(e.target.value)} 
                className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary bg-transparent"
              >
                <option value="">Selecione...</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone (com DDD)</option>
                <option value="aleatoria">Chave Aleatória</option>
              </select>
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">Chave PIX</label>
              <input
                type="text"
                value={pixChave}
                onChange={e => setPixChave(e.target.value)}
                placeholder="Ex: 123.456.789-00"
                className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">Nome do Titular/Loja</label>
              <input
                type="text"
                value={pixNome}
                onChange={e => setPixNome(e.target.value)}
                placeholder="Ex: Annalicia Modas"
                maxLength={25}
                className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary"
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">Cidade do Titular</label>
              <input
                type="text"
                value={pixCidade}
                onChange={e => setPixCidade(e.target.value)}
                placeholder="Ex: Sao Paulo"
                maxLength={15}
                className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={mutation.isPending}
            className="mt-6 w-full rounded-full bg-primary py-3.5 font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? "Salvando..." : "Salvar Configurações PIX"}
          </button>
        </form>
      </div>

      <div className="mt-8 max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-[0_15px_40px_-25px_rgba(236,72,153,0.3)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
          <h2 className="font-display text-xl">Zonas de Entrega</h2>
          <button 
            type="button"
            onClick={() => { if(confirm("Deseja adicionar os 39 bairros de Boa Vista com uma taxa padrão de R$ 10,00? Você poderá alterar as taxas depois.")) seedMutation.mutate(); }}
            disabled={seedMutation.isPending}
            className="text-xs font-semibold text-purple-600 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-full transition"
          >
            {seedMutation.isPending ? "Preenchendo..." : "✨ Preencher Bairros de Boa Vista"}
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Cadastre os bairros atendidos e suas respectivas taxas de entrega.</p>
        
        <form 
          onSubmit={e => { e.preventDefault(); createZonaMutation.mutate(); }}
          className="flex flex-col sm:flex-row gap-4 items-end mb-6 bg-pink-50/50 p-4 rounded-2xl border border-pink-100"
        >
          <div className="flex-1 w-full">
            <label className="mb-1 block text-sm font-medium text-foreground/80">Novo Bairro</label>
            <input
              required
              type="text"
              value={novoBairro}
              onChange={e => setNovoBairro(e.target.value)}
              placeholder="Ex: Centro"
              className="w-full rounded-xl border border-pink-100 p-2.5 outline-none focus:border-primary"
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="mb-1 block text-sm font-medium text-foreground/80">Taxa (R$)</label>
            <input
              required
              type="number"
              step="0.01"
              value={novaTaxa}
              onChange={e => setNovaTaxa(e.target.value)}
              placeholder="Ex: 5.00"
              className="w-full rounded-xl border border-pink-100 p-2.5 outline-none focus:border-primary"
            />
          </div>
          <button 
            type="submit"
            disabled={createZonaMutation.isPending || !novoBairro.trim() || !novaTaxa.trim()}
            className="w-full sm:w-auto rounded-xl bg-primary px-6 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 h-[46px]"
          >
            Adicionar
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-pink-100 text-muted-foreground">
                <th className="pb-3 font-medium">Bairro</th>
                <th className="pb-3 font-medium">Taxa de Entrega</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loadingZonas ? (
                <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">Carregando...</td></tr>
              ) : zonas.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">Nenhuma zona de entrega cadastrada.</td></tr>
              ) : (
                zonas.map((z: any) => (
                  <tr key={z.id} className="border-b border-pink-50 last:border-0 group">
                    <td className="py-3 font-medium text-foreground/80">{z.bairro}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateZonaMutation.mutate({ id: z.id, taxa: Math.max(0, z.taxa - 1) })}
                          className="grid h-6 w-6 place-items-center rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 transition"
                          title="Diminuir R$ 1,00"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-16 text-center font-medium">{formatBRL(z.taxa)}</span>
                        <button 
                          onClick={() => updateZonaMutation.mutate({ id: z.id, taxa: z.taxa + 1 })}
                          className="grid h-6 w-6 place-items-center rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 transition"
                          title="Aumentar R$ 1,00"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <button 
                        onClick={() => updateZonaMutation.mutate({ id: z.id, ativo: !z.ativo })}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${z.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {z.ativo ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Remover taxa do bairro ${z.bairro}?`)) {
                            deleteZonaMutation.mutate(z.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-red-500 transition"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}


function BannersPanel({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: fetchBanners,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [badgeText, setBadgeText] = useState("");
  const [titleHighlight, setTitleHighlight] = useState("");
  const [titleMain, setTitleMain] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buttonText, setButtonText] = useState("Ver Looks");
  const [buttonLink, setButtonLink] = useState("#looks");
  const [button2Text, setButton2Text] = useState("");
  const [button2Link, setButton2Link] = useState("");
  const [corDestaque, setCorDestaque] = useState("#ec4899"); // default pink

  const openEdit = (banner: any) => {
    setEditId(banner.id);
    setBadgeText(banner.badge_text || "");
    setTitleHighlight(banner.title_highlight || "");
    setTitleMain(banner.title_main || "");
    setSubtitle(banner.subtitle || "");
    setImageUrl(banner.image_url || "");
    setButtonText(banner.button_text || "Ver Looks");
    setButtonLink(banner.button_link || "#looks");
    setButton2Text(banner.button2_text || "");
    setButton2Link(banner.button2_link || "");
    setCorDestaque(banner.cor_destaque || "#ec4899");
    setModalOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setBadgeText("");
    setTitleHighlight("");
    setTitleMain("");
    setSubtitle("");
    setImageUrl("");
    setButtonText("Ver Looks");
    setButtonLink("#looks");
    setButton2Text("");
    setButton2Link("");
    setCorDestaque("#ec4899");
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (dados: any) => editId ? updateBanner(token, editId, dados) : createBanner(token, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      setModalOpen(false);
    },
    onError: (e) => alert(e.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBanner(token, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banners"] })
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return alert("A imagem é obrigatória.");
    saveMutation.mutate({
      badge_text: badgeText,
      title_highlight: titleHighlight,
      title_main: titleMain,
      subtitle: subtitle,
      image_url: imageUrl,
      button_text: buttonText,
      button_link: buttonLink,
      button2_text: button2Text,
      button2_link: button2Link,
      cor_destaque: corDestaque
    });
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Aparência</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">Banners (Carrossel)</h1>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-pink-600"
        >
          <Plus className="h-4 w-4" /> Novo Banner
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? <p>Carregando...</p> : banners.map((b: any) => (
          <div key={b.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-pink-100">
            <img src={b.image_url} alt="Banner" className="h-40 w-full object-cover" />
            <div className="p-5">
              <h3 className="font-display text-lg text-pink-900">{b.title_highlight} {b.title_main}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{b.subtitle}</p>
              
              <div className="mt-6 flex justify-end gap-2 border-t border-pink-50 pt-4">
                <button
                  onClick={() => openEdit(b)}
                  className="rounded-full bg-pink-50 px-4 py-1.5 text-xs font-semibold text-pink-700 transition hover:bg-pink-100"
                >
                  Editar
                </button>
                <button
                  onClick={() => { if(confirm("Excluir este banner?")) deleteMutation.mutate(b.id) }}
                  className="rounded-full bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl">{editId ? "Editar Banner" : "Novo Banner"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-full p-2 hover:bg-pink-50"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Badge (Topo)</label>
                <input value={badgeText} onChange={e => setBadgeText(e.target.value)} placeholder="Ex: Drop de primavera ✨" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Título (Destaque Rosa)</label>
                  <input value={titleHighlight} onChange={e => setTitleHighlight(e.target.value)} placeholder="Coleção Primavera:" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Título (Restante)</label>
                  <input value={titleMain} onChange={e => setTitleMain(e.target.value)} placeholder="Seja Você Mesma!" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Subtítulo</label>
                <textarea value={subtitle} onChange={e => setSubtitle(e.target.value)} rows={3} placeholder="Looks fofos..." className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary resize-none" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">URL da Imagem (Recomendado 1200x1500)</label>
                <input required type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Texto do Botão 1</label>
                  <input value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="Ver Looks" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Link do Botão 1</label>
                  <input value={buttonLink} onChange={e => setButtonLink(e.target.value)} placeholder="#looks" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Texto do Botão 2 (Opcional)</label>
                  <input value={button2Text} onChange={e => setButton2Text(e.target.value)} placeholder="Ver Mais" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Link do Botão 2 (Opcional)</label>
                  <input value={button2Link} onChange={e => setButton2Link(e.target.value)} placeholder="/produtos" className="w-full rounded-xl border border-pink-100 p-3 outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">Cor de Destaque</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={corDestaque} onChange={e => setCorDestaque(e.target.value)} className="h-10 w-20 cursor-pointer rounded-xl border-none outline-none" />
                  <span className="text-sm text-muted-foreground">Essa cor substituirá o rosa neste banner (botões, luzes, etc).</span>
                </div>
              </div>

              <button disabled={saveMutation.isPending} type="submit" className="w-full mt-6 rounded-xl bg-primary py-4 font-semibold text-white transition hover:bg-pink-600">
                {saveMutation.isPending ? "Salvando..." : "Salvar Banner"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function DashboardPanel({ token }: { token: string }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: () => fetchDashboardStats(token),
  });

  if (isLoading) return <div className="text-muted-foreground p-8">Carregando dashboard...</div>;

  const faturamento = stats?.faturamento_total || 0;
  const custo = stats?.custo_total || 0;
  const lucro = stats?.lucro_bruto || 0;
  const margem = custo > 0 ? (lucro / custo) * 100 : 0;

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-primary">Dashboard de Vendas</h2>
          <p className="text-sm text-muted-foreground">Visão geral do faturamento e margem de lucro.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-muted-foreground">Faturamento Total</div>
          <div className="mt-2 text-3xl font-display text-gray-900">
            R$ {faturamento.toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-muted-foreground">Custo de Mercadorias</div>
          <div className="mt-2 text-3xl font-display text-red-500">
            - R$ {custo.toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-green-50 p-6 shadow-sm">
          <div className="text-sm font-semibold text-green-700/80">Lucro Bruto</div>
          <div className="mt-2 text-3xl font-display text-green-600">
            R$ {lucro.toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-muted-foreground">Margem Média (Markup)</div>
          <div className="mt-2 text-3xl font-display text-primary">
            {margem.toFixed(1)}%
          </div>
        </div>
        
        <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center text-primary">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-semibold text-muted-foreground">Total de Pedidos</div>
            <div className="text-2xl font-display text-gray-900">{stats?.total_pedidos || 0}</div>
          </div>
        </div>
      </div>
    </>
  );
}

function CatalogoTabs({ token }: { token: string }) {
  const [subTab, setSubTab] = useState("produtos");
  return (
    <>
      <div className="mb-6 flex gap-4 border-b border-pink-100">
        <button onClick={() => setSubTab("produtos")} className={`pb-3 text-sm font-semibold transition-colors ${subTab === "produtos" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>Produtos</button>
        <button onClick={() => setSubTab("categorias")} className={`pb-3 text-sm font-semibold transition-colors ${subTab === "categorias" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>Categorias</button>
        <button onClick={() => setSubTab("estoque")} className={`pb-3 text-sm font-semibold transition-colors ${subTab === "estoque" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>Estoque</button>
      </div>
      {subTab === "produtos" && <ProductsPanel token={token} />}
      {subTab === "categorias" && <CategoriasPanel token={token} />}
      {subTab === "estoque" && <EstoquePanel token={token} />}
    </>
  );
}

function MarketingTabs({ token }: { token: string }) {
  const [subTab, setSubTab] = useState("clientes");
  return (
    <>
      <div className="mb-6 flex gap-4 border-b border-pink-100">
        <button onClick={() => setSubTab("clientes")} className={`pb-3 text-sm font-semibold transition-colors ${subTab === "clientes" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>Clientes</button>
        <button onClick={() => setSubTab("banners")} className={`pb-3 text-sm font-semibold transition-colors ${subTab === "banners" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>Banners</button>
      </div>
      {subTab === "clientes" && <MarketingPanel token={token} />}
      {subTab === "banners" && <BannersPanel token={token} />}
    </>
  );
}

function ConfiguracoesTabs({ token }: { token: string }) {
  const [subTab, setSubTab] = useState("geral");
  return (
    <>
      <div className="mb-6 flex gap-4 border-b border-pink-100">
        <button onClick={() => setSubTab("geral")} className={`pb-3 text-sm font-semibold transition-colors ${subTab === "geral" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>Geral</button>
        <button onClick={() => setSubTab("pagamentos")} className={`pb-3 text-sm font-semibold transition-colors ${subTab === "pagamentos" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>Pagamentos</button>
        <button onClick={() => setSubTab("whatsapp")} className={`pb-3 text-sm font-semibold transition-colors ${subTab === "whatsapp" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>WhatsApp</button>
      </div>
      {subTab === "geral" && <ConfiguracoesPanel token={token} />}
      {subTab === "pagamentos" && <PagamentosPanel token={token} />}
      {subTab === "whatsapp" && <WhatsAppPanel token={token} />}
    </>
  );
}
