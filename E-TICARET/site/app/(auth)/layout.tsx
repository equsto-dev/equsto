import AuthVitrinChrome from "@/components/auth/AuthVitrinChrome";

/** Üye girişi — vitrin üst bant + drawer */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthVitrinChrome />
      {children}
    </>
  );
}
