export const SSS_PAGE_CSS = `
body.eq-sss > nav.breadcrumb{display:none!important;}
.eq-sss-main{max-width:52rem;margin:0 auto;padding:28px 20px 56px;line-height:1.65;color:var(--eq-text);}
.eq-sss-main h1{font-size:clamp(26px,4vw,34px);font-weight:700;margin:0 0 12px;letter-spacing:-.02em;}
.eq-sss-lead{font-size:15px;color:var(--eq-text-secondary);margin:0 0 28px;max-width:48rem;}
.eq-sss-back{display:inline-block;margin-bottom:20px;font-size:13px;font-weight:600;color:var(--eq-text-secondary);text-decoration:none;}
.eq-sss-back:hover{color:var(--eq-text);text-decoration:underline;}
.eq-sss-list{margin:0;padding:0;}
.eq-sss-list .eq-sss-item{border:1px solid var(--eq-border);border-radius:8px;margin:0 0 10px;background:var(--eq-surface);}
.eq-sss-list .eq-sss-item[open]{background:var(--eq-surface-2);}
.eq-sss-list summary{list-style:none;cursor:pointer;padding:14px 16px;font-size:14px;font-weight:600;line-height:1.45;color:var(--eq-text);}
.eq-sss-list summary::-webkit-details-marker{display:none;}
.eq-sss-list summary::marker{display:none;content:"";}
.eq-sss-answer{padding:0 16px 14px;}
.eq-sss-answer p{margin:0;font-size:14px;line-height:1.6;color:var(--eq-text-secondary);}
.eq-sss-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:32px;}
.eq-sss-actions a{display:inline-flex;padding:10px 16px;border-radius:4px;font-size:13px;font-weight:600;text-decoration:none;}
.eq-sss-a-primary{background:#001e50;color:#fff;border:1px solid #001e50;}
.eq-sss-a-secondary{background:var(--eq-surface);color:var(--eq-text);border:1px solid var(--eq-border);}
`;

export const CONTACT_PAGE_CSS = `
body.eq-contact > nav.breadcrumb{display:none!important;}
.ct-page{max-width:1120px;margin:0 auto;padding:24px 20px 56px;line-height:1.55;color:var(--eq-text);}
.ct-konu{display:none;margin:0 0 18px;padding:12px 14px;border-radius:6px;background:var(--eq-surface-2);border:1px solid var(--eq-border);font-size:13px;color:var(--eq-text);}
.ct-konu.is-on{display:block;}
.ct-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px 32px;align-items:start;margin-bottom:32px;}
.ct-panel-title{font-size:17px;font-weight:700;color:#001e50;margin:0 0 10px;padding-bottom:8px;border-bottom:2px solid #001e50;}
.ct-info-table{width:100%;border-collapse:collapse;font-size:13px;line-height:1.5;}
.ct-info-table th,.ct-info-table td{border:1px solid var(--eq-border);padding:9px 11px;text-align:left;vertical-align:top;}
.ct-info-table th{width:38%;font-weight:600;background:var(--eq-surface-2);color:var(--eq-text);}
.ct-info-table td{color:var(--eq-text-secondary);}
.ct-info-table a{color:#001e50;text-decoration:none;font-weight:600;}
.ct-info-table a:hover{text-decoration:underline;}
.ct-form-note{margin:0 0 14px;font-size:12px;color:var(--eq-text-muted);}
.ct-form{display:flex;flex-direction:column;gap:12px;}
.ct-field{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--eq-text-muted);}
.ct-field span{font-weight:600;}
.ct-field input,.ct-field select,.ct-field textarea{width:100%;padding:9px 10px;font-size:13px;border:1px solid var(--eq-border);border-radius:4px;background:var(--eq-surface,#fff);color:var(--eq-text);}
.ct-field textarea{resize:vertical;min-height:110px;}
.ct-field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.ct-field--full{grid-column:1/-1;}
.ct-captcha{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;}
.ct-captcha-code{display:inline-flex;align-items:center;justify-content:center;min-width:72px;height:38px;padding:0 10px;border-radius:4px;background:#fce7f3;color:#831843;font-weight:700;font-size:15px;letter-spacing:.08em;border:1px solid #f9a8d4;user-select:none;}
.ct-captcha-input{flex:1;min-width:140px;}
.ct-captcha-refresh{flex:0 0 38px;height:38px;border:1px solid var(--eq-border);border-radius:4px;background:var(--eq-surface-2);color:#001e50;font-size:18px;cursor:pointer;line-height:1;}
.ct-captcha-refresh:hover{background:var(--eq-hover);}
.ct-privacy{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--eq-text-secondary);cursor:pointer;}
.ct-privacy input{margin-top:3px;flex-shrink:0;}
.ct-privacy a{color:#001e50;font-weight:600;}
.ct-form-status{min-height:18px;margin:0;font-size:12px;color:var(--eq-text-muted);}
.ct-form-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:4px;}
.ct-btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 22px;border-radius:4px;font-size:13px;font-weight:600;border:1px solid transparent;cursor:pointer;text-decoration:none;}
.ct-btn--primary{background:#001e50;color:#fff;border-color:#001e50;}
.ct-btn--primary:hover{filter:brightness(1.08);}
.ct-btn--primary:disabled{opacity:.65;cursor:not-allowed;}
.ct-btn--secondary{background:#4b5563;color:#fff;border-color:#4b5563;}
.ct-btn--secondary:hover{filter:brightness(1.06);}
.ct-quick{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px;}
.ct-quick-card{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:110px;padding:18px 12px;border:1px solid var(--eq-border);border-radius:6px;background:var(--eq-surface,#fff);text-decoration:none;color:var(--eq-text);font-size:13px;font-weight:600;text-align:center;transition:border-color .15s,box-shadow .15s;}
.ct-quick-card:hover{border-color:#001e50;box-shadow:0 2px 10px rgba(0,30,80,.08);color:#001e50;}
.ct-quick-icon{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:var(--eq-surface-2);font-size:22px;line-height:1;color:#6b7280;}
.ct-map-wrap{border:1px solid var(--eq-border);border-radius:6px;overflow:hidden;background:var(--eq-surface-2);}
.ct-map{display:block;width:100%;height:min(420px,55vw);border:0;}
@media (max-width:900px){
  .ct-grid{grid-template-columns:1fr;}
  .ct-quick{grid-template-columns:1fr;}
}
@media (max-width:560px){
  .ct-field-row{grid-template-columns:1fr;}
  .ct-page{padding:16px 14px 48px;}
}
`;

export const HAKKIMIZDA_PAGE_CSS = `
.hk-main{max-width:52rem;margin:0 auto;padding:28px 20px 56px;line-height:1.65;color:var(--eq-text);}
.hk-main h1{font-size:clamp(24px,4vw,32px);font-weight:700;margin:0 0 12px;}
.hk-lead{font-size:15px;color:var(--eq-text-secondary);margin:0 0 20px;}
.hk-box{margin:16px 0;padding:14px 16px;border:1px solid var(--eq-border);border-radius:8px;background:var(--eq-surface-2);}
.hk-summary{margin:0;padding-left:1.2em;}
.hk-summary li{margin-bottom:6px;font-size:14px;line-height:1.55;}
.hk-main h2{font-size:18px;font-weight:700;margin:24px 0 10px;}
.hk-main h3{font-size:15px;font-weight:700;margin:16px 0 8px;}
.hk-main p,.hk-main li{font-size:14px;line-height:1.7;color:var(--eq-text-secondary);}
.hk-main ul,.hk-main ol{margin:0 0 16px;padding-left:1.2em;}
.hk-actions{display:flex;flex-wrap:wrap;gap:10px;margin:28px 0;}
.hk-a-primary,.hk-a-secondary{display:inline-flex;padding:10px 16px;border-radius:4px;font-size:13px;font-weight:600;text-decoration:none;}
.hk-a-primary{background:#001e50;color:#fff;border:1px solid #001e50;}
.hk-a-secondary{background:var(--eq-surface);color:var(--eq-text);border:1px solid var(--eq-border);}
.hk-en{margin-top:32px;padding-top:20px;border-top:1px solid var(--eq-border);font-size:13px;color:var(--eq-text-muted);}
`;

export const STORY_PAGE_CSS = `
.hk-main{max-width:52rem;margin:0 auto;padding:28px 20px 56px;line-height:1.65;color:var(--eq-text);}
.hk-main h1{font-size:clamp(24px,4vw,32px);font-weight:700;margin:0 0 12px;}
.hk-lead{font-size:15px;color:var(--eq-text-secondary);margin:0 0 20px;}
.hk-media{margin:20px 0 28px;}
.hk-media__inner{min-height:160px;display:flex;align-items:center;justify-content:center;padding:24px;border:1px dashed var(--eq-border);border-radius:8px;background:var(--eq-surface-2);text-align:center;font-size:13px;color:var(--eq-text-secondary);}
.hk-timeline{margin:0;padding-left:1.2em;font-size:14px;line-height:1.7;color:var(--eq-text-secondary);}
.hk-timeline li{margin-bottom:12px;}
.hk-actions{display:flex;flex-wrap:wrap;gap:10px;margin:28px 0;}
.hk-a-primary,.hk-a-secondary{display:inline-flex;padding:10px 16px;border-radius:4px;font-size:13px;font-weight:600;text-decoration:none;}
.hk-a-primary{background:#001e50;color:#fff;border:1px solid #001e50;}
.hk-a-secondary{background:var(--eq-surface);color:var(--eq-text);border:1px solid var(--eq-border);}
`;

export const GEO_PAGE_CSS = `
.eq-geo-main{max-width:960px;margin:0 auto;padding:28px 20px 56px;}
.eq-geo-bc{font-size:12px;color:var(--eq-text-muted);margin:0 0 16px;}
.eq-geo-bc a{color:var(--eq-link,#001e50);text-decoration:none;}
.eq-geo-article h1{font-size:clamp(22px,4vw,30px);font-weight:700;margin:0 0 12px;color:var(--eq-text);}
.eq-geo-lead{font-size:15px;line-height:1.7;color:var(--eq-text-secondary);margin:0 0 16px;}
.eq-geo-budget{font-size:14px;margin:0 0 18px;padding:12px 14px;border-radius:6px;background:var(--eq-surface-2);border:1px solid var(--eq-border);}
.eq-geo-body{font-size:14px;line-height:1.75;color:var(--eq-text);}
.eq-geo-body h2{font-size:1.05rem;margin:22px 0 10px;color:var(--eq-text);}
.eq-geo-body p{margin:0 0 14px;}
.eq-geo-body ul{margin:0 0 14px 1.25rem;padding:0;}
.eq-geo-body li{margin:0 0 6px;}
.eq-geo-proforma{margin:20px 0 28px;font-size:14px;line-height:1.65;color:var(--eq-text);}
.eq-geo-proforma h2{font-size:1.05rem;margin:0 0 8px;color:var(--eq-text);}
.eq-geo-proforma-meta{font-size:13px;color:var(--eq-text-secondary);margin:0 0 18px;line-height:1.55;}
.eq-geo-proforma-dl{font-weight:600;color:var(--eq-link,#001e50);text-decoration:none;}
.eq-geo-proforma-dl:hover{text-decoration:underline;}
.eq-geo-proforma-zones{display:flex;flex-direction:column;gap:18px;}
.eq-geo-proforma-zone h3{margin:0 0 6px;font-size:14px;font-weight:700;text-transform:lowercase;color:var(--eq-text);}
.eq-geo-proforma-items{margin:0;padding:0;list-style:none;}
.eq-geo-proforma-items li{margin:0 0 2px;padding:0 0 0 1.1em;text-indent:-1.1em;font-size:13px;line-height:1.55;color:var(--eq-text);}
.eq-geo-proforma-items li::before{content:"- ";}
.eq-geo-table{width:100%;border-collapse:collapse;font-size:12px;margin:0;min-width:720px;}
.eq-geo-table th,.eq-geo-table td{border:1px solid var(--eq-border);padding:7px 9px;text-align:left;vertical-align:top;}
.eq-geo-table thead th,.eq-geo-table tfoot th{background:var(--eq-surface-2);font-weight:600;}
.eq-geo-table a{color:var(--eq-link,#001e50);font-weight:600;}
.eq-geo-links{margin:0 0 20px;padding-left:1.2em;font-size:14px;line-height:1.7;}
.eq-geo-links a{color:var(--eq-link,#001e50);}
.eq-geo-faq{margin:24px 0;}
.eq-geo-faq-item{border:1px solid var(--eq-border);border-radius:6px;margin:0 0 8px;padding:10px 12px;background:var(--eq-surface);}
.eq-geo-faq-item summary{cursor:pointer;font-weight:600;font-size:14px;}
.eq-geo-faq-item p{margin:10px 0 0;font-size:13px;line-height:1.65;color:var(--eq-text-secondary);}
.eq-geo-actions{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0 16px;}
.eq-geo-btn{display:inline-flex;padding:10px 16px;border-radius:4px;font-size:13px;font-weight:600;text-decoration:none;border:1px solid var(--eq-border);color:var(--eq-text);background:var(--eq-surface);}
.eq-geo-btn--primary{background:#001e50;color:#fff;border-color:#001e50;}
.eq-geo-about{font-size:12px;color:var(--eq-text-muted);line-height:1.55;margin:0;}
.eq-geo-main:has(.eq-geo-blog-index){max-width:1200px;}
.eq-geo-blog-index{display:grid;grid-template-columns:repeat(3,1fr);gap:28px 24px;margin:24px 0 28px;align-items:start;}
.eq-geo-blog-sec{margin:0;min-width:0;}
.eq-geo-blog-sec h2{font-size:0.95rem;font-weight:700;margin:0 0 10px;line-height:1.35;color:var(--eq-text);}
.eq-geo-blog-sec .eq-geo-links{margin:0;padding-left:1.1em;font-size:13px;line-height:1.65;}
@media (max-width:900px){.eq-geo-blog-index{grid-template-columns:repeat(2,1fr);}}
@media (max-width:560px){.eq-geo-blog-index{grid-template-columns:1fr;}}
`;
