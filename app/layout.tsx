import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Press It",
  description: "Press the button. Release the stress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#F7F4EF] text-[#20232D]">{children}</body>
    </html>
  );
}
