import { supabase } from "@/integrations/supabase/client";

interface CheckoutData {
  merchantAccount: string;
  merchantAuthType?: string;
  merchantDomainName: string;
  merchantTransactionType?: string;
  merchantTransactionSecureType?: string;
  merchantSignature: string;
  orderReference: string;
  orderDate: number;
  amount: number | string;
  currency: string;
  productName: string[];
  productCount: number[];
  productPrice: number[];
  serviceUrl: string;
  returnUrl: string;
  language: string;
  paymentUrl?: string;
}

export async function startWayForPayCheckout(registrationId: string) {
  const { data, error } = await supabase.functions.invoke<{ checkout: CheckoutData }>(
    "wayforpay-create",
    { body: { registration_id: registrationId } },
  );
  if (error || !data?.checkout) throw new Error(error?.message ?? "Не вдалося створити платіж");

  const c = data.checkout;
  if (c.paymentUrl) {
    window.location.assign(c.paymentUrl);
    return;
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://secure.wayforpay.com/pay";
  form.acceptCharset = "utf-8";
  form.target = "_self";

  const append = (name: string, value: string | number) => {
    const i = document.createElement("input");
    i.type = "hidden"; i.name = name; i.value = String(value);
    form.appendChild(i);
  };

  append("merchantAccount", c.merchantAccount);
  if (c.merchantAuthType) append("merchantAuthType", c.merchantAuthType);
  append("merchantDomainName", c.merchantDomainName);
  if (c.merchantTransactionType) append("merchantTransactionType", c.merchantTransactionType);
  if (c.merchantTransactionSecureType) append("merchantTransactionSecureType", c.merchantTransactionSecureType);
  append("merchantSignature", c.merchantSignature);
  append("orderReference", c.orderReference);
  append("orderDate", c.orderDate);
  append("amount", c.amount);
  append("currency", c.currency);
  append("serviceUrl", c.serviceUrl);
  append("returnUrl", c.returnUrl);
  append("language", c.language);
  c.productName.forEach((p) => append("productName[]", p));
  c.productCount.forEach((p) => append("productCount[]", p));
  c.productPrice.forEach((p) => append("productPrice[]", p));

  document.body.appendChild(form);
  form.submit();
}
