/* eslint-disable @next/next/no-img-element -- URL signées temporaires Supabase */
import clsx from "clsx";

export function Thumb({ src, alt, size = 48, className }: { src?: string | null; alt: string; size?: number; className?: string }) {
  return src ? (
    <img src={src} alt={alt} width={size} height={size} loading="lazy" className={clsx("shrink-0 rounded-ui object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden className={clsx("block shrink-0 rounded-ui bg-paper-alt", className)} style={{ width: size, height: size }} />
  );
}
