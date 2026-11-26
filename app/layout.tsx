import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { cookies } from "next/headers";
import { DEFAULT_LANG, dict, LANG_COOKIE, type Lang } from "@/lib/i18n";
import Header from "./Header";
import { LangProvider } from "./lang";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

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

export const viewport: Viewport = { themeColor: "#0a0a0c" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <LangProvider initial={lang}>
          <Header />
          <main className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6">{children}</main>
        </LangProvider>
      </body>
    </html>
  );
}
