import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Summarizer",
  description: "Summarize YouTube videos with AI",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
