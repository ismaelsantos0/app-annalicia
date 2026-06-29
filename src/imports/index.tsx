import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Truck, Gift, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { CartDrawer } from "../components/CartDrawer";
import { ProductCard } from "../components/ProductCard";
import { NotificationBubble } from "./NotificationBubble";
import { useQuery } from "@tanstack/react-query";
import { fetchProdutos, fetchCategorias, fetchBanners, fetchConfiguracoes } from "../lib/api";
import { useState, useEffect } from "react";
import type { Product } from "../lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Annalicia Modas — Coleção Primavera" },
      {
        name: "description",
        content:
          "Moda jovem aesthetic. Looks coquette, vestidos floral e tops fofos para você ser você mesma.",
      },
    ],
  }),
  component: Storefront,
});

function Storefront() {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["produtos"],
    queryFn: fetchProdutos,
  });
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: fetchCategorias,
  });

  const [activeCategory, setActiveCategory] = useState<string>("Todos");

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#novidades') {
        setActiveCategory("Novidades");
      } else if (window.location.hash === '#looks') {
        setActiveCategory("Todos");
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const filteredProducts = activeCategory === "Todos" 
    ? products 
    : activeCategory === "Novidades"
      ? products.filter(p => p.isNew)
      : products.filter(p => p.category === activeCategory);

  const { data: banners = [] } = useQuery({
    queryKey: ["banners"],
    queryFn: fetchBanners,
  });

  const { data: config } = useQuery({
    queryKey: ["configuracoes_public"],
    queryFn: () => fetchConfiguracoes(),
  });

  const activeBanners = (Array.isArray(banners) ? banners : []).filter((b: any) => b?.ativo);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const currentBanner = activeBanners[currentBannerIndex] || {
    badge_text: "Drop de primavera ✨",
    title_highlight: "Coleção Primavera:",
    title_main: "Seja Você Mesma!",
    subtitle: "Looks fofos, coquette e cheios de personalidade pra você arrasar em qualquer rolê. Encontre a peça que combina com a sua vibe. 💕",
    image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
    button_text: "Ver Looks",
    button_link: "#looks"
  };

  return (
    <div className="min-h-screen">
      {config && <PromoPopup config={config} />}
      <Navbar />
      <CartDrawer />
      <NotificationBubble />

      {/* Hero */}
      <section className="relative overflow-hidden transition-all duration-700 ease-in-out">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-pink-200/50 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-emerald-100 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8 lg:py-24">
          <div key={currentBannerIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {currentBanner.badge_text && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-emerald-700">
                <Sparkles className="h-3 w-3" />
                {currentBanner.badge_text}
              </span>
            )}
            <h1 className="mt-5 font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              {currentBanner.title_highlight}{" "}
              <span style={{ color: currentBanner.cor_destaque || "#ec4899" }}>{currentBanner.title_main}</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              {currentBanner.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={currentBanner.button_link}
                style={{ 
                  backgroundColor: currentBanner.cor_destaque || "#ec4899",
                  boxShadow: `0 15px 30px -10px ${currentBanner.cor_destaque || "#ec4899"}88`
                }}
                className="rounded-full px-8 py-4 text-sm font-semibold text-white transition hover:scale-105"
              >
                {currentBanner.button_text}
              </a>
              
              {currentBanner.button2_text ? (
                <a
                  href={currentBanner.button2_link}
                  style={{ 
                    borderColor: `${currentBanner.cor_destaque || "#ec4899"}33`,
                    color: currentBanner.cor_destaque || "#ec4899"
                  }}
                  className="rounded-full border-2 bg-white px-6 py-3.5 text-sm font-semibold transition hover:bg-gray-50"
                >
                  {currentBanner.button2_text}
                </a>
              ) : (
                <a
                  href="#novidades"
                  className="rounded-full border-2 border-primary/20 bg-white px-6 py-3.5 text-sm font-semibold text-primary transition hover:bg-pink-50"
                >
                  Novidades
                </a>
              )}
            </div>
            
            {activeBanners.length > 1 && (
              <div className="mt-8 flex items-center gap-3">
                {activeBanners.map((banner: any, idx: number) => {
                  const isActive = idx === currentBannerIndex;
                  const dotColor = banner.cor_destaque || "#ec4899";
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`group relative flex h-3 transition-all duration-300 ${isActive ? 'w-10' : 'w-3 hover:w-5'}`}
                      aria-label={`Ir para o banner ${idx + 1}`}
                    >
                      <span 
                        className="absolute inset-0 rounded-full transition-all duration-300"
                        style={{ 
                          backgroundColor: isActive ? dotColor : '#fbcfe8',
                          opacity: isActive ? 1 : 0.6
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" /> {config?.texto_frete || "Frete grátis acima de R$ 199"}
              </span>
              <span className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" /> {config?.texto_brinde || "Brinde fofo no pedido"}
              </span>
            </div>
          </div>
          <div className="relative" key={`img-${currentBannerIndex}`}>
            <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-pink-200 via-pink-100 to-emerald-100 blur-2xl animate-pulse" />
            <div className="relative overflow-hidden rounded-[2.5rem] shadow-[0_30px_60px_-20px_rgba(236,72,153,0.4)] animate-in fade-in zoom-in-95 duration-700">
              <img
                src={currentBanner.image_url}
                alt="Banner principal"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-2xl bg-white px-4 py-3 shadow-lg animate-in slide-in-from-bottom-8 duration-700 delay-150">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Best seller
              </p>
              <p className="font-display text-primary">+1.2k vendidos 💖</p>
            </div>
          </div>
        </div>
      </section>

      {/* Looks */}
      <div id="novidades" className="absolute -translate-y-24" />
      <section
        id="looks"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Vitrine
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">
              Looks que tão bombando 🌸
            </h2>
          </div>
          <a
            href="#novidades"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Ver tudo →
          </a>
        </div>

        {/* Categorias Filtro */}
        <div className="mb-10 flex flex-wrap gap-3">
          <button
            onClick={() => setActiveCategory("Todos")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              activeCategory === "Todos"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-pink-50 text-foreground hover:bg-pink-100 hover:text-primary"
            }`}
          >
            Todos
          </button>
          {categorias.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.nome)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                activeCategory === cat.nome
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-pink-50 text-foreground hover:bg-pink-100 hover:text-primary"
              }`}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p className="text-muted-foreground">Carregando looks...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-muted-foreground">Nenhum look nessa categoria ainda.</p>
          ) : (
            filteredProducts.slice(0, 3).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))
          )}
        </div>

        {filteredProducts.length > 3 && (
          <div className="mt-20 mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Tem mais
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">
              Descubra {activeCategory !== "Todos" ? activeCategory : "Mais Looks"} ✨
            </h2>
          </div>
        )}
        {filteredProducts.length > 3 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.slice(3).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function PromoPopup({ config }: { config: any }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!config?.popup_ativo) return;
    
    // Check if popup was closed in the last 24 hours
    const lastClosed = localStorage.getItem("promo_popup_closed");
    if (lastClosed) {
      const timeSinceClosed = Date.now() - parseInt(lastClosed, 10);
      const hours24 = 24 * 60 * 60 * 1000;
      if (timeSinceClosed < hours24) return; // Don't show
    }

    // Delay popup slightly for better UX
    const timer = setTimeout(() => setIsOpen(true), 2500);
    return () => clearTimeout(timer);
  }, [config]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("promo_popup_closed", Date.now().toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <button 
          onClick={handleClose} 
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-white backdrop-blur-md transition hover:bg-black/20"
        >
          <X className="h-4 w-4" />
        </button>
        
        {config.popup_imagem && (
          <img src={config.popup_imagem} alt="Promo" className="h-48 w-full object-cover" />
        )}
        
        <div className={`p-8 text-center ${!config.popup_imagem && 'pt-12'}`}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-primary">
            <Gift className="h-6 w-6" />
          </div>
          <h2 className="font-display text-3xl">{config.popup_titulo || "Novidade para você!"}</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {config.popup_texto}
          </p>
          
          {(config.popup_botao_texto || config.popup_botao_link) && (
            <a
              href={config.popup_botao_link || "#"}
              onClick={handleClose}
              className="mt-8 inline-block w-full rounded-full bg-primary px-6 py-4 font-semibold text-white shadow-lg shadow-pink-500/30 transition hover:bg-pink-600 hover:scale-105"
            >
              {config.popup_botao_texto || "Aproveitar"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
