"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { cameFromGallery } from "./return-origin";

type GalleryLinkProps = Omit<
  ComponentProps<typeof Link>,
  "href" | "onNavigate"
>;

/**
 * Enlace a la galería. Si se llegó desde ella, vuelve atrás en el historial: un
 * push subiría al inicio de la página y perdería el filtro de la URL. Sigue
 * siendo un enlace real para abrirlo en otra pestaña o entrar por URL directa.
 */
export function GalleryLink(props: GalleryLinkProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Link
      {...props}
      href="/orbitas"
      onNavigate={(event) => {
        if (pathname.startsWith("/orbitas/") && cameFromGallery()) {
          event.preventDefault();
          router.back();
        }
      }}
    />
  );
}
