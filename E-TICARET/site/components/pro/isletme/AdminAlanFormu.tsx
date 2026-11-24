"use client";

import { App } from "antd";
import { useState } from "react";
import type { IslemAksiyon, IslemKarti, IslemTon } from "@/lib/isletme/siparis-not-alanlari";
import styles from "./AdminAlanFormu.module.css";

export type AlanSection = IslemKarti;

function externalHref(href: string) {
  return /^https?:/i.test(href);
}

function toneClass(tone: IslemTon, done: boolean) {
  if (done) return styles.done;
  if (tone === "wa") return styles.wa;
  if (tone === "call") return styles.call;
  if (tone === "mail") return styles.mail;
  if (tone === "map") return styles.map;
  return styles.copy;
}

export default function AdminAlanFormu({ sections }: { sections: AlanSection[] }) {
  const { message } = App.useApp();
  const [copied, setCopied] = useState<string | null>(null);
  const visible = sections.filter(
    (section) => section.headline || section.body || section.facts?.length || section.actions.length,
  );

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      message.success("Kopyalandı");
      window.setTimeout(() => {
        setCopied((current) => (current === key ? null : current));
      }, 1400);
    } catch {
      message.error("Kopyalanamadı");
    }
  }

  if (!visible.length) return null;

  return (
    <div className={styles.stack}>
      {visible.map((section) => (
        <section key={section.title} className={styles.card}>
          <h3 className={styles.head}>{section.title}</h3>
          {section.headline ? <p className={styles.headline}>{section.headline}</p> : null}
          {section.body ? (
            <p className={section.bubble ? styles.bubble : styles.body}>{section.body}</p>
          ) : null}
          {section.facts && section.facts.length > 0 ? (
            <div className={styles.facts}>
              {section.facts.map((fact) => {
                const key = `${section.title}:${fact.label}`;
                const done = copied === key;
                if (!fact.copyText) {
                  return (
                    <div key={fact.label} className={styles.fact}>
                      <span className={styles.factLabel}>{fact.label}</span>
                      <span className={styles.factValue}>{fact.value}</span>
                    </div>
                  );
                }
                return (
                  <button
                    key={fact.label}
                    type="button"
                    className={`${styles.fact} ${styles.factLive}`}
                    onClick={() => void copy(key, fact.copyText || fact.value)}
                  >
                    <span className={styles.factLabel}>{fact.label}</span>
                    <span className={styles.factValue}>{done ? "Kopyalandı" : fact.value}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {section.actions.length > 0 ? (
            <div className={styles.actions}>
              {section.actions.map((action) => (
                <ActionButton
                  key={`${action.tone}-${action.label}`}
                  action={action}
                  wide={section.actions.length === 1 || action.tone === "wa"}
                  done={copied === `${section.title}:${action.label}`}
                  onCopy={() =>
                    void copy(`${section.title}:${action.label}`, action.copyText || "")
                  }
                />
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}

function isWhatsAppHref(href: string) {
  return /^whatsapp:/i.test(href);
}

function ActionButton({
  action,
  wide,
  done,
  onCopy,
}: {
  action: IslemAksiyon;
  wide: boolean;
  done: boolean;
  onCopy: () => void;
}) {
  const className = [styles.btn, toneClass(action.tone, done), wide ? styles.wide : ""]
    .filter(Boolean)
    .join(" ");
  const label = done ? "Kopyalandı" : action.label;
  if (action.href) {
    const whatsapp = isWhatsAppHref(action.href);
    return (
      <a
        className={className}
        href={action.href}
        target={whatsapp || !externalHref(action.href) ? undefined : "_blank"}
        rel={whatsapp || !externalHref(action.href) ? undefined : "noreferrer"}
        onClick={() => action.onClick?.()}
      >
        {label}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={onCopy}>
      {label}
    </button>
  );
}
