import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const StravaCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Підключаємо ваш акаунт Strava…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get("code");
    const error = params.get("error");

    if (error || !code) {
      setStatus("error");
      setMessage(error === "access_denied" ? "Ви відхилили доступ до Strava." : "Не вдалося отримати код авторизації.");
      return;
    }

    (async () => {
      const { data, error: fnErr } = await supabase.functions.invoke("strava-oauth-exchange", {
        body: { code },
      });
      if (fnErr || (data as any)?.error) {
        setStatus("error");
        setMessage(`Помилка: ${fnErr?.message ?? (data as any)?.error ?? "невідома"}`);
        return;
      }
      setStatus("success");
      setMessage(`Strava підключено: ${(data as any)?.athlete?.firstname ?? ""} ${(data as any)?.athlete?.lastname ?? ""}`);
      toast.success("Strava підключено!");
      setTimeout(() => navigate("/profile", { replace: true }), 1500);
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4 rounded-2xl border border-border bg-card p-8 shadow-elegant">
        {status === "loading" && <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />}
        {status === "success" && <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />}
        {status === "error" && <XCircle className="h-10 w-10 mx-auto text-destructive" />}
        <h1 className="font-display text-2xl font-bold">Strava</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default StravaCallback;
