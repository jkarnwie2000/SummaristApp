import AppShell from "../components/AppShell";

/** Shared sidebar + search for every signed-in page. It stays mounted between pages. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
