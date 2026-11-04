import type { Metadata } from "next";
import { Libre_Caslon_Text } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const caslon = Libre_Caslon_Text({
  variable: "--font-caslon",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Gravitación",
    template: "%s · Gravitación",
  },
  description:
    "Aprende la ley de gravitación de Newton experimentando, y explora seis órbitas de tres cuerpos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={caslon.variable}>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
