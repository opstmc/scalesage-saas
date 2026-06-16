"use client";

import { useEffect, useRef, useState } from "react";
import { SAGE_GREETING, SAGE_SUGGEST, sageReply } from "@/lib/journey";

interface Msg {
  role: "sage" | "user";
  text: string;
}

export default function SageWidget() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "sage", text: SAGE_GREETING }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  const send = (text: string) => {
    const q = (text || "").trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    const reply = sageReply(q);
    setTimeout(() => {
      setThinking(false);
      setMessages((m) => [...m, { role: "sage", text: reply }]);
    }, 600);
  };

  return (
    <div className="sage" data-reveal>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "18px 20px", borderBottom: "1px solid var(--hairline)" }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="diamond" style={{ width: 10, height: 10, background: "#fff", borderRadius: 2 }} />
        </span>
        <div>
          <div className="font-display" style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.1 }}>
            Ask Sage anything
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>Scoped to ScaleSage · instant · no login</div>
        </div>
      </div>

      <div className="sage-log" ref={logRef}>
        {messages.map((m, i) => {
          const user = m.role === "user";
          return (
            <div key={i} style={{ display: "flex", justifyContent: user ? "flex-end" : "flex-start" }}>
              <div
                style={
                  user
                    ? { maxWidth: "84%", background: "var(--accent)", color: "#fff", borderRadius: "13px 13px 4px 13px", padding: "11px 15px", fontSize: 14.5, lineHeight: 1.5 }
                    : { maxWidth: "88%", background: "color-mix(in srgb,var(--ink) 4%,var(--surface))", border: "1px solid var(--hairline)", color: "var(--ink)", borderRadius: "4px 13px 13px 13px", padding: "11px 15px", fontSize: 14.5, lineHeight: 1.5 }
                }
              >
                {m.text}
              </div>
            </div>
          );
        })}
        {thinking && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "color-mix(in srgb,var(--ink) 4%,var(--surface))", border: "1px solid var(--hairline)", borderRadius: "4px 13px 13px 13px", padding: "12px 15px", display: "flex", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-faint)", animation: "ssDot 1.2s infinite" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-faint)", animation: "ssDot 1.2s infinite .2s" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-faint)", animation: "ssDot 1.2s infinite .4s" }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "0 20px 14px", display: "flex", flexWrap: "wrap", gap: 7 }}>
        {SAGE_SUGGEST.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ padding: "14px 16px", borderTop: "1px solid var(--hairline)", display: "flex", gap: 9 }}>
        <input
          className="sage-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask about the diagnostic, pricing…"
          aria-label="Ask Sage a question"
        />
        <button
          type="button"
          onClick={() => send(input)}
          style={{ fontFamily: "Inter,sans-serif", fontWeight: 500, fontSize: 14.5, color: "#fff", background: "var(--accent)", border: "none", borderRadius: 10, padding: "11px 16px", cursor: "pointer" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
