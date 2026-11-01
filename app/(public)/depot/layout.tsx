import { SiteShell } from "@/components/site/SiteShell";

export default function DepotLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
