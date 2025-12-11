import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Void - Throw it into the Void",
    template: "%s | Void",
  },
  description: "Capture first, organize later. A private, intelligent digital sanctuary that remembers everything so you don't have to.",
  keywords: ["productivity", "second brain", "ai", "notes", "bookmarks", "organization", "minimalism"],
  authors: [{ name: "Void Team" }],
  creator: "Void Team",
  openGraph: {
    type: "website",
    url: "https://insidevoid.vercel.app",
    title: "Void - Your AI-Powered Second Brain",
    description: "Capture first, organize later. The intelligent digital sanctuary for your thoughts and links.",
    siteName: "Void",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Void Application Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Void - Throw it into the Void",
    description: "Capture first, organize later. A private, intelligent digital sanctuary.",
    creator: "@_heysumit",
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} antialiased transition-colors duration-300 bg-neutral-50 dark:bg-neutral-950`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster theme="system" richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
