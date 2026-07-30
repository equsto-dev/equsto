import Iyzipay from "iyzipay";
import { getSiteOrigin } from "@/lib/site-origin";

export type IyzicoResult = {
  status?: string;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
  locale?: string;
  systemTime?: number;
  conversationId?: string;
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  tokenExpireTime?: number;
  paymentId?: string;
  paymentStatus?: string;
  price?: string | number;
  paidPrice?: string | number;
  currency?: string;
  basketId?: string;
  [key: string]: unknown;
};

export type OdemeBasketItem = {
  id: string;
  name: string;
  category1: string;
  itemType: string;
  price: string;
};

export type OdemeBuyer = {
  id: string;
  name: string;
  surname: string;
  identityNumber: string;
  email: string;
  gsmNumber: string;
  registrationAddress: string;
  city: string;
  country: string;
  ip: string;
};

export type OdemeAddress = {
  contactName: string;
  city: string;
  country: string;
  address: string;
};

type IyzicoCb = (err: Error | null, result: IyzicoResult) => void;

function env(name: string): string {
  return String(process.env[name] ?? "").trim();
}

export function iyzicoConfigured(): boolean {
  return Boolean(env("IYZICO_API_KEY") && env("IYZICO_SECRET_KEY"));
}

export function iyzicoBaseUri(): string {
  const raw = env("IYZICO_BASE_URL") || env("IYZIPAY_URI");
  if (raw) return raw.replace(/\/$/, "");
  return "https://sandbox-api.iyzipay.com";
}

function client(): InstanceType<typeof Iyzipay> {
  if (!iyzicoConfigured()) {
    throw new Error("iyzico API anahtarları tanımlı değil (IYZICO_API_KEY / IYZICO_SECRET_KEY)");
  }
  return new Iyzipay({
    apiKey: env("IYZICO_API_KEY"),
    secretKey: env("IYZICO_SECRET_KEY"),
    uri: iyzicoBaseUri(),
  });
}

function promisify(fn: (cb: IyzicoCb) => void): Promise<IyzicoResult> {
  return new Promise((resolve, reject) => {
    fn((err, result) => {
      if (err) reject(err);
      else resolve((result || {}) as IyzicoResult);
    });
  });
}

export function formatTlPrice(n: number): string {
  const v = Math.round(Number(n) * 100) / 100;
  if (!Number.isFinite(v) || v <= 0) return "0.00";
  return v.toFixed(2);
}

export function splitName(full: string): { name: string; surname: string } {
  const parts = String(full || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { name: "Musteri", surname: "Equsto" };
  if (parts.length === 1) return { name: parts[0], surname: parts[0] };
  return { name: parts[0], surname: parts.slice(1).join(" ") };
}

export function buyerIdentityFallback(): string {
  return env("IYZICO_BUYER_IDENTITY_FALLBACK") || "11111111111";
}

export async function initializeCheckoutPreAuth(input: {
  conversationId: string;
  basketId: string;
  price: string;
  paidPrice: string;
  callbackUrl: string;
  buyer: OdemeBuyer;
  shippingAddress: OdemeAddress;
  billingAddress: OdemeAddress;
  basketItems: OdemeBasketItem[];
  enabledInstallments?: number[];
}): Promise<IyzicoResult> {
  const iyzi = client();
  return promisify((cb) =>
    iyzi.checkoutFormInitializePreAuth.create(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: input.conversationId,
        price: input.price,
        paidPrice: input.paidPrice,
        currency: Iyzipay.CURRENCY.TRY,
        basketId: input.basketId,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: input.callbackUrl,
        enabledInstallments: input.enabledInstallments ?? [1],
        buyer: input.buyer,
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress,
        basketItems: input.basketItems,
      },
      cb as (err: Error | null, result: Record<string, unknown>) => void,
    ),
  );
}

export async function retrieveCheckoutForm(token: string): Promise<IyzicoResult> {
  const iyzi = client();
  return promisify((cb) =>
    iyzi.checkoutForm.retrieve(
      {
        locale: Iyzipay.LOCALE.TR,
        token,
      },
      cb as (err: Error | null, result: Record<string, unknown>) => void,
    ),
  );
}

export async function capturePostAuth(input: {
  paymentId: string;
  ip: string;
  paidPrice?: string;
  conversationId?: string;
}): Promise<IyzicoResult> {
  const iyzi = client();
  return promisify((cb) =>
    iyzi.paymentPostAuth.create(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: input.conversationId,
        paymentId: input.paymentId,
        ip: input.ip,
        paidPrice: input.paidPrice,
      },
      cb as (err: Error | null, result: Record<string, unknown>) => void,
    ),
  );
}

export async function voidCancel(input: {
  paymentId: string;
  ip: string;
  conversationId?: string;
}): Promise<IyzicoResult> {
  const iyzi = client();
  return promisify((cb) =>
    iyzi.cancel.create(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: input.conversationId,
        paymentId: input.paymentId,
        ip: input.ip,
      },
      cb as (err: Error | null, result: Record<string, unknown>) => void,
    ),
  );
}

export function odemeCallbackUrl(): string {
  return `${getSiteOrigin()}/api/odeme/callback`;
}

export function odemeSonucUrl(params: Record<string, string>): string {
  const q = new URLSearchParams(params);
  return `${getSiteOrigin()}/odeme/sonuc?${q.toString()}`;
}

export { Iyzipay };
