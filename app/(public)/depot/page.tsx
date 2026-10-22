import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { DepotForm } from "@/components/depot/DepotForm";

export const metadata: Metadata = { title: "Proposer un meuble" };
export const dynamic = "force-dynamic";

export default async function DepotPage() {
  const supabase = createAdminClient();
  const { data: brands } = await supabase.from("brands").select("id, name").eq("active", true).order("name");

  return (
    <>
      <div className="mb-10 space-y-3 text-center">
        <h1 className="text-2xl sm:text-3xl">Proposer un meuble</h1>
        <p className="text-ink-soft">
          Vous souhaitez vendre une pièce de design ? Décrivez-la en quelques minutes, nous étudions chaque demande avec attention et revenons vers vous rapidement.
        </p>
      </div>
      <DepotForm brands={brands ?? []} />
    </>
  );
}
