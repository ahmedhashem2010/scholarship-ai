/**
 * SINGLE SOURCE OF TRUTH FOR PRICING.
 *
 * Before this file existed, prices were declared in three places that disagreed
 * with each other: the credits page advertised a $15/mo "Pro" tier that no
 * checkout code could fulfil, while the pricing page and the checkout route
 * offered review packs. A user comparing two pages saw two different products.
 *
 * Rule: no price, credit count or package name may be written anywhere else.
 * Import from here. If you find yourself typing a dollar figure into a
 * component, stop and add it to this file instead.
 */

export interface CreditPackage {
  /** Stable ID sent to the checkout API. Never reuse or repurpose an ID. */
  id: string;
  name: string;
  nameAr: string;
  /** Number of AI document reviews granted. */
  credits: number;
  /** Price in whole USD. */
  price: number;
  /** Renders a "Most popular" badge. Exactly one package should set this. */
  popular?: boolean;
  description: string;
  descriptionAr: string;
  features: string[];
  featuresAr: string[];
}

export const CREDIT_PACKAGES: readonly CreditPackage[] = [
  {
    id: "1-review",
    name: "Single Review",
    nameAr: "مراجعة واحدة",
    credits: 1,
    price: 3,
    description: "Try it on one document",
    descriptionAr: "جرّبها على مستند واحد",
    features: [
      "1 AI document review",
      "Full scoring breakdown",
      "Prioritised improvement list",
    ],
    featuresAr: [
      "مراجعة مستند واحد بالذكاء الاصطناعي",
      "تفصيل كامل للتقييم",
      "قائمة تحسينات مرتبة حسب الأولوية",
    ],
  },
  {
    id: "3-reviews",
    name: "Application Pack",
    nameAr: "باقة التقديم",
    credits: 3,
    price: 8,
    popular: true,
    description: "Enough to polish a full application",
    descriptionAr: "تكفي لتجهيز طلب كامل",
    features: [
      "3 AI document reviews",
      "Full scoring breakdown",
      "Prioritised improvement list",
      "Re-review your revised drafts",
      "Version-by-version progress tracking",
    ],
    featuresAr: [
      "3 مراجعات بالذكاء الاصطناعي",
      "تفصيل كامل للتقييم",
      "قائمة تحسينات مرتبة حسب الأولوية",
      "إعادة مراجعة المسودات المحدّثة",
      "تتبع التقدم بين النسخ",
    ],
  },
  {
    id: "5-reviews",
    name: "Full Season",
    nameAr: "الموسم الكامل",
    credits: 5,
    price: 12,
    description: "For applying to several scholarships",
    descriptionAr: "للتقديم على عدة منح",
    features: [
      "5 AI document reviews",
      "Full scoring breakdown",
      "Prioritised improvement list",
      "Re-review your revised drafts",
      "Version-by-version progress tracking",
      "Priority email support",
    ],
    featuresAr: [
      "5 مراجعات بالذكاء الاصطناعي",
      "تفصيل كامل للتقييم",
      "قائمة تحسينات مرتبة حسب الأولوية",
      "إعادة مراجعة المسودات المحدّثة",
      "تتبع التقدم بين النسخ",
      "دعم بالبريد الإلكتروني بأولوية",
    ],
  },
];

/** Credits granted to a brand-new account. */
export const FREE_CREDITS_ON_SIGNUP = 1;

/** Credits granted for redeeming a valid referral code. */
export const REFERRAL_BONUS_CREDITS = 1;

/**
 * Approximate EGP display rate. Purely cosmetic — all real charges are in USD.
 * $3 reads very differently in Cairo than in Dubai, so showing a local figure
 * materially affects whether the price feels reasonable.
 * Review this periodically; it will drift.
 */
export const USD_TO_EGP = 48;

/** Server-side lookup used by the checkout route to price a request. */
export const PACKAGE_LOOKUP: Record<string, CreditPackage> = Object.fromEntries(
  CREDIT_PACKAGES.map((p): [string, CreditPackage] => [p.id, p])
);

export function getPackage(id: string): CreditPackage | undefined {
  return PACKAGE_LOOKUP[id];
}

/**
 * Validates a client-supplied package against the server's own table.
 * The client sends both id and credits; we confirm they agree with what we
 * actually sell, so a tampered request cannot buy 100 credits for $3.
 */
export function validatePackage(
  id: unknown,
  credits: unknown
): CreditPackage | null {
  if (typeof id !== "string") return null;
  const pkg = PACKAGE_LOOKUP[id];
  if (!pkg) return null;
  if (typeof credits === "number" && credits !== pkg.credits) return null;
  return pkg;
}

export function formatUSD(amount: number): string {
  return `$${amount}`;
}

export function formatEGP(usd: number): string {
  return `${Math.round(usd * USD_TO_EGP).toLocaleString("en-US")} EGP`;
}

/** Per-review unit price, for "works out at $X per review" copy. */
export function pricePerReview(pkg: CreditPackage): string {
  return `$${(pkg.price / pkg.credits).toFixed(2)}`;
}

/** Percentage saved versus buying single reviews. 0 for the single pack. */
export function savingsPercent(pkg: CreditPackage): number {
  const single = PACKAGE_LOOKUP["1-review"];
  if (!single || pkg.id === single.id) return 0;
  const full = single.price * pkg.credits;
  return Math.round(((full - pkg.price) / full) * 100);
}
