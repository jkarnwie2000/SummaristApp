import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./shop.css";
import Providers from "./Providers";

// Roboto is bundled in app/fonts (SIL OFL 1.1, see OFL.txt), so builds never
// download fonts from Google — that download made Vercel builds fail randomly.
const roboto = localFont({
  src: [
    { path: "./fonts/roboto-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/roboto-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/roboto-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/roboto-700.woff2", weight: "700", style: "normal" },
  ],
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
