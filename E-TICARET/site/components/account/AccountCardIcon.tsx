type Props = {
  kind:
    | "orders"
    | "pfos"
    | "security"
    | "address"
    | "payments"
    | "whatsapp"
    | "cart"
    | "contact";
};

/** Hesap kartı ikonları — sade SVG */
export default function AccountCardIcon({ kind }: Props) {
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (kind) {
    case "orders":
      return (
        <svg {...common}>
          <path d="M4 7h16l-1.2 10H5.2L4 7z" />
          <path d="M9 11h6M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "pfos":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="12" rx="1.5" />
          <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M7 13h10M7 16h6" />
        </svg>
      );
    case "security":
      return (
        <svg {...common}>
          <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
          <path d="M9.5 12.5l2 2 4-4" />
        </svg>
      );
    case "address":
      return (
        <svg {...common}>
          <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
      );
    case "payments":
      return (
        <svg {...common}>
          <rect x="2.5" y="6" width="19" height="12" rx="2" />
          <path d="M2.5 10h19M6 15h4" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M12 3a8 8 0 0 0-6.9 12L4 21l6.1-1.6A8 8 0 1 0 12 3z" />
          <path d="M9.5 10.5c.4 1.2 1.8 3 3.2 3.5" />
        </svg>
      );
    case "cart":
      return (
        <svg {...common}>
          <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" />
          <path d="M3 4h2l2.5 11h10l2-8H7" />
        </svg>
      );
    case "contact":
      return (
        <svg {...common}>
          <path d="M4 5h16v10H8l-4 4V5z" />
          <path d="M8 10h8M8 13h5" />
        </svg>
      );
    default:
      return null;
  }
}
