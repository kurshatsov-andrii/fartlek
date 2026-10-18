import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { calendarQueryOptions } from "@/lib/calendar-query";

export function CalendarLoadError() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    try {
      await queryClient.fetchQuery(calendarQueryOptions);
      await router.invalidate();
    } catch {
      // The same recoverable state stays visible until the connection returns.
    } finally {
      setRetrying(false);
    }
  };
  return <div className="min-h-screen bg-background text-foreground">
    <Header />
    <main className="container py-12 space-y-4" role="alert">
      <h1 className="font-display text-2xl font-bold">Календар тимчасово недоступний</h1>
      <p className="text-muted-foreground">Не вдалося завантажити старти. Перевірте з’єднання та спробуйте ще раз.</p>
      <Button onClick={retry} disabled={retrying}>{retrying ? "Завантаження…" : "Спробувати ще раз"}</Button>
    </main>
    <Footer />
  </div>;
}