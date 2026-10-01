import type { Metadata } from "next";
import Link from "next/link";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { BANKA_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "Banka Bilgilerimiz · Equsto",
  description:
    "Equsto ödeme hesap bilgileri: QNB Finans Bank TL ve USD IBAN, SWIFT kodu. Havale/EFT açıklamasına sipariş numaranızı yazın.",
  alternates: {
    canonical: "https://equsto.com/banka-bilgileri",
    languages: { tr: "https://equsto.com/banka-bilgileri", en: "https://equsto.com/en/bank-details" },
  },
};

export default function BankaBilgileriPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-banka" extraCss={BANKA_PAGE_CSS}>
      <main className="bk-main" id="banka-bilgileri">
        <h1 data-i18n="banka.title">Banka Bilgilerimiz</h1>
        <p className="bk-lead" data-i18n="banka.lead">
          Sipariş ve fatura ödemeleri için hesap bilgilerimiz aşağıdaki gibidir.
        </p>
        <table className="bk-table">
          <tbody>
            <tr>
              <th scope="row" data-i18n="banka.bank_l">
                Banka
              </th>
              <td data-i18n-skip>QNB FİNANS BANK</td>
            </tr>
            <tr>
              <th scope="row" data-i18n="banka.holder_l">
                Hesap Sahibi
              </th>
              <td data-i18n-skip>TEPE ENDÜSTRİYEL DAĞCILIK VE CAM ALÜMİNYUM LTD. ŞTİ.</td>
            </tr>
            <tr>
              <th scope="row" data-i18n="banka.tr_iban_l">
                IBAN (TL)
              </th>
              <td data-i18n-skip>TR22 0011 1000 0000 0099 8200 96</td>
            </tr>
            <tr>
              <th scope="row" data-i18n="banka.usd_iban_l">
                IBAN (USD)
              </th>
              <td data-i18n-skip>TR73 0011 1000 0000 0107 8048 97</td>
            </tr>
            <tr>
              <th scope="row" data-i18n="banka.swift_l">
                SWIFT
              </th>
              <td data-i18n-skip>FNNBTRISXXX</td>
            </tr>
          </tbody>
        </table>
        <div className="bk-note" data-i18n-html="banka.note_html">
          <strong>Not:</strong> Havale/EFT açıklamasına sipariş veya teklif numaranızı yazın. Ödeme sonrası
          dekontunuzu <Link href="/iletisim">iletişim</Link> kanallarımızdan iletebilirsiniz.
        </div>
        <div className="bk-actions">
          <Link className="bk-a-secondary" href="/iletisim" data-i18n="banka.cta_contact">
            İletişim
          </Link>
        </div>
      </main>
    </VitrinShell>
  );
}
