"use client";

import { useState, useEffect, useRef } from "react";
import {
    Sparkles, Save, CheckCircle2, Copy, ImageIcon, RefreshCw,
    Wand2, AlertCircle, Users, HeartHandshake
} from "lucide-react";
import {
    getPersonas, generateContent, createPost, patchPostStatus,
    type Persona, type Post,
} from "@/lib/api";
import { toast } from "@/components/Toast";

// ─── Data ───────────────────────────────────────────────────────────────────

const PLATFORMS = [
    { value: "LinkedIn", label: "LinkedIn", emoji: "💼" },
    { value: "Twitter", label: "Twitter/X", emoji: "🐦" },
    { value: "Instagram", label: "Instagram", emoji: "📸" },
    { value: "TikTok", label: "TikTok", emoji: "🎵" },
];

const GENERATIONS = [
    { value: "Gen Z", label: "Gen Z", years: "1997–2012", emoji: "⚡" },
    { value: "Millennial", label: "Millennial", years: "1981–1996", emoji: "🌱" },
    { value: "Gen X", label: "Gen X", years: "1965–1980", emoji: "🎸" },
    { value: "Baby Boomer", label: "Boomer", years: "1946–1964", emoji: "🌟" },
    { value: "Silent Generation", label: "Silent Gen", years: "1928–1945", emoji: "🏛️" },
];

const LIFE_EVENTS = [
    { value: "Retirement", label: "Retirement", emoji: "🧓" },
    { value: "Recently Divorced", label: "Divorced", emoji: "💔" },
    { value: "Widowed", label: "Widowed", emoji: "🌹" },
    { value: "Inheritance Received", label: "Inheritance", emoji: "💰" },
    { value: "New Parent", label: "New Parent", emoji: "👶" },
    { value: "First Home Purchase", label: "First Home", emoji: "🏠" },
    { value: "Recently Married", label: "Newly Married", emoji: "💍" },
    { value: "New Graduate", label: "Graduate", emoji: "🎓" },
    { value: "Career Change", label: "Career Change", emoji: "💼" },
    { value: "Business Owner / Entrepreneur", label: "Entrepreneur", emoji: "📈" },
    { value: "Health Diagnosis", label: "Health Event", emoji: "⚕️" },
];

// Per-generation brief hints shown in the live preview
const GEN_HINTS: Record<string, string> = {
    "Gen Z": "Short-form, authentic, peer-to-peer. Resist corporate speak.",
    "Millennial": "Story-driven and value-led. Purpose over product.",
    "Gen X": "Direct, sceptical, no fluff. Earn trust with evidence.",
    "Baby Boomer": "Relationship-first. Detailed, warm, trust-focused.",
    "Silent Generation": "Formal, respectful, heritage and reliability matter most.",
};

const LIFE_HINTS: Record<string, string> = {
    "Retirement": "Major identity shift — frame around freedom, legacy, peace of mind.",
    "Recently Divorced": "Empathy first. Rebuilding identity — lead with support, not sales.",
    "Widowed": "Extreme sensitivity. Clarity and compassion. Avoid urgency.",
    "Inheritance Received": "Responsibility + opportunity. Thoughtful stewardship, not opportunism.",
    "New Parent": "Protection, security, long-term thinking. Time-poor, values-rich.",
    "First Home Purchase": "Pride + financial stretch. Milestone energy, smart ownership.",
    "Recently Married": "Shared future planning. Partnership and protection.",
    "New Graduate": "Ambition + uncertainty. First steps, strong foundations.",
    "Career Change": "Reinvention energy. Transferable strengths, path forward.",
    "Business Owner / Entrepreneur": "Time scarcity + risk-aware. Growth, leverage, protect what you've built.",
    "Health Diagnosis": "Fear + urgency to get affairs in order. Clarity and care, never pressure.",
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function Spinner() {
    return (
        <svg width={15} height={15} viewBox="0 0 16 16" style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
            <circle cx={8} cy={8} r={6} fill="none" stroke="currentColor" strokeWidth={2} strokeDasharray="25 10" />
        </svg>
    );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
            {icon} {children}
        </div>
    );
}

function PillButton({
    selected, onClick, children, style = {}
}: {
    selected: boolean; onClick: () => void; children: React.ReactNode; style?: React.CSSProperties
}) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "6px 11px",
                borderRadius: 8,
                border: selected ? "1px solid rgba(99,102,241,0.6)" : "1px solid var(--border)",
                background: selected ? "var(--accent-dim)" : "var(--bg-base)",
                color: selected ? "#a5b4fc" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: selected ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 5,
                boxShadow: selected ? "0 0 0 1px rgba(99,102,241,0.25)" : "none",
                ...style,
            }}
        >
            {children}
        </button>
    );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ContentEditorPage() {
    const [topic, setTopic] = useState("");
    const [platform, setPlatform] = useState("LinkedIn");
    const [personaId, setPersonaId] = useState("");
    const [personas, setPersonas] = useState<Persona[]>([]);

    // Audience state
    const [selectedGeneration, setSelectedGeneration] = useState<string | null>(null);
    const [selectedLifeEvent, setSelectedLifeEvent] = useState<string | null>(null);

    const [draft, setDraft] = useState<Post | null>(null);
    const [savedPost, setSavedPost] = useState<Post | null>(null);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [approving, setApproving] = useState(false);

    const bodyRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        getPersonas().then(data => {
            setPersonas(data);
            if (data.length > 0) setPersonaId(data[0].id);
        }).catch(() => toast.error("Failed to load personas."));
    }, []);

    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.style.height = "auto";
            bodyRef.current.style.height = bodyRef.current.scrollHeight + "px";
        }
    }, [draft?.content?.body]);

    // Live writing brief
    const writingBrief = (() => {
        if (!selectedGeneration && !selectedLifeEvent) return null;
        const parts: string[] = [];
        if (selectedGeneration) parts.push(`**${selectedGeneration}**`);
        if (selectedLifeEvent) parts.push(`going through **${selectedLifeEvent}**`);
        const hints: string[] = [];
        if (selectedGeneration && GEN_HINTS[selectedGeneration]) hints.push(GEN_HINTS[selectedGeneration]);
        if (selectedLifeEvent && LIFE_HINTS[selectedLifeEvent]) hints.push(LIFE_HINTS[selectedLifeEvent]);
        return { audience: parts.join(" "), hints };
    })();

    const handleGenerate = async () => {
        if (!topic.trim() || !personaId) return;
        setGenerating(true);
        setSavedPost(null);
        setDraft(null);
        try {
            const result = await generateContent({
                persona_id: personaId,
                platform,
                topic,
                audience_generation: selectedGeneration ?? undefined,
                life_event: selectedLifeEvent ?? undefined,
            });
            setDraft({ ...result, id: "", status: "draft" } as Post);
        } catch {
            toast.error("Generation failed. Is the backend running?");
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!draft) return;
        setSaving(true);
        try {
            const saved = await createPost({
                platform: draft.platform,
                persona_id: draft.persona_id,
                status: "draft",
                content: draft.content,
                media_instructions: draft.media_instructions,
                metadata_field: draft.metadata_field,
            });
            setSavedPost(saved);
            setDraft(saved);
            toast.success("Draft saved!");
        } catch {
            toast.error("Failed to save draft.");
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async () => {
        setApproving(true);
        try {
            if (savedPost?.id) {
                const updated = await patchPostStatus(savedPost.id, "approved");
                setSavedPost(updated);
                setDraft(updated);
            } else {
                const saved = await createPost({
                    platform: draft!.platform,
                    persona_id: draft!.persona_id,
                    status: "approved",
                    content: draft!.content,
                    media_instructions: draft!.media_instructions,
                    metadata_field: draft!.metadata_field,
                });
                setSavedPost(saved);
                setDraft(saved);
            }
            toast.success("Post approved! 🎉");
        } catch {
            toast.error("Failed to approve post.");
        } finally {
            setApproving(false);
        }
    };

    const handleCopy = () => {
        if (!draft?.content) return;
        const { hook, body, cta, hashtags } = draft.content;
        navigator.clipboard.writeText([hook, body, cta, hashtags?.join(" ")].filter(Boolean).join("\n\n"));
        toast.info("Copied to clipboard!");
    };

    const selectedPersona = personas.find(p => p.id === personaId);
    const isApproved = draft?.status === "approved";
    const isSaved = !!savedPost?.id;

    return (
        <div style={{ display: "flex", height: "100%", background: "var(--bg-base)" }}>

            {/* ── Left Panel ─────────────────────────────────────────────── */}
            <div style={{
                width: 310,
                minWidth: 310,
                background: "var(--bg-surface)",
                borderRight: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflowY: "auto",
            }}>
                <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid var(--border)" }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7 }}>
                        <Wand2 size={14} color="#818cf8" /> Generate Content
                    </h2>
                </div>

                <div style={{ flex: 1, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Topic */}
                    <div>
                        <SectionLabel icon={null}>Topic / Context</SectionLabel>
                        <textarea
                            className="input-base"
                            style={{ minHeight: 90, resize: "none", lineHeight: 1.5 }}
                            placeholder="e.g. The impact of AI on personal wealth management…"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                        />
                    </div>

                    {/* ── Audience Section ─────────────────────────────────── */}
                    <div style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        padding: "14px 14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}>
                        {/* Generation */}
                        <div>
                            <SectionLabel icon={<Users size={11} />}>Generation</SectionLabel>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {GENERATIONS.map(g => (
                                    <PillButton
                                        key={g.value}
                                        selected={selectedGeneration === g.value}
                                        onClick={() => setSelectedGeneration(prev => prev === g.value ? null : g.value)}
                                    >
                                        <span>{g.emoji}</span>
                                        <span>{g.label}</span>
                                        <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 400 }}>{g.years}</span>
                                    </PillButton>
                                ))}
                            </div>
                        </div>

                        {/* Life Event */}
                        <div>
                            <SectionLabel icon={<HeartHandshake size={11} />}>Life Event <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 10 }}>(optional overlay)</span></SectionLabel>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {LIFE_EVENTS.map(e => (
                                    <PillButton
                                        key={e.value}
                                        selected={selectedLifeEvent === e.value}
                                        onClick={() => setSelectedLifeEvent(prev => prev === e.value ? null : e.value)}
                                    >
                                        <span>{e.emoji}</span>
                                        <span>{e.label}</span>
                                    </PillButton>
                                ))}
                            </div>
                        </div>

                        {/* Live writing brief */}
                        {writingBrief && (
                            <div style={{
                                background: "rgba(99,102,241,0.08)",
                                border: "1px solid rgba(99,102,241,0.2)",
                                borderRadius: "var(--radius-sm)",
                                padding: "10px 12px",
                            }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
                                    ✦ AI Writing Brief
                                </div>
                                <div style={{ fontSize: 12, color: "#c7d2fe", lineHeight: 1.55 }}>
                                    Writing for {writingBrief.audience}.
                                </div>
                                {writingBrief.hints.map((hint, i) => (
                                    <div key={i} style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5, paddingLeft: 8, borderLeft: "2px solid rgba(99,102,241,0.3)" }}>
                                        {hint}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Platform */}
                    <div>
                        <SectionLabel icon={null}>Platform</SectionLabel>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                            {PLATFORMS.map(p => (
                                <PillButton
                                    key={p.value}
                                    selected={platform === p.value}
                                    onClick={() => setPlatform(p.value)}
                                    style={{ justifyContent: "center", padding: "8px" }}
                                >
                                    <span>{p.emoji}</span> {p.label}
                                </PillButton>
                            ))}
                        </div>
                    </div>

                    {/* Persona */}
                    <div>
                        <SectionLabel icon={null}>Brand Persona</SectionLabel>
                        {personas.length === 0 ? (
                            <div style={{
                                display: "flex", alignItems: "center", gap: 7,
                                padding: "9px 11px",
                                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                                borderRadius: "var(--radius-sm)", color: "#fbbf24", fontSize: 12,
                            }}>
                                <AlertCircle size={13} /> Create a persona first
                            </div>
                        ) : (
                            <select value={personaId} onChange={e => setPersonaId(e.target.value)} className="input-base">
                                {personas.map(p => <option key={p.id} value={p.id}>{p.name} — {p.tone}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {/* Generate button */}
                <div style={{ padding: "0 16px 20px" }}>
                    <button
                        onClick={handleGenerate}
                        disabled={!topic.trim() || !personaId || generating}
                        className="btn-primary"
                        style={{ width: "100%", paddingTop: 11, paddingBottom: 11 }}
                    >
                        {generating ? <><Spinner /> Generating…</> : <><Sparkles size={14} /> Generate Draft</>}
                    </button>
                </div>
            </div>

            {/* ── Right Panel ─────────────────────────────────────────────── */}
            <div style={{
                flex: 1,
                padding: "28px 32px",
                overflowY: "auto",
                display: "flex",
                alignItems: draft ? "flex-start" : "center",
                justifyContent: "center",
            }}>
                {/* Empty state */}
                {!draft && !generating && (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", userSelect: "none" }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: "50%",
                            background: "var(--accent-dim)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 14px",
                        }}>
                            <Sparkles size={26} color="#6366f1" />
                        </div>
                        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Ready to generate</p>
                        <p style={{ fontSize: 13 }}>Select an audience, pick a platform, enter a topic.</p>
                    </div>
                )}

                {/* Generating state */}
                {generating && (
                    <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: "50%",
                            background: "var(--accent-dim)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 14px",
                            animation: "pulseGlow 1.5s ease-in-out infinite",
                        }}>
                            <Sparkles size={26} color="#818cf8" />
                        </div>
                        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Generating your draft…</p>
                        <p style={{ fontSize: 13 }}>
                            {selectedGeneration && selectedLifeEvent
                                ? `Tailoring for ${selectedGeneration} · ${selectedLifeEvent}`
                                : selectedGeneration
                                    ? `Tailoring for ${selectedGeneration}`
                                    : `Writing for ${platform}`}
                        </p>
                    </div>
                )}

                {/* Draft card */}
                {draft && (
                    <div className="slide-up" style={{
                        width: "100%", maxWidth: 620,
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-xl)",
                        overflow: "hidden",
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: "14px 18px",
                            borderBottom: "1px solid var(--border)",
                            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                        }}>
                            <span className="platform-badge">
                                {PLATFORMS.find(p => p.value === draft.platform)?.emoji} {draft.platform}
                            </span>
                            {selectedPersona && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>— {selectedPersona.name}</span>}
                            {draft.metadata_field?.audience_generation && (
                                <span style={{
                                    fontSize: 11, fontWeight: 600,
                                    background: "rgba(16,185,129,0.1)", color: "#34d399",
                                    border: "1px solid rgba(16,185,129,0.25)",
                                    borderRadius: 6, padding: "2px 8px",
                                }}>
                                    {GENERATIONS.find(g => g.value === draft.metadata_field?.audience_generation)?.emoji}{" "}
                                    {draft.metadata_field.audience_generation}
                                </span>
                            )}
                            {draft.metadata_field?.life_event && (
                                <span style={{
                                    fontSize: 11, fontWeight: 600,
                                    background: "rgba(245,158,11,0.1)", color: "#fbbf24",
                                    border: "1px solid rgba(245,158,11,0.25)",
                                    borderRadius: 6, padding: "2px 8px",
                                }}>
                                    {LIFE_EVENTS.find(e => e.value === draft.metadata_field?.life_event)?.emoji}{" "}
                                    {draft.metadata_field.life_event}
                                </span>
                            )}
                            <div style={{ marginLeft: "auto", display: "flex", gap: 7, alignItems: "center" }}>
                                {isApproved && <span className="status-pill status-approved"><CheckCircle2 size={10} /> Approved</span>}
                                {isSaved && !isApproved && <span className="status-pill status-draft">Saved</span>}
                                <button onClick={handleCopy} title="Copy to clipboard" style={{
                                    background: "none", border: "none", cursor: "pointer",
                                    color: "var(--text-muted)", padding: 6, borderRadius: 6,
                                    display: "flex", alignItems: "center", transition: "color 0.15s, background 0.15s",
                                }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#a5b4fc"; (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-dim)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Content body */}
                        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                            {draft.content?.hook && (
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 }}>Hook</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", borderLeft: "3px solid #6366f1", paddingLeft: 10, lineHeight: 1.5 }}>
                                        {draft.content.hook}
                                    </div>
                                </div>
                            )}
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 }}>Body</div>
                                <textarea ref={bodyRef} style={{
                                    width: "100%", background: "transparent", border: "none",
                                    outline: "none", color: "var(--text-secondary)", fontSize: 14,
                                    lineHeight: 1.7, resize: "none", fontFamily: "Inter, sans-serif", overflow: "hidden",
                                }} defaultValue={draft.content?.body} />
                            </div>
                            {draft.content?.cta && (
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 }}>Call to Action</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{draft.content.cta}</div>
                                </div>
                            )}
                            {draft.content?.hashtags?.length > 0 && (
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 }}>Hashtags</div>
                                    <div style={{ color: "#818cf8", fontSize: 13, fontWeight: 500 }}>{draft.content.hashtags.join("  ")}</div>
                                </div>
                            )}
                            {draft.media_instructions && (
                                <div style={{
                                    background: "var(--bg-elevated)", border: "1px solid var(--border)",
                                    borderRadius: "var(--radius-md)", padding: "12px 14px",
                                }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
                                        <ImageIcon size={10} /> Media Brief
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                        <span style={{ color: "var(--text-muted)" }}>Type:</span> {draft.media_instructions.type}
                                        &nbsp;·&nbsp;
                                        <span style={{ color: "var(--text-muted)" }}>Ratio:</span> {draft.media_instructions.aspect_ratio}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 5, fontStyle: "italic" }}>
                                        "{draft.media_instructions.prompt}"
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{
                            padding: "14px 22px", borderTop: "1px solid var(--border)",
                            display: "flex", gap: 8, justifyContent: "flex-end",
                        }}>
                            <button onClick={() => { setDraft(null); setSavedPost(null); }} className="btn-ghost" style={{ fontSize: 13 }}>
                                <RefreshCw size={13} /> Regenerate
                            </button>
                            {!isApproved && (
                                <>
                                    <button onClick={handleSaveDraft} disabled={saving || isSaved} className="btn-ghost" style={{ fontSize: 13 }}>
                                        {saving ? <><Spinner /> Saving…</> : <><Save size={13} /> {isSaved ? "Saved ✓" : "Save Draft"}</>}
                                    </button>
                                    <button onClick={handleApprove} disabled={approving} className="btn-primary" style={{ fontSize: 13 }}>
                                        {approving ? <><Spinner /> Approving…</> : <><CheckCircle2 size={13} /> Approve</>}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
