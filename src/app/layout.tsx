import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { APP_DISPLAY_NAME, APP_PURPOSE } from "@/lib/app-config";
import "./globals.css";

// FRD DS-4: an elegant serif for headings, a clean sans-serif for body text.
const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: APP_DISPLAY_NAME, template: `%s · ${APP_DISPLAY_NAME}` },
  description: APP_PURPOSE,
};

// Lets the phone tab bar sit above the iPhone home indicator (safe-area insets).
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
