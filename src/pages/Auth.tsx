import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import logoFartlek from "@/assets/logo-fartlek.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { translateAuthError } from "@/lib/authErrors";
import { toast } from "sonner";

type Mode = "signin" | "signup" | "forgot";

const Auth = () => {
  const { t } = useApp();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = params.get("role") === "organizer" ? "organizer" : "participant";
  const redirectTo = params.get("redirect") || "/";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"participant" | "organizer">(initialRole);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true });
  }, [user, loading, navigate, redirectTo]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(translateAuthError(error));
    else navigate(redirectTo, { replace: true });
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
    if (error) toast.error(translateAuthError(error));
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
    if (error) toast.error(translateAuthError(error));
    else toast.success(t.auth.successReset);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative bg-gradient-hero p-12 flex-col justify-between text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsl(0_0%_0%/0.4),transparent)]" />
        <Link to="/" className="relative flex items-center gap-3 group w-fit">
          <img src={logoFartlek} alt="Фартлек" className="h-10 w-10 rounded-full object-cover shadow-glow transition-bounce group-hover:scale-110" />
          <span className="font-display text-2xl font-bold">Фартлек</span>
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
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8">
            <img src={logoFartlek} alt="Фартлек" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-display text-xl font-bold">Фартлек</span>
          </Link>

          {mode !== "forgot" && (
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-base ${
                  mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.auth.signIn}
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-base ${
                  mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.auth.signUp}
              </button>
            </div>
          )}

          {mode !== "forgot" && (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const result = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: `${window.location.origin}${redirectTo}`,
                  });
                  if (result.error) {
                    toast.error(translateAuthError(result.error));
                    setBusy(false);
                  }
                }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
                </svg>
                Увійти через Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">або</span></div>
              </div>
            </div>
          )}

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
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
                  <div className="relative">
                    <Input id="password2" type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
