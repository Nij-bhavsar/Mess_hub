import { useState } from "react";
import UnifiedNavbar from "../components/UnifiedNavbar";
import API from "../services/api";

const STARTERS = ["Where can I see today's menu?", "How do I apply for leave?", "How can I send feedback?", "How do I check my payment?"];

function MessAssistant() {
  const [messages, setMessages] = useState([{ role:"assistant", text:"Hi! I’m the MessHub Assistant. Ask me about menus, attendance, leave, payments, or feedback." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (question = input) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || loading) return;
    setMessages((current) => [...current, { role:"user", text:cleanQuestion }]);
    setInput(""); setLoading(true);
    try {
      const { data } = await API.post("/mess-assistant/ask", { message:cleanQuestion });
      setMessages((current) => [...current, { role:"assistant", text:data.answer }]);
    } catch {
      setMessages((current) => [...current, { role:"assistant", text:"I’m unable to connect right now. Please try again or contact the mess staff." }]);
    } finally { setLoading(false); }
  };

  return <div className="dashboard"><UnifiedNavbar /><main className="main-content" style={{ maxWidth:"850px" }}>
    <div style={{ marginBottom:"var(--space-6)" }}><h1 style={{ fontSize:"var(--text-3xl)", marginBottom:"var(--space-2)" }}>Mess Assistant</h1><p style={{ color:"var(--color-text-tertiary)" }}>Quick help for using MessHub.</p></div>
    <section style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"var(--space-5)", minHeight:"400px", boxShadow:"var(--shadow-xs)" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:"var(--space-3)" }}>{messages.map((message, index) => <div key={index} style={{ alignSelf:message.role === "user" ? "flex-end" : "flex-start", maxWidth:"78%", padding:"var(--space-3) var(--space-4)", borderRadius:"var(--radius-lg)", background:message.role === "user" ? "var(--color-brand-primary)" : "var(--color-neutral-50)", color:message.role === "user" ? "white" : "var(--color-text-primary)", lineHeight:1.5 }}>{message.text}</div>)}{loading && <div style={{ color:"var(--color-text-tertiary)", fontSize:"var(--text-sm)" }}>Assistant is typing…</div>}</div>
      <div style={{ display:"flex", gap:"var(--space-2)", flexWrap:"wrap", margin:"var(--space-6) 0 var(--space-4)" }}>{STARTERS.map((question) => <button key={question} onClick={() => ask(question)} disabled={loading} style={{ background:"#F5F3FF", border:"1px solid var(--color-border)", borderRadius:"var(--radius-full)", padding:"8px 12px", color:"var(--color-brand-primary)", cursor:"pointer" }}>{question}</button>)}</div>
      <form onSubmit={(event) => { event.preventDefault(); ask(); }} style={{ display:"flex", gap:"var(--space-3)" }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question…" aria-label="Ask the mess assistant" style={{ flex:1, padding:"12px", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)" }} /><button className="grid-add-btn" type="submit" disabled={loading}>Send</button></form>
    </section>
  </main></div>;
}

export default MessAssistant;
