import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import "./shop.css";
import Providers from "./Providers";

// Self-hosted by next/font: no render-blocking request to Google Fonts.
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Summarist", template: "%s | Summarist" },
  description:
    "Summarist: discover popular books, read or listen to short summaries of the key ideas, and buy the books you love.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
