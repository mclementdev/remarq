import Image from "next/image";

export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Image src="/brand/logo.png" alt={withText ? "" : "Remarq"} width={size} height={size} priority />
      {withText && <span className="text-lg tracking-[0.12em] uppercase">Remarq</span>}
    </span>
  );
}
