"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStats, getPosts, getPersonas, type DashboardStats, type Post, type Persona } from "@/lib/api";
import { LayoutDashboard, Users, FileText, CheckCircle, Clock, ArrowRight } from "lucide-react";

const PLATFORM_ICONS: Record<string, string> = {
  LinkedIn: "💼", Twitter: "🐦", Instagram: "📸", TikTok: "🎵",
};

function StatCard({ label, value, sub, color, icon }: { label: string; value: number | string; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="glass fade-in" style={{
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 80, height: 80,
        background: color,
        borderRadius: "0 var(--radius-lg) 0 100%",
        opacity: 0.12,
      }} />
      <div style={{ color: "var(--text-muted)", marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill status-${status}`}>{status}</span>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [personaCount, setPersonaCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getPosts({ limit: 6 })])
      .then(([s, p]) => {
        setStats(s);
        setPosts(p);
        setPersonaCount(s.personas);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div className="fade-in" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Your AI content pipeline at a glance.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {loading ? (
          <>
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: "var(--radius-lg)" }} />
            ))}
          </>
        ) : (
          <>
            <StatCard
              label="Active Personas"
              value={stats?.personas ?? 0}
              sub="Brand voices defined"
              color="#6366f1"
              icon={<Users size={20} />}
            />
            <StatCard
              label="Drafts Pending"
              value={stats?.drafts ?? 0}
              sub={`${stats?.review ?? 0} in review`}
              color="#f59e0b"
              icon={<Clock size={20} />}
            />
            <StatCard
              label="Approved Posts"
              value={stats?.approved ?? 0}
              sub="Ready to publish"
              color="#10b981"
              icon={<CheckCircle size={20} />}
            />
          </>
        )}
      </div>

      {/* Recent Posts */}
      <div className="glass" style={{ borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
        <div style={{
          padding: "18px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} color="#818cf8" />
            Recent Drafts
          </h2>
          <Link href="/content" style={{
            fontSize: 13, color: "#818cf8", fontWeight: 500,
            display: "flex", alignItems: "center", gap: 4,
            textDecoration: "none",
          }}>
            New draft <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton" style={{ height: 44, marginBottom: 10, borderRadius: "var(--radius-sm)" }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
            <FileText size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>No posts yet. Generate your first draft!</p>
          </div>
        ) : (
          <div>
            {posts.map((post, i) => (
              <div key={post.id} className="fade-in" style={{
                padding: "14px 24px",
                borderBottom: i < posts.length - 1 ? "1px solid var(--border)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 14,
                transition: "background 0.15s",
                animationDelay: `${i * 40}ms`,
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-overlay)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: 20 }}>{PLATFORM_ICONS[post.platform] ?? "📄"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.content?.hook ?? post.content?.body?.slice(0, 60) ?? "Untitled"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {post.platform}
                  </div>
                </div>
                <StatusPill status={post.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
