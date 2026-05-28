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
.ct-main{max-width:52rem;margin:0 auto;padding:28px 20px 56px;line-height:1.65;}
.ct-box{margin:20px 0;padding:16px 18px;border:1px solid var(--eq-border);border-radius:8px;background:var(--eq-surface-2);font-size:14px;}
.ct-main h1{font-size:clamp(24px,4vw,32px);font-weight:700;margin-bottom:12px;color:var(--eq-text);}
.ct-main .ct-lead{font-size:15px;line-height:1.65;color:var(--eq-text-secondary);margin-bottom:24px;}
.ct-konu{display:none;margin:0 0 20px;padding:12px 14px;border-radius:6px;background:var(--eq-surface-2);border:1px solid var(--eq-border);font-size:13px;color:var(--eq-text);}
.ct-konu.is-on{display:block;}
.ct-actions{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:28px;}
.ct-actions a{display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;border-radius:4px;font-size:13px;font-weight:600;text-decoration:none;}
.ct-a-primary{background:#001e50;color:#fff;border:1px solid #001e50;}
.ct-a-primary:hover{filter:brightness(1.08);}
.ct-a-secondary{background:var(--eq-surface);color:var(--eq-text);border:1px solid var(--eq-border);}
.ct-a-secondary:hover{background:var(--eq-hover);}
.ct-list{margin:0;padding-left:1.2em;font-size:14px;line-height:1.7;color:var(--eq-text-secondary);}
.ct-list li{margin-bottom:8px;}
`;

export const HAKKIMIZDA_PAGE_CSS = `
.hk-main{max-width:52rem;margin:0 auto;padding:28px 20px 56px;line-height:1.65;color:var(--eq-text);}
.hk-main h1{font-size:clamp(24px,4vw,32px);font-weight:700;margin:0 0 12px;}
.hk-lead{font-size:15px;color:var(--eq-text-secondary);margin:0 0 20px;}
.hk-box{margin:16px 0;padding:14px 16px;border:1px solid var(--eq-border);border-radius:8px;background:var(--eq-surface-2);}
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
.eq-geo-table{width:100%;border-collapse:collapse;font-size:13px;margin:12px 0 20px;}
.eq-geo-table th,.eq-geo-table td{border:1px solid var(--eq-border);padding:8px 10px;text-align:left;}
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
