import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const STARTERS = ["Today's menu", "How do I apply for leave?", "How do I send feedback?"];

function FloatingMessAssistant() {
  const { user } = useAuth();
  const [position, setPosition] = useState({ right: 24, bottom: 24 });
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([{ role:"assistant", text:"Hi! Ask me about menus, attendance, leave, payments, or feedback." }]);
  const drag = useRef(null);

  if (user?.role?.toLowerCase() !== "student") return null;

  const startDrag = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, moved: false };
  };

  const moveDrag = (event) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true;
    setPosition((current) => ({
      right: Math.max(12, Math.min(window.innerWidth - 72, current.right - dx)),
      bottom: Math.max(12, Math.min(window.innerHeight - 72, current.bottom - dy)),
    }));
    drag.current.x = event.clientX;
    drag.current.y = event.clientY;
  };

  const endDrag = () => {
    if (drag.current && !drag.current.moved) setOpen((value) => !value);
    drag.current = null;
  };

  const ask = async (question = input) => {
    const message = question.trim();
    if (!message || loading) return;
    setMessages((current) => [...current, { role:"user", text:message }]);
    setInput(""); setLoading(true);
    try {
      const history = messages.slice(-8).map((item) => ({ role:item.role, text:item.text }));
      const { data } = await API.post("/mess-assistant/ask", { message, history });
      setMessages((current) => [...current, { role:"assistant", text:data.answer }]);
    } catch {
      setMessages((current) => [...current, { role:"assistant", text:"I’m unable to connect right now. Please try again or contact the mess staff." }]);
    } finally { setLoading(false); }
  };

  return <>
    {open && <section aria-label="Mess Assistant chat" style={{ position:"fixed", right:"24px", bottom:"94px", zIndex:2000, width:"min(380px, calc(100vw - 32px))", height:"480px", display:"flex", flexDirection:"column", background:"white", border:"1px solid #E5E7EB", borderRadius:"18px", boxShadow:"0 20px 45px rgba(15,23,42,.22)", overflow:"hidden" }}>
      <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", color:"white", background:"linear-gradient(135deg,#7C3AED,#4F46E5)" }}><div><strong>Mess Assistant</strong><div style={{ fontSize:"11px", opacity:.85 }}>Quick MessHub help</div></div><button onClick={() => setOpen(false)} aria-label="Close assistant" style={{ border:0, background:"transparent", color:"white", fontSize:"22px", cursor:"pointer" }}>×</button></header>
      <div style={{ flex:1, overflowY:"auto", padding:"14px", display:"flex", flexDirection:"column", gap:"10px", background:"#FAFAFF" }}>{messages.map((message, index) => <div key={index} style={{ alignSelf:message.role === "user" ? "flex-end" : "flex-start", maxWidth:"85%", borderRadius:"14px", padding:"10px 12px", fontSize:"14px", lineHeight:1.45, background:message.role === "user" ? "#5B45D6" : "white", color:message.role === "user" ? "white" : "#1F2937", boxShadow:message.role === "assistant" ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>{message.text}</div>)}{loading && <small style={{ color:"#6B7280" }}>Assistant is typing…</small>}</div>
      <div style={{ padding:"10px 12px", borderTop:"1px solid #E5E7EB" }}><div style={{ display:"flex", gap:"6px", overflowX:"auto", marginBottom:"9px" }}>{STARTERS.map((question) => <button key={question} onClick={() => ask(question)} style={{ whiteSpace:"nowrap", border:"1px solid #DDD6FE", color:"#5B45D6", background:"#F5F3FF", borderRadius:"999px", padding:"5px 8px", fontSize:"11px", cursor:"pointer" }}>{question}</button>)}</div><form onSubmit={(event) => { event.preventDefault(); ask(); }} style={{ display:"flex", gap:"8px" }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question…" style={{ minWidth:0, flex:1, border:"1px solid #D1D5DB", borderRadius:"9px", padding:"9px" }} /><button type="submit" disabled={loading} style={{ border:0, borderRadius:"9px", color:"white", background:"#5B45D6", padding:"0 12px", cursor:"pointer" }}>Send</button></form></div>
    </section>}
    <button
    type="button"
    aria-label="Open Mess Assistant. Drag to move."
    title="Mess Assistant — drag to move"
    onPointerDown={startDrag}
    onPointerMove={moveDrag}
    onPointerUp={endDrag}
    style={{ position:"fixed", right:position.right, bottom:position.bottom, zIndex:2000, width:"58px", height:"58px", borderRadius:"50%", border:"3px solid white", background:"linear-gradient(135deg,#7C3AED,#4F46E5)", boxShadow:"0 10px 25px rgba(79,70,229,.35)", color:"white", fontSize:"25px", cursor:"grab", touchAction:"none", display:"grid", placeItems:"center" }}
    >🤖</button>
  </>;
}

export default FloatingMessAssistant;
