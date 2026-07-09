import { startLiqPayCheckout } from "@/lib/liqpay";
import { startWayForPayCheckout } from "@/lib/wayforpay";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error ?? "");
}

export async function startAutomatedPaymentCheckout(registrationId: string) {
  try {
    await startWayForPayCheckout(registrationId);
  } catch (wfpError: unknown) {
    const wfpMessage = errorMessage(wfpError);
    if (!wfpMessage.includes("не налаштував реквізити WayForPay")) {
      throw wfpError;
    }

    try {
      await startLiqPayCheckout(registrationId);
    } catch (liqpayError: unknown) {
      throw new Error(errorMessage(liqpayError) || wfpMessage || "Не вдалося створити платіж");
    }
  }
}