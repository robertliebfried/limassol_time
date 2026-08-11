import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Limassol Time Tracker",
  description: "Shift & Hours Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
