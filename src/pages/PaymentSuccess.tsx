import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const order = params.get("order");
  const [status, setStatus] = useState<"checking" | "paid" | "pending">(
    order ? "checking" : "paid",
  );

  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15; // ~45s
    const pollInterval = 3000;

    const poll = async () => {
      while (!cancelled && attempts < maxAttempts) {
        attempts++;
        try {
          const { data } = await supabase.functions.invoke<{ paid: boolean }>(
            "payment-confirm",
            { body: { order } },
          );
          if (data?.paid) {
            if (!cancelled) setStatus("paid");
            return;
          }
        } catch (e) {
          console.error("payment-confirm failed", e);
        }
        await new Promise((r) => setTimeout(r, pollInterval));
      }
      if (!cancelled) setStatus("pending");
    };

    poll();
    return () => { cancelled = true; };
  }, [order]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-md py-20 text-center space-y-6">
        {status === "checking" && (
          <>
            <Loader2 className="h-20 w-20 text-primary mx-auto animate-spin" />
            <h1 className="font-display text-3xl font-bold">Перевіряємо оплату…</h1>
            <p className="text-muted-foreground">
              Зачекай кілька секунд — очікуємо підтвердження від платіжної системи.
            </p>
          </>
        )}

        {status === "paid" && (
          <>
            <CheckCircle2 className="h-20 w-20 text-primary mx-auto" />
            <h1 className="font-display text-3xl font-bold">Дякуємо! Оплата прийнята</h1>
            <p className="text-muted-foreground">
              Статус оновлено. Перевір у розділі «Мої події».
            </p>
            <div className="mx-auto max-w-md rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left">
              <p className="font-semibold text-foreground">
                ⚠️ Обов'язково підпишіть «Згоду на участь»
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Без підписаної згоди ви не зможете взяти участь у заході. Перейдіть у розділ «Мої події» та натисніть кнопку «Згода на участь» біля вашої реєстрації.
              </p>
            </div>
          </>
        )}

        {status === "pending" && (
          <>
            <AlertCircle className="h-20 w-20 text-orange-500 mx-auto" />
            <h1 className="font-display text-3xl font-bold">Оплату ще не підтверджено</h1>
            <p className="text-muted-foreground">
              Ми не отримали підтвердження від платіжної системи. Якщо кошти вже списано —
              статус оновиться автоматично протягом кількох хвилин. Якщо оплату не було
              завершено, повернись у «Мої події» та спробуй ще раз через кнопку «Оплатити».
            </p>
          </>
        )}

        {order && <p className="text-xs text-muted-foreground break-all">Замовлення: {order}</p>}
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
