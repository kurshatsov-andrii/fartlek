import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (data?.valid === true) setState("valid");
        else if (data?.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch (e: any) {
        setError(e?.message ?? "Network error");
        setState("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    if (error) {
      setError(error.message);
      setState("error");
      return;
    }
    if (data?.success || data?.reason === "already_unsubscribed") setState("done");
    else setState("error");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-xl py-16">
        <div className="bg-card rounded-2xl shadow-card p-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
            <Mail className="h-7 w-7" />
          </div>

          {state === "loading" && (
            <>
              <h1 className="font-display text-2xl font-bold mb-2">Перевіряємо посилання…</h1>
              <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-muted-foreground" />
            </>
          )}

          {state === "valid" && (
            <>
              <h1 className="font-display text-2xl font-bold mb-2">Відписатися від листів?</h1>
              <p className="text-muted-foreground mb-6">
                Ви більше не отримуватимете електронних листів від fartlek на цю адресу.
              </p>
              <Button size="lg" onClick={confirm} className="w-full sm:w-auto">
                Підтвердити відписку
              </Button>
            </>
          )}

          {state === "submitting" && (
            <>
              <h1 className="font-display text-2xl font-bold mb-2">Обробляємо…</h1>
              <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-muted-foreground" />
            </>
          )}

          {state === "done" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold mb-2">Готово</h1>
              <p className="text-muted-foreground mb-6">
                Ви успішно відписалися. Більше листів від нас не надходитиме.
              </p>
              <Button asChild variant="outline">
                <Link to="/">На головну</Link>
              </Button>
            </>
          )}

          {state === "already" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold mb-2">Вже відписано</h1>
              <p className="text-muted-foreground mb-6">
                Ця адреса вже була відписана раніше.
              </p>
              <Button asChild variant="outline">
                <Link to="/">На головну</Link>
              </Button>
            </>
          )}

          {(state === "invalid" || state === "error") && (
            <>
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold mb-2">Посилання недійсне</h1>
              <p className="text-muted-foreground mb-6">
                {error || "Посилання застаріло або вже було використане."}
              </p>
              <Button asChild variant="outline">
                <Link to="/">На головну</Link>
              </Button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
