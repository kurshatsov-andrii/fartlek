import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Loader2, FileText, Download, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string | null;
  participantName: string;
  participantBirthDate?: string | null;
  participantCity?: string | null;
  participantEmail?: string | null;
  participantPhone?: string | null;
};

type ConsentRow = {
  id: string;
  full_name: string;
  birth_date: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  event_title: string;
  event_date: string;
  event_location: string | null;
  signed_at: string;
  signed_ip: string | null;
  consent_version: string;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("uk-UA", { dateOptions: { day: "numeric" } } as any) ||
  new Date(iso).toLocaleString("uk-UA");

export const ConsentDialog = ({
  registrationId,
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  participantName,
  participantBirthDate,
  participantCity,
  participantEmail,
  participantPhone,
}: Props) => {
  const { lang } = useApp();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [consent, setConsent] = useState<ConsentRow | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [emName, setEmName] = useState("");
  const [emPhone, setEmPhone] = useState("");
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    if (open) setLoading(true);
    supabase
      .from("participant_consents")
      .select("*")
      .eq("registration_id", registrationId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setConsent(data as ConsentRow | null);
        if (data) {
          setEmName(data.emergency_contact_name ?? "");
          setEmPhone(data.emergency_contact_phone ?? "");
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, registrationId, user]);


  const sign = async () => {
    if (!user || !agreed) return;
    if (!emName.trim() || !emPhone.trim()) {
      toast.error(
        lang === "uk"
          ? "Вкажіть контактну особу на випадок екстреної ситуації"
          : "Please provide emergency contact info"
      );
      return;
    }
    setSigning(true);
    try {
      let ip: string | null = null;
      try {
        const r = await fetch("https://api.ipify.org?format=json");
        ip = (await r.json())?.ip ?? null;
      } catch {}

      const payload = {
        registration_id: registrationId,
        user_id: user.id,
        event_id: eventId,
        full_name: participantName,
        birth_date: participantBirthDate ?? null,
        city: participantCity ?? null,
        email: participantEmail ?? user.email ?? null,
        phone: participantPhone ?? null,
        emergency_contact_name: emName.trim(),
        emergency_contact_phone: emPhone.trim(),
        event_title: eventTitle,
        event_date: eventDate,
        event_location: eventLocation ?? null,
        signed_ip: ip,
        signed_user_agent: navigator.userAgent.slice(0, 500),
      };

      const { data, error } = await supabase
        .from("participant_consents")
        .upsert(payload, { onConflict: "registration_id" })
        .select()
        .single();
      if (error) throw error;
      setConsent(data as ConsentRow);
      toast.success(lang === "uk" ? "Згоду підписано" : "Consent signed");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSigning(false);
    }
  };

  const downloadPdf = async () => {
    if (!docRef.current) return;
    setDownloading(true);
    // Render off-screen at full size to avoid CSS transform/scale artifacts
    // (the on-screen preview is scaled down, which makes html2canvas overlap glyphs).
    const clone = docRef.current.cloneNode(true) as HTMLElement;
    const holder = document.createElement("div");
    holder.style.position = "fixed";
    holder.style.left = "-10000px";
    holder.style.top = "0";
    holder.style.width = "794px";
    holder.style.background = "#ffffff";
    clone.style.transform = "none";
    clone.style.width = "794px";
    holder.appendChild(clone);
    document.body.appendChild(holder);
    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: 794,
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 10;
      const targetW = pageW - margin * 2;
      const imgRatio = canvas.height / canvas.width;
      const fullH = targetW * imgRatio;
      const pxPerMm = canvas.width / targetW;
      const pageContentH = pageH - margin * 2;
      const pageContentHpx = pageContentH * pxPerMm;

      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      if (fullH <= pageContentH) {
        pdf.addImage(imgData, "JPEG", margin, margin, targetW, fullH);
      } else {
        // multi-page: slice canvas
        let renderedHeight = 0;
        const totalHeight = canvas.height;
        while (renderedHeight < totalHeight) {
          const sliceHeight = Math.min(pageContentHpx, totalHeight - renderedHeight);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeight;
          const ctx = sliceCanvas.getContext("2d");
          if (!ctx) break;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );
          const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
          const sliceHmm = sliceHeight / pxPerMm;
          if (renderedHeight > 0) pdf.addPage();
          pdf.addImage(sliceData, "JPEG", margin, margin, targetW, sliceHmm);
          renderedHeight += sliceHeight;
        }
      }
      pdf.save(`consent-${participantName.replace(/\s+/g, "_")}.pdf`);
    } finally {
      document.body.removeChild(holder);
      setDownloading(false);
    }
  };

  const signed = !!consent;
  const data: ConsentRow = consent ?? ({
    full_name: participantName,
    birth_date: participantBirthDate ?? null,
    city: participantCity ?? null,
    email: participantEmail ?? user?.email ?? null,
    phone: participantPhone ?? null,
    emergency_contact_name: emName || null,
    emergency_contact_phone: emPhone || null,
    event_title: eventTitle,
    event_date: eventDate,
    event_location: eventLocation ?? null,
    signed_at: new Date().toISOString(),
    signed_ip: null,
    consent_version: "v1",
    id: "",
  } as ConsentRow);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4" />
          {lang === "uk" ? "Згода на участь" : "Consent"}
          {signed && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lang === "uk" ? "Згода на участь у спортивному заході" : "Event participation consent"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {!signed && (
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  {lang === "uk"
                    ? "Вкажіть контактну особу на випадок екстреної ситуації, ознайомтесь з умовами та підпишіть документ."
                    : "Provide emergency contact, review and sign the consent."}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>{lang === "uk" ? "Ім'я контактної особи" : "Emergency contact name"}</Label>
                    <Input value={emName} onChange={(e) => setEmName(e.target.value)} />
                  </div>
                  <div>
                    <Label>{lang === "uk" ? "Телефон контактної особи" : "Emergency contact phone"}</Label>
                    <Input value={emPhone} onChange={(e) => setEmPhone(e.target.value)} placeholder="+380..." />
                  </div>
                </div>
              </div>
            )}

            {/* Document preview (also used for PDF render) */}
            <div className="border rounded-md bg-white overflow-hidden">
              <div
                style={{
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: 794,
                    transform: "scale(var(--doc-scale, 1))",
                    transformOrigin: "top left",
                    height: "auto",
                  }}
                  ref={(el) => {
                    if (!el) return;
                    const parent = el.parentElement;
                    if (!parent) return;
                    const apply = () => {
                      const pw = parent.clientWidth;
                      const s = Math.min(1, pw / 794);
                      el.style.setProperty("--doc-scale", String(s));
                      el.style.height = `${el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetHeight * s : 0}px`;
                    };
                    apply();
                    const ro = new ResizeObserver(apply);
                    ro.observe(parent);
                    if (el.firstElementChild) ro.observe(el.firstElementChild);
                  }}
                >
              <div
                ref={docRef}
                style={{
                  width: 794, // A4 width @ ~96dpi
                  padding: "40px 48px",
                  background: "#ffffff",
                  color: "#0a0a0a",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: 12,
                  lineHeight: 1.5,
                  boxSizing: "border-box",
                }}
              >
                <h1 style={{ textAlign: "center", fontSize: 18, fontWeight: 800, margin: "0 0 20px" }}>
                  ЗГОДА НА УЧАСТЬ У СПОРТИВНОМУ ЗАХОДІ
                </h1>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                  <tbody>
                    {[
                      ["Ім'я та прізвище", data.full_name || "—"],
                      ["Дата народження", data.birth_date ? fmtDate(data.birth_date) : "—"],
                      ["Місто", data.city || "—"],
                      ["Електронна пошта", data.email || "—"],
                      ["Номер телефону", data.phone || "—"],
                      [
                        "Номер телефону та ім'я контактної особи на випадок екстреної ситуації",
                        [data.emergency_contact_phone, data.emergency_contact_name].filter(Boolean).join(", ") || "—",
                      ],
                      ["Спортивний захід (Захід)", data.event_title],
                      ["Дата проведення Заходу", fmtDate(data.event_date)],
                      ["Місце проведення Заходу", data.event_location || "повідомимо згодом"],
                    ].map(([k, v], i) => (
                      <tr key={i}>
                        <td
                          style={{
                            border: "1px solid #999",
                            padding: "8px 10px",
                            width: "42%",
                            fontWeight: 700,
                            verticalAlign: "top",
                          }}
                        >
                          {k}
                        </td>
                        <td style={{ border: "1px solid #999", padding: "8px 10px", verticalAlign: "top" }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p style={{ fontWeight: 700, margin: "14px 0 8px" }}>
                  Підписуючи цей документ, я підтверджую свою згоду на участь у Заході за такими умовами:
                </p>
                <ol style={{ paddingLeft: 22, margin: 0 }}>
                  <li style={{ marginBottom: 10 }}>
                    <b>Медичний стан.</b> Я підтверджую, що знаходжусь у належному фізичному стані для участі у Заході
                    і проконсультувався(-лася) з лікарем, медичним фахівцем або іншим постачальником медичних послуг,
                    якщо було необхідно. Я підтверджую, що беру участь у Заході на власний ризик та несу
                    відповідальність за власне здоров'я та безпеку.
                  </li>
                  <li style={{ marginBottom: 10 }}>
                    <b>Прийняття ризиків.</b> Я усвідомлюю, що участь у Заході пов'язана з можливими ризиками для
                    здоров'я, включаючи, але не обмежуючись, травмами, виснаженням, непритомністю, смертю або іншим
                    негативним впливом на моє здоров'я. Я погоджуюсь брати участь у Заході, усвідомлюючи ці ризики, і
                    добровільно приймаю їх. Я погоджуюсь дослухатися до свого організму під час Заходу та робити
                    перерви або припинити участь, якщо відчую погіршення самопочуття.
                  </li>
                  <li style={{ marginBottom: 10 }}>
                    <b>Звільнення від відповідальності.</b> Я погоджуюся, що організатори Заходу, спонсори,
                    постачальники послуг, медичний персонал та інші залучені особи не несуть відповідальності у
                    випадку будь-яких травм або втрат, що можуть статися під час моєї участі у Заході, і звільняються
                    від будь-яких претензій, скарг або позовів, пов'язаних із моїм здоров'ям, які можуть виникнути під
                    час або після Заходу.
                  </li>
                  <li style={{ marginBottom: 10 }}>
                    <b>Правила проведення Заходу та дотримання інструкцій.</b> Я погоджуюсь дотримуватись всіх правил
                    та інструкцій персоналу Заходу, а також норм поведінки під час Заходу. Я підтверджую, що й
                    ознайомився(-лася) з Положенням (правилами) про проведення Заходу. Я погоджуюсь з тим, що несу
                    персональну відповідальність за самостійне прямування в укриття, пропоноване організатором згідно
                    зі схемою у стартовому пакеті або будь-яке інше, якщо повітряна тривога почалась в процесі
                    подолання дистанції, розумію і несу персональну відповідальність, прийнявши рішення брати участь
                    у спортивній події під час військового стану.
                  </li>
                  <li style={{ marginBottom: 10 }}>
                    <b>Обробка персональних даних.</b> Відповідно до вимог статті 8 Закону України «Про рекламу» надаю
                    свою однозначну згоду на використання створених Організаторами проєкту фотографій, ілюстрацій,
                    відео-матеріалів тощо, що містять моє зображення, в рекламі майбутніх заходів Організаторів;
                    відповідно до вимог Закону України «Про захист персональних даних», даю свою згоду на обробку моїх
                    персональних даних при проведенні заходів, пов'язаних проведенням спортивно-громадського заходу,
                    а також погоджуюсь на надання інтерв'ю представникам ЗМІ.
                  </li>
                  <li style={{ marginBottom: 10 }}>
                    <b>Контактна особа на випадок екстреної ситуації та медична допомога.</b> У разі нещасного випадку
                    на Заході прошу повідомити контактну особу, зазначену мною при реєстрації. У разі необхідності я
                    погоджуюсь на надання мені першої медичної допомоги під час або після Заходу та, якщо це буде
                    потрібно, транспортування до медичного закладу. Якщо я потребуватиму подальшого медичного
                    лікування, що виходить за межі наданого на місці, я підтверджую, що самостійно несу
                    відповідальність за всі витрати.
                  </li>
                </ol>

                <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", gap: 24 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ borderBottom: "1px solid #000", height: 24 }}>
                      {signed && (
                        <span style={{ fontStyle: "italic", fontSize: 11 }}>
                          {data.full_name} (електронний підпис)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>ПІДПИС УЧАСНИКА</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ borderBottom: "1px solid #000", height: 24 }}>
                      {signed && (
                        <span style={{ fontSize: 11 }}>
                          {new Date(data.signed_at).toLocaleString("uk-UA")}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>ДАТА</div>
                  </div>
                </div>

                {signed && (
                  <div
                    style={{
                      marginTop: 24,
                      padding: 10,
                      border: "1px solid #16a34a",
                      borderRadius: 4,
                      background: "#f0fdf4",
                      fontSize: 10,
                      color: "#14532d",
                    }}
                  >
                    <b>Електронне підтвердження згоди.</b> Документ підписано онлайн.
                    {data.signed_ip && <> IP-адреса: {data.signed_ip}.</>} Час:{" "}
                    {new Date(data.signed_at).toLocaleString("uk-UA")}. Версія: {data.consent_version}.
                    Ідентифікатор реєстрації: {registrationId}.
                  </div>
                )}
              </div>
                </div>
              </div>
            </div>


            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {!signed ? (
                <>
                  <label className="flex items-start gap-2 text-sm flex-1">
                    <Checkbox
                      checked={agreed}
                      onCheckedChange={(v) => setAgreed(!!v)}
                      className="mt-0.5"
                    />
                    <span>
                      {lang === "uk"
                        ? "Я ознайомився(-лася) з умовами та підтверджую свою згоду на участь у Заході."
                        : "I have read the conditions and consent to participate."}
                    </span>
                  </label>
                  <Button onClick={sign} disabled={!agreed || signing}>
                    {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {lang === "uk" ? "Підписати онлайн" : "Sign online"}
                  </Button>
                </>
              ) : (
                <Button onClick={downloadPdf} disabled={downloading} className="flex-1">
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {lang === "uk" ? "Завантажити PDF" : "Download PDF"}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConsentDialog;
