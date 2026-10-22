import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper-alt px-4">
      <div className="w-full max-w-sm panel p-8">
        <div className="mb-8 flex justify-center"><Logo size={40} /></div>
        <h1 className="mb-6 text-center text-xl">Connexion à l&apos;outil interne</h1>
        <LoginForm next={suite ?? "/"} />
      </div>
    </main>
  );
}
