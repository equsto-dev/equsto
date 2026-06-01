"use client";

import { InboxOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import { useCallback, useRef, useState } from "react";

type PfosDropZoneProps = {
  accept?: string;
  title: string;
  hint?: string;
  fileName?: string | null;
  fileMeta?: string | null;
  disabled?: boolean;
  /** İki sütunlu import düzeni — daha az dikey boşluk */
  compact?: boolean;
  onFile: (file: File) => void;
  onClear?: () => void;
};

export default function PfosDropZone({
  accept = ".pdf,.xlsx,.xls,.json",
  title,
  hint,
  fileName,
  fileMeta,
  disabled,
  compact,
  onFile,
  onClear,
}: PfosDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const pick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleFiles = useCallback(
    (files: FileList | null | undefined) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div style={{ position: "relative" }}>
      {onClear && fileName && (
        <button
          type="button"
          title="Temizle"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          style={{
            position: "absolute",
            top: -10,
            left: -10,
            zIndex: 2,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1px solid #d9d9d9",
            background: "#fff",
            color: "#8c8c8c",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={pick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") pick();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        style={{
          border: `2px dashed ${drag ? "#1677ff" : "#d9d9d9"}`,
          borderRadius: 8,
          padding: compact ? "24px 16px" : "32px 24px",
          minHeight: compact ? 220 : undefined,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          background: drag ? "#f0f5ff" : "#fafafa",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "border-color .15s, background .15s",
          boxSizing: "border-box",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <InboxOutlined style={{ fontSize: 40, color: "#1677ff", opacity: 0.75 }} />
        {fileName ? (
          <>
            <Typography.Text strong style={{ display: "block", marginTop: 12 }}>
              {fileName}
            </Typography.Text>
            {fileMeta && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {fileMeta}
              </Typography.Text>
            )}
            <Typography.Text
              type="secondary"
              style={{ display: "block", marginTop: 8, fontSize: 12 }}
            >
              Değiştirmek için tıkla veya sürükle
            </Typography.Text>
          </>
        ) : (
          <>
            <Typography.Text strong style={{ display: "block", marginTop: 12 }}>
              {title}
            </Typography.Text>
            {hint && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {hint}
              </Typography.Text>
            )}
          </>
        )}
      </div>
    </div>
  );
}
