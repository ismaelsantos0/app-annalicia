import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { X, MessageCircle, MapPin, User, ArrowLeft, ShoppingBag } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCart } from "../lib/cart-context";
import { createPedido, fetchZonasEntrega } from "../lib/api";
import {
  formatWhatsApp,
  isValidWhatsApp,
  onlyDigits,
} from "../lib/whatsapp";
import { formatBRL } from "../lib/products";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [{ title: "Finalizar Pedido — Annalicia Modas" }],
  }),
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, updateQuantity } = useCart();
  
  const mutation = useMutation({
    mutationFn: createPedido,
    onSuccess: (data) => {
      items.forEach((i) => updateQuantity(i.id, 0));
      setSuccessData(data);
    },
    onError: (error: any) => {
      alert("Erro ao finalizar pedido: " + (error.message || "Erro desconhecido"));
    }
  });

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [deliveryType, setDeliveryType] = useState<"retirada" | "entrega">("entrega");
  
  // Delivery address states
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  
  const [successData, setSuccessData] = useState<any | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    whatsapp?: string;
    address?: string;
    cep?: string;
    numero?: string;
  }>({});

  const { data: zonas = [] } = useQuery({
    queryKey: ["zonas-entrega"],
    queryFn: fetchZonasEntrega,
  });

  const { data: config } = useQuery({
    queryKey: ["configuracoes_public"],
    queryFn: () => fetchConfiguracoes(),
  });

  // Calculate matching zone and delivery fee
  const currentZone = zonas.find((z: any) => z.bairro.toLowerCase() === bairro.toLowerCase());
  const deliveryFee = deliveryType === "entrega" ? (currentZone?.taxa || 0) : 0;
  const finalTotal = total + deliveryFee;
  const isBairroUnknown = deliveryType === "entrega" && bairro && !currentZone;

  async function handleCepSearch() {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setRua(data.logradouro || "");
        setBairro(data.bairro || "");
        setCidade(data.localidade || "");
      } else {
        alert("CEP não encontrado");
      }
    } catch (e) {
      alert("Erro ao buscar CEP");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Informe seu nome completo";
    if (!isValidWhatsApp(whatsapp))
      next.whatsapp = "WhatsApp inválido. Ex.: (11) 91234-5678";
      
    let finalAddress = "Retirada na Loja";
    if (deliveryType === "entrega") {
      if (cep.replace(/\D/g, "").length !== 8) next.cep = "CEP inválido";
      if (!numero.trim()) next.numero = "Informe o número";
      if (!rua || !bairro) next.address = "Preencha o CEP corretamente";
      
      finalAddress = `${rua}, ${numero}${complemento ? " - " + complemento : ""} - ${bairro}, ${cidade} - CEP: ${cep}`;
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    mutation.mutate({
      cliente_nome: name.trim(),
      cliente_whatsapp: onlyDigits(whatsapp),
      cliente_endereco: finalAddress,
      tipo_entrega: deliveryType,
      taxa_entrega: deliveryFee,
      bairro_entrega: deliveryType === "entrega" ? bairro : undefined,
      itens: items.map(i => ({ produto_id: i.id, quantidade: i.quantity }))
    });
  }

  // If the user arrived with an empty cart and no success data, guide them back
  if (items.length === 0 && !successData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-pink-50 mb-6">
          <ShoppingBag className="h-10 w-10 text-primary" />
        </div>
        <h2 className="font-display text-2xl mb-2">Sua sacola está vazia</h2>
        <p className="text-muted-foreground mb-8">Volte para a loja para escolher seus looks. 💕</p>
        <Link 
          to="/" 
          className="rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90"
        >
          Voltar para a Loja
        </Link>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="min-h-screen bg-pink-50/30 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg bg-background rounded-3xl shadow-xl overflow-hidden p-8 text-center flex flex-col items-center">
          <h2 className="font-display text-3xl mb-2 text-primary">Pedido confirmado 💖</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Recebemos seu pedido <span className="font-mono">#{successData.numero ? String(successData.numero).padStart(4, '0') : successData.id.split('-')[0]}</span>.
          </p>

          <div className="w-full rounded-2xl bg-yellow-50 border border-yellow-200 p-6 text-left mb-8 shadow-sm">
            <h3 className="font-semibold text-yellow-800 text-base mb-2">Finalize seu pagamento</h3>
            <p className="text-sm text-yellow-700 mb-6">Escaneie o QR Code ou copie o código abaixo e pague no seu aplicativo do banco via <b>PIX Copia e Cola</b>. O pedido será processado assim que for aprovado.</p>
            
            <div className="mb-6 flex justify-center bg-white rounded-2xl p-6 border border-yellow-100 shadow-inner">
              <img 
                src={`https://quickchart.io/qr?text=${encodeURIComponent(successData.pix_copia_cola)}&size=200`} 
                alt="QR Code PIX" 
                className="w-48 h-48 object-contain"
              />
            </div>

            <div className="relative">
              <textarea 
                readOnly 
                value={successData.pix_copia_cola} 
                className="w-full text-xs font-mono p-4 rounded-xl bg-white border border-yellow-200 outline-none resize-none break-all"
                rows={4}
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(successData.pix_copia_cola);
                  alert("Código PIX copiado!");
                }}
                className="absolute right-3 bottom-3 bg-yellow-200 text-yellow-800 text-xs font-bold px-4 py-2 rounded-full hover:bg-yellow-300 shadow-sm"
              >
                Copiar
              </button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-8">
            Copie o código acima e realize o pagamento no seu banco.
          </p>
          <a
            href={`https://wa.me/${config?.whatsapp_loja || "5595991475736"}?text=${encodeURIComponent(`Olá! Acabei de fazer o pagamento do pedido #${successData.numero ? String(successData.numero).padStart(4, '0') : successData.id.split('-')[0]}. Segue o comprovante:`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-green-500 w-full py-4 text-sm font-semibold text-white shadow-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <MessageCircle className="h-5 w-5" />
            Enviar Comprovante no WhatsApp
          </a>
          <Link
            to="/"
            className="rounded-full bg-pink-100 w-full py-4 text-sm font-semibold text-pink-800 shadow-sm hover:bg-pink-200 transition-colors"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50/20 pb-20">
      <header className="bg-white border-b border-pink-100 sticky top-0 z-10">
        <div className="mx-auto max-w-5xl flex items-center h-16 px-4 sm:px-6">
          <button 
            onClick={() => navigate({ to: "/" })}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-pink-50 -ml-2 text-muted-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl ml-2 text-foreground/90">Finalizar Pedido</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 mt-8 flex flex-col md:flex-row gap-8 items-start">
        {/* Left Column: Forms */}
        <div className="w-full md:w-[60%] flex flex-col gap-6">
          {/* Sessão 1: Dados Pessoais */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100">
            <h2 className="font-display text-lg mb-6 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-pink-100 text-primary text-sm font-bold">1</span>
              Dados Pessoais
            </h2>
            <div className="space-y-4">
              <Field
                icon={<User className="h-4 w-4" />}
                label="Nome completo"
                value={name}
                onChange={setName}
                placeholder="Ex.: Ana Souza"
                error={errors.name}
              />

              <Field
                icon={<MessageCircle className="h-4 w-4" />}
                label="WhatsApp (obrigatório)"
                value={whatsapp}
                onChange={(v) => setWhatsapp(formatWhatsApp(v))}
                placeholder="(11) 91234-5678"
                inputMode="tel"
                error={errors.whatsapp}
                hint="Usaremos para confirmar o pedido e enviar o código de rastreio."
              />
            </div>
          </section>

          {/* Sessão 2: Entrega */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100">
            <h2 className="font-display text-lg mb-6 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-pink-100 text-primary text-sm font-bold">2</span>
              Forma de Entrega
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setDeliveryType("entrega")}
                className={`rounded-2xl border-2 p-4 flex flex-col items-start gap-2 transition ${
                  deliveryType === "entrega" ? "border-primary bg-pink-50/50" : "border-pink-100 hover:border-pink-200"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-foreground/90">Receber em Casa</span>
                  <span className="text-xl">🛵</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">Entregamos no seu endereço.</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType("retirada")}
                className={`rounded-2xl border-2 p-4 flex flex-col items-start gap-2 transition ${
                  deliveryType === "retirada" ? "border-primary bg-pink-50/50" : "border-pink-100 hover:border-pink-200"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-foreground/90">Retirar na Loja</span>
                  <span className="text-xl">🏪</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">Venha buscar quando quiser!</span>
              </button>
            </div>

            {deliveryType === "entrega" && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Field
                      icon={<MapPin className="h-4 w-4" />}
                      label="CEP"
                      value={cep}
                      onChange={(v) => {
                        const val = v.replace(/\D/g, "");
                        setCep(val);
                        if (val.length === 8) {
                          setTimeout(() => {
                            const btn = document.getElementById("btn-busca-cep");
                            if (btn) btn.click();
                          }, 100);
                        }
                      }}
                      placeholder="00000-000"
                      inputMode="tel"
                      error={errors.cep}
                    />
                  </div>
                  <div className="flex items-end mt-1 sm:mt-0">
                    <button
                      id="btn-busca-cep"
                      type="button"
                      onClick={handleCepSearch}
                      className="h-[46px] w-full sm:w-auto rounded-full bg-pink-200 px-6 text-sm font-bold text-pink-800 hover:bg-pink-300 transition-colors"
                    >
                      Buscar
                    </button>
                  </div>
                </div>

                {rua && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
                      <Field icon={null} label="Rua" value={rua} onChange={() => {}} readonly />
                      <Field icon={null} label="Nº" value={numero} onChange={setNumero} error={errors.numero} placeholder="123" />
                    </div>
                    <Field icon={null} label="Complemento (Opcional)" value={complemento} onChange={setComplemento} placeholder="Apto, Bloco, etc" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field icon={null} label="Bairro" value={bairro} onChange={() => {}} readonly />
                      <Field icon={null} label="Cidade" value={cidade} onChange={() => {}} readonly />
                    </div>
                    
                    {isBairroUnknown && (
                      <p className="text-sm text-yellow-700 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                        A taxa de entrega para o bairro <b>{bairro}</b> será combinada pelo WhatsApp após a conclusão do pedido.
                      </p>
                    )}
                  </div>
                )}
                {errors.address && !rua && (
                  <p className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">{errors.address}</p>
                )}
              </div>
            )}

            {deliveryType === "retirada" && (
              <div className="rounded-xl border border-pink-100 bg-pink-50 p-5 text-sm text-muted-foreground text-center">
                Você receberá o endereço completo da loja para retirada pelo WhatsApp logo após a confirmação do pedido! 💖
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full md:w-[40%] flex flex-col gap-6 md:sticky md:top-24">
          <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-pink-100">
            <h2 className="font-display text-lg mb-6">Resumo do Pedido</h2>
            
            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <img src={item.images?.[0] || ""} alt={item.name} className="w-16 h-20 object-cover rounded-xl" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm leading-tight line-clamp-2">{item.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">Qtd: {item.quantity}</p>
                  </div>
                  <div className="font-semibold text-sm">
                    {formatBRL(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-pink-100 pt-4 space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({items.length} itens)</span>
                <span>{formatBRL(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Entrega</span>
                <span className="font-medium text-foreground/80">
                  {deliveryType === "retirada" 
                    ? "Grátis" 
                    : isBairroUnknown 
                      ? "A combinar" 
                      : formatBRL(deliveryFee)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-semibold text-primary">Total</span>
                <span className="font-display text-2xl text-primary">
                  {formatBRL(finalTotal)}
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending || items.length === 0}
              className="mt-6 w-full rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground shadow-[0_10px_25px_-10px_rgba(236,72,153,0.6)] hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {mutation.isPending ? "Processando..." : "Confirmar Pedido"}
            </button>
            <p className="text-center text-[11px] text-muted-foreground mt-4">
              Ao confirmar, você será redirecionado para o pagamento seguro via PIX.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  inputMode,
  multiline,
  readonly,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  inputMode?: "tel" | "text" | "email";
  multiline?: boolean;
  readonly?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {icon}
          {label}
        </span>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          readOnly={readonly}
          className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-sm outline-none focus:border-primary transition-colors ${
            error ? "border-red-400" : "border-pink-100"
          } ${readonly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
        />
      ) : (
        <input
          readOnly={readonly}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className={`w-full rounded-full border bg-white px-5 py-3.5 text-sm outline-none focus:border-primary transition-colors ${
            error ? "border-red-400" : "border-pink-100"
          } ${readonly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
        />
      )}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-red-500">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
