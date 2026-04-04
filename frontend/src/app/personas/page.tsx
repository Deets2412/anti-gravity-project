"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Users, Zap } from "lucide-react";
import { getPersonas, createPersona, deletePersona, type Persona } from "@/lib/api";
import { toast } from "@/components/Toast";

// ─── Preset Templates ────────────────────────────────────────────────────────

const PRESETS = [
    {
        id: "rational-empathetic",
        emoji: "🧠",
        name: "The Rational Empathetic",
        tagline: "Where hard data meets human nature.",
        accentStart: "#6366f1",
        accentEnd: "#a78bfa",
        persona: {
            name: "The Rational Empathetic",
            tone: "Authentic, intellectually curious, and slightly contrarian. Direct and jargon-free — speaks like a peer who has done the work, not a lecturer behind a mahogany desk. Grounded in Brisbane reality. Warm but never soft.",
            vocabulary: "Use 'We/Us' when talking about the shared struggle with money; use 'I' when taking a stand on independent advice. Draw on analogies from Superforecasting, philosophy, and behavioural economics to explain market moves. Avoid hustle culture, bank-speak, and generalist platitudes.",
            pillars: ["Silicon Fox", "Emotional Money", "Independent Voice"],
        },
        pillarDescriptions: [
            { label: "Silicon Fox", desc: "Quantitative insights, factor-based investing (GARP/Momentum), AI in finance." },
            { label: "Emotional Money", desc: "The psychology of financial self-sabotage, consciousness, and the weight of wealth." },
            { label: "Independent Voice", desc: "Calling out industry BS, fee transparency, and the value of non-aligned advice." },
        ],
        antiPersona: "Not a hustle guru. Not a corporate mouthpiece. Not a generalist.",
    },
    {
        id: "sun-safe-speedster",
        emoji: "🚴",
        name: "Sun-Safe Speedster",
        tagline: "Professional by day. Lycra-clad by 5 AM.",
        accentStart: "#f59e0b",
        accentEnd: "#ef4444",
        persona: {
            name: "Sun-Safe Speedster",
            tone: "Self-deprecating and relatable — takes training seriously but never themselves. Slightly cynical, always warm. Insider triathlon community voice that blends high-performance obsession with laid-back Aussie energy.",
            vocabulary: "Tri slang throughout: PB, Age-Grouper, Brick Session, Taper Tantrums, The Big Dance (World Champs), Draft-Busters, The Iron-Tax. Gear-centric and coffee-obsessed. Noosa Triathlon is the North Star. Magpies are a genuine threat. Strava is proof of existence.",
            pillars: ["Gear Talk", "The Early Bird", "Tri-Math", "The Marketplace"],
        },
        pillarDescriptions: [
            { label: "Gear Talk", desc: "Honest, slightly cynical reviews — does this hydration system work or am I just wearing my Gatorade?" },
            { label: "The Early Bird", desc: "Relatable reels about 4:15 AM alarms when it's raining but the program says Intervals." },
            { label: "Tri-Math", desc: "Absurdity of the sport: spending $500 to save 10g while carrying 2kg of holiday weight." },
            { label: "The Marketplace", desc: "Navigating secondhand gear — that 'once-ridden' carbon frame from someone who hates swimming." },
        ],
        antiPersona: "Not a serious influencer. Not a sponsored athlete. Definitely still explaining the bike bill to their partner.",
    },
] as const;

const AVATAR_COLORS = [
    ["#6366f1", "#a78bfa"],
    ["#06b6d4", "#3b82f6"],
    ["#f59e0b", "#ef4444"],
    ["#10b981", "#06b6d4"],
    ["#ec4899", "#8b5cf6"],
];

function PersonaAvatar({ name, idx }: { name: string; idx: number }) {
    const [start, end] = AVATAR_COLORS[idx % AVATAR_COLORS.length];
    return (
        <div style={{
            width: 44, height: 44, borderRadius: "var(--radius-md)",
            background: `linear-gradient(135deg, ${start}, ${end})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#fff",
            flexShrink: 0,
            boxShadow: `0 0 12px ${start}55`,
        }}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState("");
    const [tone, setTone] = useState("");
    const [vocabulary, setVocabulary] = useState("");
    const [pillarsRaw, setPillarsRaw] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !tone) return;
        setSaving(true);
        try {
            const pillars = pillarsRaw.split(",").map(s => s.trim()).filter(Boolean);
            await createPersona({ name, tone, vocabulary, pillars });
            toast.success(`Persona "${name}" created!`);
            onCreated();
            onClose();
        } catch {
            toast.error("Failed to create persona.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <div className="glass slide-up" style={{
                width: "100%", maxWidth: 480,
                borderRadius: "var(--radius-xl)",
                padding: 28,
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>New Persona</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[
                        { label: "Name *", value: name, onChange: setName, placeholder: "e.g. Tech Innovator", required: true },
                        { label: "Tone of Voice *", value: tone, onChange: setTone, placeholder: "e.g. Authoritative, witty, data-driven", required: true },
                        { label: "Vocabulary Style", value: vocabulary, onChange: setVocabulary, placeholder: "e.g. Technical jargon, startup lingo", required: false },
                        { label: "Content Pillars (comma separated)", value: pillarsRaw, onChange: setPillarsRaw, placeholder: "e.g. AI, Leadership, Innovation", required: false },
                    ].map(({ label, value, onChange, placeholder, required }) => (
                        <div key={label}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                                {label}
                            </label>
                            <input
                                className="input-base"
                                value={value}
                                onChange={e => onChange(e.target.value)}
                                placeholder={placeholder}
                                required={required}
                            />
                        </div>
                    ))}

                    <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                        <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                        <button type="submit" disabled={saving || !name || !tone} className="btn-primary" style={{ flex: 1 }}>
                            {saving ? "Creating…" : "Create Persona"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function PersonasPage() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [addingPreset, setAddingPreset] = useState<string | null>(null);
    const [showPresets, setShowPresets] = useState(true);

    const fetchPersonas = async () => {
        try {
            const data = await getPersonas();
            setPersonas(data);
        } catch {
            toast.error("Failed to load personas.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPersonas(); }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete persona "${name}"? This cannot be undone.`)) return;
        setDeletingId(id);
        try {
            await deletePersona(id);
            setPersonas(prev => prev.filter(p => p.id !== id));
            toast.success(`"${name}" deleted.`);
        } catch {
            toast.error("Failed to delete persona.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleAddPreset = async (preset: typeof PRESETS[number]) => {
        setAddingPreset(preset.id);
        try {
            await createPersona({
                ...preset.persona,
                pillars: [...preset.persona.pillars]
            });
            toast.success(`"${preset.persona.name}" added to your library!`);
            fetchPersonas();
        } catch {
            toast.error(`Failed to add preset.`);
        } finally {
            setAddingPreset(null);
        }
    };

    return (
        <div style={{ padding: "32px 36px", maxWidth: 1100, margin: "0 auto" }}>
            {showModal && (
                <CreateModal onClose={() => setShowModal(false)} onCreated={fetchPersonas} />
            )}

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
                <div className="fade-in">
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Persona Library</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                        {loading ? "Loading…" : `${personas.length} persona${personas.length !== 1 ? "s" : ""} defined`}
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={15} /> New Persona
                </button>
            </div>

            {/* ── Preset Templates ─────────────────────────────────────── */}
            <div className="glass" style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: 28 }}>
                <button
                    onClick={() => setShowPresets(p => !p)}
                    style={{
                        width: "100%", padding: "14px 20px",
                        background: "none", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        borderBottom: showPresets ? "1px solid var(--border)" : "none",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                        <Zap size={14} color="#818cf8" /> Preset Templates
                        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginLeft: 2 }}>— one-click to add</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", transition: "transform 0.2s", display: "inline-block", transform: showPresets ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                </button>

                {showPresets && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                        {PRESETS.map((preset, i) => (
                            <div key={preset.id} style={{
                                padding: "20px 22px",
                                borderRight: i === 0 ? "1px solid var(--border)" : "none",
                                position: "relative",
                                overflow: "hidden",
                            }}>
                                {/* gradient bar */}
                                <div style={{
                                    position: "absolute", top: 0, left: 0, right: 0, height: 3,
                                    background: `linear-gradient(90deg, ${preset.accentStart}, ${preset.accentEnd})`,
                                }} />

                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                        background: `linear-gradient(135deg, ${preset.accentStart}, ${preset.accentEnd})`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 20,
                                        boxShadow: `0 0 12px ${preset.accentStart}55`,
                                    }}>{preset.emoji}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{preset.name}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>{preset.tagline}</div>
                                    </div>
                                </div>

                                {/* Pillars */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                                    {preset.pillarDescriptions.map(p => (
                                        <div key={p.label} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                                            <span style={{
                                                flexShrink: 0,
                                                background: `${preset.accentStart}22`,
                                                color: preset.accentStart,
                                                border: `1px solid ${preset.accentStart}44`,
                                                borderRadius: 5, padding: "1px 7px",
                                                fontWeight: 700, fontSize: 11,
                                                lineHeight: "18px",
                                            }}>{p.label}</span>
                                            <span style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>{p.desc}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                                        {preset.antiPersona}
                                    </div>
                                    <button
                                        onClick={() => handleAddPreset(preset)}
                                        disabled={addingPreset === preset.id}
                                        style={{
                                            background: `linear-gradient(135deg, ${preset.accentStart}, ${preset.accentEnd})`,
                                            border: "none", borderRadius: 8, color: "#fff",
                                            padding: "7px 14px", fontSize: 12, fontWeight: 700,
                                            cursor: addingPreset === preset.id ? "not-allowed" : "pointer",
                                            opacity: addingPreset === preset.id ? 0.6 : 1,
                                            display: "flex", alignItems: "center", gap: 5,
                                            flexShrink: 0, transition: "opacity 0.15s",
                                            boxShadow: `0 0 10px ${preset.accentStart}44`,
                                        }}
                                    >
                                        <Plus size={13} />
                                        {addingPreset === preset.id ? "Adding…" : "Add to Library"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Grid */}
            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: 160, borderRadius: "var(--radius-lg)" }} />
                    ))}
                </div>
            ) : personas.length === 0 ? (
                <div className="glass fade-in" style={{
                    borderRadius: "var(--radius-xl)", padding: "64px 24px",
                    textAlign: "center", color: "var(--text-muted)",
                }}>
                    <Users size={40} style={{ margin: "0 auto 14px", opacity: 0.3 }} />
                    <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No personas yet</p>
                    <p style={{ fontSize: 13 }}>Create your first brand voice to start generating content.</p>
                    <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => setShowModal(true)}>
                        <Plus size={14} /> Create Persona
                    </button>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                    {personas.map((persona, i) => (
                        <div key={persona.id} className="glass fade-in" style={{
                            borderRadius: "var(--radius-lg)",
                            padding: "20px 22px",
                            position: "relative",
                            transition: "border-color 0.2s, transform 0.2s",
                            animationDelay: `${i * 50}ms`,
                            cursor: "default",
                        }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.3)";
                                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                            }}
                        >
                            {/* Card header */}
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <PersonaAvatar name={persona.name} idx={i} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {persona.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Brand Persona</div>
                                </div>
                                <button
                                    onClick={() => handleDelete(persona.id, persona.name)}
                                    disabled={deletingId === persona.id}
                                    style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        color: "var(--text-muted)", padding: 6, borderRadius: 6,
                                        transition: "color 0.15s, background 0.15s",
                                        opacity: deletingId === persona.id ? 0.5 : 1,
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
                                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                                        (e.currentTarget as HTMLButtonElement).style.background = "none";
                                    }}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>

                            {/* Tone */}
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
                                    Tone of Voice
                                </div>
                                <div style={{
                                    fontSize: 13, color: "var(--text-secondary)",
                                    background: "var(--bg-base)", borderRadius: "var(--radius-sm)",
                                    padding: "7px 10px", border: "1px solid var(--border)",
                                }}>
                                    {persona.tone}
                                </div>
                            </div>

                            {/* Pillars */}
                            {persona.pillars?.length > 0 && (
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>
                                        Content Pillars
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {persona.pillars.map((pillar, idx) => (
                                            <span key={idx} style={{
                                                background: "var(--accent-dim)",
                                                color: "#a5b4fc",
                                                border: "1px solid rgba(99,102,241,0.2)",
                                                borderRadius: 6,
                                                padding: "3px 9px",
                                                fontSize: 11,
                                                fontWeight: 600,
                                            }}>
                                                {pillar}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
