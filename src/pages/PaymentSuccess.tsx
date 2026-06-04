import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const order = params.get("order");
  const [confirming, setConfirming] = useState(!!order);

  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    (async () => {
      try {
        await supabase.functions.invoke("payment-confirm", { body: { order } });
      } catch (e) {
        console.error("payment-confirm failed", e);
      } finally {
        if (!cancelled) setConfirming(false);
      }
    })();
    return () => { cancelled = true; };
  }, [order]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-md py-20 text-center space-y-6">
        <CheckCircle2 className="h-20 w-20 text-primary mx-auto" />
        <h1 className="font-display text-3xl font-bold">Дякуємо! Оплата прийнята</h1>
        <p className="text-muted-foreground">
          {confirming
            ? "Підтверджуємо оплату..."
            : "Статус оновлено. Перевір у розділі «Мої події»."}
        </p>
        {confirming && <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />}
        <div className="mx-auto max-w-md rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left">
          <p className="font-semibold text-foreground">
            ⚠️ Обов'язково підпишіть «Згоду на участь»
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Без підписаної згоди ви не зможете взяти участь у заході. Перейдіть у розділ «Мої події» та натисніть кнопку «Згода на участь» біля вашої реєстрації.
          </p>
        </div>
        {order && <p className="text-xs text-muted-foreground">Замовлення: {order}</p>}
        <div className="flex gap-3 justify-center">
          <Button asChild><Link to="/my-events">Мої події</Link></Button>
          <Button asChild variant="outline"><Link to="/">На головну</Link></Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default PaymentSuccess;
