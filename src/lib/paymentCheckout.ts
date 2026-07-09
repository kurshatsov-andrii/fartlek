import { startLiqPayCheckout } from "@/lib/liqpay";
import { startWayForPayCheckout } from "@/lib/wayforpay";

export async function startAutomatedPaymentCheckout(registrationId: string) {
  try {
    await startWayForPayCheckout(registrationId);
  } catch (wfpError: any) {
    const wfpMessage = String(wfpError?.message ?? "");
    if (!wfpMessage.includes("не налаштував реквізити WayForPay")) {
      throw wfpError;
    }

    try {
      await startLiqPayCheckout(registrationId);
    } catch (liqpayError: any) {
      throw new Error(liqpayError?.message || wfpError?.message || "Не вдалося створити платіж");
    }
  }
}