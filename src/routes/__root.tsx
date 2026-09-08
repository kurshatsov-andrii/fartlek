import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ProfileCompletionGate } from "@/components/ProfileCompletionGate";
import { AdminOnlinePresence } from "@/components/AdminOnlinePresence";
import { SessionTracker } from "@/components/SessionTracker";
import { AdminSeoEditor } from "@/components/AdminSeoEditor";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import NotFound from "@/pages/NotFound";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "color-scheme", content: "dark" },
      { title: "Fartlek Events. Реєстрація на спортивні події в Україні" },
      {
        name: "description",
        content:
          "Реєструйся на забіги, трейли та спортивні події по всій Україні. QR-стартові пакети, миттєві результати, зручні протоколи.",
      },
      { name: "author", content: "Fartlek Events" },
      {
        name: "google-site-verification",
        content: "nmvx4wn1_8D9Qci1LZyDE-woV5YYYj9N57iDayZJ0nQ",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Fartlek Events" },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/fhzHLE2HiFZe0qgeuSJhU49nthl2/social-images/social-1776777612035-fartlek_events.webp",
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/fhzHLE2HiFZe0qgeuSJhU49nthl2/social-images/social-1776777612035-fartlek_events.webp",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "https://fartlek.com.ua/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [
      {
        // Theme bootstrap ported from index.html — must run before first paint.
        children:
          "(function(){try{document.documentElement.classList.add('dark');localStorage.setItem('fe.theme','dark');}catch(e){}})();",
      },
    ],
    styles: [{ children: "html,body{background:#0a0a0a;color:#fafafa;}" }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ProfileCompletionGate />
            <AdminOnlinePresence />
            <SessionTracker />
            <AdminSeoEditor />
            <Outlet />
          </TooltipProvider>
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="font-display text-2xl font-bold">Сторінка не завантажилась</h1>
        <p className="text-muted-foreground">Щось пішло не так. Спробуйте оновити сторінку або поверніться на головну.</p>
        <div className="flex gap-3 justify-center">
          <button
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Спробувати ще раз
          </button>
          <a href="/" className="px-4 py-2 rounded-lg border border-border text-foreground">
            На головну
          </a>
        </div>
      </div>
    </div>
  );
}
