"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(forceReload = false): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const existing = document.querySelector(
    `script[src^="https://challenges.cloudflare.com/turnstile/"]`
  ) as HTMLScriptElement | null;

  if (
    (window as any)?.turnstile &&
    typeof (window as any).turnstile.render === "function"
  ) {
    return Promise.resolve();
  }

  if (forceReload) {
    if (existing) existing.remove();
    turnstileScriptPromise = null;
  }

  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

export type TurnstileWidgetProps = {
  siteKey?: string;
  onReady?: (ready: boolean) => void;
  onToken?: (token: string) => void;
  theme?: "light" | "dark";
  size?: "normal" | "compact";
  appearance?: "always" | "interaction-only";
  className?: string;
};

export default function TurnstileWidget({
  siteKey,
  onReady,
  onToken,
  theme = "dark",
  size = "normal",
  appearance = "interaction-only",
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const readyRef = useRef(false);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [runtimeSiteKey, setRuntimeSiteKey] = useState<string>("");
  const [runtimeFetchAttempt, setRuntimeFetchAttempt] = useState(0);

  const normalizedSiteKey = useMemo(() => {
    if (typeof siteKey === "string") return siteKey;
    const maybeStringObject = siteKey as unknown;
    if (maybeStringObject instanceof String)
      return maybeStringObject.toString();
    return "";
  }, [siteKey]);

  const effectiveSiteKey = useMemo(() => {
    const direct = normalizedSiteKey.trim();
    if (direct) return direct;
    return runtimeSiteKey.trim();
  }, [normalizedSiteKey, runtimeSiteKey]);

  const canRender = useMemo(
    () => effectiveSiteKey.trim().length > 0,
    [effectiveSiteKey]
  );

  useEffect(() => {
    if (normalizedSiteKey.trim()) return;
    if (runtimeSiteKey.trim()) return;
    if (runtimeFetchAttempt >= 3) return;

    const controller = new AbortController();

    const fetchKey = async () => {
      try {
        const res = await fetch("/api/turnstile/sitekey", {
          method: "GET",
          signal: controller.signal,
          headers: { "Cache-Control": "no-store" },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch site key");
        }

        const data = (await res.json()) as { siteKey?: unknown };
        const value = data?.siteKey;
        const asString =
          typeof value === "string"
            ? value
            : value instanceof String
            ? value.toString()
            : "";

        if (asString.trim()) {
          setRuntimeSiteKey(asString);
          return;
        }

        throw new Error("Invalid site key");
      } catch {
        setRuntimeFetchAttempt((n) => n + 1);
      }
    };

    fetchKey();

    return () => controller.abort();
  }, [normalizedSiteKey, runtimeSiteKey, runtimeFetchAttempt]);

  useEffect(() => {
    if (!canRender) {
      readyRef.current = false;
      setReady(false);
      onReady?.(false);
      onToken?.("");
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const markReady = (isReady: boolean) => {
      readyRef.current = isReady;
      setReady(isReady);
      onReady?.(isReady);
    };

    const scheduleRetry = () => {
      if (cancelled) return;
      if (readyRef.current) return;
      if (renderAttempt >= 4) return;
      retryTimer = setTimeout(() => {
        if (cancelled) return;
        setRenderAttempt((n) => n + 1);
      }, 1500 + renderAttempt * 1000);
    };

    const render = async () => {
      try {
        await loadTurnstileScript(renderAttempt > 0);
        if (cancelled) return;

        const turnstile = (window as any)?.turnstile;
        if (!turnstile || typeof turnstile.render !== "function") {
          throw new Error("Turnstile API not available");
        }

        const container = containerRef.current;
        if (!container) return;

        try {
          if (widgetIdRef.current && typeof turnstile.remove === "function") {
            turnstile.remove(widgetIdRef.current);
          }
        } catch {
          // best-effort cleanup
        }

        container.innerHTML = "";
        widgetIdRef.current = turnstile.render(container, {
          sitekey: effectiveSiteKey,
          theme,
          size,
          appearance,
          callback: (token: string) => {
            if (cancelled) return;
            onToken?.(typeof token === "string" ? token : "");
          },
          "expired-callback": () => {
            if (cancelled) return;
            onToken?.("");
          },
          "error-callback": () => {
            if (cancelled) return;
            onToken?.("");
          },
        });

        markReady(true);
      } catch {
        markReady(false);
        scheduleRetry();
      }
    };

    render();

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (readyRef.current) return;
      setRenderAttempt((n) => n + 1);
    };

    window.addEventListener("focus", onVisibility);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener("focus", onVisibility);
      document.removeEventListener("visibilitychange", onVisibility);

      try {
        const turnstile = (window as any)?.turnstile;
        if (widgetIdRef.current && typeof turnstile?.remove === "function") {
          turnstile.remove(widgetIdRef.current);
        }
      } catch {
        // best-effort cleanup
      }
    };
     
  }, [canRender, effectiveSiteKey, theme, size, appearance, renderAttempt]);

  return (
    <div
      ref={containerRef}
      className={className ?? ""}
      data-ready={ready ? "true" : "false"}
    />
  );
}
