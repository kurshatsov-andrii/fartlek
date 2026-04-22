import { useState } from "react";
import { Mail, Phone, Send, MapPin } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Введіть ім'я").max(100),
  email: z.string().trim().email("Некоректний email").max(255),
  message: z.string().trim().min(1, "Повідомлення не може бути порожнім").max(2000),
});

const Contacts = () => {
  const { lang } = useApp();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);

  const seo = lang === "uk"
    ? { title: "Контакти — Fartlek Events", description: "Зв'яжіться з командою Fartlek Events: email, телефон, Telegram. Україна, Харків." }
    : { title: "Contacts — Fartlek Events", description: "Get in touch with Fartlek Events: email, phone, Telegram. Ukraine, Kharkiv." };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Перевірте форму");
      return;
    }
    setBusy(true);
    const subject = encodeURIComponent(`Fartlek: ${parsed.data.name}`);
    const body = encodeURIComponent(`${parsed.data.message}\n\n— ${parsed.data.name} <${parsed.data.email}>`);
    window.location.href = `mailto:info@fartlek.com.ua?subject=${subject}&body=${body}`;
    toast.success(lang === "uk" ? "Дякуємо! Відкриваємо пошту..." : "Thanks! Opening mail...");
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={seo.title} description={seo.description} canonical="/contacts" />
      <Header />
      <main className="flex-1 container py-12 sm:py-16">
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
          {lang === "uk" ? "Контакти" : "Contacts"}
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">{seo.description}</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <a href="mailto:info@fartlek.com.ua" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-base hover:border-primary">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Email</div>
                <div className="font-semibold">info@fartlek.com.ua</div>
              </div>
            </a>
            <a href="tel:+380664688151" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-base hover:border-primary">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{lang === "uk" ? "Телефон" : "Phone"}</div>
                <div className="font-semibold">+380 66 468 81 51</div>
              </div>
            </a>
            <a href="https://t.me/Andres_K" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-base hover:border-primary">
              <Send className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Telegram</div>
                <div className="font-semibold">@Andres_K</div>
              </div>
            </a>
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{lang === "uk" ? "Адреса" : "Address"}</div>
                <div className="font-semibold">{lang === "uk" ? "Україна, Харків — місто-герой" : "Ukraine, Kharkiv — Hero City"}</div>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-2xl font-bold">{lang === "uk" ? "Напишіть нам" : "Write to us"}</h2>
            <div className="space-y-2">
              <Label htmlFor="name">{lang === "uk" ? "Ім'я" : "Name"}</Label>
              <Input id="name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{lang === "uk" ? "Повідомлення" : "Message"}</Label>
              <Textarea id="message" rows={6} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {lang === "uk" ? "Надіслати" : "Send"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contacts;
