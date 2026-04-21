import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Mode = "signin" | "signup" | "forgot";

const Auth = () => {
  const { t } = useApp();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = params.get("role") === "organizer" ? "organizer" : "participant";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"participant" | "organizer">(initialRole);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else navigate("/", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, role },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t.auth.successSignUp);
      setMode("signin");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(t.auth.successReset);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative bg-gradient-hero p-12 flex-col justify-between text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsl(0_0%_0%/0.4),transparent)]" />
        <Link to="/" className="relative flex items-center gap-2 group w-fit">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/20 backdrop-blur">
            <Activity className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl font-bold">Fartlek<span className="opacity-70">.</span></span>
        </Link>
        <div className="relative">
          <h2 className="font-display text-5xl font-bold leading-tight mb-4">
            {mode === "signup" ? t.auth.signUpTitle : t.auth.signInTitle}
          </h2>
          <p className="text-lg opacity-90 max-w-md">
            {mode === "signup" ? t.auth.signUpSub : t.auth.signInSub}
          </p>
        </div>
        <div className="relative text-sm opacity-70">© Fartlek Events</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
              <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold">Fartlek<span className="text-primary">.</span></span>
          </Link>

          {mode === "signin" && (
            <>
              <div>
                <h1 className="font-display text-3xl font-bold">{t.auth.signIn}</h1>
                <p className="text-muted-foreground mt-1 text-sm">{t.auth.signInSub}</p>
              </div>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.auth.email}</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t.auth.password}</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.auth.signIn}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => setMode("forgot")} className="text-primary hover:underline">
                    {t.auth.forgotPassword}
                  </button>
                  <button type="button" onClick={() => setMode("signup")} className="text-muted-foreground hover:text-foreground">
                    {t.auth.noAccount} <span className="text-primary font-medium">{t.auth.signUp}</span>
                  </button>
                </div>
              </form>
            </>
          )}

          {mode === "signup" && (
            <>
              <div>
                <h1 className="font-display text-3xl font-bold">{t.auth.signUp}</h1>
                <p className="text-muted-foreground mt-1 text-sm">{t.auth.signUpSub}</p>
              </div>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.auth.role}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["participant", "organizer"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`rounded-md border-2 px-4 py-3 text-sm font-semibold transition-base ${
                          role === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {t.auth[r]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">{t.auth.fullName}</Label>
                  <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">{t.auth.email}</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">{t.auth.password}</Label>
                  <Input id="password2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.auth.signUp}
                </Button>
                <button type="button" onClick={() => setMode("signin")} className="text-sm text-muted-foreground hover:text-foreground w-full text-center">
                  {t.auth.haveAccount} <span className="text-primary font-medium">{t.auth.signIn}</span>
                </button>
              </form>
            </>
          )}

          {mode === "forgot" && (
            <>
              <div>
                <h1 className="font-display text-3xl font-bold">{t.auth.resetPassword}</h1>
              </div>
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email3">{t.auth.email}</Label>
                  <Input id="email3" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} {t.auth.sendResetLink}
                </Button>
                <button type="button" onClick={() => setMode("signin")} className="text-sm text-muted-foreground hover:text-foreground w-full text-center">
                  {t.auth.backToSignIn}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
