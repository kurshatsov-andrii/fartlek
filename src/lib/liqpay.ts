import { supabase } from "@/integrations/supabase/client";

interface LiqPayCheckout {
  action: string;
  data: string;
  signature: string;
}

export async function startLiqPayCheckout(registrationId: string) {
  const { data, error } = await supabase.functions.invoke<{ checkout: LiqPayCheckout }>(
    "liqpay-create",
    { body: { registration_id: registrationId } },
  );
  if (error || !data?.checkout) throw new Error(error?.message ?? "Не вдалося створити платіж");

  const c = data.checkout;
  const form = document.createElement("form");
  form.method = "POST";
  form.action = c.action;
  form.acceptCharset = "utf-8";
  form.target = "_self";

  const append = (name: string, value: string) => {
    const i = document.createElement("input");
    i.type = "hidden"; i.name = name; i.value = value;
    form.appendChild(i);
  };

  append("data", c.data);
  append("signature", c.signature);

  document.body.appendChild(form);
  form.submit();
}
