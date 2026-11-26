import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Hanken_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import { DEFAULT_LANG, dict, LANG_COOKIE, type Lang } from "@/lib/i18n";
import Header from "./Header";
import { LangProvider } from "./lang";
import "./globals.css";

// A high-contrast display serif for the "gala" feel, and a plain grotesque for everything else.
const display = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-display" });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body" });

async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return value === "en" || value === "fr" ? value : DEFAULT_LANG;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Les Raimondis — ${dict[await getLang()].edition}`,
    robots: { index: false, follow: false },
  };
}

export const viewport: Viewport = { themeColor: "#000000" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <LangProvider initial={lang}>
          <Header />
          <main className="pb-28">{children}</main>
        </LangProvider>
      </body>
    </html>
  );
}
