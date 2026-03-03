import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/Toast";
import SidebarNav from "@/components/SidebarNav";

export const metadata: Metadata = {
  title: "ContentEngine – Anti Gravity",
  description: "AI-driven persona content workflow engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>
        <SidebarNav />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
        <ToastContainer />
      </body>
    </html>
  );
}
