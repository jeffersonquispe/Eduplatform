"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Alert, buttonClass } from "@/components/ui";

const READY_TIMEOUT_MS = 10_000;
const FULLSCREEN_QUERY = "(max-width: 480px)";
// Lista cerrada: el iframe es otro servicio y no decide a donde puede navegar la plataforma.
const ALLOWED_PATH =
  /^\/(?:cursos(?:\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?|registro|login|mis-cursos)$/i;

function assistantOrigin(): string | null {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_EDY_URL ?? "");
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

const EDY_ORIGIN = assistantOrigin();

export function AssistantWidget() {
  return EDY_ORIGIN ? <AssistantPanel origin={EDY_ORIGIN} /> : null;
}

function AssistantPanel({ origin }: { origin: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // El iframe se crea en la primera apertura y despues solo se oculta, para no perder la conversacion.
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const launcher = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  const onLesson = pathname === "/aprender" || pathname.startsWith("/aprender/");
  const visible = open && !onLesson;

  const post = useCallback(
    (type: string) => frame.current?.contentWindow?.postMessage({ type }, origin),
    [origin],
  );

  const close = useCallback(() => {
    setOpen(false);
    launcher.current?.focus();
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== origin || event.source !== frame.current?.contentWindow) return;
      const { type, path } = (event.data ?? {}) as { type?: unknown; path?: unknown };
      if (type === "edy:ready") {
        setStatus("ready");
      } else if (type === "edy:close") {
        close();
      } else if (type === "edy:navigate" && typeof path === "string" && ALLOWED_PATH.test(path)) {
        // A pantalla completa el panel taparia la pagina de destino.
        if (window.matchMedia(FULLSCREEN_QUERY).matches) close();
        router.push(path);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [origin, close, router]);

  useEffect(() => {
    if (!visible) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, close]);

  // Un iframe bloqueado o con error tambien dispara `load`: solo `edy:ready` confirma que funciona.
  useEffect(() => {
    if (!loaded || status !== "loading") return;
    const timer = setTimeout(() => setStatus("failed"), READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loaded, status, attempt]);

  useEffect(() => {
    if (!loaded) return;
    if (visible) {
      if (status === "ready") {
        frame.current?.focus();
        post("edy:focus");
      }
    } else {
      // Sin panel a la vista no debe quedar un microfono abierto.
      post("edy:hidden");
    }
  }, [visible, loaded, status, post]);

  function retry() {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  return (
    <>
      {!onLesson && (
        <button
          ref={launcher}
          type="button"
          className={`${buttonClass("primary")} eb-assistant-launcher`}
          aria-expanded={open}
          onClick={() => {
            setLoaded(true);
            if (open) close();
            else setOpen(true);
          }}
        >
          Asistente
        </button>
      )}

      <div className="eb-assistant-panel" role="dialog" aria-label="Asistente" hidden={!visible}>
        <div className="eb-assistant-bar">
          <span className="text-sm font-medium text-fg-2">Asistente</span>
          <button type="button" className={buttonClass("secondary", { sm: true })} aria-label="Cerrar asistente" onClick={close}>
            Cerrar
          </button>
        </div>

        <div className="eb-assistant-body">
          {status === "loading" && <p className="eb-assistant-state text-sm text-fg-3">Cargando asistente...</p>}
          {status === "failed" && (
            <div className="eb-assistant-state">
              <Alert>El asistente no esta disponible ahora</Alert>
              <button type="button" className={buttonClass("secondary", { sm: true })} onClick={retry}>
                Reintentar
              </button>
            </div>
          )}
          {loaded && (
            <iframe
              key={attempt}
              ref={frame}
              src={`${origin}/widget/`}
              title="Asistente de cursos EduTech"
              allow="microphone; autoplay"
              sandbox="allow-scripts allow-same-origin allow-forms"
              className="eb-assistant-frame"
              hidden={status !== "ready"}
              onLoad={() => post("edy:init")}
            />
          )}
        </div>
      </div>
    </>
  );
}
