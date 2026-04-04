"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, PenTool, Zap, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/personas", icon: Users, label: "Persona Library" },
    { href: "/content", icon: PenTool, label: "Content Editor" },
];

export default function SidebarNav() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <aside style={{
            width: 240,
            minWidth: 240,
            background: "var(--bg-surface)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
        }}>
            {/* Logo */}
            <div style={{
                padding: "24px 20px 20px",
                borderBottom: "1px solid var(--border)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34,
                        background: "linear-gradient(135deg, #6366f1, #a78bfa)",
                        borderRadius: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "var(--accent-glow)",
                    }}>
                        <Zap size={18} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
                            ContentEngine
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginTop: 1 }}>
                            Anti Gravity
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: "12px 10px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 10px 6px" }}>
                    Menu
                </div>
                {navItems.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href;
                    return (
                        <Link key={href} href={href} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 12px",
                            borderRadius: "var(--radius-sm)",
                            marginBottom: 2,
                            fontWeight: 500,
                            fontSize: 14,
                            color: active ? "var(--text-primary)" : "var(--text-secondary)",
                            background: active ? "var(--accent-dim)" : "transparent",
                            border: active ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                            textDecoration: "none",
                            transition: "all 0.15s ease",
                        }}
                            onMouseEnter={e => {
                                if (!active) {
                                    (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-overlay)";
                                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
                                }
                            }}
                            onMouseLeave={e => {
                                if (!active) {
                                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                                }
                            }}>
                            <Icon size={16} color={active ? "#818cf8" : undefined} />
                            {label}
                            {active && (
                                <div style={{
                                    marginLeft: "auto",
                                    width: 5, height: 5,
                                    borderRadius: "50%",
                                    background: "#818cf8",
                                    boxShadow: "0 0 6px #818cf8",
                                }} />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* New Draft CTA */}
            <div style={{ padding: "12px 10px 20px" }}>
                <button
                    onClick={() => router.push("/content")}
                    className="btn-primary"
                    style={{ width: "100%", borderRadius: "var(--radius-md)" }}
                >
                    <Plus size={15} />
                    New Draft
                </button>
            </div>
        </aside>
    );
}
