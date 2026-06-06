export {

  whatsAppAccessToken,

  whatsAppAppSecret,

  whatsAppEnvHints,

  whatsAppMetaConfigured,

  whatsAppMode,

  whatsAppNotifyTo,

  whatsAppPhoneNumberId,

  whatsAppVerifyToken,

  whatsAppWebhookConfigured,

  vitrinWhatsAppE164,

  normalizeWaRecipient,

  greenApiConfigured,

  type WhatsAppMode,

} from "./config";



export {

  buildWaMeUrl,

  buildWebWhatsAppUrl,

  buildWhatsAppLink,

  whatsAppLinkReady,

  type WaLinkTarget,

} from "./link";



export {

  sendGreenApiText,

  parseGreenApiInboundMessages,

  greenApiInstanceId,

  greenApiToken,

  type GreenApiInboundMessage,

} from "./green-api";



export {

  sendWhatsAppText,

  sendWhatsAppTemplate,

  whatsAppSendConfigured,

  type WaSendResult,

} from "./send";



/** Geriye dönük uyumluluk — sunucu gönderimi yapılandırılmış mı */

export { whatsAppSendConfigured as whatsAppConfigured } from "./send";



export {

  sendWhatsAppText as sendMetaWhatsAppText,

  sendWhatsAppTemplate as sendMetaWhatsAppTemplate,

  markWhatsAppRead,

} from "./meta-client";



export {

  parseInboundWhatsAppMessages,

  verifyWhatsAppSignature,

  handleInboundWhatsAppMessage,

  handleGreenApiInboundMessage,

  type InboundWhatsAppMessage,

} from "./webhook";


