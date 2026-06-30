import { Link } from "@tanstack/react-router";
import { Instagram, Music2, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchConfiguracoes } from "../lib/api";

export function Footer() {
  const { data: config } = useQuery({
    queryKey: ["configuracoes_public"],
    queryFn: () => fetchConfiguracoes(),
  });

  return (
    <footer className="mt-24 border-t border-pink-100 bg-pink-50/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p className="font-display text-lg text-primary">
          Annalicia <span className="text-foreground">Modas</span>
        </p>
        <div className="flex gap-3">
          {config?.link_tiktok && (
            <a
              href={config.link_tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-primary shadow-sm transition hover:scale-110"
            >
              <Music2 className="h-4 w-4" />
            </a>
          )}
          {config?.link_instagram && (
            <a
              href={config.link_instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-primary shadow-sm transition hover:scale-110"
            >
              <Instagram className="h-4 w-4" />
            </a>
          )}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Feito com <Link to="/admin"><Heart className="h-3 w-3 fill-primary text-primary cursor-default hover:opacity-50" /></Link> ©{" "}
          {new Date().getFullYear()} Annalicia Modas
        </p>
      </div>
    </footer>
  );
}
