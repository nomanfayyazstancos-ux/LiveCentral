import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jost",
});

export const metadata: Metadata = {
  title: "LiveCentral",
  description: "Central Category & Product Database System. All Websites. All Categories. One Central Database.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jost.variable} h-full antialiased`}
    >
      <body className={`${jost.className} min-h-full bg-[#f4f6fb] text-[#1a1a1a]`}>{children}</body>
    </html>
  );
}
