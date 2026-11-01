import { SiteShell } from "@/components/site/SiteShell";

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
