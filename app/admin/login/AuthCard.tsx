import Image from "next/image";
import Link from "next/link";

/** Shared frame for the admin sign-in, create-account and forgot-password pages. */
export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="admin-login">
      <div className="admin-login__card">
        <Link href="/" className="admin-login__logo" aria-label="Summarist home">
          <Image src="/logo.png" alt="Summarist" width={150} height={38} preload />
        </Link>
        <h1 className="admin-title">{title}</h1>
        {subtitle && <p className="shop-muted admin-login__subtitle">{subtitle}</p>}
        {children}
        {footer && <div className="admin-login__footer">{footer}</div>}
      </div>
    </main>
  );
}
