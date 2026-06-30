import { useMemo, useState } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { useCustomers, type Customer } from "../lib/customers-context";
import {
  sendWhatsAppMessage,
  type WhatsAppSendResult,
} from "../lib/whatsapp";

type Props = { open: boolean; onClose: () => void };

const DEFAULT_TEMPLATE =
  "Oi {nome}! 💖 Acabou de chegar uma coleção fresquinha na Annalicia Modas. Dá uma espiada nos looks novos: https://annalicia.modas";

export function MarketingModal({ open, onClose }: Props) {
  const { customers, orders } = useCustomers();

  // só dispara para clientes que JÁ fizeram pedidos online
  const buyers = useMemo(() => {
    const ids = new Set(orders.map((o) => o.customerId));
    return customers.filter((c) => ids.has(c.id));
  }, [customers, orders]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState(DEFAULT_TEMPLATE);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<WhatsAppSendResult[] | null>(null);

  if (!open) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === buyers.length) setSelected(new Set());
    else setSelected(new Set(buyers.map((b) => b.id)));
  }

  async function handleSend() {
    if (selected.size === 0 || message.trim().length === 0) return;
    setSending(true);
    const targets = buyers.filter((b) => selected.has(b.id));
    const res = await Promise.all(
      targets.map((c) =>
        sendWhatsAppMessage(
          c.whatsapp,
          message.replaceAll("{nome}", c.name.split(" ")[0])
        )
      )
    );
    setResults(res);
    setSending(false);
  }

  function handleClose() {
    setResults(null);
    setSelected(new Set());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-pink-950/40 backdrop-blur-sm sm:items-center">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-background shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-pink-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="font-display text-xl">Disparo de WhatsApp</h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Fechar"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-pink-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {results ? (
          <ResultsView results={results} onClose={handleClose} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Clientes que já compraram ({buyers.length})
                  </h3>
                  {buyers.length > 0 && (
                    <button
                      onClick={toggleAll}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {selected.size === buyers.length
                        ? "Limpar"
                        : "Selecionar todos"}
                    </button>
                  )}
                </div>

                {buyers.length === 0 ? (
                  <p className="rounded-2xl bg-pink-50/60 px-4 py-6 text-center text-sm text-muted-foreground">
                    Nenhum cliente com pedido confirmado ainda. Assim que rolar
                    a primeira compra online, ele aparece aqui. ✨
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {buyers.map((c) => (
                      <BuyerRow
                        key={c.id}
                        customer={c}
                        ordersCount={
                          orders.filter((o) => o.customerId === c.id).length
                        }
                        checked={selected.has(c.id)}
                        onToggle={() => toggle(c.id)}
                      />
                    ))}
                  </ul>
                )}
              </section>

              <section className="mt-6">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Mensagem
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use <code className="rounded bg-pink-50 px-1">{"{nome}"}</code>{" "}
                  para personalizar com o primeiro nome do cliente.
                </p>
              </section>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-pink-100 bg-pink-50/40 px-6 py-4">
              <span className="text-sm font-medium text-muted-foreground">
                {selected.size} selecionado(s)
              </span>
              <button
                onClick={handleSend}
                disabled={
                  sending || selected.size === 0 || message.trim().length === 0
                }
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_25px_-10px_rgba(236,72,153,0.55)] hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                {sending ? "Disparando..." : "Disparar campanha"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BuyerRow({
  customer,
  ordersCount,
  checked,
  onToggle,
}: {
  customer: Customer;
  ordersCount: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm transition hover:bg-pink-50/60">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-4 w-4 accent-pink-500"
        />
        <div className="flex-1">
          <p className="font-display text-base">{customer.name}</p>
          <p className="text-xs text-muted-foreground">
            {customer.whatsapp} · {ordersCount} pedido(s)
          </p>
        </div>
      </label>
    </li>
  );
}

function ResultsView({
  results,
  onClose,
}: {
  results: WhatsAppSendResult[];
  onClose: () => void;
}) {
  const ok = results.filter((r) => r.ok).length;
  return (
    <div className="px-6 py-8 text-center">
      <p className="font-display text-2xl text-primary">
        {ok} de {results.length} enviadas 💖
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Os disparos foram enfileirados. Quando você plugar a API real em{" "}
        <code className="rounded bg-pink-50 px-1">sendWhatsAppMessage</code>,
        eles sairão de verdade.
      </p>
      <button
        onClick={onClose}
        className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Fechar
      </button>
    </div>
  );
}
