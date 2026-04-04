"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

// Simple global event bus
const listeners: Array<(toast: ToastMessage) => void> = [];

export function toast(type: ToastType, message: string) {
    const msg: ToastMessage = { id: Math.random().toString(36).slice(2), type, message };
    listeners.forEach(fn => fn(msg));
}
toast.success = (msg: string) => toast("success", msg);
toast.error = (msg: string) => toast("error", msg);
toast.info = (msg: string) => toast("info", msg);

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} />,
    error: <XCircle size={16} />,
    info: <Info size={16} />,
};

const colors: Record<ToastType, string> = {
    success: "border-emerald-500/40 bg-emerald-950/60 text-emerald-300",
    error: "border-red-500/40     bg-red-950/60     text-red-300",
    info: "border-indigo-500/40  bg-indigo-950/60  text-indigo-300",
};

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handler = (msg: ToastMessage) => {
            setToasts(prev => [...prev, msg]);
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== msg.id)), 4000);
        };
        listeners.push(handler);
        return () => { const i = listeners.indexOf(handler); if (i > -1) listeners.splice(i, 1); };
    }, []);

    if (!toasts.length) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl pointer-events-auto fade-in ${colors[t.type]}`}
                    style={{ minWidth: 260, maxWidth: 380 }}
                >
                    {icons[t.type]}
                    <span className="flex-1 text-sm font-medium">{t.message}</span>
                    <button
                        onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
