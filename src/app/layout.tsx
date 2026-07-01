import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/shared/theme-provider";

export const metadata: Metadata = {
  title: "PrintCardFlow — генератор SKU для печати",
  description:
    "Сканируйте папку, назначайте пресеты, валидируйте дубликаты и экспортируйте готовые SKU в Excel, ZIP, CSV, JSON или TXT.",
  keywords: [
    "PrintCardFlow",
    "SKU",
    "генератор SKU",
    "печать",
    "текстиль",
    "Excel",
    "ZIP",
    "маркетплейс",
    "Wildberries",
  ],
  authors: [{ name: "PrintCardFlow" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "PrintCardFlow — генератор SKU",
    description: "Генератор SKU для печати: Excel, ZIP, CSV, JSON, TXT.",
    siteName: "PrintCardFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrintCardFlow",
    description: "Генератор SKU для печати",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
