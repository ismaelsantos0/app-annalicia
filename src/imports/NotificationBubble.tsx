import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { MessageCircle, X, Sparkles, Send } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { inscreverNotificacoes, fetchConfiguracoes } from "../lib/api";
import { formatWhatsApp } from "../lib/whatsapp";

export function NotificationBubble() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [success, setSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("annalicia_bubble_subscribed") || localStorage.getItem("annalicia_bubble_dismissed")) {
      setDismissed(true);
    }
  }, []);

  const { data: config = {} as any } = useQuery({
    queryKey: ["config"],
    queryFn: () => fetchConfiguracoes(),
  });
  
  if (!config.popup_ativo || dismissed) {
    return null;
  }

  const titulo = config.popup_titulo || "Quer receber novidades?";
  const texto = config.popup_texto || "Deixe seu WhatsApp para ser avisado sobre novas peças e promoções exclusivas!";
  const botao = config.popup_botao_texto || "Me avise!";

  const handleWhatsappChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatWhatsApp(e.target.value));
  };

  const subscribeMutation = useMutation({
    mutationFn: () => inscreverNotificacoes(nome, whatsapp.replace(/\D/g, "")),
    onSuccess: () => {
      setSuccess(true);
      localStorage.setItem("annalicia_bubble_subscribed", "true");
      setTimeout(() => {
        setOpen(false);
        setDismissed(true);
      }, 3000);
    },
    onError: (err: Error) => {
      alert(err.message || "Erro ao se inscrever.");
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nome || whatsapp.replace(/\D/g, "").length < 10) {
      alert("Preencha nome e WhatsApp válidos.");
      return;
    }
    subscribeMutation.mutate();
  };

  const handleDismiss = () => {
    setOpen(false);
    setDismissed(true);
    localStorage.setItem("annalicia_bubble_dismissed", "true");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-transform hover:scale-110 hover:bg-pink-600"
        >
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex h-4 w-4 rounded-full bg-pink-500"></span>
          </span>
          <MessageCircle className="h-8 w-8 transition-transform group-hover:rotate-12" />
        </button>
      )}
      {open && (
        <div className="absolute bottom-0 right-0 w-[calc(100vw-3rem)] sm:w-80 overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 animate-in slide-in-from-bottom-8">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white relative">
            <button 
              onClick={handleDismiss}
              className="absolute right-4 top-4 rounded-full bg-white/20 p-1 hover:bg-white/40 transition"
            >
              <X className="h-4 w-4" />
            </button>
            <Sparkles className="h-8 w-8 mb-2 text-pink-200" />
            <h3 className="font-display text-xl font-bold">{titulo}</h3>
          </div>
          
          <div className="p-6">
            {success ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h4 className="font-display text-lg font-bold text-green-600">Sucesso!</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Você foi inscrito e receberá nossas novidades no WhatsApp!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">{texto}</p>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full rounded-xl border border-pink-100 p-3 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp (DD) 99999-9999"
                    value={whatsapp}
                    onChange={handleWhatsappChange}
                    className="w-full rounded-xl border border-pink-100 p-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary p-3 font-semibold text-white transition-colors hover:bg-pink-600 disabled:opacity-70"
                >
                  {subscribeMutation.isPending ? (
                    <span className="animate-pulse">Enviando...</span>
                  ) : (
                    <>
                      {botao}
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
