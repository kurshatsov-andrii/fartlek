import { startLiqPayCheckout } from "@/lib/liqpay";
import { startWayForPayCheckout } from "@/lib/wayforpay";

export async function startAutomatedPaymentCheckout(registrationId: string) {
  try {
    await startWayForPayCheckout(registrationId);
  } catch (wfpError: any) {
    try {
      await startLiqPayCheckout(registrationId);
    } catch (liqpayError: any) {
      throw new Error(liqpayError?.message || wfpError?.message || "Не вдалося створити платіж");
    }
  }
}