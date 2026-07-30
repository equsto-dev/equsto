declare module "iyzipay" {
  type Cb = (err: Error | null, result: Record<string, unknown>) => void;

  class Iyzipay {
    constructor(config: { apiKey: string; secretKey: string; uri: string });
    checkoutFormInitializePreAuth: { create: (req: Record<string, unknown>, cb: Cb) => void };
    checkoutForm: { retrieve: (req: Record<string, unknown>, cb: Cb) => void };
    paymentPostAuth: { create: (req: Record<string, unknown>, cb: Cb) => void };
    cancel: { create: (req: Record<string, unknown>, cb: Cb) => void };

    static LOCALE: { TR: string; EN: string };
    static PAYMENT_GROUP: { PRODUCT: string; LISTING: string; SUBSCRIPTION: string };
    static BASKET_ITEM_TYPE: { PHYSICAL: string; VIRTUAL: string };
    static CURRENCY: { TRY: string };
  }

  export = Iyzipay;
}
