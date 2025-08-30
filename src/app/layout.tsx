import type { Metadata } from "next";
import { TRPCProvider } from "@/lib/trpc/Provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple TODO List",
  description: "A simple TODO list application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}