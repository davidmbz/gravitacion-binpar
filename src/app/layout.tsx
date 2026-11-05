import type { Metadata, Viewport } from "next";
import { Libre_Caslon_Text } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const caslon = Libre_Caslon_Text({
  variable: "--font-caslon",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const DESCRIPTION =
  "Aprende la ley de gravitación de Newton experimentando, y explora seis órbitas de tres cuerpos.";

export const metadata: Metadata = {
  title: {
    default: "Gravitación",
    template: "%s · Gravitación",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "Gravitación",
    description: DESCRIPTION,
    siteName: "Gravitación",
    locale: "es_ES",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  // Deja dibujar bajo la muesca: cabecera y barras reservan la zona segura.
  viewportFit: "cover",
  // En Android, el teclado encoge la ventana y con ella 100dvh.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${caslon.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
