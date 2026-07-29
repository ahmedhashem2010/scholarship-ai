/**
 * Contact + manual payment details.
 *
 * These were previously hardcoded, and the WhatsApp number shipped as the
 * placeholder `201000000000` — meaning the only working payment path in the
 * product led to a number that doesn't exist. Everything lives in env now, and
 * the UI checks `isWhatsAppConfigured()` before offering the option, so a
 * missing value degrades to a visible message rather than a silent dead end.
 */

/** Digits only, country code first. e.g. 201012345678 */
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");

export const VODAFONE_CASH_NUMBER = process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER || "";
export const INSTAPAY_HANDLE = process.env.NEXT_PUBLIC_INSTAPAY_HANDLE || "";

/**
 * A real number is at least a country code plus a subscriber number, and the
 * old placeholder was a run of zeros — reject both so a misconfiguration can't
 * reach a user.
 */
export function isWhatsAppConfigured(): boolean {
  if (WHATSAPP_NUMBER.length < 10) return false;
  if (/^(\d)\1+$/.test(WHATSAPP_NUMBER)) return false;
  if (WHATSAPP_NUMBER === "201000000000") return false;
  return true;
}

export function whatsAppUrl(message: string): string | null {
  if (!isWhatsAppConfigured()) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Opens WhatsApp with a prefilled message.
 * Returns false when contact details aren't configured, so callers can show
 * a fallback instead of opening a broken tab.
 */
export function openWhatsApp(message: string): boolean {
  const url = whatsAppUrl(message);
  if (!url) {
    console.error(
      "NEXT_PUBLIC_WHATSAPP_NUMBER is not configured — manual payment is unavailable."
    );
    return false;
  }
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
