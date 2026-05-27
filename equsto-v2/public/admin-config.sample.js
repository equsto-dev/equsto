/**
 * Kopyalayın: public/admin-config.js (git'e GİRMEZ)
 * veya: npm run admin:config (.env'den üretir)
 */
(function () {
  var origin =
    typeof window !== "undefined" && window.location && window.location.origin
      ? window.location.origin
      : "";
  var api = origin ? origin.replace(/\/$/, "") + "/api" : "/api";

  window.EQUSTO_API_BASE = api;
  window.EQUSTO_PRODUCTS_API_BASE = api;
  window.EQUSTO_CLAUDE_API_BASE = api;

  // Production: güçlü rastgele token — .env EQUSTO_ADMIN_BEARER ile aynı
  // window.EQUSTO_ADMIN_BEARER = "eq_adm_...";

  // Canlı şifre kapısı (isteğe bağlı)
  // window.EQUSTO_ADMIN_PW_SHA256 = "...";
})();
