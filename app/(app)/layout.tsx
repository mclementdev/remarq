import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/ui/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/connexion");
  const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", data.user.id).single();

  return (
    <div className="min-h-dvh bg-cream">
      <AppNav firstName={profile?.first_name ?? ""} />
      <main className="mx-auto max-w-page px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
